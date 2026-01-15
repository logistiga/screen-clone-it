import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Clock, User, FileText, Edit, Trash2, CreditCard, 
  Loader2, Receipt, Send, CheckCircle, XCircle, Eye, 
  Download, Printer, Mail, Copy, AlertTriangle, Ban, 
  Undo, ArrowRightLeft, ArrowRight, ChevronDown, ChevronUp,
  type LucideIcon
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { auditService } from "@/services/auditService";

// Types
interface FieldChange {
  field: string;
  label: string;
  oldValue: any;
  newValue: any;
}

interface TimelineEvent {
  id: string;
  type: string;
  action: string;
  date: string;
  time?: string;
  description?: string;
  user?: string;
  changes?: FieldChange[];
  icon: LucideIcon;
  color: string;
}

interface HistoriqueTimelineProps {
  documentId: number | string;
  documentNumero?: string;
  module: "devis" | "ordres_travail" | "factures";
  createdAt?: string;
  title?: string;
}

// Configuration des actions
const ACTION_CONFIGS: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  'create': { icon: FileText, color: "text-blue-600", label: "Création" },
  'créé': { icon: FileText, color: "text-blue-600", label: "Création" },
  'création': { icon: FileText, color: "text-blue-600", label: "Création" },
  'update': { icon: Edit, color: "text-amber-600", label: "Modification" },
  'modif': { icon: Edit, color: "text-amber-600", label: "Modification" },
  'mise à jour': { icon: Edit, color: "text-amber-600", label: "Mise à jour" },
  'edit': { icon: Edit, color: "text-amber-600", label: "Modification" },
  'delete': { icon: Trash2, color: "text-red-600", label: "Suppression" },
  'supprim': { icon: Trash2, color: "text-red-600", label: "Suppression" },
  'paie': { icon: CreditCard, color: "text-green-600", label: "Paiement" },
  'payment': { icon: CreditCard, color: "text-green-600", label: "Paiement" },
  'paiement': { icon: CreditCard, color: "text-green-600", label: "Paiement" },
  'encaissement': { icon: CreditCard, color: "text-green-600", label: "Encaissement" },
  'convert': { icon: ArrowRightLeft, color: "text-purple-600", label: "Conversion" },
  'factur': { icon: Receipt, color: "text-purple-600", label: "Facturation" },
  'invoice': { icon: Receipt, color: "text-purple-600", label: "Facturation" },
  'valid': { icon: CheckCircle, color: "text-green-600", label: "Validation" },
  'approv': { icon: CheckCircle, color: "text-green-600", label: "Approbation" },
  'confirm': { icon: CheckCircle, color: "text-green-600", label: "Confirmation" },
  'annul': { icon: XCircle, color: "text-red-600", label: "Annulation" },
  'cancel': { icon: XCircle, color: "text-red-600", label: "Annulation" },
  'rejet': { icon: Ban, color: "text-red-600", label: "Rejet" },
  'reject': { icon: Ban, color: "text-red-600", label: "Rejet" },
  'refus': { icon: Ban, color: "text-red-600", label: "Refus" },
  'envoi': { icon: Send, color: "text-indigo-600", label: "Envoi" },
  'send': { icon: Send, color: "text-indigo-600", label: "Envoi" },
  'email': { icon: Mail, color: "text-indigo-600", label: "Email envoyé" },
  'mail': { icon: Mail, color: "text-indigo-600", label: "Email envoyé" },
  'view': { icon: Eye, color: "text-gray-600", label: "Consultation" },
  'consult': { icon: Eye, color: "text-gray-600", label: "Consultation" },
  'export': { icon: Download, color: "text-teal-600", label: "Export" },
  'download': { icon: Download, color: "text-teal-600", label: "Téléchargement" },
  'print': { icon: Printer, color: "text-gray-600", label: "Impression" },
  'pdf': { icon: Download, color: "text-teal-600", label: "Génération PDF" },
  'dupli': { icon: Copy, color: "text-cyan-600", label: "Duplication" },
  'copy': { icon: Copy, color: "text-cyan-600", label: "Copie" },
  'clone': { icon: Copy, color: "text-cyan-600", label: "Duplication" },
  'restor': { icon: Undo, color: "text-emerald-600", label: "Restauration" },
  'alert': { icon: AlertTriangle, color: "text-orange-600", label: "Alerte" },
  'warn': { icon: AlertTriangle, color: "text-orange-600", label: "Avertissement" },
};

