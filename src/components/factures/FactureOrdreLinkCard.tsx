import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, FileSignature, CalendarClock, Hash, Tag } from "lucide-react";
import { asRecord, readText } from "@/lib/facture-lots";

const formatDate = (value: unknown): string => {
  const text = typeof value === "string" ? value : "";
  if (!text) return "—";
  const d = new Date(text);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface Props {
  facture: unknown;
}

export function FactureOrdreLinkCard({ facture }: Props) {
  const rec = asRecord(facture) ?? {};
  const ot = asRecord(rec.ordre_travail) ?? asRecord(rec.ordreTravail);
  if (!ot) return null;

  const otId = readText(ot, ["id"]);
  const otNumero = readText(ot, ["numero"]) || "OT lié";
  const otCategorie = readText(ot, ["categorie", "type_document"]);
  const otStatut = readText(ot, ["statut"]);
  const dateTransfer = readText(rec, ["date_creation", "date", "created_at"]);
  const dateOt = readText(ot, ["date_creation", "date", "created_at"]);

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-indigo-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base font-semibold text-muted-foreground">
          <span className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10">
              <FileSignature className="h-4 w-4 text-indigo-600" />
            </div>
            Ordre de travail d'origine
          </span>
          {otId && (
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link to={`/ordres/${otId}`}>
                Voir l'OT <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <InfoItem
            icon={<Hash className="h-4 w-4 text-indigo-600" />}
            label="N° Ordre"
            value={<span className="font-mono font-semibold">{otNumero}</span>}
          />
          <InfoItem
            icon={<Tag className="h-4 w-4 text-indigo-600" />}
            label="Catégorie"
            value={
              <div className="flex items-center gap-2 flex-wrap">
                {otCategorie && (
                  <Badge variant="secondary" className="capitalize">
                    {otCategorie.replace(/_/g, " ")}
                  </Badge>
                )}
                {otStatut && (
                  <Badge variant="outline" className="capitalize">
                    {otStatut}
                  </Badge>
                )}
                {!otCategorie && !otStatut && <span>—</span>}
              </div>
            }
          />
          <InfoItem
            icon={<CalendarClock className="h-4 w-4 text-indigo-600" />}
            label="Date OT"
            value={<span className="font-medium">{formatDate(dateOt)}</span>}
          />
          <InfoItem
            icon={<CalendarClock className="h-4 w-4 text-emerald-600" />}
            label="Date de transfert"
            value={<span className="font-medium">{formatDate(dateTransfer)}</span>}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 shrink-0">{icon}</div>
      <div className="min-w-0">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <div className="text-sm mt-0.5">{value}</div>
      </div>
    </div>
  );
}
