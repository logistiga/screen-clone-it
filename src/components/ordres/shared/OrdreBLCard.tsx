import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Anchor, Hash, Ship, Calendar } from "lucide-react";
import { formatDate } from "@/data/mockData";

interface OrdreBLCardProps {
  blNumero: string | null | undefined;
  navire?: string | null;
  dateArrivee?: string | null;
}

export function OrdreBLCard({ blNumero, navire, dateArrivee }: OrdreBLCardProps) {
  if (!blNumero) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-500/5 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <Anchor className="h-5 w-5 text-blue-600" />
            Informations BL
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Hash className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Numéro BL</span>
                <p className="font-mono font-medium">{blNumero}</p>
              </div>
            </div>
            {navire && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Ship className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Navire</span>
                  <p className="font-medium">{navire}</p>
                </div>
              </div>
            )}
            {dateArrivee && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Date d'arrivée</span>
                  <p className="font-medium">{formatDate(dateArrivee)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
