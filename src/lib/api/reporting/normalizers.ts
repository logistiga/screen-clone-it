import type {
  ChiffreAffairesData, RentabiliteData, CreancesData, TresorerieData,
  ComparatifData, ActiviteClientsData, StatistiquesDocumentsData, TableauDeBordData,
} from './types';

const MOIS_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

export const safeNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const safeString = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return fallback;
  return String(value);
};

const normalizeKey = (value: unknown): string => {
  return safeString(value)
    .trim().toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
};

export const normalizeChiffreAffaires = (raw: any, annee?: number, mois?: number): ChiffreAffairesData => {
  if (raw?.mensuel && raw?.total_annuel) return raw as ChiffreAffairesData;
  const parMois: any[] = Array.isArray(raw?.par_mois) ? raw.par_mois : [];
  const totaux = raw?.totaux ?? {};
  return {
    annee: safeNumber(raw?.annee ?? annee),
    mois: mois ?? (raw?.mois ?? null),
    mensuel: parMois.map((m) => ({
      mois: safeNumber(m?.mois),
      label: safeString(m?.label, MOIS_LABELS[safeNumber(m?.mois) - 1] || ""),
      total_ht: safeNumber(m?.total_ht), total_tva: safeNumber(m?.total_tva),
      total_css: safeNumber(m?.total_css), total_ttc: safeNumber(m?.total_ttc),
      nb_factures: safeNumber(m?.nombre_factures ?? m?.nb_factures),
    })),
    total_annuel: {
      total_ht: safeNumber(totaux?.total_ht), total_tva: safeNumber(totaux?.total_tva),
      total_css: safeNumber(totaux?.total_css), total_ttc: safeNumber(totaux?.total_ttc),
      nb_factures: safeNumber(totaux?.nombre_factures ?? totaux?.nb_factures),
    },
  };
};

export const normalizeRentabilite = (raw: any, annee?: number): RentabiliteData => {
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
      ca: safeNumber(m?.ca), charges: safeNumber(m?.charges), marge: safeNumber(m?.marge),
    })),
  };
};

export const normalizeCreances = (raw: any): CreancesData => {
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
      client_id: safeNumber(c?.client_id), client_nom: safeString(c?.client_nom, "N/A"),
      montant_du: safeNumber(c?.total_restant ?? c?.montant_du),
      nb_factures: safeNumber(c?.nombre_factures ?? c?.nb_factures),
      plus_ancienne: safeString(c?.plus_ancienne, ""),
    })),
  };
};

export const normalizeTresorerie = (raw: any, dateDebut: string, dateFin: string): TresorerieData => {
  if (raw?.mouvements_quotidiens && raw?.date_debut) return raw as TresorerieData;
  return {
    date_debut: safeString(raw?.periode?.debut, dateDebut),
    date_fin: safeString(raw?.periode?.fin, dateFin),
    solde_initial: safeNumber(raw?.solde_initial), solde_final: safeNumber(raw?.solde_final),
    total_entrees: safeNumber(raw?.total_entrees), total_sorties: safeNumber(raw?.total_sorties),
    mouvements_quotidiens: (Array.isArray(raw?.mouvements_quotidiens) ? raw.mouvements_quotidiens : []).map((m: any) => ({
      date: safeString(m?.date ?? m?.jour), entrees: safeNumber(m?.entrees),
      sorties: safeNumber(m?.sorties), solde: safeNumber(m?.solde ?? m?.solde_cumule),
    })),
    par_categorie: (Array.isArray(raw?.par_categorie) ? raw.par_categorie : []).map((c: any) => ({
      categorie: safeString(c?.categorie), entrees: safeNumber(c?.entrees), sorties: safeNumber(c?.sorties),
    })),
  };
};

export const normalizeComparatif = (raw: any, annee1: number, annee2: number): ComparatifData => {
  if (typeof raw?.ca_annee1 === "number" && typeof raw?.ca_annee2 === "number") return raw as ComparatifData;
  const p1 = raw?.periode_1 ?? {}; const p2 = raw?.periode_2 ?? {}; const v = raw?.variations ?? {};
  return {
    annee1: safeNumber(p1?.annee ?? annee1), annee2: safeNumber(p2?.annee ?? annee2),
    ca_annee1: safeNumber(p1?.ca_ttc ?? p1?.ca_ht), ca_annee2: safeNumber(p2?.ca_ttc ?? p2?.ca_ht),
    variation_ca: safeNumber(v?.ca_ttc ?? v?.ca_ht),
    nb_factures_annee1: safeNumber(p1?.nombre_factures), nb_factures_annee2: safeNumber(p2?.nombre_factures),
    variation_factures: safeNumber(v?.nombre_factures),
    nb_clients_annee1: safeNumber(p1?.nouveaux_clients), nb_clients_annee2: safeNumber(p2?.nouveaux_clients),
    variation_clients: safeNumber(v?.nouveaux_clients),
  };
};

