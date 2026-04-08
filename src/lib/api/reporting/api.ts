import api from '@/lib/api';
import type {
  ChiffreAffairesData, RentabiliteData, CreancesData, TresorerieData,
  ComparatifData, ActiviteClientsData, StatistiquesDocumentsData, TableauDeBordData,
  ExportType, ExportFilters,
} from './types';
import {
  normalizeChiffreAffaires, normalizeRentabilite, normalizeCreances,
  normalizeTresorerie, normalizeComparatif, normalizeActiviteClients,
  normalizeStatistiquesDocuments, normalizeTableauDeBord, safeString,
} from './normalizers';

// File d'attente séquentielle pour éviter les 429
const reportingQueue: { pending: Promise<void> } = { pending: Promise.resolve() };
const DELAY_BETWEEN_CALLS_MS = 1500;
const MAX_RETRIES_429 = 3;
const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const reportingCallInternal = async <T>(
  endpoint: string, params: Record<string, unknown>,
  normalizer: (raw: unknown, ...args: unknown[]) => T, ...normalizerArgs: unknown[]
): Promise<T> => {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES_429; attempt++) {
    if (attempt > 0) {
      const retryDelay = attempt * 2000;
      console.warn(`[Reporting] 🔄 Retry ${attempt}/${MAX_RETRIES_429} pour /reporting/${endpoint} dans ${retryDelay}ms...`);
      await delay(retryDelay);
    }
    const startTime = performance.now();
    console.log(`[Reporting] ➡️ GET /reporting/${endpoint}${attempt > 0 ? ` (retry ${attempt})` : ''}`, { params });
    try {
      const response = await api.get(`/reporting/${endpoint}`, { params });
      const duration = Math.round(performance.now() - startTime);
      const contentType = response.headers?.['content-type'] || '';
      if (contentType && !contentType.includes('application/json')) {
        console.error(`[Reporting] ❌ /reporting/${endpoint} — Réponse non-JSON reçue`, { contentType, status: response.status });
        throw new Error(`L'API /reporting/${endpoint} a renvoyé du contenu non-JSON (${contentType}).`);
      }
      console.log(`[Reporting] ✅ /reporting/${endpoint} — ${duration}ms`, { status: response.status });
      const normalized = normalizer(response.data, ...normalizerArgs);
      return normalized;
    } catch (error: unknown) {
      const duration = Math.round(performance.now() - startTime);
      const axiosError = error as { response?: { status: number; data: unknown; headers?: Record<string, string> }; message?: string };
      if (axiosError.response) {
        const { status, data } = axiosError.response;
        console.error(`[Reporting] ❌ /reporting/${endpoint} — HTTP ${status} en ${duration}ms`);
        if (status === 429 && attempt < MAX_RETRIES_429) {
          lastError = new Error(`429 - Rate limited sur /reporting/${endpoint}`);
          continue;
        }
        const serverMessage = typeof data === 'object' && data !== null && 'message' in data ? (data as { message: string }).message : null;
        throw new Error(serverMessage || `Erreur ${status} sur /reporting/${endpoint}.`);
      }
      console.error(`[Reporting] 🔴 /reporting/${endpoint} — Erreur réseau en ${duration}ms`);
      throw new Error(`Impossible de joindre l'API reporting (/reporting/${endpoint}).`);
    }
  }
  throw lastError || new Error(`Échec après ${MAX_RETRIES_429} tentatives sur /reporting/${endpoint}`);
};

const reportingCall = <T>(
  endpoint: string, params: Record<string, unknown>,
  normalizer: (raw: unknown, ...args: unknown[]) => T, ...normalizerArgs: unknown[]
): Promise<T> => {
  const result = reportingQueue.pending
    .then(() => delay(DELAY_BETWEEN_CALLS_MS))
    .then(() => reportingCallInternal<T>(endpoint, params, normalizer, ...normalizerArgs));
  reportingQueue.pending = result.then(() => {}, () => {});
  return result;
};

