import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  ArrowRight,
  Wallet,
  Loader2,
  Download,
  Mail,
  MessageCircle,
  Ban,
  Trash2,
  User,
} from "lucide-react";
import { formatDate, getStatutLabel } from "@/data/mockData";
import { usePdfDownload } from "@/hooks/use-pdf-download";
import { useDeleteOrdre } from "@/hooks/use-commercial";
import { openWhatsAppShare } from "@/lib/whatsapp";
import { toast } from "sonner";
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
import { EmailModalWithTemplate } from "@/components/EmailModalWithTemplate";
import { AnnulationOrdreModal } from "@/components/AnnulationOrdreModal";
import {
  typeIndepConfigs,
  typeConteneurConfigs,
  getStatutConfig,
  getTypeFromLignes,
  Container,
  Ship,
  Truck,
} from "./ordreTypeConfigs";

interface OrdreHeaderProps {
  ordre: any;
  id: string;
  resteAPayer: number;
  onPaiementClick: () => void;
  onConvertClick: () => void;
  isConverting: boolean;
  onRefresh?: () => void;
}

export function OrdreHeader({
  ordre,
  id,
  resteAPayer,
  onPaiementClick,
  onConvertClick,
  isConverting,
  onRefresh,
}: OrdreHeaderProps) {
  const navigate = useNavigate();
  const statutConfig = getStatutConfig(ordre.statut);
  const { downloadPdf } = usePdfDownload({ filename: `ordre-${ordre.numero}.pdf` });
  const deleteOrdreMutation = useDeleteOrdre();
  
  // Modales
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [annulationModalOpen, setAnnulationModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  // Nom du créateur
  const creatorName = ordre.created_by?.name || ordre.user?.name;

  const handleWhatsAppShare = () => {
    const pdfUrl = `${window.location.origin}/ordres/${ordre.id}/pdf`;
    const montant = new Intl.NumberFormat('fr-FR').format(ordre.montant_ttc || 0) + ' FCFA';
    const typeOperation = ordre.type_independant || ordre.type_conteneur || 'Ordre de travail';
    const message = `Bonjour${ordre.client?.raison_sociale ? ` ${ordre.client.raison_sociale}` : ''},

Veuillez trouver ci-dessous votre ordre de travail n° *${ordre.numero}* d'un montant de *${montant}*.

📋 *Détails de l'ordre :*
• Client : ${ordre.client?.raison_sociale || ordre.client?.nom_complet || '-'}
• Type : ${typeOperation}
• Montant HT : ${new Intl.NumberFormat('fr-FR').format(ordre.montant_ht || 0)} FCFA
• TVA : ${new Intl.NumberFormat('fr-FR').format(ordre.montant_tva || 0)} FCFA
• *Total TTC : ${montant}*
• Statut : ${getStatutLabel(ordre.statut)}

📎 *Lien du document PDF :*
${pdfUrl}

Pour toute question, n'hésitez pas à nous contacter.

Cordialement,
L'équipe LOGISTIGA`;

    openWhatsAppShare(message);
  };

  const handleDelete = async () => {
    try {
      await deleteOrdreMutation.mutateAsync(id);
      toast.success("Ordre supprimé avec succès");
      navigate("/ordres");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erreur lors de la suppression");
    } finally {
      setDeleteConfirmOpen(false);
    }
  };

  const getTypeBadge = () => {
    const { categorie, type_operation, type_operation_indep } = ordre;

    if (categorie === 'conteneurs') {
      const typeOp = type_operation?.toLowerCase() || '';
      if (typeOp.includes('import') || typeOp === 'import') {
        const config = typeConteneurConfigs.import;
        const IconComponent = config.icon;
        return (
          <Badge className={`${config.className} flex items-center gap-1.5 font-medium`}>
            <IconComponent className="h-3.5 w-3.5" />
            <span>Conteneurs / Import</span>
          </Badge>
        );
      }
      if (typeOp.includes('export') || typeOp === 'export') {
        const config = typeConteneurConfigs.export;
        const IconComponent = config.icon;
        return (
          <Badge className={`${config.className} flex items-center gap-1.5 font-medium`}>
            <IconComponent className="h-3.5 w-3.5" />
            <span>Conteneurs / Export</span>
          </Badge>
        );
      }
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 flex items-center gap-1.5 font-medium">
          <Container className="h-3.5 w-3.5" />
          Conteneurs
        </Badge>
      );
    }

    if (categorie === 'operations_independantes') {
      let typeIndep = type_operation_indep?.toLowerCase() || type_operation?.toLowerCase() || '';
      if (!typeIndep || !typeIndepConfigs[typeIndep]) {
        typeIndep = getTypeFromLignes(ordre);
      }
      const config = typeIndepConfigs[typeIndep];
      if (config) {
        const IconComponent = config.icon;
        return (
          <Badge className={`${config.className} flex items-center gap-1.5 font-medium`}>
            <IconComponent className="h-3.5 w-3.5" />
            <span>Indépendant / {config.label}</span>
          </Badge>
        );
      }
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-200 flex items-center gap-1.5 font-medium">
          <Truck className="h-3.5 w-3.5" />
          Indépendant
        </Badge>
      );
    }

    if (categorie === 'conventionnel') {
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-200 flex items-center gap-1.5 font-medium">
          <Ship className="h-3.5 w-3.5" />
          Conventionnel
        </Badge>
      );
    }

    return (
      <Badge className="bg-muted text-muted-foreground flex items-center gap-1.5">
        {ordre.type_document || categorie || 'N/A'}
      </Badge>
    );
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card/50 backdrop-blur-sm p-4 rounded-lg border"
      >
        <div className="flex items-center gap-4">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                if (window.history.length <= 2) {
                  navigate('/ordres');
                } else {
                  navigate(-1);
                }
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </motion.div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold">{ordre.numero}</h1>
              <Badge
                variant="outline"
                className={`${statutConfig.className} flex items-center gap-1`}
              >
                {statutConfig.icon && <statutConfig.icon className="h-3.5 w-3.5" />}
                {statutConfig.label}
              </Badge>
              {getTypeBadge()}
            </div>
            <div className="flex items-center gap-4 mt-1 text-muted-foreground text-sm">
              <span>Créé le {formatDate(ordre.date)}</span>
              {creatorName && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {creatorName}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              className="gap-2"
              onClick={downloadPdf}
            >
              <Download className="h-4 w-4" />
              Télécharger PDF
            </Button>
          </motion.div>
          
          {/* Email */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              className="gap-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              onClick={() => setEmailModalOpen(true)}
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
          </motion.div>
          
          {/* WhatsApp */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              className="gap-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
              onClick={handleWhatsAppShare}
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
          </motion.div>

          {ordre.statut !== 'facture' && ordre.statut !== 'annule' && (
            <>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate(`/ordres/${id}/modifier`)}
                >
                  <Edit className="h-4 w-4" />
                  Modifier
                </Button>
              </motion.div>
              {resteAPayer > 0 && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    className="gap-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                    onClick={onPaiementClick}
                  >
                    <Wallet className="h-4 w-4" />
                    Paiement
                  </Button>
                </motion.div>
              )}
              {/* Annuler */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="outline"
                  className="gap-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                  onClick={() => setAnnulationModalOpen(true)}
                >
                  <Ban className="h-4 w-4" />
                  Annuler
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  className="gap-2 shadow-md"
                  onClick={onConvertClick}
                  disabled={isConverting}
                >
                  {isConverting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Facturer
                </Button>
              </motion.div>
            </>
          )}
          
          {/* Supprimer (toujours visible sauf si facturé) */}
          {ordre.statut !== 'facture' && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className="gap-2 text-destructive hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Modal de confirmation de suppression */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'ordre {ordre.numero} ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal d'annulation */}
      {annulationModalOpen && (
        <AnnulationOrdreModal
          open={annulationModalOpen}
          onOpenChange={setAnnulationModalOpen}
          ordreId={Number(id)}
          ordreNumero={ordre.numero}
        />
      )}

      {/* Modal Email */}
      {emailModalOpen && (
        <EmailModalWithTemplate
          open={emailModalOpen}
          onOpenChange={setEmailModalOpen}
          documentType="ordre"
          documentData={{
            id: ordre.id,
            numero: ordre.numero,
            dateCreation: ordre.date_creation,
            montantTTC: ordre.montant_ttc,
            montantHT: ordre.montant_ht,
            resteAPayer: resteAPayer,
            clientNom: ordre.client?.raison_sociale || ordre.client?.nom_complet,
            clientEmail: ordre.client?.email,
            transitaireNom: ordre.transitaire?.nom,
            transitaireEmail: ordre.transitaire?.email,
            armateurNom: ordre.armateur?.nom,
            armateurEmail: ordre.armateur?.email,
            representantNom: ordre.representant?.nom,
            representantEmail: ordre.representant?.email,
            contacts: ordre.client?.contacts || [],
            statut: ordre.statut,
            categorie: ordre.categorie || ordre.type_operation,
          }}
        />
      )}
    </>
  );
}
