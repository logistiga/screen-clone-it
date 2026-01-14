import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { configurationApi } from "@/lib/api/commercial";
import { 
  Hash, 
  FileText, 
  ClipboardList, 
  Receipt, 
  FileX, 
  RefreshCw, 
  Save,
  Calendar
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DocumentStatCard } from "@/components/shared/documents/DocumentStatCard";
import { DocumentLoadingState } from "@/components/shared/documents/DocumentLoadingState";
import { DocumentEmptyState } from "@/components/shared/documents/DocumentEmptyState";

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

  const { data, isLoading, error, refetch } = useQuery({
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
        <DocumentLoadingState message="Chargement de la configuration..." />
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Numérotation">
        <DocumentEmptyState
          icon={Hash}
          title="Erreur de chargement"
          description="Impossible de charger la configuration de numérotation. Veuillez réessayer."
          actionLabel="Réessayer"
          onAction={() => refetch()}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Numérotation">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Numérotation</h1>
            <p className="text-muted-foreground">
              Configurez les préfixes et compteurs pour vos documents
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DocumentStatCard
            title="Prochain Devis"
            value={getExemple(formData.prefixe_devis, formData.prochain_numero_devis)}
            icon={FileText}
            variant="primary"
            delay={0}
          />
          <DocumentStatCard
            title="Prochain Ordre"
            value={getExemple(formData.prefixe_ordre, formData.prochain_numero_ordre)}
            icon={ClipboardList}
            variant="info"
            delay={0.1}
          />
          <DocumentStatCard
            title="Prochaine Facture"
            value={getExemple(formData.prefixe_facture, formData.prochain_numero_facture)}
            icon={Receipt}
            variant="success"
            delay={0.2}
          />
          <DocumentStatCard
            title="Prochain Avoir"
            value={getExemple(formData.prefixe_avoir, formData.prochain_numero_avoir)}
            icon={FileX}
            variant="warning"
            delay={0.3}
          />
        </div>

        {/* Configuration Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Format Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <Hash className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Format de numérotation</CardTitle>
                    <p className="text-sm text-muted-foreground">Définissez les préfixes de vos documents</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Préfixe Devis</Label>
                    <Input 
                      value={formData.prefixe_devis} 
                      onChange={(e) => handleInputChange('prefixe_devis', e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Préfixe Ordres</Label>
                    <Input 
                      value={formData.prefixe_ordre} 
                      onChange={(e) => handleInputChange('prefixe_ordre', e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Préfixe Factures</Label>
                    <Input 
                      value={formData.prefixe_facture} 
                      onChange={(e) => handleInputChange('prefixe_facture', e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Préfixe Avoirs</Label>
                    <Input 
                      value={formData.prefixe_avoir} 
                      onChange={(e) => handleInputChange('prefixe_avoir', e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Inclure l'année</p>
                      <p className="text-xs text-muted-foreground">Format: PREFIXE-ANNÉE-NUMÉRO</p>
                    </div>
                  </div>
                  <Switch 
                    checked={formData.format_annee} 
                    onCheckedChange={(checked) => handleInputChange('format_annee', checked)}
                  />
                </div>

                <Button 
                  className="w-full gap-2" 
                  onClick={handleSaveFormat} 
                  disabled={updateMutation.isPending}
                >
                  <Save className="h-4 w-4" />
                  Enregistrer le format
                </Button>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Compteurs Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10">
                      <RefreshCw className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Compteurs actuels</CardTitle>
                      <p className="text-sm text-muted-foreground">Gérez les numéros séquentiels</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSyncCompteurs}
                    disabled={syncMutation.isPending}
                    className="gap-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                    Sync
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      N° Devis
                    </Label>
                    <Input 
                      type="number" 
                      value={formData.prochain_numero_devis}
                      onChange={(e) => handleInputChange('prochain_numero_devis', parseInt(e.target.value) || 1)}
                      min={1}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <ClipboardList className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      N° Ordre
                    </Label>
                    <Input 
                      type="number" 
                      value={formData.prochain_numero_ordre}
                      onChange={(e) => handleInputChange('prochain_numero_ordre', parseInt(e.target.value) || 1)}
                      min={1}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Receipt className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      N° Facture
                    </Label>
                    <Input 
                      type="number" 
                      value={formData.prochain_numero_facture}
                      onChange={(e) => handleInputChange('prochain_numero_facture', parseInt(e.target.value) || 1)}
                      min={1}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <FileX className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      N° Avoir
                    </Label>
                    <Input 
                      type="number" 
                      value={formData.prochain_numero_avoir}
                      onChange={(e) => handleInputChange('prochain_numero_avoir', parseInt(e.target.value) || 1)}
                      min={1}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    ⚠️ Modifier manuellement les compteurs peut créer des doublons. Utilisez la synchronisation automatique.
                  </p>
                </div>

                <Button 
                  className="w-full gap-2" 
                  onClick={handleSaveCompteurs} 
                  disabled={updateMutation.isPending}
                >
                  <Save className="h-4 w-4" />
                  Mettre à jour les compteurs
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </MainLayout>
  );
}
