import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentFilters, DocumentEmptyState } from "@/components/shared/documents";
import { Zap, Edit, Trash2, Plus, Clock, Mail, CheckCircle, XCircle } from "lucide-react";
import type { EmailAutomation, EmailTemplate } from "@/services/emailService";

const statusFilterOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "actif", label: "Actif" },
  { value: "inactif", label: "Inactif" },
];

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

interface Props {
  automations: EmailAutomation[];
  templates: EmailTemplate[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  onAdd: () => void;
  onEdit: (a: EmailAutomation) => void;
  onDelete: (a: EmailAutomation) => void;
  onToggle: (a: EmailAutomation) => void;
  togglePending: boolean;
  deletePending: boolean;
  getDeclencheurLabel: (k: string) => string;
  getDelaiUniteLabel: (k: string) => string;
}

export function EmailAutomationsList({
  automations, templates, isLoading, searchTerm, onSearchChange,
  statusFilter, onStatusFilterChange, onAdd, onEdit, onDelete, onToggle,
  togglePending, deletePending, getDeclencheurLabel, getDelaiUniteLabel,
}: Props) {
  const getTemplateById = (id: number) => templates.find(t => t.id === id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Automatisation des emails</h2>
          <p className="text-sm text-muted-foreground">Configurez l'envoi automatique des emails selon les événements</p>
        </div>
        <Button onClick={onAdd} className="gap-2 shadow-md"><Plus className="h-4 w-4" />Nouvelle automatisation</Button>
      </div>

      <DocumentFilters
        searchTerm={searchTerm} onSearchChange={onSearchChange} searchPlaceholder="Rechercher une automatisation..."
        statutFilter={statusFilter} onStatutChange={onStatusFilterChange} statutOptions={statusFilterOptions}
      />

      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => (<Card key={i}><CardContent className="p-4"><div className="flex items-center gap-4"><Skeleton className="h-10 w-10 rounded-xl" /><div className="space-y-2 flex-1"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-64" /></div></div></CardContent></Card>))}</div>
      ) : automations.length === 0 ? (
        <DocumentEmptyState icon={Zap} title="Aucune automatisation trouvée" description="Aucune automatisation ne correspond à vos critères de recherche." actionLabel="Nouvelle automatisation" onAction={onAdd} />
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid gap-4">
          {automations.map((automation, index) => {
            const template = getTemplateById(automation.template_id);
            return (
              <motion.div key={automation.id} variants={itemVariants} transition={{ delay: index * 0.05 }}>
                <Card className={`transition-all duration-200 hover:shadow-md ${!automation.actif ? "opacity-60" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary"><Zap className="h-5 w-5" /></div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium">{automation.nom}</h3>
                            {automation.actif ? (
                              <Badge variant="outline" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle className="h-3 w-3 mr-1" />Actif</Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-muted text-muted-foreground"><XCircle className="h-3 w-3 mr-1" />Inactif</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground"><span className="font-medium">Déclencheur:</span> {getDeclencheurLabel(automation.declencheur)}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{automation.delai === 0 ? "Immédiat" : `${automation.delai} ${getDelaiUniteLabel(automation.delai_unite)}`}</span>
                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{template?.nom || automation.template?.nom || "Modèle inconnu"}</span>
                          </div>
                          {automation.conditions && <p className="text-xs text-muted-foreground italic">{automation.conditions}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={automation.actif} onCheckedChange={() => onToggle(automation)} disabled={togglePending} />
                        <Button variant="ghost" size="icon" onClick={() => onEdit(automation)} className="hover:bg-primary/10"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(automation)} className="hover:bg-destructive/10" disabled={deletePending}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
