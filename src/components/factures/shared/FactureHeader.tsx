import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Edit,
  Wallet,
  Download,
  Mail,
  Calendar,
  User,
  FileText,
  Clock,
  Ban,
  Trash2,
  Copy,
  MessageCircle,
} from "lucide-react";
import { formatDate, getStatutLabel } from "@/data/mockData";
import { usePdfDownload } from "@/hooks/use-pdf-download";
import { openWhatsAppShare } from "@/lib/whatsapp";
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

interface FactureHeaderProps {
  facture: any;
  id: string;
  resteAPayer: number;
  onPaiementClick: () => void;
  onEmailClick: () => void;
  onAnnulerClick?: () => void;
  onDupliquerClick?: () => void;
  onDeleteClick?: () => void;
}

const statutGradients: Record<string, string> = {
  brouillon: "from-slate-500/20 via-slate-400/10 to-transparent",
  emise: "from-blue-500/20 via-blue-400/10 to-transparent",
  payee: "from-emerald-500/20 via-emerald-400/10 to-transparent",
  partielle: "from-amber-500/20 via-amber-400/10 to-transparent",
  impayee: "from-orange-500/20 via-orange-400/10 to-transparent",
  annulee: "from-red-500/20 via-red-400/10 to-transparent",
};

const statutConfigs: Record<string, { label: string; className: string; icon?: React.ElementType }> = {
  brouillon: { 
    label: "Brouillon", 
    className: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-200 dark:border-gray-700",
    icon: FileText,
  },
  emise: { 
    label: "Émise", 
    className: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700",
    icon: FileText,
  },
  payee: { 
    label: "Payée", 
    className: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-700",
    icon: Wallet,
  },
  partielle: { 
    label: "Paiement partiel", 
    className: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700",
    icon: Wallet,
  },
  impayee: { 
    label: "Impayée", 
    className: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700",
    icon: Clock,
  },
  annulee: { 
    label: "Annulée", 
    className: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700",
    icon: Ban,
  },
};

export function FactureHeader({
  facture,
  id,
  resteAPayer,
  onPaiementClick,
  onEmailClick,
  onAnnulerClick,
  onDupliquerClick,
  onDeleteClick,
}: FactureHeaderProps) {
  const navigate = useNavigate();
  const { downloadPdf } = usePdfDownload({ filename: `facture-${facture.numero}.pdf` });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const client = facture.client;
  const clientName = client?.raison_sociale || client?.nom_complet || client?.nom || 'Client';
  const clientInitials = clientName.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
  
  const creatorName = facture.created_by?.name || facture.user?.name;
  const statutConfig = statutConfigs[facture.statut] || { label: getStatutLabel(facture.statut), className: "bg-gray-100 text-gray-800" };
  const gradientClass = statutGradients[facture.statut] || statutGradients.brouillon;
  
  const StatusIcon = statutConfig.icon;

  const handleWhatsAppShare = () => {
    const pdfUrl = `${window.location.origin}/factures/${facture.id}/pdf`;
    const montant = new Intl.NumberFormat('fr-FR').format(facture.montant_ttc || 0) + ' FCFA';
    const message = `Bonjour${client?.raison_sociale ? ` ${client.raison_sociale}` : ''},

Veuillez trouver ci-dessous votre facture n° *${facture.numero}* d'un montant de *${montant}*.

📋 *Détails de la facture :*
• Client : ${clientName}
• Montant HT : ${new Intl.NumberFormat('fr-FR').format(facture.montant_ht || 0)} FCFA
• TVA : ${new Intl.NumberFormat('fr-FR').format(facture.montant_tva || 0)} FCFA
• *Total TTC : ${montant}*
• Statut : ${statutConfig.label}
• Échéance : ${formatDate(facture.date_echeance)}

📎 *Lien du document PDF :*
${pdfUrl}

Pour toute question, n'hésitez pas à nous contacter.

Cordialement,
L'équipe LOGISTIGA`;

    openWhatsAppShare(message);
  };

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
                    navigate('/factures');
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
                onClick={onEmailClick}
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

            {/* Invoice Info */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{facture.numero}</h1>
                <Badge
                  variant="outline"
                  className={`${statutConfig.className} flex items-center gap-1 font-semibold`}
                >
                  {StatusIcon && <StatusIcon className="h-3.5 w-3.5" />}
                  {statutConfig.label}
                </Badge>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Créée le {formatDate(facture.date_facture)}
                </span>
                <span className="flex items-center gap-1.5 text-orange-600">
                  <Clock className="h-3.5 w-3.5" />
                  Échéance: {formatDate(facture.date_echeance)}
                </span>
                {creatorName && (
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    {creatorName}
                  </span>
                )}
              </div>
              
              <span className="text-sm font-medium text-foreground">
                {clientName}
              </span>
            </div>
          </div>

          {/* Bottom action buttons */}
          <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-border/50">
            {facture.statut !== 'payee' && facture.statut !== 'annulee' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-lg"
                  onClick={() => navigate(`/factures/${id}/modifier`)}
                >
                  <Edit className="h-3.5 w-3.5" />
                  Modifier
                </Button>

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
                
                {onAnnulerClick && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-lg text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                    onClick={onAnnulerClick}
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Annuler
                  </Button>
                )}
              </>
            )}
            
            {onDupliquerClick && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-lg"
                onClick={onDupliquerClick}
              >
                <Copy className="h-3.5 w-3.5" />
                Dupliquer
              </Button>
            )}
            
            {onDeleteClick && facture.statut !== 'payee' && (
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
              Êtes-vous sûr de vouloir supprimer la facture {facture.numero} ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                onDeleteClick?.();
                setDeleteConfirmOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
