import { useState, Fragment } from "react";
import { roundMoney } from "@/lib/utils";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Receipt,
  Loader2,
  Clock,
  FileText,
  Anchor,
  Hash,
  Ship,
  Package,
  StickyNote,
} from "lucide-react";
import { useFactureById } from "@/hooks/use-commercial";
import { formatMontant, formatDate } from "@/data/mockData";
import { PaiementModal } from "@/components/PaiementModal";
import { EmailModal } from "@/components/EmailModal";
import { 
  FactureHistorique, 
  FactureHeader, 
  FactureFinancialCard, 
  FactureClientCard 
} from "@/components/factures/shared";
import { ExonerationStatusCard } from "@/components/shared/ExonerationStatusCard";

export default function FactureDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("details");
  const [paiementModalOpen, setPaiementModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const { data: facture, isLoading, error, refetch } = useFactureById(id || "");

  if (isLoading) {
    return (
      <MainLayout title="Chargement...">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-10 w-10 text-primary" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-muted-foreground"
          >
            Chargement de la facture...
          </motion.p>
        </div>
      </MainLayout>
    );
  }

  if (error || !facture) {
    return (
      <MainLayout title="Facture non trouvée">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <AlertCircle className="h-20 w-20 text-destructive/50 mb-6" />
          </motion.div>
          <h2 className="text-xl font-semibold mb-2">Facture non trouvée</h2>
          <p className="text-muted-foreground mb-6">
            La facture demandée n'existe pas ou a été supprimée.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={() => window.history.length <= 2 ? navigate('/factures') : navigate(-1)}>
              Retour
            </Button>
          </motion.div>
        </motion.div>
      </MainLayout>
    );
  }

  const resteAPayer = roundMoney((facture.montant_ttc || 0) - (facture.montant_paye || 0));
  const client = facture.client;

  // Fallback: si la facture n'a pas ses propres lignes/lots/conteneurs (conversion incomplète),
  // afficher celles de l'OT d'origine pour montrer les Désignations
  const ot: any = (facture as any).ordre_travail || (facture as any).ordreTravail;
  const facLignes = (facture as any).lignes?.length ? (facture as any).lignes : (ot?.lignes ?? []);
  const facLots = (facture as any).lots?.length ? (facture as any).lots : (ot?.lots ?? []);
  const facConteneurs = (facture as any).conteneurs?.length ? (facture as any).conteneurs : (ot?.conteneurs ?? []);


  return (
    <MainLayout title={`Facture ${facture.numero}`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Header avec actions */}
        <FactureHeader
          facture={facture}
          id={id!}
          resteAPayer={resteAPayer}
          onPaiementClick={() => setPaiementModalOpen(true)}
          onEmailClick={() => setEmailModalOpen(true)}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/50 p-1 rounded-xl">
            <TabsTrigger 
              value="details" 
              className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300"
            >
              <Receipt className="h-4 w-4" />
              Détails
            </TabsTrigger>
            <TabsTrigger 
              value="tracabilite" 
              className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300"
            >
              <Clock className="h-4 w-4" />
              Historique
            </TabsTrigger>
          </TabsList>

          <div className="mt-6 relative overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              {activeTab === "details" && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="space-y-6"
                >


                  {/* Infos client + récap */}
                  <div className="grid gap-6 md:grid-cols-2">
                    <FactureClientCard client={client} />
                    <FactureFinancialCard
                      montantHT={facture.montant_ht || 0}
                      montantTVA={facture.montant_tva || 0}
                      montantCSS={facture.montant_css || 0}
                      montantTTC={facture.montant_ttc || 0}
                      montantPaye={facture.montant_paye || 0}
                      resteAPayer={resteAPayer}
                      remiseType={facture.remise_type}
                      remiseValeur={facture.remise_valeur}
                      remiseMontant={facture.remise_montant}
                      selectedTaxCodes={facture.taxes_selection?.selected_tax_codes || []}
                      tauxTva={facture.taux_tva || 18}
                      tauxCss={facture.taux_css || 1}
                    />
                  </div>

                  {/* Exonération de taxes */}
                  <ExonerationStatusCard
                    exonereTva={facture.exonere_tva}
                    exonereCss={facture.exonere_css}
                    motifExoneration={facture.motif_exoneration}
                    montantTva={facture.montant_tva}
                    montantCss={facture.montant_css}
                    updatedAt={facture.updated_at}
                  />

                  {/* Infos BL */}
                  {facture.bl_numero && (
                    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-blue-500/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold text-muted-foreground">
                          <div className="p-1.5 rounded-lg bg-blue-500/10">
                            <Anchor className="h-4 w-4 text-blue-600" />
                          </div>
                          Informations BL
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                              <Hash className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Numéro BL</span>
                              <p className="font-mono font-medium">{facture.bl_numero}</p>
                            </div>
                          </div>
                          {facture.navire && (
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <Ship className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <span className="text-sm text-muted-foreground">Navire</span>
                                <p className="font-medium">{facture.navire}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Lignes de la facture */}
                  {facture.lignes && facture.lignes.length > 0 && (
                    <Card className="overflow-hidden border-0 shadow-lg">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold text-muted-foreground">
                          <div className="p-1.5 rounded-lg bg-purple-500/10">
                            <FileText className="h-4 w-4 text-purple-600" />
                          </div>
                          Lignes de la facture
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>Description</TableHead>
                              <TableHead className="text-center">Quantité</TableHead>
                              <TableHead className="text-right">Prix unitaire</TableHead>
                              <TableHead className="text-right">Montant HT</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {facture.lignes.map((ligne: any) => (
                              <TableRow key={ligne.id} className="hover:bg-muted/50">
                                <TableCell>{ligne.description || ligne.type_operation}</TableCell>
                                <TableCell className="text-center">{ligne.quantite}</TableCell>
                                <TableCell className="text-right">{formatMontant(ligne.prix_unitaire)}</TableCell>
                                <TableCell className="text-right font-medium">{formatMontant(ligne.montant_ht)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}

                  {/* Lots (Conventionnel) */}
                  {facture.lots && facture.lots.length > 0 && (
                    <Card className="overflow-hidden border-0 shadow-lg">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold text-muted-foreground">
                          <div className="p-1.5 rounded-lg bg-emerald-500/10">
                            <Package className="h-4 w-4 text-emerald-600" />
                          </div>
                          Lots
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>N° Lot</TableHead>
                              <TableHead>Désignation</TableHead>
                              <TableHead className="text-center">Quantité</TableHead>
                              <TableHead className="text-right">Prix unitaire</TableHead>
                              <TableHead className="text-right">Montant HT</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {facture.lots.map((lot: any, index: number) => {
                              const numeroLot = lot.numero_lot || `Lot ${index + 1}`;
                              const designation = String(lot.designation || lot.description || '').trim() || '—';
                              const qte = Number(lot.quantite ?? 1);
                              const pu = Number(lot.prix_unitaire ?? 0);
                              const montant = Number(lot.montant_ht ?? lot.prix_total ?? qte * pu);
                              return (
                                <TableRow key={lot.id ?? index} className="hover:bg-muted/50">
                                  <TableCell className="font-mono font-medium">{numeroLot}</TableCell>
                                  <TableCell>{designation}</TableCell>
                                  <TableCell className="text-center">{qte}</TableCell>
                                  <TableCell className="text-right">{formatMontant(pu)}</TableCell>
                                  <TableCell className="text-right font-medium">{formatMontant(montant)}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}

                  {/* Conteneurs */}
                  {facture.conteneurs && facture.conteneurs.length > 0 && (
                    <Card className="overflow-hidden border-0 shadow-lg">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold text-muted-foreground">
                          <div className="p-1.5 rounded-lg bg-cyan-500/10">
                            <Package className="h-4 w-4 text-cyan-600" />
                          </div>
                          Conteneurs
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>Désignation</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-center">Qté</TableHead>
                              <TableHead className="text-right">Prix unit.</TableHead>
                              <TableHead className="text-right">Montant</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {facture.conteneurs.map((conteneur: any) => {
                              const ops = conteneur.operations || [];
                              const baseHT = Number(conteneur.prix_unitaire ?? 0);
                              return (
                                <Fragment key={conteneur.id}>
                                  <TableRow className="bg-muted/20">
                                    <TableCell className="font-mono font-medium">
                                      {conteneur.numero}
                                      {conteneur.taille && <span className="ml-2 text-xs text-muted-foreground">{conteneur.taille}'</span>}
                                      {conteneur.type && <span className="ml-2 text-xs text-muted-foreground">{conteneur.type}</span>}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{conteneur.description || '—'}</TableCell>
                                    <TableCell className="text-center">1</TableCell>
                                    <TableCell className="text-right">{formatMontant(baseHT)}</TableCell>
                                    <TableCell className="text-right font-medium">{formatMontant(baseHT)}</TableCell>
                                  </TableRow>
                                  {ops.map((op: any, i: number) => {
                                    const qte = Number(op.quantite ?? 1);
                                    const pu = Number(op.prix_unitaire ?? 0);
                                    const total = Number(op.prix_total ?? op.montant_ht ?? qte * pu);
                                    return (
                                      <TableRow key={op.id ?? `${conteneur.id}-op-${i}`} className="hover:bg-muted/30">
                                        <TableCell className="pl-8 text-sm text-muted-foreground">↳ {op.type_operation || op.type || 'Opération'}</TableCell>
                                        <TableCell className="text-sm">{op.description || '—'}</TableCell>
                                        <TableCell className="text-center text-sm">{qte}</TableCell>
                                        <TableCell className="text-right text-sm">{formatMontant(pu)}</TableCell>
                                        <TableCell className="text-right text-sm font-medium">{formatMontant(total)}</TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </Fragment>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}

                  {/* Notes */}
                  {facture.notes && (
                    <Card className="overflow-hidden border-0 shadow-lg">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base font-semibold text-muted-foreground">
                          <div className="p-1.5 rounded-lg bg-amber-500/10">
                            <StickyNote className="h-4 w-4 text-amber-600" />
                          </div>
                          Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{facture.notes}</p>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              )}

              {activeTab === "tracabilite" && (
                <motion.div
                  key="tracabilite"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <FactureHistorique facture={facture} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Tabs>
      </motion.div>

      {/* Modal paiement */}
      <PaiementModal
        open={paiementModalOpen}
        onOpenChange={setPaiementModalOpen}
        documentType="facture"
        documentId={facture.id}
        documentNumero={facture.numero}
        montantRestant={resteAPayer}
        clientId={client?.id ? Number(client.id) : undefined}
        montantHT={facture.montant_ht || 0}
        montantDejaPaye={facture.montant_paye || 0}
        exonereTva={facture.exonere_tva || false}
        exonereCss={facture.exonere_css || false}
        tauxTva={18}
        tauxCss={1}
        onSuccess={() => refetch()}
      />

      {/* Modal email */}
      <EmailModal
        open={emailModalOpen}
        onOpenChange={setEmailModalOpen}
        documentType="facture"
        documentNumero={facture.numero}
        clientEmail={client?.email || ""}
        clientNom={client?.nom || ""}
      />
    </MainLayout>
  );
}
