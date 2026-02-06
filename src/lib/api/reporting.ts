import api from '../api';

// ============ TYPES ============

export interface ChiffreAffairesData {
  annee: number;
  mois: number | null;
  mensuel: {
    mois: number;
    label: string;
    total_ht: number;
    total_tva: number;
    total_css: number;
    total_ttc: number;
    nb_factures: number;
  }[];
  total_annuel: {
    total_ht: number;
    total_tva: number;
    total_css: number;
    total_ttc: number;
    nb_factures: number;
  };
}

export interface RentabiliteData {
  annee: number;
  chiffre_affaires: number;
  charges_exploitation: number;
  charges_financieres: number;
  commissions: number;
  marge_brute: number;
  resultat_net: number;
  taux_marge: number;
  mensuel: {
    mois: number;
    label: string;
    ca: number;
    charges: number;
    marge: number;
  }[];
}

export interface CreancesData {
  total_creances: number;
  nb_factures_impayees: number;
  age_moyen: number;
  par_tranche: {
    tranche: string;
    montant: number;
    nb_factures: number;
  }[];
  top_debiteurs: {
    client_id: number;
    client_nom: string;
    montant_du: number;
    nb_factures: number;
    plus_ancienne: string;
  }[];
}

export interface TresorerieData {
  date_debut: string;
  date_fin: string;
  solde_initial: number;
  solde_final: number;
  total_entrees: number;
  total_sorties: number;
  mouvements_quotidiens: {
    date: string;
    entrees: number;
    sorties: number;
    solde: number;
  }[];
  par_categorie: {
    categorie: string;
    entrees: number;
    sorties: number;
  }[];
}

export interface ComparatifData {
  annee1: number;
  annee2: number;
  ca_annee1: number;
  ca_annee2: number;
  variation_ca: number;
  nb_factures_annee1: number;
  nb_factures_annee2: number;
  variation_factures: number;
  nb_clients_annee1: number;
  nb_clients_annee2: number;
  variation_clients: number;
}

export interface ActiviteClientsData {
  date_debut: string;
  date_fin: string;
  total_clients: number;
  clients_actifs: number;
  top_clients: {
    client_id: number;
    client_nom: string;
    ca_total: number;
    nb_factures: number;
    paiements: number;
    solde_du: number;
  }[];
}

export interface StatistiquesDocumentsData {
  annee: number;
  devis: {
    total: number;
    brouillon: number;
    envoye: number;
    accepte: number;
    refuse: number;
    expire: number;
    taux_conversion: number;
  };
  ordres: {
    total: number;
    en_cours: number;
    termine: number;
    facture: number;
    taux_facturation: number;
  };
  factures: {
    total: number;
    brouillon: number;
    validee: number;
    partiellement_payee: number;
    payee: number;
    annulee: number;
    taux_recouvrement: number;
  };
}

export interface TableauDeBordData {
  annee: number;
  kpis: {
    ca_total: number;
    ca_mois_courant: number;
    creances_totales: number;
    taux_recouvrement: number;
    nb_factures: number;
    nb_ordres: number;
    nb_devis: number;
    nb_clients: number;
  };
  evolution_mensuelle: {
    mois: string;
    ca: number;
    encaissements: number;
  }[];
  alertes: {
    type: string;
    message: string;
    count: number;
  }[];
}

// ============ API CALLS REPORTING ============

const MOIS_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

const safeNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const safeString = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const normalizeKey = (value: unknown): string => {
  return safeString(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
};

const normalizeChiffreAffaires = (raw: any, annee?: number, mois?: number): ChiffreAffairesData => {
  // Nouveau format (déjà compatible)
  if (raw?.mensuel && raw?.total_annuel) return raw as ChiffreAffairesData;

  const parMois: any[] = Array.isArray(raw?.par_mois) ? raw.par_mois : [];
  const totaux = raw?.totaux ?? {};

  return {
    annee: safeNumber(raw?.annee ?? annee),
    mois: mois ?? (raw?.mois ?? null),
    mensuel: parMois.map((m) => ({
      mois: safeNumber(m?.mois),
      label: safeString(m?.label, MOIS_LABELS[safeNumber(m?.mois) - 1] || ""),
      total_ht: safeNumber(m?.total_ht),
      total_tva: safeNumber(m?.total_tva),
      total_css: safeNumber(m?.total_css),
      total_ttc: safeNumber(m?.total_ttc),
      nb_factures: safeNumber(m?.nombre_factures ?? m?.nb_factures),
    })),
    total_annuel: {
      total_ht: safeNumber(totaux?.total_ht),
      total_tva: safeNumber(totaux?.total_tva),
      total_css: safeNumber(totaux?.total_css),
      total_ttc: safeNumber(totaux?.total_ttc),
      nb_factures: safeNumber(totaux?.nombre_factures ?? totaux?.nb_factures),
    },
  };
};

const normalizeRentabilite = (raw: any, annee?: number): RentabiliteData => {
  if (raw?.mensuel && typeof raw?.chiffre_affaires === "number") return raw as RentabiliteData;

  const mensuel: any[] = Array.isArray(raw?.par_mois) ? raw.par_mois : Array.isArray(raw?.mensuel) ? raw.mensuel : [];

  return {
    annee: safeNumber(raw?.annee ?? annee),
    chiffre_affaires: safeNumber(raw?.chiffre_affaires_ht ?? raw?.chiffre_affaires),
    charges_exploitation: safeNumber(raw?.depenses_exploitation ?? raw?.charges_exploitation),
    charges_financieres: safeNumber(raw?.charges_financieres),
    commissions: safeNumber(raw?.primes ?? raw?.commissions),
    marge_brute: safeNumber(raw?.resultat_brut ?? raw?.marge_brute),
    resultat_net: safeNumber(raw?.resultat_net),
    taux_marge: safeNumber(raw?.marge_brute_pct ?? raw?.taux_marge),
    mensuel: mensuel.map((m) => ({
      mois: safeNumber(m?.mois),
      label: safeString(m?.label, MOIS_LABELS[safeNumber(m?.mois) - 1] || ""),
      ca: safeNumber(m?.ca),
      charges: safeNumber(m?.charges),
      marge: safeNumber(m?.marge),
    })),
  };
};

const normalizeCreances = (raw: any): CreancesData => {
  if (raw?.par_tranche && raw?.top_debiteurs) return raw as CreancesData;

  const tranches = raw?.par_tranche_age ?? {};
  const parTranche: CreancesData["par_tranche"] = [
    { tranche: "À jour", montant: safeNumber(tranches?.a_jour), nb_factures: 0 },
    { tranche: "1-30 jours", montant: safeNumber(tranches?.["1_30_jours"]), nb_factures: 0 },
    { tranche: "31-60 jours", montant: safeNumber(tranches?.["31_60_jours"]), nb_factures: 0 },
    { tranche: "61-90 jours", montant: safeNumber(tranches?.["61_90_jours"]), nb_factures: 0 },
    { tranche: "+90 jours", montant: safeNumber(tranches?.plus_90_jours), nb_factures: 0 },
  ];

  const topDebiteurs = Array.isArray(raw?.top_debiteurs) ? raw.top_debiteurs : [];

  return {
    total_creances: safeNumber(raw?.total_creances),
    nb_factures_impayees: safeNumber(raw?.nombre_factures ?? raw?.nb_factures_impayees),
    age_moyen: safeNumber(raw?.age_moyen),
    par_tranche: parTranche,
    top_debiteurs: topDebiteurs.map((c: any) => ({
      client_id: safeNumber(c?.client_id),
      client_nom: safeString(c?.client_nom, "N/A"),
      montant_du: safeNumber(c?.total_restant ?? c?.montant_du),
      nb_factures: safeNumber(c?.nombre_factures ?? c?.nb_factures),
      plus_ancienne: safeString(c?.plus_ancienne, ""),
    })),
  };
};

const normalizeTresorerie = (raw: any, dateDebut: string, dateFin: string): TresorerieData => {
  if (raw?.mouvements_quotidiens && raw?.date_debut) return raw as TresorerieData;

  const periodeDebut = safeString(raw?.periode?.debut, dateDebut);
  const periodeFin = safeString(raw?.periode?.fin, dateFin);

  return {
    date_debut: periodeDebut,
    date_fin: periodeFin,
    solde_initial: safeNumber(raw?.solde_initial),
    solde_final: safeNumber(raw?.solde_final),
    total_entrees: safeNumber(raw?.total_entrees),
    total_sorties: safeNumber(raw?.total_sorties),
    mouvements_quotidiens: (Array.isArray(raw?.mouvements_quotidiens) ? raw.mouvements_quotidiens : []).map((m: any) => ({
      date: safeString(m?.date ?? m?.jour),
      entrees: safeNumber(m?.entrees),
      sorties: safeNumber(m?.sorties),
      solde: safeNumber(m?.solde ?? m?.solde_cumule),
    })),
    par_categorie: (Array.isArray(raw?.par_categorie) ? raw.par_categorie : []).map((c: any) => ({
      categorie: safeString(c?.categorie),
      entrees: safeNumber(c?.entrees),
      sorties: safeNumber(c?.sorties),
    })),
  };
};

const normalizeComparatif = (raw: any, annee1: number, annee2: number): ComparatifData => {
  if (typeof raw?.ca_annee1 === "number" && typeof raw?.ca_annee2 === "number") return raw as ComparatifData;

  const p1 = raw?.periode_1 ?? {};
  const p2 = raw?.periode_2 ?? {};
  const v = raw?.variations ?? {};

  return {
    annee1: safeNumber(p1?.annee ?? annee1),
    annee2: safeNumber(p2?.annee ?? annee2),
    ca_annee1: safeNumber(p1?.ca_ttc ?? p1?.ca_ht),
    ca_annee2: safeNumber(p2?.ca_ttc ?? p2?.ca_ht),
    variation_ca: safeNumber(v?.ca_ttc ?? v?.ca_ht),
    nb_factures_annee1: safeNumber(p1?.nombre_factures),
    nb_factures_annee2: safeNumber(p2?.nombre_factures),
    variation_factures: safeNumber(v?.nombre_factures),
    nb_clients_annee1: safeNumber(p1?.nouveaux_clients),
    nb_clients_annee2: safeNumber(p2?.nouveaux_clients),
    variation_clients: safeNumber(v?.nouveaux_clients),
  };
};

const normalizeActiviteClients = (raw: any, dateDebut: string, dateFin: string): ActiviteClientsData => {
  if (raw?.top_clients && raw?.date_debut) return raw as ActiviteClientsData;

  const top = Array.isArray(raw?.top_clients) ? raw.top_clients : [];
  const totaux = raw?.totaux ?? {};

  return {
    date_debut: safeString(raw?.periode?.debut, dateDebut),
    date_fin: safeString(raw?.periode?.fin, dateFin),
    total_clients: top.length,
    clients_actifs: safeNumber(totaux?.nombre_clients_actifs),
    top_clients: top.map((c: any) => ({
      client_id: safeNumber(c?.id ?? c?.client_id),
      client_nom: safeString(c?.nom ?? c?.raison_sociale ?? c?.client_nom, "N/A"),
      ca_total: safeNumber(c?.factures_sum_montant_ttc ?? c?.ca_total),
      nb_factures: safeNumber(c?.factures_count ?? c?.nb_factures),
      paiements: safeNumber(c?.paiements_sum_montant ?? c?.paiements),
      solde_du: safeNumber(c?.solde ?? c?.solde_du),
    })),
  };
};

const normalizeStatistiquesDocuments = (raw: any, annee?: number): StatistiquesDocumentsData => {
  if (raw?.devis?.brouillon !== undefined) return raw as StatistiquesDocumentsData;

  const countsFromRows = (rows: any[], expected: string[]) => {
    const out: Record<string, number> = Object.fromEntries(expected.map((k) => [k, 0]));
    for (const r of rows) {
      const key = normalizeKey(r?.statut);
      if (key in out) out[key] += safeNumber(r?.nombre);
    }
    return out;
  };

  const devisExpected = ["brouillon", "envoye", "accepte", "refuse", "expire", "converti"];
  const ordresExpected = ["en_cours", "termine", "facture"];
  const facturesExpected = ["brouillon", "validee", "partiellement_payee", "payee", "annulee", "envoyee", "envoyee_"]; // compat

  const devisRows = Array.isArray(raw?.devis?.par_statut) ? raw.devis.par_statut : [];
  const ordresRows = Array.isArray(raw?.ordres?.par_statut) ? raw.ordres.par_statut : [];
  const facturesRows = Array.isArray(raw?.factures?.par_statut) ? raw.factures.par_statut : [];

  const devisCounts = countsFromRows(devisRows, devisExpected);
  const ordresCounts = countsFromRows(ordresRows, ordresExpected);

  // Factures: mapper "envoyee" -> "validee" si besoin
  const facturesCounts = (() => {
    const expected = ["brouillon", "validee", "partiellement_payee", "payee", "annulee"];
    const out: Record<string, number> = Object.fromEntries(expected.map((k) => [k, 0]));

    for (const r of facturesRows) {
      const keyRaw = normalizeKey(r?.statut);
      const key =
        keyRaw === "envoyee" || keyRaw === "envoyee_" || keyRaw === "envoyee__"
          ? "validee"
          : keyRaw === "payee" ? "payee" : keyRaw;

      if (key in out) out[key] += safeNumber(r?.nombre);
    }

    return out;
  })();

  return {
    annee: safeNumber(raw?.annee ?? annee),
    devis: {
      total: safeNumber(raw?.devis?.total),
      brouillon: safeNumber(devisCounts.brouillon),
      envoye: safeNumber(devisCounts.envoye),
      accepte: safeNumber(devisCounts.accepte),
      refuse: safeNumber(devisCounts.refuse),
      expire: safeNumber(devisCounts.expire),
      taux_conversion: safeNumber(raw?.devis?.taux_conversion),
    },
    ordres: {
      total: safeNumber(raw?.ordres?.total),
      en_cours: safeNumber(ordresCounts.en_cours),
      termine: safeNumber(ordresCounts.termine),
      facture: safeNumber(ordresCounts.facture),
      taux_facturation: safeNumber(raw?.ordres?.taux_conversion ?? raw?.ordres?.taux_facturation),
    },
    factures: {
      total: safeNumber(raw?.factures?.total),
      brouillon: safeNumber(facturesCounts.brouillon),
      validee: safeNumber(facturesCounts.validee),
      partiellement_payee: safeNumber(facturesCounts.partiellement_payee),
      payee: safeNumber(facturesCounts.payee),
      annulee: safeNumber(facturesCounts.annulee),
      taux_recouvrement: safeNumber(raw?.factures?.taux_recouvrement),
    },
  };
};

const normalizeTableauDeBord = (raw: any, annee?: number): TableauDeBordData => {
  if (raw?.kpis) return raw as TableauDeBordData;

  const indicateurs = raw?.indicateurs ?? {};
  const documents = raw?.documents ?? {};

  const caTotal = safeNumber(indicateurs?.ca_ttc ?? raw?.rentabilite?.chiffre_affaires_ttc);
  const creances = safeNumber(indicateurs?.creances_totales ?? raw?.creances?.total_creances);
  const tauxRecouvrement = caTotal > 0 ? Math.round((((caTotal - creances) / caTotal) * 100) * 100) / 100 : 0;

  return {
    annee: safeNumber(raw?.annee ?? annee),
    kpis: {
      ca_total: caTotal,
      ca_mois_courant: safeNumber(indicateurs?.ca_mois_courant),
      creances_totales: creances,
      taux_recouvrement: safeNumber(indicateurs?.taux_recouvrement ?? tauxRecouvrement),
      nb_factures: safeNumber(documents?.factures?.total ?? indicateurs?.factures_en_cours),
      nb_ordres: safeNumber(documents?.ordres?.total),
      nb_devis: safeNumber(documents?.devis?.total),
      nb_clients: safeNumber(indicateurs?.nb_clients),
    },
    evolution_mensuelle: [],
    alertes: (Array.isArray(raw?.alertes) ? raw.alertes : []).map((a: any) => ({
      type: safeString(a?.type, "info"),
      message: safeString(a?.message),
      count: safeNumber(a?.count),
    })),
  };
};

// ===== File d'attente séquentielle pour éviter les 429 =====
const reportingQueue: {
  pending: Promise<void>;
} = { pending: Promise.resolve() };

const DELAY_BETWEEN_CALLS_MS = 1500; // Délai entre chaque appel (1.5s pour éviter le rate limit)
const MAX_RETRIES_429 = 3;

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

// Helper pour logger les appels reporting et propager les erreurs réelles
const reportingCallInternal = async <T>(
  endpoint: string,
  params: Record<string, unknown>,
  normalizer: (raw: unknown, ...args: unknown[]) => T,
  ...normalizerArgs: unknown[]
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES_429; attempt++) {
    if (attempt > 0) {
      const retryDelay = attempt * 2000; // 2s, 4s, 6s backoff
      console.warn(`[Reporting] 🔄 Retry ${attempt}/${MAX_RETRIES_429} pour /reporting/${endpoint} dans ${retryDelay}ms...`);
      await delay(retryDelay);
    }

    const startTime = performance.now();
    console.log(`[Reporting] ➡️ GET /reporting/${endpoint}${attempt > 0 ? ` (retry ${attempt})` : ''}`, { params });

    try {
      const response = await api.get(`/reporting/${endpoint}`, { params });
      const duration = Math.round(performance.now() - startTime);

      // Vérifier que la réponse est du JSON valide
      const contentType = response.headers?.['content-type'] || '';
      if (contentType && !contentType.includes('application/json')) {
        console.error(`[Reporting] ❌ /reporting/${endpoint} — Réponse non-JSON reçue`, {
          contentType,
          status: response.status,
          dataPreview: typeof response.data === 'string' ? response.data.substring(0, 300) : response.data,
        });
        throw new Error(
          `L'API /reporting/${endpoint} a renvoyé du contenu non-JSON (${contentType}). ` +
          `Cela peut indiquer une erreur serveur ou une redirection.`
        );
      }

      console.log(`[Reporting] ✅ /reporting/${endpoint} — ${duration}ms`, {
        status: response.status,
        dataKeys: response.data ? Object.keys(response.data) : [],
        dataPreview: JSON.stringify(response.data).substring(0, 200),
      });

      const normalized = normalizer(response.data, ...normalizerArgs);
      console.log(`[Reporting] 📊 /reporting/${endpoint} — Données normalisées:`, {
        keys: Object.keys(normalized as Record<string, unknown>),
      });

      return normalized;
    } catch (error: unknown) {
      const duration = Math.round(performance.now() - startTime);
      const axiosError = error as { response?: { status: number; data: unknown; headers?: Record<string, string> }; message?: string };

      if (axiosError.response) {
        const { status, data, headers } = axiosError.response;
        const contentType = headers?.['content-type'] || '';
        const isHtml = contentType.includes('text/html') || 
                       (typeof data === 'string' && (data.trim().startsWith('<!') || data.includes('<html')));

        console.error(`[Reporting] ❌ /reporting/${endpoint} — HTTP ${status} en ${duration}ms`, {
          status,
          contentType,
          isHtmlResponse: isHtml,
          errorData: isHtml 
            ? `[HTML Response - ${(typeof data === 'string' ? data : '').substring(0, 200)}]`
            : data,
          params,
        });

        // Si 429 et qu'on peut retry, on continue la boucle
        if (status === 429 && attempt < MAX_RETRIES_429) {
          const retryAfter = typeof data === 'object' && data !== null && 'retry_after' in data
            ? (data as { retry_after: number }).retry_after
            : null;
          if (retryAfter) {
            console.warn(`[Reporting] ⏳ Serveur demande d'attendre ${retryAfter}s pour /reporting/${endpoint}`);
          }
          lastError = new Error(`429 - Rate limited sur /reporting/${endpoint}`);
          continue; // Retry avec backoff
        }

        // Message d'erreur clair pour l'utilisateur
        const serverMessage = typeof data === 'object' && data !== null && 'message' in data 
          ? (data as { message: string }).message 
          : null;

        throw new Error(
          serverMessage || 
          `Erreur ${status} sur /reporting/${endpoint}. ${
            status === 500 ? 'Erreur interne du serveur — vérifiez les logs backend (storage/logs/laravel.log).' :
            status === 401 ? 'Session expirée — reconnectez-vous.' :
            status === 403 ? 'Permission insuffisante pour accéder au reporting.' :
            status === 429 ? 'Trop de requêtes — patientez 30s avant de réessayer.' :
            status === 404 ? 'Endpoint non trouvé — vérifiez la configuration des routes backend.' :
            'Erreur inattendue.'
          }`
        );
      }

      // Erreur réseau ou autre
      console.error(`[Reporting] 🔴 /reporting/${endpoint} — Erreur réseau en ${duration}ms`, {
        message: axiosError.message || String(error),
        params,
      });

      throw new Error(
        `Impossible de joindre l'API reporting (/reporting/${endpoint}). ` +
        `Vérifiez votre connexion et que le serveur backend est accessible.`
      );
    }
  }

  // Si on arrive ici, tous les retries ont échoué
  throw lastError || new Error(`Échec après ${MAX_RETRIES_429} tentatives sur /reporting/${endpoint}`);
};

