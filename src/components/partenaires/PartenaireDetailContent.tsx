import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ArrowLeft, Edit, CreditCard, History, DollarSign, Printer, 
  ClipboardList, Receipt, FileText, Banknote, CheckCircle2, Ship, Download 
} from "lucide-react";
import { usePdfDownload } from "@/hooks/use-pdf-download";
import { formatMontant, formatDate, getStatutLabel } from "@/data/mockData";
import { PaiementPrimeModal } from "@/components/PaiementPrimeModal";
import { 
  PartenaireInfoCard, 
  PartenaireInfoCardSkeleton,
  DetailStatCard,
  DetailStatCardSkeleton 
} from "@/components/partenaires";
import { cn } from "@/lib/utils";
import type { 
  PartenaireType, 
  Partenaire, 
  Transitaire, 
  Representant, 
  Armateur,
  Prime,
  PaiementPrime,
  OrdreTravail,
  Facture,
  Devis
} from "@/types/partenaires";

interface PartenaireDetailContentProps {
  type: PartenaireType;
  partenaire: Partenaire | null;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

// Type guards
function isTransitaire(p: Partenaire): p is Transitaire {
  return 'nif' in p || 'rccm' in p || 'contact_principal' in p;
}

function isRepresentant(p: Partenaire): p is Representant {
  return 'taux_commission' in p || 'nom_complet' in p;
}

function isArmateur(p: Partenaire): p is Armateur {
  return 'code' in p || 'chiffre_affaires' in p;
}

export function PartenaireDetailContent({
  type,
  partenaire,
  isLoading,
  error,
  refetch,
}: PartenaireDetailContentProps) {
  const navigate = useNavigate();
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [selectedPrimes, setSelectedPrimes] = useState<string[]>([]);
  
  // PDF download
  const pdfFilename = partenaire 
    ? `${type === 'representant' && partenaire.prenom ? `${partenaire.prenom}-${partenaire.nom}` : partenaire.nom}-fiche.pdf`
    : 'partenaire-fiche.pdf';
  const { downloadPdf } = usePdfDownload({ filename: pdfFilename });

  // Labels par type
  const typeLabels: Record<PartenaireType, { singular: string; notFound: string }> = {
    transitaire: { singular: "Transitaire", notFound: "Ce transitaire n'existe pas." },
    representant: { singular: "Représentant", notFound: "Ce représentant n'existe pas." },
    armateur: { singular: "Armateur", notFound: "Cet armateur n'existe pas." },
  };

  // Gestion erreur / non trouvé
  if (error || (!isLoading && !partenaire)) {
    return (
      <MainLayout title={`${typeLabels[type].singular} non trouvé`}>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">{typeLabels[type].notFound}</p>
          <Button variant="link" onClick={() => navigate("/partenaires")}>
            Retour aux partenaires
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Extraction des données selon le type
  const getDisplayName = (): string => {
    if (!partenaire) return typeLabels[type].singular;
    if (type === 'representant' && partenaire.prenom) {
      return `${partenaire.prenom} ${partenaire.nom}`;
    }
    return partenaire.nom;
  };

  // Données communes
  const ordres: OrdreTravail[] = (partenaire as any)?.ordres_travail || [];
  const factures: Facture[] = (partenaire as any)?.factures || [];
  const devisList: Devis[] = (partenaire as any)?.devis || [];
  
  // Primes (seulement pour transitaire et representant)
  const hasPrimes = type === 'transitaire' || type === 'representant';
  const primes: Prime[] = hasPrimes ? ((partenaire as any)?.primes || []) : [];
  const paiementsPrimes: PaiementPrime[] = hasPrimes ? ((partenaire as any)?.paiements_primes || []) : [];
  
  // Calculs
  const totalOrdres = ordres.length;
  const totalFactures = factures.length;
  const totalDevis = devisList.length;
  const montantTotalOrdres = ordres.reduce((sum, o) => sum + (o.montant_ttc || 0), 0);

  // Primes calculs
  const primesDues = primes
    .filter(p => p.statut !== 'Payée')
    .reduce((sum, p) => sum + (p.reste_a_payer ?? p.montant ?? 0), 0);
  
  const primesPayees = primes
    .filter(p => p.statut === 'Payée')
    .reduce((sum, p) => sum + (p.montant || 0), 0);

  const primesDuesList = primes.filter(p => p.statut !== 'Payée');

  const allPaiements = paiementsPrimes.length > 0 
    ? paiementsPrimes 
    : primes.flatMap(p => p.paiements || []);

  // Handlers
  const handleSelectPrime = (primeId: string, checked: boolean) => {
    if (checked) {
      setSelectedPrimes([...selectedPrimes, primeId]);
    } else {
      setSelectedPrimes(selectedPrimes.filter(pid => pid !== primeId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPrimes(primesDuesList.map(p => String(p.id)));
    } else {
      setSelectedPrimes([]);
    }
  };

  const selectedTotal = primes
    .filter(p => selectedPrimes.includes(String(p.id)))
    .reduce((sum, p) => sum + (p.reste_a_payer ?? p.montant ?? 0), 0);

  // Badge helpers
  const getStatutBadge = (statut: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      en_cours: "outline",
      termine: "default",
      facture: "default",
      annule: "destructive",
      emise: "outline",
      payee: "default",
      partielle: "secondary",
      impayee: "destructive",
      brouillon: "secondary",
      envoye: "outline",
      accepte: "default",
      refuse: "destructive",
      expire: "destructive",
      converti: "default",
    };
    return <Badge variant={variants[statut] || "secondary"}>{getStatutLabel(statut)}</Badge>;
  };

  const getPrimeStatutBadge = (statut: string) => {
    const isPaid = statut === 'Payée' || statut === 'payee';
    const isPartial = statut === 'Partiellement payée';
    return (
      <Badge 
        className={cn(
          isPaid && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
          isPartial && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
          !isPaid && !isPartial && "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
        )}
      >
        {isPaid ? 'Payée' : isPartial ? 'Partielle' : 'Due'}
      </Badge>
    );
  };

  // Info card props
  const getInfoCardProps = () => {
    if (!partenaire) return null;
    
    const baseProps = {
      nom: partenaire.nom,
      prenom: partenaire.prenom,
      email: partenaire.email,
      telephone: partenaire.telephone,
      adresse: partenaire.adresse,
      actif: partenaire.actif !== false,
      createdAt: partenaire.created_at,
      type,
    };

    if (type === 'transitaire' && isTransitaire(partenaire)) {
      return {
        ...baseProps,
        nif: partenaire.nif,
        rccm: partenaire.rccm,
        contactPrincipal: partenaire.contact_principal,
      };
    }

    if (type === 'representant' && isRepresentant(partenaire)) {
      return {
        ...baseProps,
        tauxCommission: partenaire.taux_commission,
      };
    }

    return baseProps;
  };

  const displayName = getDisplayName();

  return (
    <MainLayout title={displayName}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="ghost" onClick={() => navigate("/partenaires")} className="gap-2 w-fit">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={downloadPdf}>
              <Download className="h-4 w-4" />
              Télécharger PDF
            </Button>
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Modifier
            </Button>
            {hasPrimes && primesDues > 0 && (
              <Button 
                className="gap-2 shadow-sm"
                onClick={() => setShowPaiementModal(true)}
                disabled={selectedPrimes.length === 0}
              >
                <DollarSign className="h-4 w-4" />
                Payer primes ({formatMontant(selectedTotal || primesDues)})
              </Button>
            )}
          </div>
        </div>

        {/* Info + Stats */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {isLoading ? (
              <PartenaireInfoCardSkeleton />
            ) : (
              getInfoCardProps() && <PartenaireInfoCard {...getInfoCardProps()!} />
            )}
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <>
                <DetailStatCardSkeleton />
                <DetailStatCardSkeleton />
                <DetailStatCardSkeleton />
              </>
            ) : (
              <>
                <DetailStatCard
                  title="Total Ordres"
                  value={totalOrdres}
                  subtitle={formatMontant(montantTotalOrdres)}
                  icon={ClipboardList}
                  variant="primary"
                />
                {hasPrimes ? (
                  <>
                    <DetailStatCard
                      title="Primes Dues"
                      value={formatMontant(primesDues)}
                      icon={Banknote}
                      variant={primesDues > 0 ? "danger" : "default"}
                    />
                    <DetailStatCard
                      title="Primes Payées"
                      value={formatMontant(primesPayees)}
                      icon={CheckCircle2}
                      variant="success"
                    />
                  </>
                ) : (
                  <>
                    {type === 'armateur' && isArmateur(partenaire!) && (partenaire as Armateur).type_conteneur && (
                      <Card className="p-4">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                          <Ship className="h-4 w-4" />
                          Type de conteneur
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="outline" className="text-xs">
                            {(partenaire as Armateur).type_conteneur}
                          </Badge>
                        </div>
                      </Card>
                    )}
                    <DetailStatCard
                      title="Total Factures"
                      value={totalFactures}
                      subtitle={formatMontant(factures.reduce((s, f) => s + (f.montant_ttc || 0), 0))}
                      icon={Receipt}
                      variant="success"
                    />
                    <DetailStatCard
                      title="Total Devis"
                      value={totalDevis}
                      icon={FileText}
                      variant="default"
                    />
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={hasPrimes ? "primes" : "ordres"} className="w-full">
          <TabsList className="flex-wrap h-auto gap-1">
            {hasPrimes && (
              <>
                <TabsTrigger value="primes" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline">Primes</span> ({primesDuesList.length})
                </TabsTrigger>
                <TabsTrigger value="paiements" className="gap-2">
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">Paiements</span> ({allPaiements.length})
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="ordres" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Ordres</span> ({totalOrdres})
            </TabsTrigger>
            <TabsTrigger value="factures" className="gap-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Factures</span> ({totalFactures})
            </TabsTrigger>
            <TabsTrigger value="devis" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Devis</span> ({totalDevis})
            </TabsTrigger>
          </TabsList>

          {/* Primes Tab */}
          {hasPrimes && (
            <TabsContent value="primes" className="mt-4 animate-fade-in">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-12">
                          <Checkbox 
                            checked={selectedPrimes.length === primesDuesList.length && primesDuesList.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Ordre/Facture</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead className="text-right">Reste à payer</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {primesDuesList.map((prime) => (
                        <TableRow key={prime.id} className="group hover:bg-muted/50">
                          <TableCell>
                            <Checkbox 
                              checked={selectedPrimes.includes(String(prime.id))}
                              onCheckedChange={(checked) => handleSelectPrime(String(prime.id), !!checked)}
                            />
                          </TableCell>
                          <TableCell 
                            className="font-medium text-primary hover:underline cursor-pointer"
                            onClick={() => {
                              if (prime.ordre_id) navigate(`/ordres/${prime.ordre_id}`);
                              else if (prime.facture_id) navigate(`/factures/${prime.facture_id}`);
                            }}
                          >
                            {prime.ordre?.numero || prime.facture?.numero || '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(prime.created_at)}</TableCell>
                          <TableCell className="text-right font-medium">{formatMontant(prime.montant)}</TableCell>
                          <TableCell className="text-right">
                            <span className="font-semibold text-red-600 dark:text-red-400">
                              {formatMontant(prime.reste_a_payer ?? prime.montant)}
                            </span>
                          </TableCell>
                          <TableCell>{getPrimeStatutBadge(prime.statut)}</TableCell>
                        </TableRow>
                      ))}
                      {primesDuesList.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-20" />
                            Aucune prime en attente
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Paiements Tab */}
          {hasPrimes && (
            <TabsContent value="paiements" className="mt-4 animate-fade-in">
              {/* Historique des paiements */}
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  {allPaiements.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center text-muted-foreground">
                      <History className="h-10 w-10 mb-2 opacity-20" />
                      Aucun paiement enregistré
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>N° Reçu</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Mode</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                          <TableHead>Documents</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allPaiements.map((paiement) => (
                          <TableRow key={paiement.id} className="group hover:bg-muted/50">
                            <TableCell className="font-medium text-primary">
                              {paiement.numero_recu || `#${paiement.id}`}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(paiement.date || paiement.created_at)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-normal">
                                {paiement.mode_paiement}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {formatMontant(paiement.montant)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {paiement.primes && paiement.primes.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {paiement.primes.slice(0, 3).map((prime) => (
                                    <span 
                                      key={prime.id}
                                      className="text-xs text-primary hover:underline cursor-pointer"
                                      onClick={() => {
                                        if (prime.ordre_id) navigate(`/ordres/${prime.ordre_id}`);
                                        else if (prime.facture_id) navigate(`/factures/${prime.facture_id}`);
                                      }}
                                    >
                                      {prime.ordre?.numero || prime.facture?.numero || `#${prime.id}`}
                                    </span>
                                  ))}
                                  {paiement.primes.length > 3 && (
                                    <span className="text-xs text-muted-foreground">
                                      +{paiement.primes.length - 3}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-2"
                                onClick={() => {
                                  const primesData = (paiement.primes || []).map(p => ({
                                    numero: p.ordre?.numero || p.facture?.numero || `Prime #${p.id}`,
                                    montant: p.montant
                                  }));
                                  
                                  const params = new URLSearchParams({
                                    montant: String(paiement.montant),
                                    mode: paiement.mode_paiement || '',
                                    reference: paiement.reference || '',
                                    date: paiement.date || paiement.created_at || '',
                                    beneficiaire: displayName,
                                    type,
                                    numero_recu: paiement.numero_recu || '',
                                    primes: encodeURIComponent(JSON.stringify(primesData))
                                  });
                                  
                                  window.open(`/partenaires/recu-prime/${paiement.id}?${params.toString()}`, '_blank');
                                }}
                              >
                                <Printer className="h-4 w-4" />
                                Imprimer
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Ordres Tab */}
          <TabsContent value="ordres" className="mt-4 animate-fade-in">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Numéro</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">Montant TTC</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ordres.map((ordre) => (
                      <TableRow 
                        key={ordre.id} 
                        className="hover:bg-muted/50"
                      >
                        <TableCell 
                          className="font-medium text-primary cursor-pointer"
                          onClick={() => navigate(`/ordres/${ordre.id}`)}
                        >
                          {ordre.numero}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(ordre.date || ordre.created_at)}</TableCell>
                        <TableCell>{ordre.client?.nom || '-'}</TableCell>
                        <TableCell className="text-right font-medium">{formatMontant(ordre.montant_ttc)}</TableCell>
                        <TableCell>{getStatutBadge(ordre.statut)}</TableCell>
                        <TableCell>
                          <a
                            href={`/ordres/${ordre.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant="outline" size="sm" className="gap-1.5">
                              <Download className="h-4 w-4" />
                              PDF
                            </Button>
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                    {ordres.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-20" />
                          Aucun ordre de travail
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Factures Tab */}
          <TabsContent value="factures" className="mt-4 animate-fade-in">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Numéro</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">Montant TTC</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {factures.map((facture) => (
                      <TableRow 
                        key={facture.id} 
                        className="hover:bg-muted/50"
                      >
                        <TableCell 
                          className="font-medium text-primary cursor-pointer"
                          onClick={() => navigate(`/factures/${facture.id}`)}
                        >
                          {facture.numero}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(facture.date_facture || facture.created_at)}</TableCell>
                        <TableCell>{facture.client?.nom || '-'}</TableCell>
                        <TableCell className="text-right font-medium">{formatMontant(facture.montant_ttc)}</TableCell>
                        <TableCell>{getStatutBadge(facture.statut)}</TableCell>
                        <TableCell>
                          <a
                            href={`/factures/${facture.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant="outline" size="sm" className="gap-1.5">
                              <Download className="h-4 w-4" />
                              PDF
                            </Button>
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                    {factures.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          <Receipt className="h-10 w-10 mx-auto mb-2 opacity-20" />
                          Aucune facture
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Devis Tab */}
          <TabsContent value="devis" className="mt-4 animate-fade-in">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Numéro</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">Montant TTC</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {devisList.map((devis) => (
                      <TableRow 
                        key={devis.id} 
                        className="hover:bg-muted/50"
                      >
                        <TableCell 
                          className="font-medium text-primary cursor-pointer"
                          onClick={() => navigate(`/devis/${devis.id}`)}
                        >
                          {devis.numero}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(devis.date || devis.created_at)}</TableCell>
                        <TableCell>{devis.client?.nom || '-'}</TableCell>
                        <TableCell className="text-right font-medium">{formatMontant(devis.montant_ttc)}</TableCell>
                        <TableCell>{getStatutBadge(devis.statut)}</TableCell>
                        <TableCell>
                          <a
                            href={`/devis/${devis.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button variant="outline" size="sm" className="gap-1.5">
                              <Download className="h-4 w-4" />
                              PDF
                            </Button>
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                    {devisList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          <FileText className="h-10 w-10 mx-auto mb-2 opacity-20" />
                          Aucun devis
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal Paiement */}
      {hasPrimes && partenaire && (
        <PaiementPrimeModal 
          open={showPaiementModal}
          onOpenChange={setShowPaiementModal}
          partenaireNom={displayName}
          partenaireType={type}
          primes={primes.filter(p => selectedPrimes.length > 0 ? selectedPrimes.includes(String(p.id)) : p.statut !== 'Payée')}
          total={selectedTotal > 0 ? selectedTotal : primesDues}
          onSuccess={() => refetch()}
        />
      )}
    </MainLayout>
  );
}