// Labels pour les champs
const fieldLabels: Record<string, string> = {
  montant_ht: "Montant HT",
  montant_ttc: "Montant TTC",
  montant_tva: "TVA",
  montant_css: "CSS",
  tva: "TVA",
  css: "CSS",
  remise_valeur: "Valeur remise",
  remise_montant: "Montant remise",
  remise_type: "Type de remise",
  statut: "Statut",
  date_validite: "Date de validité",
  date_echeance: "Date d'échéance",
  client_id: "Client",
  transitaire_id: "Transitaire",
  armateur_id: "Armateur",
  representant_id: "Représentant",
  notes: "Notes",
  observations: "Observations",
  navire: "Navire",
  voyage: "Voyage",
  port_origine: "Port d'origine",
  port_destination: "Port de destination",
  numero_bl: "N° BL",
  type_operation: "Type d'opération",
  categorie: "Catégorie",
  montant_paye: "Montant payé",
  reste_a_payer: "Reste à payer",
};

// Formater une valeur pour l'affichage
const formatValue = (field: string, value: any): string => {
  if (value === null || value === undefined || value === "") return "—";
  
  // Montants
  if (field.includes("montant") || field.includes("prix") || field.includes("remise_valeur") || field.includes("remise_montant") || field === "tva" || field === "css") {
    const num = Number(value);
    if (!isNaN(num)) {
      return new Intl.NumberFormat("fr-FR").format(num) + " XAF";
    }
  }
  
  // Types de remise
  if (field === "remise_type") {
    if (value === "pourcentage") return "Pourcentage";
    if (value === "montant") return "Montant fixe";
    if (value === "none") return "Aucune";
    return String(value);
  }
  
  // Statuts
  if (field === "statut") {
    const statuts: Record<string, string> = {
      brouillon: "Brouillon",
      envoye: "Envoyé",
      accepte: "Accepté",
      refuse: "Refusé",
      converti: "Converti",
      en_cours: "En cours",
      termine: "Terminé",
      facture: "Facturé",
      annule: "Annulé",
      payee: "Payée",
      partiellement_payee: "Partiellement payée",
      impayee: "Impayée",
    };
    return statuts[value] || value;
  }
  
  // Dates
  if (field.includes("date") && typeof value === "string") {
    try {
      return format(new Date(value), "dd/MM/yyyy", { locale: fr });
    } catch {
      return value;
    }
  }
  
  return String(value);
};

// Extraire les changements entre old_values et new_values
const extractChanges = (oldValues: any, newValues: any): FieldChange[] => {
  const changes: FieldChange[] = [];
  
  if (!newValues || typeof newValues !== "object") return changes;
  
  const importantFields = [
    "montant_ht", "montant_ttc", "montant_tva", "montant_css", "tva", "css",
    "remise_valeur", "remise_montant", "remise_type",
    "statut", "date_validite", "date_echeance",
    "navire", "voyage", "port_origine", "port_destination",
    "notes", "observations", "type_operation",
    "montant_paye", "reste_a_payer"
  ];

  const fieldAliases: Record<string, string> = {
    tva: "montant_tva",
    css: "montant_css",
  };
  
  const processedFields = new Set<string>();
  
  for (const field of importantFields) {
    const displayField = fieldAliases[field] || field;
    if (processedFields.has(displayField)) continue;
    
    const oldVal = oldValues?.[field];
    const newVal = newValues?.[field];
    
    if (oldVal !== newVal && !(isEmptyValue(oldVal) && isEmptyValue(newVal))) {
      changes.push({
        field: displayField,
        label: fieldLabels[displayField] || fieldLabels[field] || field,
        oldValue: oldVal,
        newValue: newVal,
      });
      processedFields.add(displayField);
    }
  }
  
  return changes;
};

const isEmptyValue = (val: any): boolean => {
  return val === null || val === undefined || val === "";
};

