import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, User, FileText } from "lucide-react";
import { formatDate } from "@/data/mockData";

interface HistoriqueAction {
  id: string;
  action: string;
  utilisateur: string;
  date: string;
  details: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface OrdreHistoriqueProps {
  ordre: {
    created_at?: string;
    date?: string;
  };
}

export function OrdreHistorique({ ordre }: OrdreHistoriqueProps) {
  const tracabilite: HistoriqueAction[] = [
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
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 to-transparent" />
            <div className="space-y-6">
              {tracabilite.map((action, index) => {
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
        </CardContent>
      </Card>
    </motion.div>
  );
}
