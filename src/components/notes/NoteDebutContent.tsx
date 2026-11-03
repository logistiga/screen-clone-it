import { Calendar, Clock, CreditCard, FileText, Receipt, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { NoteDebut } from "@/lib/api/notes-debut";
import type { Paiement } from "@/lib/api/commercial/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { NoteDebutLines } from "./NoteDebutLines";

interface Props {
  note: NoteDebut;
  typeInfo: { label: string; color: string; icon: LucideIcon };
  clientName: string;
  montantTotal: number;
  montantPaye: number;
  montantAvance: number;
  remaining: number;
  paiements: Paiement[];
  formatCurrency: (value: number | undefined) => string;
  formatDate: (value: string | undefined) => string;
  onPayment: () => void;
}
export function NoteDebutContent({ note, typeInfo, clientName, montantTotal, montantPaye, montantAvance, remaining, paiements, formatCurrency, formatDate, onPayment }: Props) {
  const TypeIcon = typeInfo.icon;
  return <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations principales */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informations de la note
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                <Badge className={`${typeInfo.color} border text-base px-4 py-2`}>
                  <TypeIcon className="h-5 w-5 mr-2" />
                  {typeInfo.label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-4 w-4" /> Client
                  </p>
                  <p className="font-medium">{clientName}</p>
                </div>
                {note.conteneur_numero && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">N° Conteneur</p>
                    <p className="font-mono font-medium">{note.conteneur_numero}</p>
                  </div>
                )}
                {note.bl_numero && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">N° BL</p>
                    <p className="font-medium">{note.bl_numero}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(note.date_debut || note.date_debut_stockage) && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> Date début
                    </p>
                    <p className="font-medium">{formatDate(note.date_debut || note.date_debut_stockage)}</p>
                  </div>
                )}
                {(note.date_fin || note.date_fin_stockage) && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> Date fin
                    </p>
                    <p className="font-medium">{formatDate(note.date_fin || note.date_fin_stockage)}</p>
                  </div>
                )}
                {(note.nombre_jours || note.jours_stockage) && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" /> Nombre de jours
                    </p>
                    <p className="font-bold text-xl">{note.nombre_jours || note.jours_stockage}</p>
                  </div>
                )}
                {note.tarif_journalier && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Tarif journalier</p>
                    <p className="font-medium">{formatCurrency(note.tarif_journalier)} FCFA</p>
                  </div>
                )}
              </div>

              {(note.description || note.observations || note.notes) && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="whitespace-pre-wrap break-words">{note.description || note.observations || note.notes}</p>
                  </div>
                </>
              )}

              <NoteDebutLines note={note} />

              {note.navire && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Navire</p>
                    <p className="font-medium">{note.navire}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Résumé financier */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Résumé financier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Montant total</span>
                  <span className="font-bold text-xl">{formatCurrency(montantTotal)} FCFA</span>
                </div>
                <Separator />
                {montantAvance > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Avance</span>
                    <span className="text-cyan-600 font-medium">
                      -{formatCurrency(montantAvance)} FCFA
                    </span>
                  </div>
                )}
                {montantPaye > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Payé</span>
                    <span className="text-success font-medium">
                      -{formatCurrency(montantPaye)} FCFA
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-medium">Reste à payer</span>
                  <span className={`font-bold text-xl ${remaining > 0 ? "text-destructive" : "text-success"}`}>
                    {formatCurrency(remaining)} FCFA
                  </span>
                </div>
              </div>

              {remaining > 0 && (
                <Button className="w-full" onClick={() => onPayment()}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Enregistrer un paiement
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Historique des paiements */}
        {paiements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Historique des paiements</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paiements.map((paiement) => (
                    <TableRow key={paiement.id}>
                      <TableCell>{formatDate(paiement.date || paiement.date_paiement)}</TableCell>
                      <TableCell>{paiement.mode_paiement}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {paiement.reference || paiement.numero_cheque || "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium text-success">
                        {formatCurrency(paiement.montant)} FCFA
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
  </>;
}
