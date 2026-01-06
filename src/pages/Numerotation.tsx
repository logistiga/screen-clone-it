import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { configurationNumerotation } from "@/data/mockData";

export default function NumerotationPage() {
  return (
    <MainLayout title="Numérotation">
      <div className="grid gap-6 md:grid-cols-2">
        <Card><CardHeader><CardTitle>Format de numérotation</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Préfixe Devis</Label><Input defaultValue={configurationNumerotation.prefixeDevis} /><p className="text-xs text-muted-foreground mt-1">Ex: DEV-2026-0001</p></div>
            <div><Label>Préfixe Ordres de travail</Label><Input defaultValue={configurationNumerotation.prefixeOrdre} /></div>
            <div><Label>Préfixe Factures</Label><Input defaultValue={configurationNumerotation.prefixeFacture} /></div>
            <div><Label>Préfixe Avoirs</Label><Input defaultValue={configurationNumerotation.prefixeAvoir} /></div>
            <div className="flex items-center gap-2"><Switch defaultChecked={configurationNumerotation.formatAnnee} /><Label>Inclure l'année dans la numérotation</Label></div>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Compteurs actuels</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Prochain n° Devis</Label><Input type="number" defaultValue={configurationNumerotation.prochainNumeroDevis} /></div>
            <div><Label>Prochain n° Ordre</Label><Input type="number" defaultValue={configurationNumerotation.prochainNumeroOrdre} /></div>
            <div><Label>Prochain n° Facture</Label><Input type="number" defaultValue={configurationNumerotation.prochainNumeroFacture} /></div>
            <div><Label>Prochain n° Avoir</Label><Input type="number" defaultValue={configurationNumerotation.prochainNumeroAvoir} /></div>
            <Button className="w-full">Enregistrer</Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
