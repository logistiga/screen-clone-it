import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { mouvementsCaisse, banques, formatMontant, formatDate } from "@/data/mockData";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function CaisseGlobalePage() {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  // Tous les mouvements
  const allMouvements = mouvementsCaisse;

  const totalEntrees = allMouvements
    .filter(m => m.type === 'entree')
    .reduce((sum, m) => sum + m.montant, 0);
  
  const totalSorties = allMouvements
    .filter(m => m.type === 'sortie')
    .reduce((sum, m) => sum + m.montant, 0);

  const soldeCaisse = allMouvements
    .filter(m => m.source === 'caisse')
    .reduce((sum, m) => m.type === 'entree' ? sum + m.montant : sum - m.montant, 0);

  const soldeBanque = banques.reduce((sum, b) => sum + b.solde, 0);

  const soldeGlobal = soldeCaisse + soldeBanque;

  return (
    <MainLayout title="Caisse Globale">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Solde Global
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatMontant(soldeGlobal)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Solde Caisse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMontant(soldeCaisse)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Solde Banques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMontant(soldeBanque)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Entrées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatMontant(totalEntrees)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Sorties
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatMontant(totalSorties)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy")
                    )
                  ) : (
                    "Sélectionner une période"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 text-green-600">
              <ArrowDownCircle className="h-4 w-4" />
              Entrée manuelle
            </Button>
            <Button variant="outline" className="gap-2 text-destructive">
              <ArrowUpCircle className="h-4 w-4" />
              Sortie manuelle
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tous les mouvements</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allMouvements.map((mouvement) => {
                  const banque = banques.find(b => b.id === mouvement.banqueId);
                  return (
                    <TableRow key={mouvement.id}>
                      <TableCell>{formatDate(mouvement.date)}</TableCell>
                      <TableCell>
                        {mouvement.source === 'caisse' ? (
                          <Badge variant="secondary">Caisse</Badge>
                        ) : (
                          <Badge variant="outline">{banque?.nom || 'Banque'}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {mouvement.type === 'entree' ? (
                          <Badge className="bg-green-100 text-green-800">Entrée</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">Sortie</Badge>
                        )}
                      </TableCell>
                      <TableCell>{mouvement.description}</TableCell>
                      <TableCell className={`text-right font-medium ${
                        mouvement.type === 'entree' ? 'text-green-600' : 'text-destructive'
                      }`}>
                        {mouvement.type === 'entree' ? '+' : '-'}{formatMontant(mouvement.montant)}
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
