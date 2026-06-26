import api from '@/lib/api';
import type {
  DetentionAttente,
  DetentionStats,
  DetentionsParams,
} from '@/hooks/use-detentions-attente';

export interface DetentionsResponse {
  data: DetentionAttente[];
  meta: { current_page: number; last_page: number; per_page: number; total: number };
  source_errors?: Record<string, string>;
}

export async function fetchDetentionsAttente(params: DetentionsParams): Promise<DetentionsResponse> {
  const { data } = await api.get('/detentions-attente', { params });
  return data as DetentionsResponse;
}

export async function fetchDetentionsAttenteStats(): Promise<DetentionStats> {
  const { data } = await api.get('/detentions-attente/stats');
  return data as DetentionStats;
}