export const normalizeActiviteClients = (raw: any, dateDebut: string, dateFin: string): ActiviteClientsData => {
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

export const normalizeStatistiquesDocuments = (raw: any, annee?: number): StatistiquesDocumentsData => {
  if (raw?.devis?.brouillon !== undefined) return raw as StatistiquesDocumentsData;
  const countsFromRows = (rows: any[], expected: string[]) => {
    const out: Record<string, number> = Object.fromEntries(expected.map((k) => [k, 0]));
    for (const r of rows) { const key = normalizeKey(r?.statut); if (key in out) out[key] += safeNumber(r?.nombre); }
    return out;
  };
  const devisRows = Array.isArray(raw?.devis?.par_statut) ? raw.devis.par_statut : [];
  const ordresRows = Array.isArray(raw?.ordres?.par_statut) ? raw.ordres.par_statut : [];
  const facturesRows = Array.isArray(raw?.factures?.par_statut) ? raw.factures.par_statut : [];
  const devisCounts = countsFromRows(devisRows, ["brouillon", "envoye", "accepte", "refuse", "expire", "converti"]);
  const ordresCounts = countsFromRows(ordresRows, ["en_cours", "termine", "facture"]);
  const facturesCounts = (() => {
    const expected = ["brouillon", "validee", "partiellement_payee", "payee", "annulee"];
    const out: Record<string, number> = Object.fromEntries(expected.map((k) => [k, 0]));
    for (const r of facturesRows) {
      const keyRaw = normalizeKey(r?.statut);
      const key = keyRaw === "envoyee" || keyRaw === "envoyee_" || keyRaw === "envoyee__" ? "validee" : keyRaw === "payee" ? "payee" : keyRaw;
      if (key in out) out[key] += safeNumber(r?.nombre);
    }
    return out;
  })();
  return {
    annee: safeNumber(raw?.annee ?? annee),
    devis: {
      total: safeNumber(raw?.devis?.total), brouillon: safeNumber(devisCounts.brouillon),
      envoye: safeNumber(devisCounts.envoye), accepte: safeNumber(devisCounts.accepte),
      refuse: safeNumber(devisCounts.refuse), expire: safeNumber(devisCounts.expire),
      taux_conversion: safeNumber(raw?.devis?.taux_conversion),
    },
    ordres: {
      total: safeNumber(raw?.ordres?.total), en_cours: safeNumber(ordresCounts.en_cours),
      termine: safeNumber(ordresCounts.termine), facture: safeNumber(ordresCounts.facture),
      taux_facturation: safeNumber(raw?.ordres?.taux_conversion ?? raw?.ordres?.taux_facturation),
    },
    factures: {
      total: safeNumber(raw?.factures?.total), brouillon: safeNumber(facturesCounts.brouillon),
      validee: safeNumber(facturesCounts.validee), partiellement_payee: safeNumber(facturesCounts.partiellement_payee),
      payee: safeNumber(facturesCounts.payee), annulee: safeNumber(facturesCounts.annulee),
      taux_recouvrement: safeNumber(raw?.factures?.taux_recouvrement),
    },
  };
};

export const normalizeTableauDeBord = (raw: any, annee?: number): TableauDeBordData => {
  if (raw?.kpis) return raw as TableauDeBordData;
  const indicateurs = raw?.indicateurs ?? {}; const documents = raw?.documents ?? {};
  const caTotal = safeNumber(indicateurs?.ca_ttc ?? raw?.rentabilite?.chiffre_affaires_ttc);
  const creances = safeNumber(indicateurs?.creances_totales ?? raw?.creances?.total_creances);
  const tauxRecouvrement = caTotal > 0 ? Math.round((((caTotal - creances) / caTotal) * 100) * 100) / 100 : 0;
  return {
    annee: safeNumber(raw?.annee ?? annee),
    kpis: {
      ca_total: caTotal, ca_mois_courant: safeNumber(indicateurs?.ca_mois_courant),
      creances_totales: creances,
      taux_recouvrement: safeNumber(indicateurs?.taux_recouvrement ?? tauxRecouvrement),
      nb_factures: safeNumber(documents?.factures?.total ?? indicateurs?.factures_en_cours),
      nb_ordres: safeNumber(documents?.ordres?.total), nb_devis: safeNumber(documents?.devis?.total),
      nb_clients: safeNumber(indicateurs?.nb_clients),
    },
    evolution_mensuelle: [],
    alertes: (Array.isArray(raw?.alertes) ? raw.alertes : []).map((a: any) => ({
      type: safeString(a?.type, "info"), message: safeString(a?.message), count: safeNumber(a?.count),
    })),
  };
};
