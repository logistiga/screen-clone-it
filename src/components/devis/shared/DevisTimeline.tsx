import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Clock, FileText, Edit, Mail, Check, ArrowRight, 
  Ban, Send, Eye, User, Loader2, ChevronDown, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { auditService } from "@/services/auditService";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface TimelineEvent {
  id: string;
  type: 'creation' | 'modification' | 'envoi' | 'validation' | 'refus' | 'conversion' | 'consultation';
  date: string;
  time: string;
  description?: string;
  user?: string;
  changes?: FieldChange[];
}

interface FieldChange {
  field: string;
  label: string;
  oldValue: any;
  newValue: any;
}

interface DevisTimelineProps {
  devis: any;
}

const eventConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string; label: string }> = {
  creation: {
    icon: <FileText className="h-4 w-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    label: "Création du devis",
  },
  modification: {
    icon: <Edit className="h-4 w-4" />,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    label: "Modification",
  },
  envoi: {
    icon: <Send className="h-4 w-4" />,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    label: "Envoi au client",
  },
  validation: {
    icon: <Check className="h-4 w-4" />,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
    label: "Validation",
  },
  refus: {
    icon: <Ban className="h-4 w-4" />,
    color: "text-red-600",
    bgColor: "bg-red-100",
    label: "Refus",
  },
  conversion: {
    icon: <ArrowRight className="h-4 w-4" />,
    color: "text-primary",
    bgColor: "bg-primary/10",
    label: "Conversion en ordre",
  },
  consultation: {
    icon: <Eye className="h-4 w-4" />,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
    label: "Consultation",
  },
};

// Labels lisibles pour les champs
const fieldLabels: Record<string, string> = {
  montant_ht: "Montant HT",
  montant_ttc: "Montant TTC",
  montant_tva: "TVA",
  montant_css: "CSS",
  remise_valeur: "Remise (valeur)",
  remise_montant: "Montant remise",
  remise_type: "Type de remise",
  statut: "Statut",
  date_validite: "Date de validité",
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
};

// Formater une valeur pour l'affichage
const formatValue = (field: string, value: any): string => {
  if (value === null || value === undefined || value === "") return "—";
  
  // Montants
  if (field.includes("montant") || field.includes("prix") || field.includes("remise_valeur") || field.includes("remise_montant")) {
    const num = Number(value);
    if (!isNaN(num)) {
      return new Intl.NumberFormat("fr-FR").format(num) + " XAF";
    }
  }
  
  // Pourcentages
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
  
  // Champs importants à surveiller
  const importantFields = [
    "montant_ht", "montant_ttc", "montant_tva", "montant_css",
    "remise_valeur", "remise_montant", "remise_type",
    "statut", "date_validite",
    "navire", "voyage", "port_origine", "port_destination",
    "notes", "observations", "type_operation"
  ];
  
  for (const field of importantFields) {
    const oldVal = oldValues?.[field];
    const newVal = newValues?.[field];
    
    // Comparer les valeurs (ignorer si les deux sont vides)
    if (oldVal !== newVal && !(isEmpty(oldVal) && isEmpty(newVal))) {
      changes.push({
        field,
        label: fieldLabels[field] || field,
        oldValue: oldVal,
        newValue: newVal,
      });
    }
  }
  
  return changes;
};

const isEmpty = (val: any): boolean => {
  return val === null || val === undefined || val === "" || val === 0;
};

// Mapper l'action d'audit vers le type d'événement
const mapActionToEventType = (action: string): TimelineEvent['type'] => {
  const actionLower = action.toLowerCase();
  if (actionLower.includes('create') || actionLower.includes('créé')) return 'creation';
  if (actionLower.includes('update') || actionLower.includes('modif') || actionLower.includes('edit')) return 'modification';
  if (actionLower.includes('envoi') || actionLower.includes('send') || actionLower.includes('email')) return 'envoi';
  if (actionLower.includes('valid') || actionLower.includes('accept') || actionLower.includes('approv')) return 'validation';
  if (actionLower.includes('refus') || actionLower.includes('reject')) return 'refus';
  if (actionLower.includes('convert') || actionLower.includes('ordre')) return 'conversion';
  if (actionLower.includes('view') || actionLower.includes('consult')) return 'consultation';
  return 'modification';
};

