import api from '@/lib/api';

// ===== Mouvements caisse =====
export interface CaisseMouvementParams {
  page?: number;
  per_page?: number;
  source?: string;
  search?: string;
  type?: string;
  date_debut?: string;
  date_fin?: string;
}

export async function fetchCaisseMouvements<T = unknown>(params: CaisseMouvementParams): Promise<T> {
  const response = await api.get('/caisse', { params });
  return response.data as T;
}

export async function fetchCaisseSolde<T = unknown>(params?: Record<string, string>): Promise<T> {
  const response = await api.get('/caisse/solde', { params });
  return response.data as T;
}

export async function fetchCaisseSoldeJour<T = unknown>(date: string): Promise<T> {
  const response = await api.get('/caisse/solde-jour', { params: { date } });
  return response.data as T;
}

// ===== Caisse en attente (stats + listes) =====
const CAISSE_SOURCES = {
  OPS: '/caisse-en-attente',
  CNV: '/caisse-cnv',
  HORSLBV: '/caisse-horslbv',
  GARAGE: '/caisse-garage',
  GARAGE_PRIME: '/caisse-garage/primes',
  PRIME_REP: '/caisse-primes-rep',
  PRIME_TRANS: '/caisse-primes-trans',
} as const;

export type CaisseSourceKey = keyof typeof CAISSE_SOURCES;

export async function fetchCaisseAttenteStats<T = unknown>(source: CaisseSourceKey): Promise<T> {
  const response = await api.get(`${CAISSE_SOURCES[source]}/stats`);
  return response.data as T;
}

export async function fetchCaisseAttenteList<T = unknown>(
  source: CaisseSourceKey,
  params: Record<string, string | number>,
): Promise<T> {
  const response = await api.get(CAISSE_SOURCES[source], { params });
  return response.data as T;
}

export async function decaisserPrime<T = unknown>(
  source: CaisseSourceKey,
  primeId: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const response = await api.post(`${CAISSE_SOURCES[source]}/${primeId}/decaisser`, payload);
  return response.data as T;
}

export async function refuserPrime<T = unknown>(
  source: CaisseSourceKey,
  primeId: string,
  payload: { motif?: string },
): Promise<T> {
  const response = await api.post(`${CAISSE_SOURCES[source]}/${primeId}/refuser`, payload);
  return response.data as T;
}

// ===== Catégories de dépenses =====
export async function fetchCategoriesDepenses<T = unknown>(
  params?: Record<string, string | number | boolean>,
): Promise<T> {
  const response = await api.get('/categories-depenses', { params });
  return response.data as T;
}
