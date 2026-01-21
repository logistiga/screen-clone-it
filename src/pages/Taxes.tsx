import { useState } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Plus, Edit, Percent, Save, RefreshCw, Lock, Calendar, Settings, History, Calculator, TrendingUp, FileText, Ban } from "lucide-react";
import { toast } from "sonner";
import { formatMontant } from "@/data/mockData";
import { 
  useTaxesConfig, 
  useUpdateTaxesConfig, 
  useTaxesMoisCourant, 
  useTaxesHistorique,
  useRecalculerTaxes,
  useCloturerMois 
} from "@/hooks/use-taxes";
import { AngleTaxeCard } from "@/components/taxes/AngleTaxeCard";
import { HistoriqueTaxes } from "@/components/taxes/HistoriqueTaxes";

export default function TaxesPage() {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCloturerModal, setShowCloturerModal] = useState(false);
  const [historiqueAnnee, setHistoriqueAnnee] = useState(new Date().getFullYear());
  const [editFormData, setEditFormData] = useState({
    taux_tva: 18,
    taux_css: 1,
  });

  // Hooks de données
  const { data: taxesConfig, isLoading: isLoadingConfig, refetch: refetchConfig } = useTaxesConfig();
  const { data: moisCourant, isLoading: isLoadingMois, refetch: refetchMois } = useTaxesMoisCourant();
  const { data: historique, isLoading: isLoadingHistorique, refetch: refetchHistorique } = useTaxesHistorique(historiqueAnnee);
  
  // Mutations
  const updateTaxesMutation = useUpdateTaxesConfig();
  const recalculerMutation = useRecalculerTaxes();
  const cloturerMutation = useCloturerMois();

  const handleOpenEdit = () => {
    if (taxesConfig) {
      setEditFormData({
        taux_tva: taxesConfig.taux_tva,
        taux_css: taxesConfig.taux_css,
      });
    }
    setShowEditModal(true);
  };

  const handleSaveTaxes = () => {
    if (editFormData.taux_tva < 0 || editFormData.taux_tva > 100 || 
        editFormData.taux_css < 0 || editFormData.taux_css > 100) {
      toast.error("Les taux doivent être entre 0 et 100%");
      return;
    }

    updateTaxesMutation.mutate(editFormData, {
      onSuccess: () => {
        setShowEditModal(false);
        refetchConfig();
      },
    });
  };

  const handleRefresh = () => {
    refetchConfig();
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

  const isLoading = isLoadingConfig || isLoadingMois;

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
              Suivez les taxes collectées et gérez les taux applicables
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={handleOpenEdit} className="gap-2">
              <Settings className="h-4 w-4" />
              Modifier les taux
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="mois-courant" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="mois-courant" className="gap-2">
              <Calendar className="h-4 w-4" />
              Mois courant
            </TabsTrigger>
            <TabsTrigger value="historique" className="gap-2">
              <History className="h-4 w-4" />
              Historique
            </TabsTrigger>
          </TabsList>

          {/* Tab: Mois courant */}
          <TabsContent value="mois-courant" className="space-y-6">
            {isLoadingMois || isLoadingConfig ? (
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

                {/* Configuration des taux */}
                <Card className="border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calculator className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">Taux configurés</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableHead className="font-semibold">Code</TableHead>
                          <TableHead className="font-semibold">Nom</TableHead>
                          <TableHead className="text-center font-semibold">Taux</TableHead>
                          <TableHead className="font-semibold">Description</TableHead>
                          <TableHead className="text-center font-semibold">Type</TableHead>
                          <TableHead className="text-center font-semibold">Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {taxesConfig?.data.map((taxe, index) => (
                          <motion.tr
                            key={taxe.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                          >
                            <TableCell className="font-mono font-bold text-primary">
                              {taxe.code}
                            </TableCell>
                            <TableCell className="font-medium">{taxe.nom}</TableCell>
                            <TableCell className="text-center">
                              <Badge 
                                variant="secondary" 
                                className="text-sm font-semibold bg-primary/10 text-primary border-0"
                              >
                                {taxe.taux}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-xs truncate">
                              {taxe.description}
                            </TableCell>
                            <TableCell className="text-center">
                              {taxe.obligatoire ? (
                                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                                  Obligatoire
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground">
                                  Optionnelle
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge 
                                variant={taxe.active ? "default" : "secondary"}
                                className={taxe.active ? "bg-emerald-500/10 text-emerald-600 border-0" : ""}
                              >
                                {taxe.active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

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
                            Archiver les taxes du mois précédent et verrouiller les modifications
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
                        Clôturer le mois précédent
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Aucune donnée disponible</p>
                <Button variant="outline" className="mt-4" onClick={handleRefresh}>
                  Actualiser
                </Button>
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

      {/* Modal édition des taux */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Percent className="h-5 w-5 text-primary" />
              </div>
              Modifier les taux de taxes
            </DialogTitle>
            <DialogDescription>
              Modifiez les taux applicables aux factures et ordres de travail
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taux_tva">Taux TVA (%)</Label>
                <Input
                  id="taux_tva"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={editFormData.taux_tva}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, taux_tva: parseFloat(e.target.value) || 0 })
                  }
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">Taxe sur la Valeur Ajoutée</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taux_css">Taux CSS (%)</Label>
                <Input
                  id="taux_css"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={editFormData.taux_css}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, taux_css: parseFloat(e.target.value) || 0 })
                  }
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">Contribution Spéciale de Solidarité</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-sm text-muted-foreground">
                <strong>Taux total cumulé:</strong>{" "}
                <span className="text-primary font-semibold">
                  {(editFormData.taux_tva + editFormData.taux_css).toFixed(2)}%
                </span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSaveTaxes} 
              disabled={updateTaxesMutation.isPending}
              className="gap-2"
            >
              {updateTaxesMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal confirmation clôture */}
      <AlertDialog open={showCloturerModal} onOpenChange={setShowCloturerModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-600" />
              Confirmer la clôture
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va clôturer les taxes du mois précédent. Une fois clôturé, 
              les données ne pourront plus être modifiées. Voulez-vous continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCloturer}
              disabled={cloturerMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {cloturerMutation.isPending ? "Clôture en cours..." : "Confirmer la clôture"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
