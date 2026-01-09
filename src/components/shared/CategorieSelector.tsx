import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ship, Package, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategorieOption {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface CategorieSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const categories: CategorieOption[] = [
  {
    value: "conteneurs",
    label: "Conteneurs",
    description: "Opérations sur conteneurs maritimes",
    icon: <Ship className="h-6 w-6" />,
  },
  {
    value: "conventionnel",
    label: "Conventionnel",
    description: "Marchandises en vrac ou lots",
    icon: <Package className="h-6 w-6" />,
  },
  {
    value: "operations_independantes",
    label: "Opérations Indépendantes",
    description: "Services logistiques divers",
    icon: <Settings className="h-6 w-6" />,
  },
];

export function CategorieSelector({ value, onChange, disabled }: CategorieSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Type de document</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(cat.value)}
              className={cn(
                "flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all",
                value === cat.value
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-primary/50",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className={cn(
                "p-3 rounded-full",
                value === cat.value ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                {cat.icon}
              </div>
              <div className="text-center">
                <div className="font-medium">{cat.label}</div>
                <div className="text-sm text-muted-foreground">{cat.description}</div>
              </div>
              {value === cat.value && (
                <Badge variant="default">Sélectionné</Badge>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
