/**
 * Utilitaires de normalisation des réponses API paginées.
 * Garantit qu'on obtient toujours un tableau, même si le backend
 * retourne un objet paginé { data: [...] } ou une structure imprévue.
 */

/**
 * Extrait un tableau depuis une réponse API qui peut être :
 * - un tableau direct : [item1, item2]
 * - un objet paginé : { data: [item1, item2], total: 10, ... }
 * - autre chose (retourne [])
 */
export function normalizeArrayResponse<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (typeof data === 'object' && data !== null && 'data' in data) {
    const inner = (data as Record<string, unknown>).data;
    if (Array.isArray(inner)) return inner;
  }
  return [];
}

/**
 * Structure paginée normalisée, avec des valeurs par défaut sûres.
 */
export interface NormalizedPaginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

/**
 * Normalise une réponse paginée du backend.
 * Gère les cas où le backend retourne un tableau simple ou un objet paginé.
 */
export function normalizePaginatedResponse<T>(raw: unknown): NormalizedPaginated<T> {
  // Cas tableau direct
  if (Array.isArray(raw)) {
    return {
      data: raw,
      current_page: 1,
      last_page: 1,
      per_page: raw.length,
      total: raw.length,
      from: raw.length > 0 ? 1 : 0,
      to: raw.length,
    };
  }

  // Cas objet
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    const data = normalizeArrayResponse<T>(raw);

    return {
      data,
      current_page: typeof obj.current_page === 'number' ? obj.current_page : 1,
      last_page: typeof obj.last_page === 'number' ? obj.last_page : 1,
      per_page: typeof obj.per_page === 'number' ? obj.per_page : data.length,
      total: typeof obj.total === 'number' ? obj.total : data.length,
      from: typeof obj.from === 'number' ? obj.from : (data.length > 0 ? 1 : 0),
      to: typeof obj.to === 'number' ? obj.to : data.length,
    };
  }

  // Fallback
  return {
    data: [],
    current_page: 1,
    last_page: 1,
    per_page: 0,
    total: 0,
    from: 0,
    to: 0,
  };
}
