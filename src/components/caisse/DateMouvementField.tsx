import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const toIso = (d: Date): string => {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const j = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${j}`;
};

export const todayIso = (): string => toIso(new Date());

/** Date d'un mouvement de caisse : aujourd'hui par défaut, 7 jours en arrière au maximum. */
export function DateMouvementField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const min = new Date();
  min.setDate(min.getDate() - 7);
  return (
    <div className="space-y-2">
      <Label htmlFor="date-mouvement">Date du mouvement</Label>
      <Input
        id="date-mouvement"
        type="date"
        value={value}
        min={toIso(min)}
        max={todayIso()}
        onChange={(e) => onChange(e.target.value || todayIso())}
      />
      <p className="text-xs text-muted-foreground">Jusqu'à 7 jours en arrière.</p>
    </div>
  );
}
