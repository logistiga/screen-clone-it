import { expect, test } from 'bun:test';
import api from '@/lib/api';
import { fetchAllPaginated } from './pagination.api';

test('cash monthly totals include movements after the first page', async () => {
  const originalAdapter = api.defaults.adapter;
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true, value: { getItem: () => null },
  });
  const pages = [];
  api.defaults.adapter = async (config) => {
    pages.push(config.params.page);
    return {
      config, status: 200, statusText: 'OK', headers: {},
      data: {
        data: config.params.page === 1
          ? [{ type: 'entree', montant: 100000 }, { type: 'sortie', montant: 25000 }]
          : [{ type: 'sortie', montant: 5000 }],
        meta: { last_page: 2 },
      },
    };
  };
  try {
    const movements = await fetchAllPaginated('/caisse', {
      source: 'caisse', date_debut: '2026-11-01', date_fin: '2026-11-30',
    });
    expect(pages).toEqual([1, 2]);
    expect(movements.filter((m) => m.type === 'sortie').reduce((sum, m) => sum + m.montant, 0)).toBe(30000);
  } finally {
    api.defaults.adapter = originalAdapter;
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
    else delete globalThis.localStorage;
  }
});