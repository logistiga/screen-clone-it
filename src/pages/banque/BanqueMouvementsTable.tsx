import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle, ArrowDownCircle, Building2, CreditCard, Eye, Trash2 } from "lucide-react";
import { formatMontant, formatDate } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface BanqueMouvementsTableProps {
  mouvements: any[];
  hasFilters: boolean;
  onClearFilters: () => void;
  onViewDocument: (m: any) => void;
  onDeleteMouvement: (m: any) => void;
}

export function BanqueMouvementsTable({ mouvements, hasFilters, onClearFilters, onViewDocument, onDeleteMouvement }: BanqueMouvementsTableProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" />Mouvements bancaires</span>
          <Badge variant="secondary">{mouvements.length} mouvement{mouvements.length > 1 ? 's' : ''}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[100px]">Date</TableHead>
                <TableHead className="w-[120px]">Type</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Tiers</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Banque</TableHead>
                <TableHead>Référence</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mouvements.map((mouvement, index) => (
                <TableRow key={mouvement.id} className="transition-all duration-200 animate-fade-in hover:bg-muted/50" style={{ animationDelay: `${index * 20}ms` }}>
                  <TableCell className="font-medium">{formatDate(mouvement.date)}</TableCell>
                  <TableCell>
                    {mouvement.type === 'entree' ? (
                      <Badge className="gap-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 hover:bg-green-100"><ArrowDownCircle className="h-3 w-3" />Encaissement</Badge>
                    ) : (
                      <Badge className="gap-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 hover:bg-red-100"><ArrowUpCircle className="h-3 w-3" />Décaissement</Badge>
                    )}
                  </TableCell>
                  <TableCell><Badge variant="secondary">{mouvement.categorie}</Badge></TableCell>
                  <TableCell>{mouvement.tiers || <span className="text-muted-foreground">-</span>}</TableCell>
                  <TableCell className="max-w-[200px]">
                    {mouvement.description ? (
                      mouvement.document_type ? (
                        <span className="text-primary hover:underline cursor-pointer font-medium truncate block" onClick={() => onViewDocument(mouvement)}>{mouvement.description}</span>
                      ) : (<span className="truncate block">{mouvement.description}</span>)
                    ) : (<span className="text-muted-foreground">-</span>)}
                  </TableCell>
                  <TableCell>
                    {mouvement.banque ? (
                      <Badge variant="outline" className="gap-1"><Building2 className="h-3 w-3" />{mouvement.banque.nom}</Badge>
                    ) : (<span className="text-muted-foreground">-</span>)}
                  </TableCell>
                  <TableCell>
                    {mouvement.reference ? (<code className="text-xs bg-muted px-2 py-1 rounded">{mouvement.reference}</code>) : (<span className="text-muted-foreground">-</span>)}
                  </TableCell>
                  <TableCell className={cn("text-right font-bold", mouvement.type === 'entree' ? "text-green-600" : "text-red-600")}>
                    {mouvement.type === 'entree' ? '+' : '-'}{formatMontant(mouvement.montant)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {mouvement.document_type && (
                        <Button variant="ghost" size="icon" onClick={() => onViewDocument(mouvement)} className="transition-all duration-200 hover:scale-110 hover:bg-primary/10" title="Voir le document"><Eye className="h-4 w-4" /></Button>
                      )}
                      {mouvement.source_type === 'mouvement' && (
                        <Button variant="ghost" size="icon" onClick={() => onDeleteMouvement(mouvement)} className="transition-all duration-200 hover:scale-110 hover:bg-destructive/10 text-destructive" title="Supprimer"><Trash2 className="h-4 w-4" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {mouvements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <CreditCard className="h-8 w-8 opacity-50" /><p>Aucun mouvement bancaire trouvé</p>
                      {hasFilters && (<Button variant="link" onClick={onClearFilters} className="text-primary">Réinitialiser les filtres</Button>)}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
