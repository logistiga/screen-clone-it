import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, User, FileText, Edit, Trash2, CreditCard, RefreshCw, Loader2 } from "lucide-react";
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

const getActionIcon = (action: string) => {
  const actionLower = action.toLowerCase();
  if (actionLower.includes('créé') || actionLower.includes('create') || actionLower.includes('création')) {
    return { icon: FileText, color: "text-blue-600" };
  }
  if (actionLower.includes('modif') || actionLower.includes('update') || actionLower.includes('mise à jour')) {
    return { icon: Edit, color: "text-amber-600" };
  }
  if (actionLower.includes('supprim') || actionLower.includes('delete')) {
    return { icon: Trash2, color: "text-red-600" };
  }
  if (actionLower.includes('paie') || actionLower.includes('payment')) {
    return { icon: CreditCard, color: "text-green-600" };
  }
  if (actionLower.includes('convert') || actionLower.includes('factur')) {
    return { icon: RefreshCw, color: "text-purple-600" };
  }
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
    ...getActionIcon(entry.action),
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