// Wrapper qui sérialise les appels via une file d'attente
const reportingCall = <T>(
  endpoint: string,
  params: Record<string, unknown>,
  normalizer: (raw: unknown, ...args: unknown[]) => T,
  ...normalizerArgs: unknown[]
): Promise<T> => {
  // Chaîner chaque appel après le précédent avec un délai
  const result = reportingQueue.pending
    .then(() => delay(DELAY_BETWEEN_CALLS_MS))
    .then(() => reportingCallInternal<T>(endpoint, params, normalizer, ...normalizerArgs));

  // Mettre à jour la file: le prochain appel attend que celui-ci finisse (succès ou échec)
  reportingQueue.pending = result.then(() => {}, () => {});

  return result;
};

export const reportingApi = {
  // Tableau de bord
  getTableauDeBord: async (annee?: number): Promise<TableauDeBordData> => {
    const params: Record<string, unknown> = {};
    if (annee) params.annee = annee;
    return reportingCall('synthese', params, normalizeTableauDeBord, annee);
  },

  // Chiffre d'affaires
  getChiffreAffaires: async (annee?: number, mois?: number): Promise<ChiffreAffairesData> => {
    const params: Record<string, unknown> = {};
    if (annee) params.annee = annee;
    if (mois) params.mois = mois;
    return reportingCall('chiffre-affaires', params, normalizeChiffreAffaires, annee, mois);
  },

  // Rentabilité
  getRentabilite: async (annee?: number): Promise<RentabiliteData> => {
    const params: Record<string, unknown> = {};
    if (annee) params.annee = annee;
    return reportingCall('rentabilite-clients', params, normalizeRentabilite, annee);
  },

  // Créances
  getCreances: async (): Promise<CreancesData> => {
    return reportingCall('creances', {}, normalizeCreances);
  },

  // Trésorerie
  getTresorerie: async (dateDebut: string, dateFin: string): Promise<TresorerieData> => {
    return reportingCall('tresorerie', { date_debut: dateDebut, date_fin: dateFin }, normalizeTresorerie, dateDebut, dateFin);
  },

  // Comparatif annuel
  getComparatif: async (annee1: number, annee2: number): Promise<ComparatifData> => {
    return reportingCall('comparaison-periodes', { annee1, annee2 }, normalizeComparatif, annee1, annee2);
  },

  // Activité clients
  getActiviteClients: async (dateDebut: string, dateFin: string, limit?: number): Promise<ActiviteClientsData> => {
    return reportingCall('top-clients', { date_debut: dateDebut, date_fin: dateFin, limit }, normalizeActiviteClients, dateDebut, dateFin);
  },

  // Statistiques documents
  getStatistiquesDocuments: async (annee?: number): Promise<StatistiquesDocumentsData> => {
    const params: Record<string, unknown> = {};
    if (annee) params.annee = annee;
    return reportingCall('analyse-operations', params, normalizeStatistiquesDocuments, annee);
  },
};

