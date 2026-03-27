import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { formatMontant } from "@/data/mockData";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import type { DetentionAttente } from "@/hooks/use-detentions-attente";

interface Props {
  data: DetentionAttente[];
  isLoading: boolean;
}

function ResponsabiliteBadge({ value }: { value: string }) {
  const variant = value === "Client"
    ? "default"
    : value === "Compagnie" || value === "Logistiga"
      ? "secondary"
      : "outline";
  return <Badge variant={variant}>{value}</Badge>;
}

function PaiementBadge({ valide }: { valide: boolean }) {
  return valide
    ? <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Payé</Badge>
    : <Badge variant="destructive">Non payé</Badge>;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy", { locale: fr });
  } catch {
    return d;
  }
}

export function DetentionTable({ data, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Aucune détention en attente trouvée
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Conteneur</TableHead>
            <TableHead>BL</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Armateur</TableHead>
            <TableHead className="text-center">Jours</TableHead>
            <TableHead className="text-right">Prix/jour</TableHead>
            <TableHead className="text-right">Coût total</TableHead>
            <TableHead>Responsabilité</TableHead>
            <TableHead className="text-right">Coût Client</TableHead>
            <TableHead className="text-right">Coût Cie</TableHead>
            <TableHead className="text-center">Paiement</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow key={row.id ?? idx}>
              <TableCell className="font-medium">{row.numero_conteneur}</TableCell>
              <TableCell className="text-muted-foreground">{row.numero_bl || "—"}</TableCell>
              <TableCell>{row.client_nom || "—"}</TableCell>
              <TableCell>
                <Badge variant="outline">{row.armateur_code || "—"}</Badge>
              </TableCell>
              <TableCell className="text-center">
                <span className={row.jours_detention > 14 ? "text-destructive font-semibold" : ""}>
                  {row.jours_detention}j
                </span>
                {row.jours_gratuits > 0 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({row.jours_gratuits}j gratuits)
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">{formatMontant(row.prix_par_jour)}</TableCell>
              <TableCell className="text-right font-semibold">{formatMontant(row.cout_total)}</TableCell>
              <TableCell>
                <ResponsabiliteBadge value={row.responsabilite} />
              </TableCell>
              <TableCell className="text-right">{formatMontant(row.cout_client)}</TableCell>
              <TableCell className="text-right">{formatMontant(row.cout_compagnie)}</TableCell>
              <TableCell className="text-center">
                <PaiementBadge valide={row.paiement_valide} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
