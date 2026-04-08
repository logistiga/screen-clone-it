import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AnimatedTableRow, AnimatedTableBody } from "@/components/ui/animated-table";
import { Eye, Edit, Download, Mail, CreditCard, Trash2, FileText, Anchor, Container, Wrench, PackageOpen } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { formatMontant, formatDate } from "@/data/mockData";
import { NoteDebut } from "@/lib/api/notes-debut";
import { getNoteAmount, getNotePaid, getNoteAdvance, getNoteRemaining, getNoteStatus, getNoteType } from "./useNotesDebutData";

const typeIcons: Record<string, any> = {
  ouverture_port: Anchor, "Ouverture Port": Anchor,
  detention: Container, Detention: Container,
  reparation: Wrench, Reparation: Wrench,
  relache: PackageOpen, Relache: PackageOpen,
};

interface NotesTableProps {
  notes: NoteDebut[];
  tableRenderKey: string;
  selectedIds: string[];
  isAllSelected: boolean;
  hasFilters: boolean;
  onSelectAll: () => void;
  onSelectOne: (id: string) => void;
  onClearFilters: () => void;
  onEmail: (note: NoteDebut) => void;
  onPaiement: (note: NoteDebut) => void;
  onDelete: (note: NoteDebut) => void;
}

export function NotesTable({
  notes, tableRenderKey, selectedIds, isAllSelected, hasFilters,
  onSelectAll, onSelectOne, onClearFilters, onEmail, onPaiement, onDelete,
}: NotesTableProps) {
  const navigate = useNavigate();

  return (
    <Card className="border-border/50 overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/50">
                <TableHead className="w-12"><Checkbox checked={isAllSelected} onCheckedChange={onSelectAll} /></TableHead>
                <TableHead>Numéro</TableHead><TableHead>Client</TableHead><TableHead>Type</TableHead>
                <TableHead>Conteneur</TableHead><TableHead>Période</TableHead><TableHead className="text-center">Jours</TableHead>
                <TableHead className="text-right">Montant</TableHead><TableHead className="text-right">Payé</TableHead>
                <TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <AnimatedTableBody key={tableRenderKey}>
              {notes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 opacity-50" />
                      <p>Aucune note trouvée</p>
                      {hasFilters && <Button variant="link" onClick={onClearFilters} className="text-primary">Réinitialiser les filtres</Button>}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                notes.map((note, index) => {
                  const typeInfo = getNoteType(note);
                  const TypeIcon = typeIcons[note.type] || FileText;
                  const status = getNoteStatus(note);
                  const isSelected = selectedIds.includes(note.id);
                  const remaining = getNoteRemaining(note);
                  const paid = getNotePaid(note);
                  const advance = getNoteAdvance(note);

                  return (
                    <AnimatedTableRow key={note.id} index={index}
                      className={`group hover:bg-muted/50 cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : ""}`}
                      onClick={() => navigate(`/notes-debut/${note.id}`)}>
                      <TableCell onClick={(e) => e.stopPropagation()}><Checkbox checked={isSelected} onCheckedChange={() => onSelectOne(note.id)} /></TableCell>
                      <TableCell className="font-medium font-mono">{note.numero}</TableCell>
                      <TableCell>{note.client?.nom || '-'}</TableCell>
                      <TableCell><Badge className={`${typeInfo.color} border`}><TypeIcon className="h-3 w-3 mr-1" />{typeInfo.label}</Badge></TableCell>
                      <TableCell className="font-mono text-sm">{note.conteneur_numero || '-'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {note.date_debut || note.date_debut_stockage ? (
                          <>{formatDate(note.date_debut || note.date_debut_stockage)}{(note.date_fin || note.date_fin_stockage) && <> → {formatDate(note.date_fin || note.date_fin_stockage)}</>}</>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-center font-semibold">{note.nombre_jours || note.jours_stockage || '-'}</TableCell>
                      <TableCell className="text-right font-semibold">{formatMontant(getNoteAmount(note))}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          {paid > 0 && <span className="text-green-600 text-sm">{formatMontant(paid)}</span>}
                          {advance > 0 && <span className="text-cyan-600 text-xs">+{formatMontant(advance)} avance</span>}
                          {remaining > 0 && <span className="text-muted-foreground text-xs">Reste: {formatMontant(remaining)}</span>}
                        </div>
                      </TableCell>
                      <TableCell><Badge className={status.class}>{status.label}</Badge></TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Voir" onClick={() => navigate(`/notes-debut/${note.id}`)}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Modifier" onClick={() => navigate(`/notes-debut/${note.id}/modifier`)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="PDF" onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              toast.info(`Génération du PDF ${note.numero}...`);
                              const response = await api.get(`/notes-debit/${note.id}/pdf`, { responseType: 'blob' });
                              const ct = response.headers['content-type'] || '';
                              if (ct.includes('application/json') || (response.data as Blob)?.size < 500) {
                                const text = await (response.data as Blob).text();
                                try { const d = JSON.parse(text); toast.error(d.error || d.message || "Erreur PDF"); } catch { toast.error("Erreur serveur"); }
                                return;
                              }
                              const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
                              const a = document.createElement('a'); a.href = url; a.download = `Note_${note.numero}.pdf`;
                              document.body.appendChild(a); a.click(); document.body.removeChild(a);
                              window.URL.revokeObjectURL(url);
                              toast.success("PDF téléchargé");
                            } catch (err: any) { toast.error(err.response?.data?.message || "Erreur téléchargement PDF"); }
                          }}><Download className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Email" onClick={() => onEmail(note)}><Mail className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon"
                            className={`h-8 w-8 ${remaining > 0 ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : ''}`}
                            title={remaining > 0 ? "Enregistrer un paiement" : "Entièrement payé"}
                            disabled={remaining <= 0} onClick={() => onPaiement(note)}><CreditCard className="h-4 w-4" /></Button>
                          {paid === 0 && advance === 0 && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Supprimer" onClick={() => onDelete(note)}><Trash2 className="h-4 w-4" /></Button>
                          )}
                        </div>
                      </TableCell>
                    </AnimatedTableRow>
                  );
                })
              )}
            </AnimatedTableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
