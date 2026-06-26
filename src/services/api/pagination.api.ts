import api from '@/lib/api';
import type { PaginatedResponse } from '@/lib/api/commercial';

/**
 * Récupère toutes les pages d'une ressource paginée standard Laravel (meta.last_page).
 * Utilisé par les exports volumineux côté front (relevés clients, etc.).
 */
export async function fetchAllPaginated<T>(
  url: string,
  params: Record<string, string | number>,
  perPage = 100,
): Promise<T[]> {
  const first = await api.get<PaginatedResponse<T>>(url, {
    params: { ...params, page: 1, per_page: perPage },
  });
  const items = Array.isArray(first.data.data) ? [...first.data.data] : [];
  const lastPage = Number(first.data.meta?.last_page || 1);
  for (let page = 2; page <= lastPage; page += 1) {
    const response = await api.get<PaginatedResponse<T>>(url, {
      params: { ...params, page, per_page: perPage },
    });
    if (Array.isArray(response.data.data)) items.push(...response.data.data);
  }
  return items;
}
