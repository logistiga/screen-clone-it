import { useBanques } from "@/hooks/use-commercial";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ExpenseBankFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ExpenseBankField({ value, onChange, disabled }: ExpenseBankFieldProps) {
  const { data: banques = [], isLoading, isError } = useBanques({ actif: true });
  return (
    <div className="space-y-2">
      <Label htmlFor="expense-bank">Compte bancaire *</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled || isLoading || isError}>
        <SelectTrigger id="expense-bank"><SelectValue placeholder="Sélectionner une banque" /></SelectTrigger>
        <SelectContent>
          {banques.map((banque) => (
            <SelectItem key={banque.id} value={String(banque.id)}>{banque.nom}{banque.numero_compte ? ` — ${banque.numero_compte}` : ""}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isLoading && <p className="text-sm text-muted-foreground">Chargement des banques…</p>}
      {isError && <p className="text-sm text-destructive">Impossible de charger les banques. Vérifiez votre connexion et vos accès.</p>}
      {!isLoading && !isError && banques.length === 0 && <p className="text-sm text-muted-foreground">Aucune banque active disponible.</p>}
    </div>
  );
}