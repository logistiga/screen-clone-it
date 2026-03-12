import api from '@/lib/api';

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiChatResponse {
  message: string;
  session_id: string;
}

export interface AiProvider {
  label: string;
  models: string[];
  needs_key: boolean;
}

export interface AiSettingData {
  id?: number;
  provider: string;
  api_url: string | null;
  model: string;
  max_context_length: number;
  system_prompt: string | null;
  extra_config: Record<string, unknown> | null;
  is_active: boolean;
}

export interface AiSettingsResponse {
  setting: AiSettingData | null;
  providers: Record<string, AiProvider>;
}

export interface AiSession {
  session_id: string;
  started_at: string;
  last_message_at: string;
  message_count: number;
}

export const aiService = {
  async chat(message: string, sessionId?: string): Promise<AiChatResponse> {
    const { data } = await api.post('/ai/chat', { message, session_id: sessionId });
    return data;
  },

  async getContext() {
    const { data } = await api.get('/ai/context');
    return data;
  },

  async getSettings(): Promise<AiSettingsResponse> {
    const { data } = await api.get('/ai/settings');
    return data;
  },

  async updateSettings(settings: Partial<AiSettingData> & { api_key?: string }): Promise<void> {
    await api.put('/ai/settings', settings);
  },

  async testConnection(): Promise<{ success: boolean; response?: string; error?: string }> {
    const { data } = await api.post('/ai/test-connection');
    return data;
  },

  async getSessions(): Promise<AiSession[]> {
    const { data } = await api.get('/ai/history');
    return data;
  },

  async getSessionMessages(sessionId: string): Promise<AiMessage[]> {
    const { data } = await api.get('/ai/history', { params: { session_id: sessionId } });
    return data;
  },
};
