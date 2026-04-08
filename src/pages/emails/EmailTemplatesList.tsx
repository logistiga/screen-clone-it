import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { DocumentFilters, DocumentEmptyState } from "@/components/shared/documents";
import { Mail, FileText, Eye, Edit, Copy, Trash2, Plus, XCircle, Loader2 } from "lucide-react";
import type { EmailTemplate } from "@/services/emailService";

const typeLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  devis: { label: "Devis", icon: <FileText className="h-4 w-4" />, color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  ordre: { label: "Ordre de travail", icon: <FileText className="h-4 w-4" />, color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  facture: { label: "Facture", icon: <FileText className="h-4 w-4" />, color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  relance: { label: "Relance", icon: <FileText className="h-4 w-4" />, color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  confirmation: { label: "Confirmation", icon: <FileText className="h-4 w-4" />, color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  notification: { label: "Notification", icon: <FileText className="h-4 w-4" />, color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400" },
  custom: { label: "Personnalisé", icon: <FileText className="h-4 w-4" />, color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" },
};

const typeFilterOptions = [
  { value: "all", label: "Tous les types" },
  { value: "devis", label: "Devis" },
  { value: "ordre", label: "Ordre de travail" },
  { value: "facture", label: "Facture" },
  { value: "relance", label: "Relance" },
  { value: "confirmation", label: "Confirmation" },
  { value: "notification", label: "Notification" },
  { value: "custom", label: "Personnalisé" },
];

const statusFilterOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "actif", label: "Actif" },
  { value: "inactif", label: "Inactif" },
];

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

interface Props {
  templates: EmailTemplate[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (v: string) => void;
  typeFilter: string;
  onTypeFilterChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  onAdd: () => void;
  onEdit: (t: EmailTemplate) => void;
  onPreview: (t: EmailTemplate) => void;
  onDuplicate: (t: EmailTemplate) => void;
  onDelete: (t: EmailTemplate) => void;
  onToggle: (t: EmailTemplate) => void;
  togglePending: boolean;
  previewPending: boolean;
  duplicatePending: boolean;
  deletePending: boolean;
  selectedTemplateId?: number;
}

export function EmailTemplatesList({
  templates, isLoading, searchTerm, onSearchChange, typeFilter, onTypeFilterChange,
  statusFilter, onStatusFilterChange, onAdd, onEdit, onPreview, onDuplicate, onDelete, onToggle,
  togglePending, previewPending, duplicatePending, deletePending, selectedTemplateId,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Modèles d'emails</h2>
          <p className="text-sm text-muted-foreground">Gérez vos modèles d'emails pour chaque type de document</p>
        </div>
        <Button onClick={onAdd} className="gap-2 shadow-md"><Plus className="h-4 w-4" />Nouveau modèle</Button>
      </div>

      <DocumentFilters
        searchTerm={searchTerm} onSearchChange={onSearchChange} searchPlaceholder="Rechercher un modèle..."
        statutFilter={statusFilter} onStatutChange={onStatusFilterChange} statutOptions={statusFilterOptions}
        categorieFilter={typeFilter} onCategorieChange={onTypeFilterChange} categorieOptions={typeFilterOptions}
      />

      {isLoading ? (
        <div className="space-y-4">{[1, 2, 3].map(i => (<Card key={i}><CardContent className="p-4"><div className="flex items-center gap-4"><Skeleton className="h-10 w-10 rounded-xl" /><div className="space-y-2 flex-1"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-64" /></div></div></CardContent></Card>))}</div>
      ) : templates.length === 0 ? (
        <DocumentEmptyState icon={Mail} title="Aucun modèle trouvé" description="Aucun modèle d'email ne correspond à vos critères de recherche." actionLabel="Nouveau modèle" onAction={onAdd} />
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid gap-4">
          {templates.map((template, index) => (
            <motion.div key={template.id} variants={itemVariants} transition={{ delay: index * 0.05 }}>
              <Card className={`transition-all duration-200 hover:shadow-md ${!template.actif ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-xl ${typeLabels[template.type]?.color || typeLabels.custom.color}`}>
                        {typeLabels[template.type]?.icon || typeLabels.custom.icon}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium">{template.nom}</h3>
                          <Badge variant="outline" className={typeLabels[template.type]?.color || typeLabels.custom.color}>
                            {typeLabels[template.type]?.label || "Personnalisé"}
                          </Badge>
                          {!template.actif && <Badge variant="secondary" className="bg-muted text-muted-foreground"><XCircle className="h-3 w-3 mr-1" />Inactif</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">{template.objet}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(template.variables || []).slice(0, 4).map(v => <Badge key={v} variant="outline" className="text-xs bg-muted/50">{`{{${v}}}`}</Badge>)}
                          {(template.variables || []).length > 4 && <Badge variant="outline" className="text-xs bg-muted/50">+{template.variables.length - 4} autres</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={template.actif} onCheckedChange={() => onToggle(template)} disabled={togglePending} />
                      <Button variant="ghost" size="icon" onClick={() => onPreview(template)} className="hover:bg-primary/10" disabled={previewPending}>
                        {previewPending && selectedTemplateId === template.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onEdit(template)} className="hover:bg-primary/10"><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => onDuplicate(template)} className="hover:bg-primary/10" disabled={duplicatePending}><Copy className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(template)} className="hover:bg-destructive/10" disabled={deletePending}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
