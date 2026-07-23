import { Fragment } from "react";
import { FileText, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMontant } from "@/data/mockData";
import {
  asRecord,
  asRows,
  getFactureLotsAvecOrdre,
  readNumber,
  readText,
} from "@/lib/facture-lots";

type DetailRow = Record<string, unknown>;

const getRows = (facture: unknown) => {
  const factureRecord = asRecord(facture) ?? {};
  const ot = asRecord(factureRecord.ordre_travail) ?? asRecord(factureRecord.ordreTravail);
  const ownLignes = asRows(factureRecord.lignes);
  const ownConteneurs = asRows(factureRecord.conteneurs);
  const otLignes = asRows(ot?.lignes);
  const otConteneurs = asRows(ot?.conteneurs);

  return {
    lignes: ownLignes.length > 0 ? ownLignes : otLignes,
    lots: getFactureLotsAvecOrdre(facture),
    conteneurs: ownConteneurs.length > 0 ? ownConteneurs : otConteneurs,
  };
};

function LignesTable({ lignes }: { lignes: DetailRow[] }) {
  if (lignes.length === 0) return null;

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-muted-foreground">
          <div className="p-1.5 rounded-lg bg-purple-500/10">
            <FileText className="h-4 w-4 text-purple-600" />
          </div>
          Lignes de la facture
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Description</TableHead>
              <TableHead className="text-center">Quantité</TableHead>
              <TableHead className="text-right">Prix unitaire</TableHead>
              <TableHead className="text-right">Montant HT</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lignes.map((ligne, index) => (
              <TableRow key={String(ligne.id ?? index)} className="hover:bg-muted/50">
                <TableCell>{readText(ligne, ["description", "type_operation"])}</TableCell>
                <TableCell className="text-center">{readNumber(ligne.quantite, 1)}</TableCell>
                <TableCell className="text-right">{formatMontant(readNumber(ligne.prix_unitaire))}</TableCell>
                <TableCell className="text-right font-medium">{formatMontant(readNumber(ligne.montant_ht))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function LotsTable({ lots }: { lots: DetailRow[] }) {
  if (lots.length === 0) return null;

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-muted-foreground">
          <div className="p-1.5 rounded-lg bg-emerald-500/10">
            <Package className="h-4 w-4 text-emerald-600" />
          </div>
          Lots
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>N° Lot</TableHead>
              <TableHead>Désignation</TableHead>
              <TableHead className="text-center">Quantité</TableHead>
              <TableHead className="text-right">Prix unitaire</TableHead>
              <TableHead className="text-right">Montant HT</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lots.map((lot, index) => {
              const numeroLot = readText(lot, ["numero_lot"]) || `Lot ${index + 1}`;
              const designation = readText(lot, ["designation", "description"]) || "—";
              const qte = readNumber(lot.quantite, 1);
              const pu = readNumber(lot.prix_unitaire);
              const montantStocke = readNumber(lot.montant_ht ?? lot.prix_total);
              const montant = montantStocke > 0 ? montantStocke : qte * pu;
              return (
                <TableRow key={String(lot.id ?? index)} className="hover:bg-muted/50">
                  <TableCell className="font-mono font-medium">{numeroLot}</TableCell>
                  <TableCell>{designation}</TableCell>
                  <TableCell className="text-center">{qte}</TableCell>
                  <TableCell className="text-right">{formatMontant(pu)}</TableCell>
                  <TableCell className="text-right font-medium">{formatMontant(montant)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ConteneursTable({ conteneurs }: { conteneurs: DetailRow[] }) {
  if (conteneurs.length === 0) return null;

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-muted-foreground">
          <div className="p-1.5 rounded-lg bg-cyan-500/10">
            <Package className="h-4 w-4 text-cyan-600" />
          </div>
          Conteneurs
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Désignation</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-center">Qté</TableHead>
              <TableHead className="text-right">Prix unit.</TableHead>
              <TableHead className="text-right">Montant</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conteneurs.map((conteneur, conteneurIndex) => {
              const ops = asRows(conteneur.operations);
              const baseHT = readNumber(conteneur.prix_unitaire);
              const numero = readText(conteneur, ["numero"]);
              const taille = readText(conteneur, ["taille"]);
              const type = readText(conteneur, ["type"]);
              return (
                <Fragment key={String(conteneur.id ?? conteneurIndex)}>
                  <TableRow className="bg-muted/20">
                    <TableCell className="font-mono font-medium">
                      {numero}
                      {taille && <span className="ml-2 text-xs text-muted-foreground">{taille}'</span>}
                      {type && <span className="ml-2 text-xs text-muted-foreground">{type}</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{readText(conteneur, ["description"]) || "—"}</TableCell>
                    <TableCell className="text-center">1</TableCell>
                    <TableCell className="text-right">{formatMontant(baseHT)}</TableCell>
                    <TableCell className="text-right font-medium">{formatMontant(baseHT)}</TableCell>
                  </TableRow>
                  {ops.map((op, i) => {
                    const qte = readNumber(op.quantite, 1);
                    const pu = readNumber(op.prix_unitaire);
                    const totalStocke = readNumber(op.prix_total ?? op.montant_ht);
                    const total = totalStocke > 0 ? totalStocke : qte * pu;
                    return (
                      <TableRow key={String(op.id ?? `${conteneur.id ?? conteneurIndex}-op-${i}`)} className="hover:bg-muted/30">
                        <TableCell className="pl-8 text-sm text-muted-foreground">↳ {readText(op, ["type_operation", "type"]) || "Opération"}</TableCell>
                        <TableCell className="text-sm">{readText(op, ["description"]) || "—"}</TableCell>
                        <TableCell className="text-center text-sm">{qte}</TableCell>
                        <TableCell className="text-right text-sm">{formatMontant(pu)}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{formatMontant(total)}</TableCell>
                      </TableRow>
                    );
                  })}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function FactureItemsTables({ facture }: { facture: unknown }) {
  const { lignes, lots, conteneurs } = getRows(facture);

  return (
    <>
      <LignesTable lignes={lignes} />
      <LotsTable lots={lots} />
      <ConteneursTable conteneurs={conteneurs} />
    </>
  );
}