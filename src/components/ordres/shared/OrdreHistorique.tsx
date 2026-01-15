import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Clock, 
  User, 
  FileText, 
  Edit, 
  Trash2, 
  CreditCard, 
  RefreshCw, 
  Loader2,
  Receipt,
  Send,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Printer,
  Mail,
  Copy,
  AlertTriangle,
  Ban,
  Undo,
  ArrowRightLeft,
  type LucideIcon
} from "lucide-react";
import { formatDate } from "@/data/mockData";
import { useQuery } from "@tanstack/react-query";
import { auditService } from "@/services/auditService";

interface OrdreHistoriqueProps {
  ordre: {
    id?: number | string;
    created_at?: string;
    date?: string;
  };
}

interface ActionConfig {
  icon: LucideIcon;
  color: string;
  label?: string;
}

const ACTION_CONFIGS: Record<string, ActionConfig> = {
  // Création
  'create': { icon: FileText, color: "text-blue-600", label: "Création" },
  'créé': { icon: FileText, color: "text-blue-600", label: "Création" },
  'création': { icon: FileText, color: "text-blue-600", label: "Création" },
  
  // Modification
  'update': { icon: Edit, color: "text-amber-600", label: "Modification" },
  'modif': { icon: Edit, color: "text-amber-600", label: "Modification" },
  'mise à jour': { icon: Edit, color: "text-amber-600", label: "Mise à jour" },
  'edit': { icon: Edit, color: "text-amber-600", label: "Modification" },
  
  // Suppression
  'delete': { icon: Trash2, color: "text-red-600", label: "Suppression" },
  'supprim': { icon: Trash2, color: "text-red-600", label: "Suppression" },
  
  // Paiement
  'paie': { icon: CreditCard, color: "text-green-600", label: "Paiement" },
  'payment': { icon: CreditCard, color: "text-green-600", label: "Paiement" },
  'paiement': { icon: CreditCard, color: "text-green-600", label: "Paiement" },
  'encaissement': { icon: CreditCard, color: "text-green-600", label: "Encaissement" },
  'règlement': { icon: CreditCard, color: "text-green-600", label: "Règlement" },
  
  // Conversion / Facturation
  'convert': { icon: ArrowRightLeft, color: "text-purple-600", label: "Conversion" },
  'factur': { icon: Receipt, color: "text-purple-600", label: "Facturation" },
  'invoice': { icon: Receipt, color: "text-purple-600", label: "Facturation" },
  
  // Validation
  'valid': { icon: CheckCircle, color: "text-green-600", label: "Validation" },
  'approv': { icon: CheckCircle, color: "text-green-600", label: "Approbation" },
  'confirm': { icon: CheckCircle, color: "text-green-600", label: "Confirmation" },
  
  // Annulation / Rejet
  'annul': { icon: XCircle, color: "text-red-600", label: "Annulation" },
  'cancel': { icon: XCircle, color: "text-red-600", label: "Annulation" },
  'rejet': { icon: Ban, color: "text-red-600", label: "Rejet" },
  'reject': { icon: Ban, color: "text-red-600", label: "Rejet" },
  'refus': { icon: Ban, color: "text-red-600", label: "Refus" },
  
  // Envoi
  'envoi': { icon: Send, color: "text-indigo-600", label: "Envoi" },
  'send': { icon: Send, color: "text-indigo-600", label: "Envoi" },
  'email': { icon: Mail, color: "text-indigo-600", label: "Email envoyé" },
  'mail': { icon: Mail, color: "text-indigo-600", label: "Email envoyé" },
  
  // Consultation
  'view': { icon: Eye, color: "text-gray-600", label: "Consultation" },
  'consult': { icon: Eye, color: "text-gray-600", label: "Consultation" },
  'vue': { icon: Eye, color: "text-gray-600", label: "Consultation" },
  
  // Export / Impression
  'export': { icon: Download, color: "text-teal-600", label: "Export" },
  'download': { icon: Download, color: "text-teal-600", label: "Téléchargement" },
  'télécharg': { icon: Download, color: "text-teal-600", label: "Téléchargement" },
  'print': { icon: Printer, color: "text-gray-600", label: "Impression" },
  'imprim': { icon: Printer, color: "text-gray-600", label: "Impression" },
  'pdf': { icon: Download, color: "text-teal-600", label: "Génération PDF" },
  
  // Duplication
  'dupli': { icon: Copy, color: "text-cyan-600", label: "Duplication" },
  'copy': { icon: Copy, color: "text-cyan-600", label: "Copie" },
  'clone': { icon: Copy, color: "text-cyan-600", label: "Duplication" },
  
  // Restauration
  'restor': { icon: Undo, color: "text-emerald-600", label: "Restauration" },
  'restore': { icon: Undo, color: "text-emerald-600", label: "Restauration" },
  
  // Alerte / Avertissement
  'alert': { icon: AlertTriangle, color: "text-orange-600", label: "Alerte" },
  'warn': { icon: AlertTriangle, color: "text-orange-600", label: "Avertissement" },
};

const getActionConfig = (action: string): ActionConfig => {
  const actionLower = action.toLowerCase();
  
  // Chercher une correspondance dans les configurations
  for (const [key, config] of Object.entries(ACTION_CONFIGS)) {
    if (actionLower.includes(key)) {
      return config;
    }
  }
  
  // Configuration par défaut
  return { icon: Clock, color: "text-muted-foreground" };
};

export function OrdreHistorique({ ordre }: OrdreHistoriqueProps) {
  // Récupérer l'historique depuis l'API d'audit
  const { data: auditData, isLoading } = useQuery({
    queryKey: ["audit-logs", "ordres_travail", ordre.id],
    queryFn: () => auditService.getAll({
      module: "ordres_travail",
      search: ordre.id ? String(ordre.id) : undefined,
      per_page: 50,
    }),
    enabled: !!ordre.id,
  });

  // Construire l'historique à partir des données d'audit
  const tracabilite = auditData?.data?.filter(entry => 
    entry.document_id === Number(ordre.id) || 
    entry.details?.includes(String(ordre.id))
  ).map(entry => ({
    id: String(entry.id),
    action: entry.action || "Action",
    utilisateur: entry.user?.name || "Système",
    date: entry.created_at,
    details: entry.details || `${entry.action} effectuée`,
    ...getActionConfig(entry.action),
  })) || [];

  // Si aucune donnée d'audit, afficher au moins la création
  const displayHistory = tracabilite.length > 0 ? tracabilite : [
    {
      id: "1",
      action: "Création",
      utilisateur: "Système",
      date: ordre.created_at || ordre.date || '',
      details: "Ordre de travail créé",
      icon: FileText,
      color: "text-blue-600",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Historique des actions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Chargement de l'historique...</span>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 to-transparent" />
              <div className="space-y-6">
                {displayHistory.map((action, index) => {
                  const IconComponent = action.icon;
                  return (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative flex gap-4 pl-10"
                    >
                      <motion.div
                        className={`absolute left-0 p-2 rounded-full bg-background border-2 ${action.color.replace("text-", "border-")}`}
                        whileHover={{ scale: 1.1 }}
                      >
                        <IconComponent className={`h-4 w-4 ${action.color}`} />
                      </motion.div>
                      <div className="flex-1 bg-muted/30 rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{action.action}</span>
                          <span className="text-sm text-muted-foreground">{formatDate(action.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <User className="h-3 w-3" />
                          <span>{action.utilisateur}</span>
                        </div>
                        <p className="text-sm">{action.details}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
