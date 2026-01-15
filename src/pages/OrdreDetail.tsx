import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, AlertCircle, Loader2, Receipt, Clock } from "lucide-react";
import { useOrdreById, useConvertOrdreToFacture } from "@/hooks/use-commercial";
import { PaiementModal } from "@/components/PaiementModal";
import { toast } from "sonner";
import {
  OrdreHeader,
  OrdreClientCard,
  OrdreFinancialCard,
  OrdreBLCard,
  OrdrePrestationsTable,
  OrdreConteneursTable,
  OrdreLotsTable,
  OrdrePrimesTable,
  OrdreNotesCard,
  OrdreHistorique,
} from "@/components/ordres/shared";

export default function OrdreDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("details");
  const [paiementModalOpen, setPaiementModalOpen] = useState(false);

  const { data: ordre, isLoading, error, refetch } = useOrdreById(id || "");
  const convertMutation = useConvertOrdreToFacture();

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
            Chargement de l'ordre...
          </motion.p>
        </div>
      </MainLayout>
    );
  }

  if (error || !ordre) {
    return (
      <MainLayout title="Ordre non trouvé">
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
          <h2 className="text-xl font-semibold mb-2">Ordre de travail non trouvé</h2>
          <p className="text-muted-foreground mb-6">
            L'ordre demandé n'existe pas ou a été supprimé.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={() => window.history.length <= 2 ? navigate('/ordres') : navigate(-1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          </motion.div>
        </motion.div>
      </MainLayout>
    );
  }

  const resteAPayer = (ordre.montant_ttc || 0) - (ordre.montant_paye || 0);
  const client = ordre.client;

  const handleConvertToFacture = async () => {
    try {
      await convertMutation.mutateAsync(id!);
      toast.success("Ordre converti en facture avec succès");
      navigate("/factures");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de la conversion");
    }
  };

  return (
    <MainLayout title={`Ordre ${ordre.numero}`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Header avec actions */}
        <OrdreHeader
          ordre={ordre}
          id={id!}
          resteAPayer={resteAPayer}
          onPaiementClick={() => setPaiementModalOpen(true)}
          onConvertClick={handleConvertToFacture}
          isConverting={convertMutation.isPending}
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="details" className="gap-2">
              <Receipt className="h-4 w-4" />
              Détails
            </TabsTrigger>
            <TabsTrigger value="tracabilite" className="gap-2">
              <Clock className="h-4 w-4" />
              Historique
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="details" className="space-y-6 mt-6">
              {/* Infos client + récap */}
              <div className="grid gap-6 md:grid-cols-2">
                <OrdreClientCard client={client} />
                <OrdreFinancialCard
                  montantHT={ordre.montant_ht || 0}
                  montantTVA={ordre.montant_tva || 0}
                  montantCSS={ordre.montant_css || 0}
                  montantTTC={ordre.montant_ttc || 0}
                  montantPaye={ordre.montant_paye || 0}
                  resteAPayer={resteAPayer}
                />
              </div>

              {/* Infos BL */}
              <OrdreBLCard
                blNumero={ordre.bl_numero}
                navire={ordre.navire}
                dateArrivee={ordre.date_arrivee}
              />

              {/* Prestations (lignes) */}
              <OrdrePrestationsTable lignes={ordre.lignes || []} />

              {/* Conteneurs */}
              <OrdreConteneursTable conteneurs={ordre.conteneurs || []} />

              {/* Lots */}
              <OrdreLotsTable lots={ordre.lots || []} />

              {/* Notes */}
              <OrdreNotesCard notes={ordre.notes} />

              {/* Primes */}
              <OrdrePrimesTable primes={ordre.primes || []} />
            </TabsContent>

            <TabsContent value="tracabilite" className="mt-6">
              <OrdreHistorique ordre={ordre} />
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </motion.div>

      {/* Modal paiement */}
      <PaiementModal
        open={paiementModalOpen}
        onOpenChange={setPaiementModalOpen}
        documentType="ordre"
        documentId={ordre.id}
        documentNumero={ordre.numero}
        montantRestant={resteAPayer}
        clientId={client?.id ? Number(client.id) : undefined}
        onSuccess={() => refetch()}
      />
    </MainLayout>
  );
}
