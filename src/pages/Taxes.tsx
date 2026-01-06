import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { configurationTaxes } from "@/data/mockData";

export default function TaxesPage() {
  return (
    <MainLayout title="Taxes">
      <Card className="max-w-md"><CardHeader><CardTitle>Configuration des taxes</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>TVA (%)</Label><Input type="number" defaultValue={configurationTaxes.tvaRate} /><p className="text-xs text-muted-foreground mt-1">Taxe sur la Valeur Ajoutée</p></div>
          <div><Label>CSS (%)</Label><Input type="number" defaultValue={configurationTaxes.cssRate} /><p className="text-xs text-muted-foreground mt-1">Contribution Spéciale de Solidarité</p></div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
