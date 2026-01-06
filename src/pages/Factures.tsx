import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Eye, Wallet, Mail, FileText, XCircle } from "lucide-react";
import { factures, clients, formatMontant, formatDate, getStatutLabel } from "@/data/mockData";

export default function FacturesPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");

  const filteredFactures = factures.filter(f => {
    const client = clients.find(c => c.id === f.clientId);
    const matchSearch = f.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatut = statutFilter === "all" || f.statut === statutFilter;
    return matchSearch && matchStatut;
  });

  const totalFactures = factures.reduce((sum, f) => sum + f.montantTTC, 0);
  const totalPaye = factures.reduce((sum, f) => sum + f.montantPaye, 0);
  const totalImpaye = totalFactures - totalPaye;

  const getStatutBadge = (statut: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      emise: "outline",
      payee: "default",
      partielle: "secondary",
      impayee: "destructive",
      annulee: "destructive",
    };
    return <Badge variant={variants[statut] || "secondary"}>{getStatutLabel(statut)}</Badge>;
  };

  return (
    <MainLayout title="Factures">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Factures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{factures.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Montant Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMontant(totalFactures)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Encaissé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatMontant(totalPaye)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Impayé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatMontant(totalImpaye)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statutFilter} onValueChange={setStatutFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="emise">Émise</SelectItem>
                <SelectItem value="payee">Payée</SelectItem>
                <SelectItem value="partielle">Partielle</SelectItem>
                <SelectItem value="impayee">Impayée</SelectItem>
                <SelectItem value="annulee">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="gap-2" onClick={() => navigate("/factures/nouvelle")}>
            <Plus className="h-4 w-4" />
            Nouvelle facture
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead className="text-right">Montant HT</TableHead>
                  <TableHead className="text-right">TVA (18%)</TableHead>
                  <TableHead className="text-right">CSS (1%)</TableHead>
                  <TableHead className="text-right">Total TTC</TableHead>
                  <TableHead className="text-right">Payé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-40">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFactures.map((facture) => {
                  const client = clients.find(c => c.id === facture.clientId);
                  const resteAPayer = facture.montantTTC - facture.montantPaye;
                  return (
                    <TableRow key={facture.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{facture.numero}</TableCell>
                      <TableCell>{client?.nom}</TableCell>
                      <TableCell>{formatDate(facture.dateCreation)}</TableCell>
                      <TableCell>{formatDate(facture.dateEcheance)}</TableCell>
                      <TableCell className="text-right">{formatMontant(facture.montantHT)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatMontant(facture.tva)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatMontant(facture.css)}</TableCell>
                      <TableCell className="text-right font-medium">{formatMontant(facture.montantTTC)}</TableCell>
                      <TableCell className="text-right">
                        <span className={facture.montantPaye > 0 ? "text-green-600" : ""}>
                          {formatMontant(facture.montantPaye)}
                        </span>
                        {resteAPayer > 0 && facture.statut !== 'payee' && (
                          <div className="text-xs text-destructive">
                            Reste: {formatMontant(resteAPayer)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatutBadge(facture.statut)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" title="Voir">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {facture.statut !== 'payee' && facture.statut !== 'annulee' && (
                            <Button variant="ghost" size="icon" title="Paiement" className="text-green-600">
                              <Wallet className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" title="Envoyer par email">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="PDF">
                            <FileText className="h-4 w-4" />
                          </Button>
                          {facture.statut !== 'annulee' && (
                            <Button variant="ghost" size="icon" title="Annuler" className="text-destructive">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
