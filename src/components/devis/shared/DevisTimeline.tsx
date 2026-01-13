import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Clock, FileText, Edit, Mail, Check, ArrowRight, 
  Ban, Send, Eye
} from "lucide-react";
import { formatDate } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  type: 'creation' | 'modification' | 'envoi' | 'validation' | 'refus' | 'conversion' | 'consultation';
  date: string;
  description?: string;
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

export function DevisTimeline({ devis }: DevisTimelineProps) {
  // Construire la timeline à partir des données du devis
  const events: TimelineEvent[] = [
    {
      id: '1',
      type: 'creation',
      date: devis.created_at,
      description: `Devis ${devis.numero} créé`,
    },
  ];

  // Ajouter la modification si différente de la création
  if (devis.updated_at !== devis.created_at) {
    events.push({
      id: '2',
      type: 'modification',
      date: devis.updated_at,
      description: 'Dernière modification',
    });
  }

  // Ajouter le statut actuel
  if (devis.statut === 'envoye') {
    events.push({
      id: '3',
      type: 'envoi',
      date: devis.updated_at,
      description: 'Devis envoyé au client',
    });
  }

  if (devis.statut === 'accepte') {
    events.push({
      id: '4',
      type: 'validation',
      date: devis.updated_at,
      description: 'Devis accepté par le client',
    });
  }

  if (devis.statut === 'refuse') {
    events.push({
      id: '5',
      type: 'refus',
      date: devis.updated_at,
      description: 'Devis refusé',
    });
  }

  if (devis.statut === 'converti') {
    events.push({
      id: '6',
      type: 'conversion',
      date: devis.updated_at,
      description: 'Converti en ordre de travail',
    });
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
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{config.label}</p>
                      <time className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(event.date)}
                      </time>
                    </div>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
