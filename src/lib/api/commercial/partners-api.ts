import api from '@/lib/api';
import type { Armateur, Transitaire, Representant } from './types';

// Armateurs API
export const armateursApi = {
  getAll: async () => {
    const response = await api.get('/armateurs', { params: { per_page: 9999 } });
    const payload: any = response.data;
    if (Array.isArray(payload)) return payload as Armateur[];
    const data = payload?.data;
    if (Array.isArray(data)) return data as Armateur[];
    if (Array.isArray(data?.data)) return data.data as Armateur[];
    console.warn('[armateursApi.getAll] Format inattendu:', payload);
    return [] as Armateur[];
  },
  
  getById: async (id: string) => {
    const response = await api.get<{ data: Armateur }>(`/armateurs/${id}`);
    return response.data.data;
  },

  updateTypeConteneur: async (id: number | string, type_conteneur: string) => {
    const response = await api.put<{ data: Armateur }>(`/armateurs/${id}`, { type_conteneur });
    return response.data.data;
  },

  syncFromOps: async () => {
    const response = await api.post('/sync-diagnostic/sync-armateurs');
    return response.data;
  },
};

// Transitaires API
export const transitairesApi = {
  getAll: async () => {
    const PER_PAGE = 500;

    const fetchPage = async (page: number) => {
      const response = await api.get('/transitaires', { params: { page, per_page: PER_PAGE } });
      return response.data as any;
    };

    const firstPayload = await fetchPage(1);
    console.log('[transitairesApi.getAll] Raw response:', firstPayload);

    if (Array.isArray(firstPayload)) {
      console.log('[transitairesApi.getAll] Returning direct array:', firstPayload.length);
      return firstPayload as Transitaire[];
    }

    const firstData = Array.isArray(firstPayload?.data)
      ? (firstPayload.data as Transitaire[])
      : Array.isArray(firstPayload?.data?.data)
        ? (firstPayload.data.data as Transitaire[])
        : ([] as Transitaire[]);

    const meta = firstPayload?.meta;
    const lastPage = typeof meta?.last_page === 'number' ? meta.last_page : Number(meta?.last_page ?? 1);

    if (!lastPage || lastPage <= 1) {
      return firstData;
    }

    const all: Transitaire[] = [...firstData];

    for (let page = 2; page <= lastPage; page++) {
      const payload = await fetchPage(page);
      const pageData = Array.isArray(payload?.data)
        ? (payload.data as Transitaire[])
        : Array.isArray(payload?.data?.data)
          ? (payload.data.data as Transitaire[])
          : ([] as Transitaire[]);

      all.push(...pageData);
      if (pageData.length === 0) break;
    }

    console.log('[transitairesApi.getAll] Aggregated:', all.length);
    return all;
  },
  
  getById: async (id: string) => {
    const response = await api.get<{ data: Transitaire }>(`/transitaires/${id}`);
    return response.data.data;
  },
  
  create: async (data: Partial<Transitaire>) => {
    const response = await api.post<{ data: Transitaire }>('/transitaires', data);
    return response.data.data;
  },
  
  update: async (id: string, data: Partial<Transitaire>) => {
    const response = await api.put<{ data: Transitaire }>(`/transitaires/${id}`, data);
    return response.data.data;
  },
  
  delete: async (id: string) => {
    await api.delete(`/transitaires/${id}`);
  },
};

// Representants API
export const representantsApi = {
  getAll: async (params?: { per_page?: number }) => {
    console.log('[representantsApi.getAll] Appel avec params:', params);
    const response = await api.get('/representants', { params });
    console.log('[representantsApi.getAll] Réponse brute:', response.data);
    const payload: any = response.data;
    if (Array.isArray(payload)) {
      console.log('[representantsApi.getAll] Format tableau direct, count:', payload.length);
      return payload as Representant[];
    }
    const data = payload?.data;
    if (Array.isArray(data)) {
      console.log('[representantsApi.getAll] Format {data: []}, count:', data.length);
      return data as Representant[];
    }
    if (Array.isArray(data?.data)) {
      console.log('[representantsApi.getAll] Format {data: {data: []}}, count:', data.data.length);
      return data.data as Representant[];
    }
    console.warn('[representantsApi.getAll] Format inattendu:', payload);
    return [] as Representant[];
  },
  
  getById: async (id: string) => {
    const response = await api.get<{ data: Representant }>(`/representants/${id}`);
    return response.data.data;
  },
  
  create: async (data: Partial<Representant>) => {
    const response = await api.post<{ data: Representant }>('/representants', data);
    return response.data.data;
  },
  
  update: async (id: string, data: Partial<Representant>) => {
    const response = await api.put<{ data: Representant }>(`/representants/${id}`, data);
    return response.data.data;
  },
  
  delete: async (id: string) => {
    await api.delete(`/representants/${id}`);
  },
};
