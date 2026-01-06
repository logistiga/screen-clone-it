import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { configurationNumerotation } from "@/data/mockData";
import { toast } from "sonner";

export default function NumerotationPage() {
  const [formData, setFormData] = useState({
    prefixeDevis: configurationNumerotation.prefixeDevis,
    prefixeOrdre: configurationNumerotation.prefixeOrdre,
    prefixeFacture: configurationNumerotation.prefixeFacture,
    prefixeAvoir: configurationNumerotation.prefixeAvoir,
    formatAnnee: configurationNumerotation.formatAnnee,
    prochainNumeroDevis: configurationNumerotation.prochainNumeroDevis,
    prochainNumeroOrdre: configurationNumerotation.prochainNumeroOrdre,
    prochainNumeroFacture: configurationNumerotation.prochainNumeroFacture,
    prochainNumeroAvoir: configurationNumerotation.prochainNumeroAvoir,
  });

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveFormat = () => {
    toast.success("Format de numérotation enregistré avec succès");
  };

  const handleSaveCompteurs = () => {
    toast.success("Compteurs mis à jour avec succès");
  };

  const getExemple = (prefixe: string, numero: number) => {
    const annee = formData.formatAnnee ? new Date().getFullYear() + "-" : "";
    return `${prefixe}${annee}${String(numero).padStart(4, '0')}`;
  };

  return (
    <MainLayout title="Numérotation">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Format de numérotation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Préfixe Devis</Label>
              <Input 
                value={formData.prefixeDevis} 
                onChange={(e) => handleInputChange('prefixeDevis', e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ex: {getExemple(formData.prefixeDevis, formData.prochainNumeroDevis)}
              </p>
            </div>
            <div>
              <Label>Préfixe Ordres de travail</Label>
              <Input 
                value={formData.prefixeOrdre} 
                onChange={(e) => handleInputChange('prefixeOrdre', e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ex: {getExemple(formData.prefixeOrdre, formData.prochainNumeroOrdre)}
              </p>
            </div>
            <div>
              <Label>Préfixe Factures</Label>
              <Input 
                value={formData.prefixeFacture} 
                onChange={(e) => handleInputChange('prefixeFacture', e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ex: {getExemple(formData.prefixeFacture, formData.prochainNumeroFacture)}
              </p>
            </div>
            <div>
              <Label>Préfixe Avoirs</Label>
              <Input 
                value={formData.prefixeAvoir} 
                onChange={(e) => handleInputChange('prefixeAvoir', e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ex: {getExemple(formData.prefixeAvoir, formData.prochainNumeroAvoir)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={formData.formatAnnee} 
                onCheckedChange={(checked) => handleInputChange('formatAnnee', checked)}
              />
              <Label>Inclure l'année dans la numérotation</Label>
            </div>
            <Button className="w-full" onClick={handleSaveFormat}>
              Enregistrer le format
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Compteurs actuels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Prochain n° Devis</Label>
              <Input 
                type="number" 
                value={formData.prochainNumeroDevis}
                onChange={(e) => handleInputChange('prochainNumeroDevis', parseInt(e.target.value) || 1)}
                min={1}
              />
            </div>
            <div>
              <Label>Prochain n° Ordre</Label>
              <Input 
                type="number" 
                value={formData.prochainNumeroOrdre}
                onChange={(e) => handleInputChange('prochainNumeroOrdre', parseInt(e.target.value) || 1)}
                min={1}
              />
            </div>
            <div>
              <Label>Prochain n° Facture</Label>
              <Input 
                type="number" 
                value={formData.prochainNumeroFacture}
                onChange={(e) => handleInputChange('prochainNumeroFacture', parseInt(e.target.value) || 1)}
                min={1}
              />
            </div>
            <div>
              <Label>Prochain n° Avoir</Label>
              <Input 
                type="number" 
                value={formData.prochainNumeroAvoir}
                onChange={(e) => handleInputChange('prochainNumeroAvoir', parseInt(e.target.value) || 1)}
                min={1}
              />
            </div>
            <Button className="w-full" onClick={handleSaveCompteurs}>
              Mettre à jour les compteurs
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}