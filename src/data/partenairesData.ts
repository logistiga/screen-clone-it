import { Transitaire, Representant, Armateur, Prime, PaiementPrime } from "@/types/partenaires";

// Données en mémoire (persistance locale uniquement, perdues au refresh)
export const transitairesData: Transitaire[] = [];
export const representantsData: Representant[] = [];
export const armateursData: Armateur[] = [];
export const primesPartenaires: Prime[] = [];
export const paiementsPrimes: PaiementPrime[] = [];

// Fonctions utilitaires
export const getTransitaire = (id: string | number) => transitairesData.find(t => String(t.id) === String(id));
export const getRepresentant = (id: string | number) => representantsData.find(r => String(r.id) === String(id));
export const getArmateur = (id: string | number) => armateursData.find(a => String(a.id) === String(id));

export const getPrimesTransitaire = (transitaireId: string | number) => 
  primesPartenaires.filter(p => String(p.transitaire_id) === String(transitaireId));

export const getPrimesRepresentant = (representantId: string | number) => 
  primesPartenaires.filter(p => String(p.representant_id) === String(representantId));

export const getPaiementsTransitaire = (transitaireId: string | number) => 
  paiementsPrimes.filter(p => String(p.transitaire_id) === String(transitaireId));

export const getPaiementsRepresentant = (representantId: string | number) => 
  paiementsPrimes.filter(p => String(p.representant_id) === String(representantId));

export const getTotalPrimesDues = (primes: Prime[]) => 
  primes.filter(p => p.statut !== 'Payée').reduce((sum, p) => sum + p.montant, 0);

export const getTotalPrimesPayees = (primes: Prime[]) => 
  primes.filter(p => p.statut === 'Payée').reduce((sum, p) => sum + p.montant, 0);
