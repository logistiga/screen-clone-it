import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, BarChart3, Receipt } from "lucide-react";

interface Props {
  loadingStats: boolean;
  statsDocuments: any;
}

export function DocumentsTab({ loadingStats, statsDocuments }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Devis */}
      <Card className="rounded-xl border shadow-sm overflow-hidden">
        <CardHeader className="pb-2 border-b bg-muted/20">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold"><FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />Devis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-4">
          {loadingStats ? <Skeleton className="h-32 w-full" /> : (
            <>
              <div className="flex justify-between items-center p-2 rounded-lg bg-muted/50"><span className="font-medium">Total</span><Badge>{statsDocuments?.devis?.total || 0}</Badge></div>
              {[
                { label: "Brouillon", key: "brouillon" },
                { label: "Envoyé", key: "envoye" },
                { label: "Accepté", key: "accepte", color: "text-emerald-600 dark:text-emerald-400", bold: true },
                { label: "Refusé", key: "refuse", color: "text-red-600 dark:text-red-400" },
              ].map(({ label, key, color, bold }) => (
                <div key={key} className="flex justify-between text-sm py-1">
                  <span className={color || "text-muted-foreground"}>{label}</span>
                  <span className={bold ? "font-semibold" : ""}>{statsDocuments?.devis?.[key] || 0}</span>
                </div>
              ))}
              <div className="pt-2 border-t"><div className="flex justify-between items-center"><span className="font-medium">Taux de conversion</span><Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400">{statsDocuments?.devis?.taux_conversion || 0}%</Badge></div></div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Ordres */}
      <Card className="rounded-xl border shadow-sm overflow-hidden">
        <CardHeader className="pb-2 border-b bg-muted/20">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold"><BarChart3 className="h-4 w-4 text-amber-600 dark:text-amber-400" />Ordres de Travail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-4">
          {loadingStats ? <Skeleton className="h-32 w-full" /> : (
            <>
              <div className="flex justify-between items-center p-2 rounded-lg bg-muted/50"><span className="font-medium">Total</span><Badge>{statsDocuments?.ordres?.total || 0}</Badge></div>
              {[
                { label: "En cours", key: "en_cours", color: "text-amber-600 dark:text-amber-400" },
                { label: "Terminé", key: "termine", color: "text-emerald-600 dark:text-emerald-400" },
                { label: "Facturé", key: "facture", color: "text-primary", bold: true },
              ].map(({ label, key, color, bold }) => (
                <div key={key} className="flex justify-between text-sm py-1">
                  <span className={color}>{label}</span>
                  <span className={bold ? "font-semibold" : ""}>{statsDocuments?.ordres?.[key] || 0}</span>
                </div>
              ))}
              <div className="pt-2 border-t"><div className="flex justify-between items-center"><span className="font-medium">Taux de facturation</span><Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400">{statsDocuments?.ordres?.taux_facturation || 0}%</Badge></div></div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Factures */}
      <Card className="rounded-xl border shadow-sm overflow-hidden">
        <CardHeader className="pb-2 border-b bg-muted/20">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold"><Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />Factures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-4">
          {loadingStats ? <Skeleton className="h-32 w-full" /> : (
            <>
              <div className="flex justify-between items-center p-2 rounded-lg bg-muted/50"><span className="font-medium">Total</span><Badge>{statsDocuments?.factures?.total || 0}</Badge></div>
              {[
                { label: "Validée", key: "validee" },
                { label: "Partiellement payée", key: "partiellement_payee", color: "text-amber-600 dark:text-amber-400" },
                { label: "Payée", key: "payee", color: "text-emerald-600 dark:text-emerald-400", bold: true },
                { label: "Annulée", key: "annulee", color: "text-red-600 dark:text-red-400" },
              ].map(({ label, key, color, bold }) => (
                <div key={key} className="flex justify-between text-sm py-1">
                  <span className={color || "text-muted-foreground"}>{label}</span>
                  <span className={bold ? "font-semibold" : ""}>{statsDocuments?.factures?.[key] || 0}</span>
                </div>
              ))}
              <div className="pt-2 border-t"><div className="flex justify-between items-center"><span className="font-medium">Taux de recouvrement</span><Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">{statsDocuments?.factures?.taux_recouvrement || 0}%</Badge></div></div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
