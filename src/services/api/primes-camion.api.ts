import api from '@/lib/api';

export interface PrimeCamionParams {
  page?: number;
  per_page?: number;
  statut?: string;
  search?: string;
}

export async function fetchPrimesCamion<T = unknown>(params: PrimeCamionParams): Promise<T> {
  const response = await api.get('/primes-camion', { params });
  return response.data as T;
}

export async function fetchPrimesCamionStats<T = unknown>(): Promise<T> {
  const response = await api.get('/primes-camion/stats');
  return response.data as T;
}

export async function decaisserPrimeCamion<T = unknown>(
  primeId: number | string,
  payload: { mode_paiement: string; reference?: string; notes?: string },
): Promise<T> {
  const response = await api.post(`/primes-camion/${primeId}/decaisser`, payload);
  return response.data as T;
}
