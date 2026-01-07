import { Transitaire, Representant, Armateur, PrimePartenaire, PaiementPrime } from "@/types/partenaires";

// Données en mémoire (persistance locale uniquement, perdues au refresh)
export const transitairesData: Transitaire[] = [];
export const representantsData: Representant[] = [];
export const armateursData: Armateur[] = [];
export const primesPartenaires: PrimePartenaire[] = [];
export const paiementsPrimes: PaiementPrime[] = [];

// Fonctions utilitaires
export const getTransitaire = (id: string) => transitairesData.find(t => t.id === id);
export const getRepresentant = (id: string) => representantsData.find(r => r.id === id);
export const getArmateur = (id: string) => armateursData.find(a => a.id === id);

export const getPrimesTransitaire = (transitaireId: string) => 
  primesPartenaires.filter(p => p.transitaireId === transitaireId);

export const getPrimesRepresentant = (representantId: string) => 
  primesPartenaires.filter(p => p.representantId === representantId);

export const getPaiementsTransitaire = (transitaireId: string) => 
  paiementsPrimes.filter(p => p.transitaireId === transitaireId);

export const getPaiementsRepresentant = (representantId: string) => 
  paiementsPrimes.filter(p => p.representantId === representantId);

export const getTotalPrimesDues = (primes: PrimePartenaire[]) => 
  primes.filter(p => p.statut === 'due').reduce((sum, p) => sum + p.montant, 0);

export const getTotalPrimesPayees = (primes: PrimePartenaire[]) => 
  primes.filter(p => p.statut === 'payee').reduce((sum, p) => sum + p.montant, 0);
