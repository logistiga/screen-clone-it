import { CategorieDocument, getCategoriesLabels } from "@/types/documents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CategorieSelectorProps {
  onSelect: (categorie: CategorieDocument) => void;
}

export default function CategorieSelector({ onSelect }: CategorieSelectorProps) {
  const categoriesLabels = getCategoriesLabels();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Catégorie de devis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(categoriesLabels) as CategorieDocument[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className="p-4 rounded-lg border-2 text-left transition-all border-border hover:border-primary/50 hover:bg-muted/50"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="text-muted-foreground">{categoriesLabels[key].icon}</div>
                <span className="font-semibold">{categoriesLabels[key].label}</span>
              </div>
              <p className="text-sm text-muted-foreground">{categoriesLabels[key].description}</p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
