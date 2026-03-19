import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { Prevision } from "@/lib/api/previsions";
import { CheckCircle2, XCircle, AlertTriangle, Clock, TrendingUp } from "lucide-react";

interface PrevisionsListeTabProps {
  previsions: Prevision[];
  moisNom: string;
  annee: number;
  onDelete: (id: number) => void;
  onAdd: () => void;
  formatMontantFull: (montant: number) => string;
}

const getStatutBadge = (statut: string) => {
  switch (statut) {
    case 'en_cours': return <Badge variant="outline" className="border-primary text-primary"><Clock className="h-3 w-3 mr-1" />En cours</Badge>;
    case 'atteint': return <Badge className="bg-success text-success-foreground"><CheckCircle2 className="h-3 w-3 mr-1" />Atteint</Badge>;
    case 'depasse': return <Badge className="bg-info text-info-foreground"><TrendingUp className="h-3 w-3 mr-1" />Dépassé</Badge>;
    case 'non_atteint': return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Non atteint</Badge>;
    default: return <Badge variant="outline">{statut}</Badge>;
  }
};

const getTauxColor = (taux: number, isDepense = false) => {
  if (isDepense) {
    if (taux > 100) return 'text-destructive';
    if (taux >= 80) return 'text-warning';
    return 'text-success';
  }
  if (taux >= 100) return 'text-success';
  if (taux >= 50) return 'text-warning';
  return 'text-destructive';
};

export function PrevisionsListeTab({ previsions, moisNom, annee, onDelete, onAdd, formatMontantFull }: PrevisionsListeTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Prévisions de {moisNom} {annee}</CardTitle>
      </CardHeader>
      <CardContent>
        {previsions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Aucune prévision pour ce mois.</p>
            <Button variant="link" onClick={onAdd}>Ajouter une prévision</Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="text-right">Prévu</TableHead>
                <TableHead className="text-right">Réalisé</TableHead>
                <TableHead className="text-right">Taux</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previsions.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    {p.type === 'recette' ? (
                      <Badge className="bg-success/20 text-success border-0">Recette</Badge>
                    ) : (
                      <Badge className="bg-destructive/20 text-destructive border-0">Dépense</Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{p.categorie}</TableCell>
                  <TableCell className="text-right">{formatMontantFull(p.montant_prevu)}</TableCell>
                  <TableCell className="text-right">{formatMontantFull(p.montant_realise)}</TableCell>
                  <TableCell className={`text-right font-bold ${getTauxColor(p.taux_realisation, p.type === 'depense')}`}>
                    {p.taux_realisation}%
                  </TableCell>
                  <TableCell>{getStatutBadge(p.statut)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => onDelete(p.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
