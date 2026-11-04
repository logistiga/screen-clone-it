import { describe, expect, test } from 'bun:test';
import axios from 'axios';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { affectsTreasury, installTreasuryRefresh } from './treasury-cache';

const balanceKeys = [
  ['caisse-solde'], ['caisse', 'solde'], ['caisse-solde-jour', '2026-11-04'],
  ['caisse-mouvements', 1], ['caisse-mouvements-mois', '2026-11-01', '2026-11-30'],
  ['mouvements-caisse', { source: 'caisse' }], ['banques'], ['mouvements-bancaires'],
];

async function exercise(url, amount, type) {
  let balance = 100000;
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  const unsubscribe = [];
  for (const queryKey of balanceKeys) {
    await client.fetchQuery({ queryKey, queryFn: async () => balance });
    const observer = new QueryObserver(client, { queryKey, queryFn: async () => balance });
    unsubscribe.push(observer.subscribe(() => {}));
  }
  client.setQueryData(['clients'], 'unchanged');
  const api = axios.create({ adapter: async (config) => {
    balance += type === 'entree' ? amount : -amount;
    return { status: 201, statusText: 'Created', headers: {}, config, data: {} };
  } });
  const dispose = installTreasuryRefresh(api, client);
  try {
    await api.post(url, { montant: amount, type });
    for (const key of balanceKeys) expect(client.getQueryData(key)).toBe(balance);
    expect(client.getQueryState(['clients']).isInvalidated).toBe(false);
    return balance;
  } finally {
    dispose();
    unsubscribe.forEach((stop) => stop());
    client.clear();
  }
}

describe('treasury balances refresh after money operations', () => {
  test('a cash disbursement reduces every displayed balance', async () => {
    expect(await exercise('/caisse', 25000, 'sortie')).toBe(75000);
  });
  test('a supplier invoice payment reduces every displayed balance', async () => {
    expect(await exercise('/paiements-fournisseurs/7/avancer', 40000, 'sortie')).toBe(60000);
  });
  test('a client invoice receipt increases every displayed balance', async () => {
    expect(await exercise('/paiements', 15000, 'entree')).toBe(115000);
  });
  test('a manual cash entry increases every displayed balance', async () => {
    expect(await exercise('/caisse', 10000, 'entree')).toBe(110000);
  });
  test('all pending cash sources and payment reversals are covered', () => {
    for (const source of ['caisse-en-attente', 'caisse-cnv', 'caisse-horslbv',
      'caisse-garage', 'caisse-garage/primes', 'caisse-primes-rep', 'caisse-primes-trans', 'primes-camion']) {
      expect(affectsTreasury('post', `/${source}/7/decaisser`)).toBe(true);
    }
    expect(affectsTreasury('delete', '/paiements/7')).toBe(true);
    expect(affectsTreasury('put', '/caisse/7')).toBe(true);
    expect(affectsTreasury('post', '/paiements/global')).toBe(true);
    expect(affectsTreasury('post', '/annulations/7/rembourser')).toBe(true);
    expect(affectsTreasury('post', '/primes/7/payer')).toBe(true);
  });
  test('reads, draft supplier invoices and non-cash credit notes do not trigger refresh', () => {
    expect(affectsTreasury('get', '/caisse')).toBe(false);
    expect(affectsTreasury('post', '/paiements-fournisseurs')).toBe(false);
    expect(affectsTreasury('post', '/annulations/7/utiliser-avoir')).toBe(false);
    expect(affectsTreasury('post', '/caisse-en-attente/7/refuser')).toBe(false);
  });
  test('failed submissions leave balances untouched and do not refetch', async () => {
    const client = new QueryClient();
    client.setQueryData(['caisse-solde'], 100000);
    const api = axios.create({ adapter: async () => { throw new Error('Payment rejected'); } });
    const dispose = installTreasuryRefresh(api, client);
    try {
      await expect(api.post('/caisse')).rejects.toThrow('Payment rejected');
      expect(client.getQueryData(['caisse-solde'])).toBe(100000);
      expect(client.getQueryState(['caisse-solde']).isInvalidated).toBe(false);
    } finally { dispose(); client.clear(); }
  });
});