import * as React from "react";
import { CategorieDocument, getCategoriesLabels } from "@/types/documents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CategorieSelectorProps {
  onSelect: (categorie: CategorieDocument) => void;
}

const CategorieSelector = React.forwardRef<HTMLDivElement, CategorieSelectorProps>(function CategorieSelector(
  { onSelect },
  ref,
) {
  const categoriesLabels = getCategoriesLabels();

  return (
    <Card ref={ref}>
      <CardHeader>
        <CardTitle className="text-lg">Catégorie de devis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {(Object.keys(categoriesLabels) as CategorieDocument[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className="rounded-lg border-2 border-border p-4 text-left transition-all hover:border-primary/50 hover:bg-muted/50"
            >
              <div className="mb-2 flex items-center gap-3">
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
});

CategorieSelector.displayName = "CategorieSelector";

export default CategorieSelector;
