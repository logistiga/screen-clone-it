import api from '@/lib/api';

export interface DashboardStats {
  clients: number;
  devis: number;
  ordres: number;
  factures: number;
  paiements: number;
  caisse: number;
  banque: number;
  creances: number;
  ca_mensuel: number;
  ca_annuel: number;
}

export interface DashboardGraphiques {
  ca_mensuel: { mois: string; montant: number }[];
  paiements_mensuel: { mois: string; montant: number }[];
  top_clients: { nom: string; montant: number }[];
  factures_par_categorie: { categorie: string; count: number }[];
}

export interface DashboardAlerte {
  type: 'danger' | 'warning' | 'info';
  message: string;
  count: number;
  lien?: string;
}

export interface DashboardActivite {
  type: 'facture' | 'paiement' | 'client';
  description: string;
  date: string;
  montant?: number;
}

export interface DashboardData {
  stats: DashboardStats;
  graphiques: DashboardGraphiques;
  alertes: DashboardAlerte[];
  activite_recente: DashboardActivite[];
}

const safeNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const normalizeStats = (data: any): DashboardStats => {
  // Le backend Laravel renvoie une structure imbriquée
  // Ex: { clients: { total: 5 }, devis: { total: 10 }, caisse: { solde_actuel: 1000 }, ... }
  
  // Calculer le CA annuel à partir des factures (montant total des factures non annulées)
  const facturesMontant = safeNumber(data?.factures?.montant_total);
  
  // Calculer le CA mensuel à partir du montant période des factures
  const caMensuel = safeNumber(data?.factures?.montant_total);
  
  // Pour le CA annuel, on utilise le total des factures ou le calcul périodique
  const caAnnuel = facturesMontant;

  return {
    clients: safeNumber(data?.clients?.total ?? data?.clients ?? data?.nb_clients),
    devis: safeNumber(data?.devis?.total ?? data?.devis ?? data?.nb_devis),
    ordres: safeNumber(data?.ordres?.total ?? data?.ordres ?? data?.nb_ordres),
    factures: safeNumber(data?.factures?.total ?? data?.factures ?? data?.nb_factures),
    paiements: safeNumber(data?.paiements?.total_periode ?? data?.paiements ?? data?.nb_paiements),
    caisse: safeNumber(data?.caisse?.solde_actuel ?? data?.solde_caisse ?? data?.caisse),
    banque: safeNumber(data?.banque?.solde_actuel ?? data?.solde_banque ?? data?.banque ?? 0),
    creances: safeNumber(data?.creances?.total_impaye ?? data?.creances ?? data?.total_creances),
    ca_mensuel: caMensuel,
    ca_annuel: caAnnuel,
  };
};

const MOIS_NOMS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

const normalizeGraphiques = (data: any): DashboardGraphiques => ({
  ca_mensuel: Array.isArray(data?.ca_mensuel) 
    ? data.ca_mensuel.map((m: any) => ({
        mois: typeof m?.mois === 'number' ? MOIS_NOMS[m.mois - 1] || String(m.mois) : String(m?.mois ?? m?.label ?? ''),
        montant: safeNumber(m?.montant ?? m?.total),
      }))
    : [],
  paiements_mensuel: Array.isArray(data?.paiements_mensuel)
    ? data.paiements_mensuel.map((m: any) => ({
        mois: typeof m?.mois === 'number' ? MOIS_NOMS[m.mois - 1] || String(m.mois) : String(m?.mois ?? m?.label ?? ''),
        montant: safeNumber(m?.montant ?? m?.total),
      }))
    : [],
  top_clients: Array.isArray(data?.top_clients)
    ? data.top_clients.map((c: any) => ({
        // Le backend renvoie: { id, nom, factures_sum_montant_ttc }
        nom: String(c?.nom ?? c?.raison_sociale ?? c?.client_nom ?? 'N/A'),
        montant: safeNumber(c?.factures_sum_montant_ttc ?? c?.montant ?? c?.ca_total ?? c?.total),
      }))
    : [],
  factures_par_categorie: Array.isArray(data?.factures_par_categorie ?? data?.repartition_types)
    ? (data?.factures_par_categorie ?? data?.repartition_types).map((f: any) => ({
        categorie: String(f?.categorie ?? f?.type ?? ''),
        count: safeNumber(f?.count ?? f?.nombre),
      }))
    : [],
});

const normalizeAlertes = (data: any[]): DashboardAlerte[] => {
  if (!Array.isArray(data)) return [];
  return data.map((a) => ({
    type: (['danger', 'warning', 'info'].includes(a?.type) ? a.type : 'info') as DashboardAlerte['type'],
    message: String(a?.message ?? ''),
    count: safeNumber(a?.count ?? a?.nombre),
    lien: a?.lien,
  }));
};

const normalizeActivite = (data: any[]): DashboardActivite[] => {
  if (!Array.isArray(data)) return [];
  return data.map((a) => ({
    type: (['facture', 'paiement', 'client'].includes(a?.type) ? a.type : 'facture') as DashboardActivite['type'],
    description: String(a?.description ?? a?.message ?? ''),
    date: String(a?.date ?? a?.created_at ?? ''),
    montant: a?.montant !== undefined ? safeNumber(a.montant) : undefined,
  }));
};

export const dashboardService = {
  getStats: async (dateDebut?: string, dateFin?: string): Promise<DashboardStats> => {
    const params: Record<string, string> = {};
    if (dateDebut) params.date_debut = dateDebut;
    if (dateFin) params.date_fin = dateFin;
    const response = await api.get('/dashboard', { params });
    return normalizeStats(response.data);
  },

  getGraphiques: async (annee?: number): Promise<DashboardGraphiques> => {
    const params = annee ? { annee } : {};
    const response = await api.get('/dashboard/graphiques', { params });
    return normalizeGraphiques(response.data);
  },

  getAlertes: async (): Promise<DashboardAlerte[]> => {
    const response = await api.get('/dashboard/alertes');
    return normalizeAlertes(response.data);
  },

  getActiviteRecente: async (): Promise<DashboardActivite[]> => {
    const response = await api.get('/dashboard/activite-recente');
    return normalizeActivite(response.data);
  },

  getAll: async (annee?: number): Promise<DashboardData> => {
    const [stats, graphiques, alertes, activite] = await Promise.all([
      dashboardService.getStats(),
      dashboardService.getGraphiques(annee),
      dashboardService.getAlertes(),
      dashboardService.getActiviteRecente(),
    ]);
    return { stats, graphiques, alertes, activite_recente: activite };
  },
};