// Obtenir la configuration d'une action
const getActionConfig = (action: string) => {
  const actionLower = action.toLowerCase();
  for (const [key, config] of Object.entries(ACTION_CONFIGS)) {
    if (actionLower.includes(key)) {
      return config;
    }
  }
  return { icon: Clock, color: "text-muted-foreground", label: action };
};

// Formater la date
const formatDate = (dateStr: string): string => {
  try {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: fr });
  } catch {
    return dateStr;
  }
};

const formatTime = (dateStr: string): string => {
  try {
    return format(new Date(dateStr), "HH:mm", { locale: fr });
  } catch {
    return "";
  }
};

// Composant pour afficher les changements détaillés
function ChangeDetails({ changes }: { changes: FieldChange[] }) {
  const [expanded, setExpanded] = useState(false);
  
  if (!changes || changes.length === 0) return null;
  
  const displayChanges = expanded ? changes : changes.slice(0, 2);
  const hasMore = changes.length > 2;
  
  return (
    <div className="mt-2 space-y-1">
      {displayChanges.map((change, idx) => (
        <div 
          key={idx} 
          className="flex items-start gap-2 text-xs bg-muted/50 rounded-md px-2 py-1.5"
        >
          <span className="font-medium text-foreground min-w-[100px]">
            {change.label}:
          </span>
          <span className="text-destructive line-through">
            {formatValue(change.field, change.oldValue)}
          </span>
          <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
          <span className="text-emerald-600 font-medium">
            {formatValue(change.field, change.newValue)}
          </span>
        </div>
      ))}
      
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs px-2"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Voir moins
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              +{changes.length - 2} autres modifications
            </>
          )}
        </Button>
      )}
    </div>
  );
}

// Composant principal
export function HistoriqueTimeline({ 
  documentId, 
  documentNumero,
  module, 
  createdAt,
  title = "Historique des actions"
}: HistoriqueTimelineProps) {
  const { data: auditData, isLoading, isError } = useQuery({
    queryKey: ["audit-logs", module, documentId],
    queryFn: () => auditService.getAll({
      module,
      search: documentId ? String(documentId) : undefined,
      per_page: 50,
    }),
    enabled: !!documentId,
    retry: 1,
    staleTime: 60000,
  });

  // Construire la timeline
  const events: TimelineEvent[] = (!isError && Array.isArray(auditData?.data))
    ? auditData.data
        .filter(entry => 
          entry.document_id === Number(documentId) || 
          (documentNumero && entry.document_numero === documentNumero) ||
          entry.details?.includes(String(documentId)) ||
          (documentNumero && entry.details?.includes(documentNumero))
        )
        .map(entry => {
          const config = getActionConfig(entry.action);
          const changes = extractChanges(entry.old_values, entry.new_values);
          return {
            id: String(entry.id),
            type: entry.action,
            action: config.label,
            date: entry.created_at,
            time: formatTime(entry.created_at),
            description: entry.details || `${entry.action} effectuée`,
            user: entry.user?.name || entry.user?.nom,
            changes,
            icon: config.icon,
            color: config.color,
          };
        })
    : [];

  // Ajouter événement par défaut si aucun historique
  if (events.length === 0 && createdAt) {
    events.push({
      id: '1',
      type: 'creation',
      action: 'Création',
      date: createdAt,
      time: formatTime(createdAt),
      description: `Document créé`,
      user: undefined,
      icon: FileText,
      color: "text-blue-600",
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {title}
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
                {events.map((event, index) => {
                  const IconComponent = event.icon;
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative flex gap-4 pl-10"
                    >
                      <motion.div
                        className={`absolute left-0 p-2 rounded-full bg-background border-2 ${event.color.replace("text-", "border-")}`}
                        whileHover={{ scale: 1.1 }}
                      >
                        <IconComponent className={`h-4 w-4 ${event.color}`} />
                      </motion.div>
                      <div className="flex-1 bg-muted/30 rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{event.action}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(event.date)}{event.time && ` • ${event.time}`}
                          </span>
                        </div>
                        {event.user && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <User className="h-3 w-3" />
                            <span>{event.user}</span>
                          </div>
                        )}
                        <p className="text-sm">{event.description}</p>
                        
                        {/* Afficher les changements détaillés */}
                        <ChangeDetails changes={event.changes || []} />
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
