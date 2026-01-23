import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Calendar,
  User,
  Send,
} from "lucide-react";
import { formatDate, getStatutLabel } from "@/data/mockData";
import { usePdfDownload } from "@/hooks/use-pdf-download";
import { useDeleteOrdre } from "@/hooks/use-commercial";
import { useSendToLogistiga, canSendToLogistiga } from "@/hooks/use-logistiga";
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

const statutGradients: Record<string, string> = {
  brouillon: "from-slate-500/20 via-slate-400/10 to-transparent",
  en_cours: "from-blue-500/20 via-blue-400/10 to-transparent",
  valide: "from-emerald-500/20 via-emerald-400/10 to-transparent",
  facture: "from-green-500/20 via-green-400/10 to-transparent",
  annule: "from-red-500/20 via-red-400/10 to-transparent",
};

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
  const sendToLogistigaMutation = useSendToLogistiga();
  
  // Modales
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [annulationModalOpen, setAnnulationModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  // Préparer les données pour Logistiga
  const ordreForLogistiga = {
    id: ordre.id,
    numero: ordre.numero,
    numero_bl: ordre.numero_bl,
    client: ordre.client ? { nom: ordre.client.raison_sociale || ordre.client.nom_complet || ordre.client.nom } : null,
    transitaire: ordre.transitaire ? { nom: ordre.transitaire.nom } : null,
    conteneurs: ordre.conteneurs?.map((c: any) => ({ numero: c.numero })) || [],
  };
  
  const canSendLogistiga = ordre.categorie === 'conteneurs' && canSendToLogistiga(ordreForLogistiga);

  // Nom du créateur - chercher dans plusieurs champs possibles
  const creatorName = ordre.created_by?.name || ordre.user?.name || ordre.createur?.name || ordre.createur_nom || ordre.user_name;
  
  // Client info
  const clientName = ordre.client?.raison_sociale || ordre.client?.nom_complet || ordre.client?.nom || 'Client';
  const clientInitials = clientName.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();

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

  const handleSendToLogistiga = () => {
    sendToLogistigaMutation.mutate(ordreForLogistiga);
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
          <Badge className={`${config.className} flex items-center gap-1.5 font-medium text-xs`}>
            <IconComponent className="h-3 w-3" />
            <span>Conteneurs / Import</span>
          </Badge>
        );
      }
      if (typeOp.includes('export') || typeOp === 'export') {
        const config = typeConteneurConfigs.export;
        const IconComponent = config.icon;
        return (
          <Badge className={`${config.className} flex items-center gap-1.5 font-medium text-xs`}>
            <IconComponent className="h-3 w-3" />
            <span>Conteneurs / Export</span>
          </Badge>
        );
      }
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 flex items-center gap-1.5 font-medium text-xs">
          <Container className="h-3 w-3" />
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
          <Badge className={`${config.className} flex items-center gap-1.5 font-medium text-xs`}>
            <IconComponent className="h-3 w-3" />
            <span>Indépendant / {config.label}</span>
          </Badge>
        );
      }
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-200 flex items-center gap-1.5 font-medium text-xs">
          <Truck className="h-3 w-3" />
          Indépendant
        </Badge>
      );
    }

    if (categorie === 'conventionnel') {
      return (
        <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-200 flex items-center gap-1.5 font-medium text-xs">
          <Ship className="h-3 w-3" />
          Conventionnel
        </Badge>
      );
    }

    return (
      <Badge className="bg-muted text-muted-foreground flex items-center gap-1.5 text-xs">
        {ordre.type_document || categorie || 'N/A'}
      </Badge>
    );
  };

  const gradientClass = statutGradients[ordre.statut] || statutGradients.brouillon;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${gradientClass} backdrop-blur-sm`}
      >
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/5 to-transparent rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-primary/5 to-transparent rounded-full translate-y-24 -translate-x-24" />
        
        <div className="relative p-6">
          {/* Top row: Back button + Actions */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="outline" 
                size="icon"
                className="rounded-full bg-background/80 backdrop-blur-sm shadow-sm"
                onClick={() => {
                  if (window.history.length <= 2) {
                    navigate('/ordres');
                  } else {
                    navigate(-1);
                  }
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </motion.div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-full bg-background/80 backdrop-blur-sm shadow-sm"
                onClick={downloadPdf}
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-full bg-background/80 backdrop-blur-sm shadow-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                onClick={() => setEmailModalOpen(true)}
              >
                <Mail className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Email</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-full bg-background/80 backdrop-blur-sm shadow-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                onClick={handleWhatsAppShare}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </Button>
            </div>
          </div>

          {/* Main content: Avatar + Info + Status */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Client Avatar */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Avatar className="h-20 w-20 border-4 border-background shadow-xl">
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-2xl font-bold">
                  {clientInitials}
                </AvatarFallback>
              </Avatar>
            </motion.div>

            {/* Order Info */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{ordre.numero}</h1>
                <Badge
                  variant="outline"
                  className={`${statutConfig.className} flex items-center gap-1 font-semibold`}
                >
                  {statutConfig.icon && <statutConfig.icon className="h-3.5 w-3.5" />}
                  {statutConfig.label}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                {getTypeBadge()}
              </div>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Créé le {formatDate(ordre.date)}
                </span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-muted/50 rounded-full">
                  <User className="h-3.5 w-3.5" />
                  <span className="font-medium">{creatorName || 'Non renseigné'}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Client:</span>
                  <span className="font-medium text-foreground">{clientName}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Bottom action buttons */}
          <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-border/50">
            {ordre.statut !== 'annule' && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-lg"
                onClick={() => navigate(`/ordres/${id}/modifier`)}
              >
                <Edit className="h-3.5 w-3.5" />
                Modifier
              </Button>
            )}

            {/* Bouton Logistiga - uniquement pour les ordres conteneurs avec BL et conteneurs */}
            {canSendLogistiga && ordre.statut !== 'annule' && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                onClick={handleSendToLogistiga}
                disabled={sendToLogistigaMutation.isPending}
              >
                {sendToLogistigaMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Envoyer Logistiga
              </Button>
            )}

            {ordre.statut !== 'facture' && ordre.statut !== 'annule' && (
              <>
                {resteAPayer > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                    onClick={onPaiementClick}
                  >
                    <Wallet className="h-3.5 w-3.5" />
                    Paiement
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-lg text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                  onClick={() => setAnnulationModalOpen(true)}
                >
                  <Ban className="h-3.5 w-3.5" />
                  Annuler
                </Button>
                
                <Button
                  size="sm"
                  className="gap-1.5 rounded-lg shadow-md bg-primary hover:bg-primary/90"
                  onClick={onConvertClick}
                  disabled={isConverting}
                >
                  {isConverting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5" />
                  )}
                  Facturer
                </Button>
              </>
            )}
            
            {ordre.statut !== 'facture' && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-lg text-destructive hover:bg-red-50 dark:hover:bg-red-900/20 ml-auto"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer
              </Button>
            )}
          </div>
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
