import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Package, Clock, CheckCircle2, FileText, Ship, PlusCircle, Link as LinkIcon, XCircle, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ConteneurTraite, getAdresseLivraisonLabel } from "@/lib/api/conteneurs-traites";

interface Props {
  conteneurs: ConteneurTraite[];
  navigate: (path: string) => void;
  handleCreerOrdre: (c: ConteneurTraite) => void;
  handleAffecterClick: (c: ConteneurTraite) => void;
  ignorerMutate: (id: number) => void;
}

const getStatutBadge = (statut: string) => {
  const configs: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    en_attente: { label: "En attente", icon: <Clock className="h-3 w-3" />, className: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200" },
    affecte: { label: "Affecté", icon: <LinkIcon className="h-3 w-3" />, className: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200" },
    facture: { label: "Facturé", icon: <CheckCircle2 className="h-3 w-3" />, className: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200" },
    ignore: { label: "Ignoré", icon: <XCircle className="h-3 w-3" />, className: "bg-muted text-muted-foreground" },
  };
  const config = configs[statut] || { label: statut, icon: null, className: "bg-muted" };
  return <Badge variant="outline" className={`${config.className} flex items-center gap-1`}>{config.icon}{config.label}</Badge>;
};

export function ConteneursTable({ conteneurs, navigate, handleCreerOrdre, handleAffecterClick, ignorerMutate }: Props) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
      <CardHeader className="bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5" />Liste des conteneurs<Badge variant="secondary" className="ml-2">{conteneurs.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {conteneurs.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium">Aucun résultat</p>
            <p className="text-muted-foreground">Modifiez vos filtres pour voir plus de conteneurs</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Conteneur</TableHead><TableHead>Type</TableHead><TableHead>N° BL</TableHead>
                  <TableHead>Client</TableHead><TableHead>Adresse</TableHead><TableHead>Transitaire</TableHead>
                  <TableHead>Statut</TableHead><TableHead className="w-48">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conteneurs.map((conteneur) => (
                  <TableRow key={conteneur.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium font-mono">{conteneur.numero_conteneur}</TableCell>
                    <TableCell>{conteneur.type_conteneur ? <Badge variant="outline" className="text-xs font-normal">{conteneur.type_conteneur}</Badge> : "-"}</TableCell>
                    <TableCell>{conteneur.numero_bl || "-"}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{conteneur.client_nom || "-"}</TableCell>
                    <TableCell className="max-w-[220px] truncate">{getAdresseLivraisonLabel(conteneur)}</TableCell>
                    <TableCell className="max-w-[120px] truncate">{conteneur.transitaire_nom || "-"}</TableCell>
                    <TableCell>{getStatutBadge(conteneur.statut)}</TableCell>
                    <TableCell>
                      {conteneur.statut !== 'facture' ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="gap-1">Actions<ArrowRight className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleCreerOrdre(conteneur)}><PlusCircle className="h-4 w-4 mr-2" />Créer un ordre</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAffecterClick(conteneur)}><LinkIcon className="h-4 w-4 mr-2" />Affecter à un ordre</DropdownMenuItem>
                            {conteneur.ordre_travail && (
                              <DropdownMenuItem onClick={() => navigate(`/ordres/${conteneur.ordre_travail_id}`)}><FileText className="h-4 w-4 mr-2" />Voir OT {conteneur.ordre_travail.numero}</DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => ignorerMutate(conteneur.id)} className="text-destructive focus:text-destructive"><XCircle className="h-4 w-4 mr-2" />Ignorer</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1" />Terminé</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
