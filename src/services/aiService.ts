import api from '@/lib/api';

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatResponse {
  message: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AiContext {
  clients: { total: number; nouveaux_ce_mois: number };
  factures: { total: number; impayees: number; montant_impaye: number; ce_mois: number };
  paiements: { total_mois: number };
  caisse: { solde: number; entrees_mois: number; sorties_mois: number };
  top_clients: Array<{ nom: string; ca: number }>;
  date_contexte: string;
}

export const aiService = {
  async chat(messages: AiMessage[]): Promise<AiChatResponse> {
    const { data } = await api.post('/ai/chat', { messages });
    return data;
  },

  async getContext(): Promise<AiContext> {
    const { data } = await api.get('/ai/context');
    return data;
  },
};
