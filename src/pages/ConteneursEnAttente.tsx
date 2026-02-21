import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { 
  Package, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  FileText,
  Truck,
  Ship,
  Calendar,
  User,
  PlusCircle,
  Link as LinkIcon,
  XCircle,
  ArrowRight,
  Download,
  AlertTriangle,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { conteneursTraitesApi, ConteneurTraite, ConteneursTraitesStats, anomaliesApi } from "@/lib/api/conteneurs-traites";
import { ordresApi } from "@/lib/api/commercial";
import {
  DocumentStatCard,
  DocumentFilters,
  DocumentEmptyState,
  DocumentLoadingState,
  DocumentErrorState,
} from "@/components/shared/documents";
import { AnomaliesSection } from "@/components/conteneurs/AnomaliesSection";
import { OpsConnectionStatus } from "@/components/conteneurs/OpsConnectionStatus";

// Options de filtres
const statutOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "en_attente", label: "En attente" },
  { value: "affecte", label: "Affectés" },
  { value: "facture", label: "Facturés" },
  { value: "ignore", label: "Ignorés" },
];

export default function ConteneursEnAttentePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [selectedConteneur, setSelectedConteneur] = useState<ConteneurTraite | null>(null);
  const [isAffecterDialogOpen, setIsAffecterDialogOpen] = useState(false);
  const [selectedOrdreId, setSelectedOrdreId] = useState<string>("");

  // Récupérer les conteneurs
  const { data: conteneursData, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['conteneurs-traites', statutFilter, searchQuery],
    queryFn: () => conteneursTraitesApi.getAll({ 
      statut: statutFilter !== "all" ? statutFilter : undefined,
      search: searchQuery || undefined,
      per_page: 50,
    }),
  });

  // Récupérer les stats
  const { data: stats } = useQuery<ConteneursTraitesStats>({
    queryKey: ['conteneurs-traites-stats'],
    queryFn: () => conteneursTraitesApi.getStats(),
  });

  // Récupérer les ordres pour l'affectation
  const { data: ordresData } = useQuery({
    queryKey: ['ordres-for-affectation'],
    queryFn: () => ordresApi.getAll({ categorie: 'conteneurs', per_page: 100 }),
    enabled: isAffecterDialogOpen,
  });

  // Mutations
  const affecterOrdreMutation = useMutation({
    mutationFn: ({ conteneurId, ordreId }: { conteneurId: number; ordreId: number }) => 
      conteneursTraitesApi.affecterAOrdre(conteneurId, ordreId),
    onSuccess: (data) => {
      toast.success(`Conteneur affecté à l'ordre ${data.ordre?.numero}`);
      setIsAffecterDialogOpen(false);
      setSelectedConteneur(null);
      queryClient.invalidateQueries({ queryKey: ['conteneurs-traites'] });
      queryClient.invalidateQueries({ queryKey: ['conteneurs-traites-stats'] });
    },
    onError: () => {
      toast.error("Erreur lors de l'affectation");
    },
  });

  const ignorerMutation = useMutation({
    mutationFn: (conteneurId: number) => conteneursTraitesApi.ignorer(conteneurId),
    onSuccess: () => {
      toast.success("Conteneur ignoré");
      queryClient.invalidateQueries({ queryKey: ['conteneurs-traites'] });
      queryClient.invalidateQueries({ queryKey: ['conteneurs-traites-stats'] });
    },
    onError: () => {
      toast.error("Erreur lors de l'opération");
    },
  });

  // Mutation pour sync + détection
  const syncAndDetectMutation = useMutation({
    mutationFn: async () => {
      await conteneursTraitesApi.syncFromOps();
      try {
        await anomaliesApi.detecter();
      } catch {
        // Ignorer si l'API anomalies échoue
      }
    },
    onSuccess: () => {
      toast.success("Synchronisation terminée");
      queryClient.invalidateQueries({ queryKey: ['conteneurs-traites'] });
      queryClient.invalidateQueries({ queryKey: ['conteneurs-traites-stats'] });
      queryClient.invalidateQueries({ queryKey: ['conteneurs-anomalies'] });
      queryClient.invalidateQueries({ queryKey: ['conteneurs-anomalies-stats'] });
    },
    onError: (error: Error) => {
      toast.error("Erreur lors de la synchronisation - voir les détails ci-dessous");
      // L'erreur sera affichée dans le composant OpsConnectionStatus
      console.error('[Sync OPS] Erreur:', error);
    },
  });

  const conteneurs: ConteneurTraite[] = conteneursData?.data || [];
  const ordres = Array.isArray(ordresData) ? ordresData : (ordresData?.data || []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd MMM yyyy", { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const getStatutBadge = (statut: string) => {
    const configs: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
      en_attente: { 
        label: "En attente", 
        icon: <Clock className="h-3 w-3" />,
        className: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-200" 
      },
      affecte: { 
        label: "Affecté", 
        icon: <LinkIcon className="h-3 w-3" />,
        className: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200" 
      },
      facture: { 
        label: "Facturé", 
        icon: <CheckCircle2 className="h-3 w-3" />,
        className: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200" 
      },
      ignore: { 
        label: "Ignoré", 
        icon: <XCircle className="h-3 w-3" />,
        className: "bg-muted text-muted-foreground" 
      },
    };
    const config = configs[statut] || { label: statut, icon: null, className: "bg-muted" };
    return (
      <Badge variant="outline" className={`${config.className} flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const handleAffecterClick = (conteneur: ConteneurTraite) => {
    setSelectedConteneur(conteneur);
    setIsAffecterDialogOpen(true);
  };

  const handleAffecterConfirm = () => {
    if (selectedConteneur && selectedOrdreId) {
      affecterOrdreMutation.mutate({
        conteneurId: selectedConteneur.id,
        ordreId: parseInt(selectedOrdreId),
      });
    }
  };

  // Rediriger vers le formulaire de nouvel ordre avec données pré-remplies
  const handleCreerOrdre = (conteneur: ConteneurTraite) => {
    // Stocker les données du conteneur dans sessionStorage pour pré-remplissage
    const prefillData = {
      categorie: 'conteneurs',
      numeroBL: conteneur.numero_bl || '',
      clientNom: conteneur.client_nom || '',
      armateurCode: conteneur.armateur_code || '',
      armateurNom: conteneur.armateur_nom || '',
      conteneur: {
        numero: conteneur.numero_conteneur,
        taille: '20', // Valeur par défaut
        type: 'DRY',
      },
      sourceConteneurId: conteneur.id, // Pour marquer comme affecté après création
    };
    
    sessionStorage.setItem('prefill_ordre', JSON.stringify(prefillData));
    navigate('/ordres/nouveau?prefill=conteneur');
  };

  if (isLoading) {
    return (
      <MainLayout title="Conteneurs en Attente">
        <DocumentLoadingState message="Chargement des conteneurs..." />
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Conteneurs en Attente">
        <DocumentErrorState 
          message="Erreur lors du chargement des conteneurs"
          onRetry={() => refetch()}
        />
      </MainLayout>
    );
  }

  // État vide
  if (conteneurs.length === 0 && !searchQuery && statutFilter === "en_attente") {
    return (
      <MainLayout title="Conteneurs en Attente">
        <div className="space-y-6 animate-fade-in">
          {/* Stats Cards - toujours visibles */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <DocumentStatCard
              title="En attente"
              value={stats?.en_attente || 0}
              icon={Clock}
              variant="warning"
              subtitle="À traiter"
              delay={0}
            />
            <DocumentStatCard
              title="Affectés"
              value={stats?.affectes || 0}
              icon={LinkIcon}
              variant="info"
              subtitle="Ordres créés"
              delay={0.1}
            />
            <DocumentStatCard
              title="Facturés"
              value={stats?.factures || 0}
              icon={CheckCircle2}
              variant="success"
              subtitle="Terminés"
              delay={0.2}
            />
            <DocumentStatCard
              title="Total"
              value={stats?.total || 0}
              icon={Package}
              variant="primary"
              subtitle="Tous conteneurs"
              delay={0.3}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 justify-end">
            <Button 
              onClick={() => syncAndDetectMutation.mutate()} 
              disabled={syncAndDetectMutation.isPending}
              variant="default"
              className="gap-2"
            >
              <Download className={`h-4 w-4 ${syncAndDetectMutation.isPending ? 'animate-spin' : ''}`} />
              Synchroniser depuis OPS
            </Button>
            <Button onClick={() => refetch()} disabled={isRefetching} variant="outline" className="gap-2">
              <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>

          {/* Diagnostic OPS - affiché si erreur de sync */}
          <OpsConnectionStatus 
            syncError={syncAndDetectMutation.error as Error | null}
            onRetrySync={() => syncAndDetectMutation.mutate()}
          />

          <DocumentEmptyState
            icon={Package}
            title="Aucun conteneur en attente"
            description="Les conteneurs traités par Logistiga OPS apparaîtront ici. Cliquez sur 'Synchroniser depuis OPS' pour récupérer les dernières données."
            actionLabel="Synchroniser"
            onAction={() => syncAndDetectMutation.mutate()}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Conteneurs en Attente">
      <div className="space-y-6 animate-fade-in">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DocumentStatCard
            title="En attente"
            value={stats?.en_attente || 0}
            icon={Clock}
            variant="warning"
            subtitle="À traiter"
            delay={0}
          />
          <DocumentStatCard
            title="Affectés"
            value={stats?.affectes || 0}
            icon={LinkIcon}
            variant="info"
            subtitle="Ordres créés"
            delay={0.1}
          />
          <DocumentStatCard
            title="Facturés"
            value={stats?.factures || 0}
            icon={CheckCircle2}
            variant="success"
            subtitle="Terminés"
            delay={0.2}
          />
          <DocumentStatCard
            title="Total"
            value={stats?.total || 0}
            icon={Package}
            variant="primary"
            subtitle="Tous conteneurs"
            delay={0.3}
          />
        </div>

        {/* Filters */}
        <DocumentFilters
          searchTerm={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Rechercher par conteneur, BL, client..."
          statutFilter={statutFilter}
          onStatutChange={setStatutFilter}
          statutOptions={statutOptions}
        />

        {/* Actions */}
        <div className="flex flex-wrap gap-2 justify-end">
          <Button 
            onClick={() => syncAndDetectMutation.mutate()} 
            disabled={syncAndDetectMutation.isPending}
            variant="default"
            className="gap-2 transition-all duration-200 hover:scale-105"
          >
            <Download className={`h-4 w-4 ${syncAndDetectMutation.isPending ? 'animate-spin' : ''}`} />
            Synchroniser depuis OPS
          </Button>
          <Button onClick={() => refetch()} disabled={isRefetching} variant="outline" className="gap-2 transition-all duration-200 hover:scale-105">
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>

        {/* Diagnostic OPS - affiché si erreur de sync */}
        <OpsConnectionStatus 
          syncError={syncAndDetectMutation.error as Error | null}
          onRetrySync={() => syncAndDetectMutation.mutate()}
        />

        {/* Section Anomalies */}
        <AnomaliesSection />

        {/* Table */}
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5" />
              Liste des conteneurs
              <Badge variant="secondary" className="ml-2">{conteneurs.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {conteneurs.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">Aucun résultat</p>
                <p className="text-muted-foreground">
                  Modifiez vos filtres pour voir plus de conteneurs
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Conteneur</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>N° BL</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Armateur</TableHead>
                      <TableHead>Transitaire</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="w-48">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conteneurs.map((conteneur) => (
                      <TableRow key={conteneur.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium font-mono">
                          {conteneur.numero_conteneur}
                        </TableCell>
                        <TableCell>
                          {conteneur.type_conteneur ? (
                            <Badge variant="outline" className="text-xs font-normal">
                              {conteneur.type_conteneur}
                            </Badge>
                          ) : "-"}
                        </TableCell>
                        <TableCell>{conteneur.numero_bl || "-"}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{conteneur.client_nom || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Ship className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="truncate max-w-[100px]">
                              {conteneur.armateur_nom || conteneur.armateur_code || "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[120px] truncate">{conteneur.transitaire_nom || "-"}</TableCell>
                        <TableCell>{getStatutBadge(conteneur.statut)}</TableCell>
                        <TableCell>
                          {conteneur.statut !== 'facture' ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1">
                                  Actions
                                  <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleCreerOrdre(conteneur)}>
                                  <PlusCircle className="h-4 w-4 mr-2" />
                                  Créer un ordre
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAffecterClick(conteneur)}>
                                  <LinkIcon className="h-4 w-4 mr-2" />
                                  Affecter à un ordre
                                </DropdownMenuItem>
                                {conteneur.ordre_travail && (
                                  <DropdownMenuItem onClick={() => navigate(`/ordres/${conteneur.ordre_travail_id}`)}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Voir OT {conteneur.ordre_travail.numero}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={() => ignorerMutation.mutate(conteneur.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Ignorer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Terminé
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog Affecter à un ordre */}
        <Dialog open={isAffecterDialogOpen} onOpenChange={setIsAffecterDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Affecter à un ordre de travail</DialogTitle>
              <DialogDescription>
                Sélectionnez l'ordre de travail auquel affecter le conteneur{" "}
                <strong className="font-mono">{selectedConteneur?.numero_conteneur}</strong>
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Select value={selectedOrdreId} onValueChange={setSelectedOrdreId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un ordre de travail" />
                </SelectTrigger>
                <SelectContent>
                  {ordres.map((ordre: any) => (
                    <SelectItem key={ordre.id} value={String(ordre.id)}>
                      {ordre.numero} - {ordre.client?.nom || 'Client inconnu'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAffecterDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleAffecterConfirm} 
                disabled={!selectedOrdreId || affecterOrdreMutation.isPending}
              >
                {affecterOrdreMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <LinkIcon className="h-4 w-4 mr-2" />
                )}
                Affecter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
