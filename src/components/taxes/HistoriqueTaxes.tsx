import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { History, Lock, RefreshCw, Calendar } from "lucide-react";
import { formatMontant } from "@/data/mockData";
import { HistoriqueMoisData } from "@/lib/api/taxes";

interface HistoriqueTaxesProps {
  historique: HistoriqueMoisData[];
  cumul: {
    tva: { total_ht: number; total_taxe: number; total_exonere: number } | null;
    css: { total_ht: number; total_taxe: number; total_exonere: number } | null;
    total_taxes: number;
  };
  annee: number;
  onAnneeChange: (annee: number) => void;
  onRecalculer?: (mois: number) => void;
  isRecalculating?: boolean;
}

export function HistoriqueTaxes({
  historique,
  cumul,
  annee,
  onAnneeChange,
  onRecalculer,
  isRecalculating,
}: HistoriqueTaxesProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const currentMonth = new Date().getMonth() + 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <History className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Historique annuel</CardTitle>
            </div>
            <Select value={annee.toString()} onValueChange={(v) => onAnneeChange(parseInt(v))}>
              <SelectTrigger className="w-32">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="font-semibold">Mois</TableHead>
                  <TableHead className="text-right font-semibold">TVA collectée</TableHead>
                  <TableHead className="text-right font-semibold">CSS collectée</TableHead>
                  <TableHead className="text-right font-semibold">Total taxes</TableHead>
                  <TableHead className="text-center font-semibold">Docs</TableHead>
                  <TableHead className="text-center font-semibold">Statut</TableHead>
                  {onRecalculer && <TableHead className="text-center">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {historique.map((mois) => {
                  const isCurrent = annee === currentYear && mois.mois === currentMonth;
                  const isCloture = mois.tva?.cloture || mois.css?.cloture;
                  const hasData = mois.tva || mois.css;

                  return (
                    <TableRow 
                      key={mois.mois}
                      className={`border-b border-border/50 ${isCurrent ? 'bg-primary/5' : ''}`}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="capitalize">{mois.nom_mois}</span>
                          {isCurrent && (
                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary">
                              Courant
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {mois.tva ? formatMontant(mois.tva.montant_taxe) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {mois.css ? formatMontant(mois.css.montant_taxe) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-primary">
                        {hasData ? formatMontant(mois.total_taxes) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {mois.tva?.docs || mois.css?.docs || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {isCloture ? (
                          <Badge variant="outline" className="gap-1">
                            <Lock className="h-3 w-3" />
                            Clôturé
                          </Badge>
                        ) : hasData ? (
                          <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                            En cours
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      {onRecalculer && (
                        <TableCell className="text-center">
                          {hasData && !isCloture && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onRecalculer(mois.mois)}
                              disabled={isRecalculating}
                              className="h-8 w-8"
                            >
                              <RefreshCw className={`h-4 w-4 ${isRecalculating ? 'animate-spin' : ''}`} />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Cumul annuel */}
          <div className="p-4 bg-muted/30 border-t border-border/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">TVA collectée (année)</p>
                <p className="font-bold text-lg text-primary">
                  {formatMontant(cumul.tva?.total_taxe || 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">CSS collectée (année)</p>
                <p className="font-bold text-lg text-amber-600">
                  {formatMontant(cumul.css?.total_taxe || 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Base HT totale</p>
                <p className="font-semibold">
                  {formatMontant((cumul.tva?.total_ht || 0) + (cumul.css?.total_ht || 0))}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total taxes (année)</p>
                <p className="font-bold text-lg">
                  {formatMontant(cumul.total_taxes)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
