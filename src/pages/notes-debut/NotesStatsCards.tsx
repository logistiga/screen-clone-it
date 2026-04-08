import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Anchor, Container, Wrench, PackageOpen, FileText, Calculator } from "lucide-react";
import { formatMontant } from "@/data/mockData";
import { DocumentStatCard } from "@/components/shared/documents";
import { getNoteAmount } from "./useNotesDebutData";

const typeIcons: Record<string, any> = {
  ouverture_port: Anchor,
  detention: Container,
  reparation: Wrench,
  relache: PackageOpen,
};

const typeLabels: Record<string, string> = {
  ouverture_port: "Ouverture de port",
  detention: "Détention",
  reparation: "Réparation conteneur",
  relache: "Relâche",
};

const typeColors: Record<string, string> = {
  ouverture_port: "bg-primary/10 text-primary border-primary/20",
  detention: "bg-warning/10 text-warning border-warning/20",
  reparation: "bg-success/10 text-success border-success/20",
  relache: "bg-accent text-accent-foreground border-accent",
};

interface NotesStatsCardsProps {
  notes: any[];
  totalNotes: number;
  totalMontant: number;
  meta: { current_page: number; last_page: number };
  pageSize: number;
}

export function NotesStatsCards({ notes, totalNotes, totalMontant, meta, pageSize }: NotesStatsCardsProps) {
  return (
    <>
      {/* Récap par type */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['ouverture_port', 'detention', 'reparation', 'relache'] as const).map((type, i) => {
          const TypeIcon = typeIcons[type] || FileText;
          const label = typeLabels[type] || type;
          const color = typeColors[type] || '';
          const typeNotes = notes.filter((n: any) => {
            const t = (n.type || '').toLowerCase().replace(/\s+/g, '_');
            return t === type || t === type.replace('_', ' ');
          });
          const somme = typeNotes.reduce((acc: number, n: any) => acc + getNoteAmount(n), 0);
          return (
            <motion.div key={type} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${color}`}><TypeIcon className="h-5 w-5" /></div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{label}</p>
                      <p className="text-lg font-bold text-foreground">{formatMontant(somme)}</p>
                      <p className="text-xs text-muted-foreground">{typeNotes.length} note{typeNotes.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Stats générales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DocumentStatCard title="Total notes" value={totalNotes} icon={FileText} subtitle="notes" delay={0} />
        <DocumentStatCard title="Montant total" value={formatMontant(totalMontant)} icon={Calculator} subtitle="FCFA" variant="primary" delay={0.1} />
        <DocumentStatCard title="Page actuelle" value={`${meta.current_page}/${meta.last_page}`} icon={FileText} subtitle={`${notes.length} affichées`} delay={0.2} />
        <DocumentStatCard title="Par page" value={pageSize} icon={FileText} subtitle="documents" delay={0.3} />
      </div>
    </>
  );
}
