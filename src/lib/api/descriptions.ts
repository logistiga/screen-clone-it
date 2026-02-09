import api from '@/lib/api';

export interface DescriptionSuggestionsResponse {
  suggestions: string[];
}

/**
 * Rechercher des suggestions de descriptions existantes.
 * @param query Terme de recherche (min 2 caractères)
 * @param type Type de document : 'lot', 'conteneur' ou 'all'
 * @param limit Nombre max de résultats
 */
export async function searchDescriptions(
  query: string,
  type: 'lot' | 'conteneur' | 'all' = 'all',
  limit: number = 10
): Promise<string[]> {
  if (query.trim().length < 2) return [];
  
  const { data } = await api.get<DescriptionSuggestionsResponse>('/descriptions/suggestions', {
    params: { q: query.trim(), type, limit },
  });
  
  return data.suggestions;
}