export const reportingApi = {
  getTableauDeBord: async (annee?: number): Promise<TableauDeBordData> => {
    const params: Record<string, unknown> = {}; if (annee) params.annee = annee;
    return reportingCall('synthese', params, normalizeTableauDeBord, annee);
  },
  getChiffreAffaires: async (annee?: number, mois?: number): Promise<ChiffreAffairesData> => {
    const params: Record<string, unknown> = {}; if (annee) params.annee = annee; if (mois) params.mois = mois;
    return reportingCall('chiffre-affaires', params, normalizeChiffreAffaires, annee, mois);
  },
  getRentabilite: async (annee?: number): Promise<RentabiliteData> => {
    const params: Record<string, unknown> = {}; if (annee) params.annee = annee;
    return reportingCall('rentabilite-clients', params, normalizeRentabilite, annee);
  },
  getCreances: async (): Promise<CreancesData> => reportingCall('creances', {}, normalizeCreances),
  getTresorerie: async (dateDebut: string, dateFin: string): Promise<TresorerieData> =>
    reportingCall('tresorerie', { date_debut: dateDebut, date_fin: dateFin }, normalizeTresorerie, dateDebut, dateFin),
  getComparatif: async (annee1: number, annee2: number): Promise<ComparatifData> =>
    reportingCall('comparaison-periodes', { annee1, annee2 }, normalizeComparatif, annee1, annee2),
  getActiviteClients: async (dateDebut: string, dateFin: string, limit?: number): Promise<ActiviteClientsData> =>
    reportingCall('top-clients', { date_debut: dateDebut, date_fin: dateFin, limit }, normalizeActiviteClients, dateDebut, dateFin),
  getStatistiquesDocuments: async (annee?: number): Promise<StatistiquesDocumentsData> => {
    const params: Record<string, unknown> = {}; if (annee) params.annee = annee;
    return reportingCall('analyse-operations', params, normalizeStatistiquesDocuments, annee);
  },
};

export const exportApi = {
  exportCSV: async (type: ExportType, filters: ExportFilters = {}): Promise<Blob> => {
    const response = await api.get(`/export/${type}`, { params: filters, responseType: 'blob' });
    return response.data;
  },
  downloadExport: async (type: ExportType, filters: ExportFilters = {}, _format: 'csv' | 'pdf' = 'csv'): Promise<void> => {
    const blob = await exportApi.exportCSV(type, filters);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
  exportFactures: (filters: ExportFilters = {}) => exportApi.exportCSV('factures', filters),
  exportDevis: (filters: ExportFilters = {}) => exportApi.exportCSV('devis', filters),
  exportOrdres: (filters: ExportFilters = {}) => exportApi.exportCSV('ordres-travail', filters),
  exportPaiements: (filters: ExportFilters = {}) => exportApi.exportCSV('paiements', filters),
  exportCaisse: (filters: ExportFilters = {}) => exportApi.exportCSV('caisse', filters),
  exportClients: (filters: ExportFilters = {}) => exportApi.exportCSV('clients', filters),
  exportPrimes: (filters: ExportFilters = {}) => exportApi.exportCSV('primes', filters),
  exportCreances: () => exportApi.exportCSV('creances'),
  exportTresorerie: (dateDebut: string, dateFin: string) => exportApi.exportCSV('tresorerie', { date_debut: dateDebut, date_fin: dateFin }),
  exportCredits: (filters: ExportFilters = {}) => exportApi.exportCSV('credits', filters),
  exportAnnulations: (filters: ExportFilters = {}) => exportApi.exportCSV('annulations', filters),
  exportActiviteGlobale: (dateDebut: string, dateFin: string) => exportApi.exportCSV('activite-globale', { date_debut: dateDebut, date_fin: dateFin }),
  exportTableauDeBord: (annee: number) => exportApi.exportCSV('tableau-de-bord', { annee }),
};