// ============ EXPORT TYPES ============

export type ExportType = 
  | 'factures' 
  | 'devis' 
  | 'ordres-travail'
  | 'paiements' 
  | 'caisse' 
  | 'clients' 
  | 'primes'
  | 'chiffre-affaires' 
  | 'creances' 
  | 'tresorerie' 
  | 'credits' 
  | 'annulations'
  | 'activite-globale'
  | 'tableau-de-bord';

export interface ExportFilters {
  date_debut?: string;
  date_fin?: string;
  statut?: string;
  client_id?: string;
  mode_paiement?: string;
  type?: string;
  categorie?: string;
  banque_id?: string;
  representant_id?: string;
  annee?: number;
  actif?: boolean;
}

// ============ API CALLS EXPORTS ============

export const exportApi = {
  // Export générique CSV
  exportCSV: async (type: ExportType, filters: ExportFilters = {}): Promise<Blob> => {
    const response = await api.get(`/exports/${type}`, {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },

  // Télécharger un export
  downloadExport: async (type: ExportType, filters: ExportFilters = {}, format: 'csv' | 'pdf' = 'csv'): Promise<void> => {
    try {
      const blob = await exportApi.exportCSV(type, filters);
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      throw error;
    }
  },

  // Exports spécifiques
  exportFactures: async (filters: ExportFilters = {}): Promise<Blob> => {
    return exportApi.exportCSV('factures', filters);
  },

  exportDevis: async (filters: ExportFilters = {}): Promise<Blob> => {
    return exportApi.exportCSV('devis', filters);
  },

  exportOrdres: async (filters: ExportFilters = {}): Promise<Blob> => {
    return exportApi.exportCSV('ordres-travail', filters);
  },

  exportPaiements: async (filters: ExportFilters = {}): Promise<Blob> => {
    return exportApi.exportCSV('paiements', filters);
  },

  exportCaisse: async (filters: ExportFilters = {}): Promise<Blob> => {
    return exportApi.exportCSV('caisse', filters);
  },

  exportClients: async (filters: ExportFilters = {}): Promise<Blob> => {
    return exportApi.exportCSV('clients', filters);
  },

  exportPrimes: async (filters: ExportFilters = {}): Promise<Blob> => {
    return exportApi.exportCSV('primes', filters);
  },

  exportCreances: async (): Promise<Blob> => {
    return exportApi.exportCSV('creances');
  },

  exportTresorerie: async (dateDebut: string, dateFin: string): Promise<Blob> => {
    return exportApi.exportCSV('tresorerie', { date_debut: dateDebut, date_fin: dateFin });
  },

  exportCredits: async (filters: ExportFilters = {}): Promise<Blob> => {
    return exportApi.exportCSV('credits', filters);
  },

  exportAnnulations: async (filters: ExportFilters = {}): Promise<Blob> => {
    return exportApi.exportCSV('annulations', filters);
  },

  exportActiviteGlobale: async (dateDebut: string, dateFin: string): Promise<Blob> => {
    return exportApi.exportCSV('activite-globale', { date_debut: dateDebut, date_fin: dateFin });
  },

  exportTableauDeBord: async (annee: number): Promise<Blob> => {
    return exportApi.exportCSV('tableau-de-bord', { annee });
  },
};
