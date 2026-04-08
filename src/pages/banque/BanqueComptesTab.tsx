import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { formatMontant } from "@/data/mockData";

interface BanqueComptesTabProps {
  banques: any[];
  onNavigateBanques: () => void;
}

export function BanqueComptesTab({ banques, onNavigateBanques }: BanqueComptesTabProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {banques.map((banque: any, index: number) => (
        <Card
          key={banque.id}
          className="overflow-hidden transition-all duration-300 hover:shadow-lg animate-fade-in border-l-4 border-l-primary/50"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <CardHeader className="bg-muted/30 pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" />{banque.nom}</span>
              <Badge variant="default" className="bg-green-600 text-xs">Actif</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Solde actuel</p>
                <p className="text-2xl font-bold text-primary">{formatMontant(banque.solde || 0)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div><p className="text-xs text-muted-foreground">Paiements</p><p className="text-sm font-semibold">{banque.paiements_count || 0}</p></div>
                <div><p className="text-xs text-muted-foreground">Total encaissé</p><p className="text-sm font-semibold text-green-600">{formatMontant(banque.paiements_sum_montant || 0)}</p></div>
              </div>
              {(banque.numero_compte || banque.iban || banque.swift) && (
                <div className="pt-2 border-t space-y-1 text-xs text-muted-foreground">
                  {banque.numero_compte && <p><strong>N° Compte:</strong> {banque.numero_compte}</p>}
                  {banque.iban && <p><strong>IBAN:</strong> {banque.iban}</p>}
                  {banque.swift && <p><strong>SWIFT:</strong> {banque.swift}</p>}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      {banques.length === 0 && (
        <div className="col-span-full text-center py-8 text-muted-foreground">
          Aucun compte bancaire actif.{" "}
          <span className="text-primary hover:underline cursor-pointer" onClick={onNavigateBanques}>Configurer les banques</span>
        </div>
      )}
    </div>
  );
}
