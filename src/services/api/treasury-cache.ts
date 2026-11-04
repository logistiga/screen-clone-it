import type { AxiosInstance } from 'axios';
import type { QueryClient } from '@tanstack/react-query';

const treasuryKeys = [
  'caisse', 'caisse-solde', 'caisse-solde-jour',
  'caisse-mouvements', 'caisse-mouvements-mois', 'mouvements-caisse',
  'banques', 'mouvements-bancaires', 'paiements',
] as const;

/** Invalidate both historical and current query names; never calculate balances locally. */
export async function refreshTreasury(client: QueryClient): Promise<void> {
  await client.invalidateQueries({
    predicate: ({ queryKey }) => treasuryKeys.some((key) => key === queryKey[0]),
  });
}

export function affectsTreasury(method?: string, url?: string): boolean {
  if (!method || !['post', 'put', 'patch', 'delete'].includes(method.toLowerCase()) || !url) {
    return false;
  }
  const path = url.split('?')[0].replace(/\/$/, '');
  return /(?:^|\/)caisse(?:\/\d+)?$/.test(path)
    || /(?:^|\/)paiements(?:\/global|\/\d+)?$/.test(path)
    || /(?:^|\/)paiements-fournisseurs\/\d+\/avancer$/.test(path)
    || /(?:^|\/)(?:caisse-en-attente|caisse-cnv|caisse-horslbv|caisse-garage(?:\/primes)?|caisse-primes-rep|caisse-primes-trans|primes-camion)\/[^/]+\/decaisser$/.test(path)
    || /(?:^|\/)primes\/[^/]+\/payer$/.test(path)
    || /(?:^|\/)annulations\/[^/]+\/rembourser$/.test(path);
}

/** Catch successful writes regardless of which screen/hook submitted them. */
export function installTreasuryRefresh(api: AxiosInstance, client: QueryClient): () => void {
  const id = api.interceptors.response.use(async (response) => {
    if (response.status >= 200 && response.status < 300
      && affectsTreasury(response.config.method, response.config.url)) {
      await refreshTreasury(client);
    }
    return response;
  });
  return () => api.interceptors.response.eject(id);
}