import { useState } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Percent, RefreshCw, Lock, Calendar, History, Settings } from "lucide-react";
import { toast } from "sonner";
import { formatMontant } from "@/data/mockData";
import { 
  useTaxes,
  useTaxesMoisCourant, 
  useTaxesHistorique,
  useRecalculerTaxes,
  useCloturerMois 
} from "@/hooks/use-taxes";
import { AngleTaxeCard } from "@/components/taxes/AngleTaxeCard";
import { HistoriqueTaxes } from "@/components/taxes/HistoriqueTaxes";
import { GestionTaxes } from "@/components/taxes/GestionTaxes";

export default function TaxesPage() {
  const [showCloturerModal, setShowCloturerModal] = useState(false);
  const [historiqueAnnee, setHistoriqueAnnee] = useState(new Date().getFullYear());

  // Hooks de données
  const { refetch: refetchTaxes } = useTaxes();
  const { data: moisCourant, isLoading: isLoadingMois, refetch: refetchMois } = useTaxesMoisCourant();
  const { data: historique, isLoading: isLoadingHistorique, refetch: refetchHistorique } = useTaxesHistorique(historiqueAnnee);
  
  // Mutations
  const recalculerMutation = useRecalculerTaxes();
  const cloturerMutation = useCloturerMois();

  const handleRefresh = () => {
    refetchTaxes();
    refetchMois();
    refetchHistorique();
    toast.success("Données actualisées");
  };

  const handleRecalculer = (mois: number) => {
    recalculerMutation.mutate({ annee: historiqueAnnee, mois }, {
      onSuccess: () => {
        refetchMois();
        refetchHistorique();
      },
    });
  };

  const handleCloturer = () => {
    if (!moisCourant) return;
    
    const moisPrec = moisCourant.mois === 1 ? 12 : moisCourant.mois - 1;
    const anneePrec = moisCourant.mois === 1 ? moisCourant.annee - 1 : moisCourant.annee;

    cloturerMutation.mutate({ annee: anneePrec, mois: moisPrec }, {
      onSuccess: () => {
        refetchMois();
        refetchHistorique();
        setShowCloturerModal(false);
      },
    });
  };

  return (
    <MainLayout title="Taxes">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Percent className="h-6 w-6 text-primary" />
              </div>
              Gestion des Taxes
            </h1>
            <p className="text-muted-foreground mt-1">
              Configurez les taxes et suivez les montants collectés
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="configuration" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="configuration" className="gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="mois-courant" className="gap-2">
              <Calendar className="h-4 w-4" />
              Mois courant
            </TabsTrigger>
            <TabsTrigger value="historique" className="gap-2">
              <History className="h-4 w-4" />
              Historique
            </TabsTrigger>
          </TabsList>

          {/* Tab: Configuration des taxes */}
          <TabsContent value="configuration" className="space-y-6">
            <GestionTaxes onRefresh={handleRefresh} />
          </TabsContent>

          {/* Tab: Mois courant */}
          <TabsContent value="mois-courant" className="space-y-6">
            {isLoadingMois ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
              </div>
            ) : moisCourant ? (
              <>
                {/* Titre du mois */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold capitalize">{moisCourant.nom_mois}</h2>
                    <p className="text-sm text-muted-foreground">
                      Taxes collectées ce mois-ci
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total à reverser</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatMontant(moisCourant.total_taxes_mois)}
                    </p>
                  </div>
                </div>

                {/* Angles TVA et CSS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AngleTaxeCard
                    typeTaxe="TVA"
                    taux={moisCourant.angles.tva.taux}
                    montantHT={moisCourant.angles.tva.montant_ht_total}
                    montantTaxe={moisCourant.angles.tva.montant_taxe_total}
                    montantExonere={moisCourant.angles.tva.montant_exonere}
                    nombreDocuments={moisCourant.angles.tva.nombre_documents}
                    nombreExonerations={moisCourant.angles.tva.nombre_exonerations}
                    progression={moisCourant.angles.tva.progression}
                    cloture={moisCourant.angles.tva.cloture}
                    delay={0}
                  />
                  <AngleTaxeCard
                    typeTaxe="CSS"
                    taux={moisCourant.angles.css.taux}
                    montantHT={moisCourant.angles.css.montant_ht_total}
                    montantTaxe={moisCourant.angles.css.montant_taxe_total}
                    montantExonere={moisCourant.angles.css.montant_exonere}
                    nombreDocuments={moisCourant.angles.css.nombre_documents}
                    nombreExonerations={moisCourant.angles.css.nombre_exonerations}
                    progression={moisCourant.angles.css.progression}
                    cloture={moisCourant.angles.css.cloture}
                    delay={0.1}
                  />
                </div>

                {/* Action clôture */}
                <Card className="border-border/50 bg-muted/30">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10">
                          <Lock className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">Clôture mensuelle</h3>
                          <p className="text-sm text-muted-foreground">
                            Archiver les taxes du mois précédent
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowCloturerModal(true)}
                        disabled={cloturerMutation.isPending}
                        className="gap-2"
                      >
                        <Lock className="h-4 w-4" />
                        Clôturer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Aucune donnée disponible</p>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Historique */}
          <TabsContent value="historique" className="space-y-6">
            {isLoadingHistorique ? (
              <Skeleton className="h-96" />
            ) : historique ? (
              <HistoriqueTaxes
                historique={historique.historique}
                cumul={historique.cumul}
                annee={historiqueAnnee}
                onAnneeChange={setHistoriqueAnnee}
                onRecalculer={handleRecalculer}
                isRecalculating={recalculerMutation.isPending}
              />
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Aucun historique disponible</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Modal confirmation clôture */}
      <AlertDialog open={showCloturerModal} onOpenChange={setShowCloturerModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clôturer le mois ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va archiver les taxes du mois précédent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleCloturer}>
              {cloturerMutation.isPending && <RefreshCw className="h-4 w-4 animate-spin mr-2" />}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