// Formater la date
const formatDate = (dateStr: string): string => {
  try {
    return format(new Date(dateStr), "dd/MM/yyyy", { locale: fr });
  } catch {
    return dateStr;
  }
};

// Formater l'heure
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

export function DevisTimeline({ devis }: DevisTimelineProps) {
  // Récupérer l'historique depuis l'API d'audit
  const { data: auditData, isLoading, isError } = useQuery({
    queryKey: ["audit-logs", "devis", devis.id],
    queryFn: () => auditService.getAll({
      module: "devis",
      search: devis.id ? String(devis.id) : undefined,
      per_page: 50,
    }),
    enabled: !!devis.id,
    retry: 1,
    staleTime: 60000,
  });

  // Construire la timeline à partir des données d'audit
  const events: TimelineEvent[] = (!isError && Array.isArray(auditData?.data))
    ? auditData.data
        .filter(entry => 
          entry.document_id === Number(devis.id) || 
          entry.document_numero === devis.numero ||
          entry.details?.includes(String(devis.id)) ||
          entry.details?.includes(devis.numero)
        )
        .map(entry => {
          const changes = extractChanges(entry.old_values, entry.new_values);
          return {
            id: String(entry.id),
            type: mapActionToEventType(entry.action),
            date: entry.created_at,
            time: formatTime(entry.created_at),
            description: entry.details || `${entry.action} effectuée`,
            user: entry.user?.name || entry.user?.nom,
            changes,
          };
        })
    : [];

  // Si aucune donnée d'audit, construire une timeline par défaut
  if (events.length === 0) {
    events.push({
      id: '1',
      type: 'creation',
      date: devis.created_at,
      time: formatTime(devis.created_at),
      description: `Devis ${devis.numero} créé`,
      user: undefined,
    });

    // Ajouter la modification si différente de la création
    if (devis.updated_at !== devis.created_at) {
      events.push({
        id: '2',
        type: 'modification',
        date: devis.updated_at,
        time: formatTime(devis.updated_at),
        description: 'Dernière modification',
        user: undefined,
      });
    }

    // Ajouter le statut actuel
    if (devis.statut === 'envoye') {
      events.push({
        id: '3',
        type: 'envoi',
        date: devis.updated_at,
        time: formatTime(devis.updated_at),
        description: 'Devis envoyé au client',
        user: undefined,
      });
    }

    if (devis.statut === 'accepte') {
      events.push({
        id: '4',
        type: 'validation',
        date: devis.updated_at,
        time: formatTime(devis.updated_at),
        description: 'Devis accepté par le client',
        user: undefined,
      });
    }

    if (devis.statut === 'refuse') {
      events.push({
        id: '5',
        type: 'refus',
        date: devis.updated_at,
        time: formatTime(devis.updated_at),
        description: 'Devis refusé',
        user: undefined,
      });
    }

    if (devis.statut === 'converti') {
      events.push({
        id: '6',
        type: 'conversion',
        date: devis.updated_at,
        time: formatTime(devis.updated_at),
        description: 'Converti en ordre de travail',
        user: undefined,
      });
    }
  }

  // Trier par date décroissante
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Historique des actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Chargement...</span>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[17px] top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-4">
              {events.map((event, index) => {
                const config = eventConfig[event.type];
                return (
                  <div 
                    key={event.id} 
                    className={cn(
                      "relative flex items-start gap-4 pl-10",
                      "animate-fade-in"
                    )}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Icon */}
                    <div className={cn(
                      "absolute left-0 p-2 rounded-full border-2 border-background",
                      config.bgColor
                    )}>
                      <div className={config.color}>
                        {config.icon}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-4">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="font-medium">{config.label}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatDate(event.date)}</span>
                          {event.time && (
                            <>
                              <span>•</span>
                              <span className="font-mono">{event.time}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Utilisateur */}
                      {event.user && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                          <User className="h-3 w-3" />
                          <span>{event.user}</span>
                        </div>
                      )}
                      
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {event.description}
                        </p>
                      )}
                      
                      {/* Changements détaillés */}
                      {event.changes && event.changes.length > 0 && (
                        <ChangeDetails changes={event.changes} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
