import { Transitaire, Representant, Armateur, PrimePartenaire, PaiementPrime } from "@/types/partenaires";

// Données enrichies pour les transitaires
export const transitairesData: Transitaire[] = [
  { 
    id: "trans1", 
    nom: "Transit Express", 
    email: "contact@transit-express.ga",
    telephone: "+241 01 72 45 89",
    adresse: "Port d'Owendo, Libreville",
    dateCreation: "2024-01-15",
    actif: true
  },
  { 
    id: "trans2", 
    nom: "Global Transit", 
    email: "info@globaltransit.ga",
    telephone: "+241 01 44 67 23",
    adresse: "Zone Portuaire, Libreville",
    dateCreation: "2024-02-20",
    actif: true
  },
  { 
    id: "trans3", 
    nom: "Africa Logistics", 
    email: "operations@africalogistics.ga",
    telephone: "+241 01 55 12 34",
    adresse: "Boulevard du Bord de Mer, Libreville",
    dateCreation: "2024-03-10",
    actif: true
  },
];

// Données enrichies pour les représentants
export const representantsData: Representant[] = [
  { 
    id: "rep1", 
    nom: "Jean Dupont", 
    email: "j.dupont@gmail.com",
    telephone: "+241 77 12 34 56",
    adresse: "Quartier Glass, Libreville",
    dateCreation: "2024-01-10",
    actif: true
  },
  { 
    id: "rep2", 
    nom: "Marie Koumba", 
    email: "m.koumba@yahoo.fr",
    telephone: "+241 66 98 76 54",
    adresse: "Akébé, Libreville",
    dateCreation: "2024-02-15",
    actif: true
  },
  { 
    id: "rep3", 
    nom: "Paul Mbongo", 
    email: "p.mbongo@outlook.com",
    telephone: "+241 77 45 67 89",
    adresse: "Nzeng-Ayong, Libreville",
    dateCreation: "2024-03-20",
    actif: true
  },
];

// Données enrichies pour les armateurs
export const armateursData: Armateur[] = [
  { 
    id: "arm1", 
    nom: "MSC",
    email: "gabon@msc.com",
    telephone: "+241 01 79 00 00",
    adresse: "Terminal à conteneurs, Owendo",
    dateCreation: "2023-01-01",
    actif: true
  },
  { 
    id: "arm2", 
    nom: "MAERSK",
    email: "gabon@maersk.com",
    telephone: "+241 01 76 00 00",
    adresse: "Port d'Owendo",
    dateCreation: "2023-01-01",
    actif: true
  },
  { 
    id: "arm3", 
    nom: "CMA CGM",
    email: "gabon@cma-cgm.com",
    telephone: "+241 01 44 00 00",
    adresse: "Zone Portuaire, Libreville",
    dateCreation: "2023-01-01",
    actif: true
  },
  { 
    id: "arm4", 
    nom: "HAPAG-LLOYD",
    email: "gabon@hapag-lloyd.com",
    telephone: "+241 01 70 00 00",
    adresse: "Port d'Owendo",
    dateCreation: "2023-01-01",
    actif: true
  },
];

// Primes générées par les ordres de travail
export const primesPartenaires: PrimePartenaire[] = [
  {
    id: "prime1",
    ordreId: "1",
    ordreNumero: "OT-2026-0001",
    transitaireId: "trans1",
    montant: 125000,
    statut: "payee",
    dateCreation: "2026-01-02",
    datePaiement: "2026-01-10"
  },
  {
    id: "prime2",
    ordreId: "1",
    ordreNumero: "OT-2026-0001",
    representantId: "rep1",
    montant: 62500,
    statut: "payee",
    dateCreation: "2026-01-02",
    datePaiement: "2026-01-10"
  },
  {
    id: "prime3",
    ordreId: "2",
    ordreNumero: "OT-2026-0002",
    transitaireId: "trans2",
    montant: 89250,
    statut: "due",
    dateCreation: "2026-01-03"
  },
  {
    id: "prime4",
    ordreId: "2",
    ordreNumero: "OT-2026-0002",
    representantId: "rep2",
    montant: 44625,
    statut: "due",
    dateCreation: "2026-01-03"
  },
  {
    id: "prime5",
    ordreId: "3",
    ordreNumero: "OT-2026-0003",
    transitaireId: "trans1",
    montant: 297500,
    statut: "due",
    dateCreation: "2026-01-04"
  },
  {
    id: "prime6",
    ordreId: "4",
    ordreNumero: "OT-2026-0004",
    transitaireId: "trans3",
    montant: 178500,
    statut: "payee",
    dateCreation: "2026-01-05",
    datePaiement: "2026-01-08"
  },
  {
    id: "prime7",
    ordreId: "4",
    ordreNumero: "OT-2026-0004",
    representantId: "rep3",
    montant: 89250,
    statut: "due",
    dateCreation: "2026-01-05"
  },
];

// Historique des paiements de primes
export const paiementsPrimes: PaiementPrime[] = [
  {
    id: "paiement1",
    primeIds: ["prime1"],
    transitaireId: "trans1",
    montant: 125000,
    date: "2026-01-10",
    modePaiement: "virement",
    reference: "VIR-PRIME-001"
  },
  {
    id: "paiement2",
    primeIds: ["prime2"],
    representantId: "rep1",
    montant: 62500,
    date: "2026-01-10",
    modePaiement: "especes"
  },
  {
    id: "paiement3",
    primeIds: ["prime6"],
    transitaireId: "trans3",
    montant: 178500,
    date: "2026-01-08",
    modePaiement: "cheque",
    reference: "CHQ-456789"
  },
];

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
