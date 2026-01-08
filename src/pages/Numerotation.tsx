import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { configurationApi } from "@/lib/api/commercial";
import { Loader2, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface NumerotationData {
  prefixe_devis: string;
  prefixe_ordre: string;
  prefixe_facture: string;
  prefixe_avoir: string;
  format_annee: boolean;
  prochain_numero_devis: number;
  prochain_numero_ordre: number;
  prochain_numero_facture: number;
  prochain_numero_avoir: number;
}

export default function NumerotationPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['numerotation'],
    queryFn: configurationApi.getNumerotation,
  });

  const [formData, setFormData] = useState<NumerotationData>({
    prefixe_devis: 'DEV',
    prefixe_ordre: 'OT',
    prefixe_facture: 'FAC',
    prefixe_avoir: 'AV',
    format_annee: true,
    prochain_numero_devis: 1,
    prochain_numero_ordre: 1,
    prochain_numero_facture: 1,
    prochain_numero_avoir: 1,
  });

  useEffect(() => {
    if (data) {
      setFormData({
        prefixe_devis: data.prefixe_devis || 'DEV',
        prefixe_ordre: data.prefixe_ordre || 'OT',
        prefixe_facture: data.prefixe_facture || 'FAC',
        prefixe_avoir: data.prefixe_avoir || 'AV',
        format_annee: data.format_annee ?? true,
        prochain_numero_devis: data.prochain_numero_devis || 1,
        prochain_numero_ordre: data.prochain_numero_ordre || 1,
        prochain_numero_facture: data.prochain_numero_facture || 1,
        prochain_numero_avoir: data.prochain_numero_avoir || 1,
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: configurationApi.updateNumerotation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['numerotation'] });
      toast.success('Numérotation mise à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    },
  });

  const syncMutation = useMutation({
    mutationFn: configurationApi.syncCompteurs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['numerotation'] });
      toast.success('Compteurs synchronisés avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la synchronisation');
    },
  });

  const handleInputChange = (field: keyof NumerotationData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveFormat = () => {
    updateMutation.mutate({
      prefixe_devis: formData.prefixe_devis,
      prefixe_ordre: formData.prefixe_ordre,
      prefixe_facture: formData.prefixe_facture,
      prefixe_avoir: formData.prefixe_avoir,
      format_annee: formData.format_annee,
    });
  };

  const handleSaveCompteurs = () => {
    updateMutation.mutate({
      prochain_numero_devis: formData.prochain_numero_devis,
      prochain_numero_ordre: formData.prochain_numero_ordre,
      prochain_numero_facture: formData.prochain_numero_facture,
      prochain_numero_avoir: formData.prochain_numero_avoir,
    });
  };

  const handleSyncCompteurs = () => {
    syncMutation.mutate();
  };

  const getExemple = (prefixe: string, numero: number) => {
    const annee = formData.format_annee ? new Date().getFullYear() + "-" : "";
    return `${prefixe}-${annee}${String(numero).padStart(4, '0')}`;
  };

  if (isLoading) {
    return (
      <MainLayout title="Numérotation">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Numérotation">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive">Erreur lors du chargement de la configuration</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
            Réessayer
          </Button>
        </div>
      </MainLayout>
    );
  }

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
                value={formData.prefixe_devis} 
                onChange={(e) => handleInputChange('prefixe_devis', e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ex: {getExemple(formData.prefixe_devis, formData.prochain_numero_devis)}
              </p>
            </div>
            <div>
              <Label>Préfixe Ordres de travail</Label>
              <Input 
                value={formData.prefixe_ordre} 
                onChange={(e) => handleInputChange('prefixe_ordre', e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ex: {getExemple(formData.prefixe_ordre, formData.prochain_numero_ordre)}
              </p>
            </div>
            <div>
              <Label>Préfixe Factures</Label>
              <Input 
                value={formData.prefixe_facture} 
                onChange={(e) => handleInputChange('prefixe_facture', e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ex: {getExemple(formData.prefixe_facture, formData.prochain_numero_facture)}
              </p>
            </div>
            <div>
              <Label>Préfixe Avoirs</Label>
              <Input 
                value={formData.prefixe_avoir} 
                onChange={(e) => handleInputChange('prefixe_avoir', e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ex: {getExemple(formData.prefixe_avoir, formData.prochain_numero_avoir)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch 
                checked={formData.format_annee} 
                onCheckedChange={(checked) => handleInputChange('format_annee', checked)}
              />
              <Label>Inclure l'année dans la numérotation</Label>
            </div>
            <Button className="w-full" onClick={handleSaveFormat} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Enregistrer le format
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Compteurs actuels</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSyncCompteurs}
              disabled={syncMutation.isPending}
              className="gap-2"
            >
              {syncMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Synchroniser
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Prochain n° Devis</Label>
              <Input 
                type="number" 
                value={formData.prochain_numero_devis}
                onChange={(e) => handleInputChange('prochain_numero_devis', parseInt(e.target.value) || 1)}
                min={1}
              />
            </div>
            <div>
              <Label>Prochain n° Ordre</Label>
              <Input 
                type="number" 
                value={formData.prochain_numero_ordre}
                onChange={(e) => handleInputChange('prochain_numero_ordre', parseInt(e.target.value) || 1)}
                min={1}
              />
            </div>
            <div>
              <Label>Prochain n° Facture</Label>
              <Input 
                type="number" 
                value={formData.prochain_numero_facture}
                onChange={(e) => handleInputChange('prochain_numero_facture', parseInt(e.target.value) || 1)}
                min={1}
              />
            </div>
            <div>
              <Label>Prochain n° Avoir</Label>
              <Input 
                type="number" 
                value={formData.prochain_numero_avoir}
                onChange={(e) => handleInputChange('prochain_numero_avoir', parseInt(e.target.value) || 1)}
                min={1}
              />
            </div>
            <Button className="w-full" onClick={handleSaveCompteurs} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Mettre à jour les compteurs
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
