import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { 
  Package, 
  Search, 
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
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

import { conteneursTraitesApi, ConteneurTraite, ConteneursTraitesStats } from "@/lib/api/conteneurs-traites";
import { ordresApi } from "@/lib/api/commercial";
import { DebugPanel } from "@/components/debug/DebugPanel";
import { useAuth } from "@/hooks/use-auth";

export default function ConteneursEnAttentePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin') || hasRole('administrateur') || hasRole('directeur');
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("en_attente");
  const [selectedConteneur, setSelectedConteneur] = useState<ConteneurTraite | null>(null);
  const [isAffecterDialogOpen, setIsAffecterDialogOpen] = useState(false);
  const [selectedOrdreId, setSelectedOrdreId] = useState<string>("");
  
  // Debug info state
  const [debugInfo, setDebugInfo] = useState<{
    lastRequest: any;
    lastResponse: any;
    lastError: any;
    apiUrl: string;
    timestamp: string | null;
    duration: number | null;
  }>({
    lastRequest: null,
    lastResponse: null,
    lastError: null,
    apiUrl: '/conteneurs-en-attente',
    timestamp: null,
    duration: null,
  });

  // Récupérer les conteneurs avec debug
  const { data: conteneursData, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['conteneurs-traites', statutFilter, searchQuery],
    queryFn: async () => {
      const startTime = Date.now();
      const requestParams = { 
        statut: statutFilter || undefined,
        search: searchQuery || undefined,
        per_page: 50,
      };
      
      try {
        const result = await conteneursTraitesApi.getAll(requestParams);
        
        setDebugInfo({
          lastRequest: requestParams,
          lastResponse: result,
          lastError: null,
          apiUrl: '/conteneurs-en-attente',
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
        });
        
        return result;
      } catch (err: any) {
        setDebugInfo(prev => ({
          ...prev,
          lastRequest: requestParams,
          lastError: err?.response?.data || err?.message || err,
          timestamp: new Date().toISOString(),
          duration: Date.now() - startTime,
        }));
        throw err;
      }
    },
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
  const creerOrdreMutation = useMutation({
    mutationFn: (conteneurId: number) => conteneursTraitesApi.creerOrdre(conteneurId),
    onSuccess: (data) => {
      toast.success(`Ordre ${data.ordre?.numero} créé avec succès`);
      queryClient.invalidateQueries({ queryKey: ['conteneurs-traites'] });
      queryClient.invalidateQueries({ queryKey: ['conteneurs-traites-stats'] });
      if (data.ordre?.id) {
        navigate(`/ordres/${data.ordre.id}`);
      }
    },
    onError: () => {
      toast.error("Erreur lors de la création de l'ordre");
    },
  });

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
    switch (statut) {
      case 'en_attente':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200"><Clock className="h-3 w-3 mr-1" /> En attente</Badge>;
      case 'affecte':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><LinkIcon className="h-3 w-3 mr-1" /> Affecté</Badge>;
      case 'facture':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" /> Facturé</Badge>;
      case 'ignore':
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" /> Ignoré</Badge>;
      default:
        return <Badge variant="secondary">{statut}</Badge>;
    }
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Conteneurs en Attente de Facturation
          </h1>
          <p className="text-muted-foreground mt-1">
            Conteneurs traités par Logistiga OPS, prêts à être facturés
          </p>
      </div>

      {/* Debug Panel - visible en dev ou pour admins */}
      {(import.meta.env.DEV || isAdmin) && (
        <DebugPanel 
          title="Debug Communication API"
          data={{
            apiUrl: debugInfo.apiUrl,
            request: debugInfo.lastRequest,
            response: debugInfo.lastResponse,
            error: debugInfo.lastError || error,
            queryStatus: { isLoading, isError: !!error, isRefetching },
            stats: stats,
            timestamp: debugInfo.timestamp,
            duration: debugInfo.duration,
          }}
          onRefresh={() => refetch()}
        />
      )}
        <Button onClick={() => refetch()} disabled={isRefetching} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.en_attente || 0}</p>
                <p className="text-sm text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <LinkIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.affectes || 0}</p>
                <p className="text-sm text-muted-foreground">Affectés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.factures || 0}</p>
                <p className="text-sm text-muted-foreground">Facturés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100">
                <Package className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par conteneur, BL, client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statutFilter} onValueChange={setStatutFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="affecte">Affectés</SelectItem>
                <SelectItem value="facture">Facturés</SelectItem>
                <SelectItem value="ignore">Ignorés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Liste des conteneurs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : conteneurs.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">Aucun conteneur en attente</p>
              <p className="text-muted-foreground">
                Les conteneurs traités par Logistiga OPS apparaîtront ici
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Conteneur</TableHead>
                    <TableHead>N° BL</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Armateur</TableHead>
                    <TableHead>Date Sortie</TableHead>
                    <TableHead>Véhicule</TableHead>
                    <TableHead>Chauffeur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conteneurs.map((conteneur) => (
                    <TableRow key={conteneur.id}>
                      <TableCell className="font-medium">
                        {conteneur.numero_conteneur}
                      </TableCell>
                      <TableCell>{conteneur.numero_bl || "-"}</TableCell>
                      <TableCell>{conteneur.client_nom || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Ship className="h-3 w-3 text-muted-foreground" />
                          {conteneur.armateur_nom || conteneur.armateur_code || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(conteneur.date_sortie)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {conteneur.camion_plaque && (
                          <div className="flex items-center gap-1">
                            <Truck className="h-3 w-3 text-muted-foreground" />
                            {conteneur.camion_plaque}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {conteneur.chauffeur_nom && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {conteneur.chauffeur_nom}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatutBadge(conteneur.statut)}</TableCell>
                      <TableCell className="text-right">
                        {conteneur.statut === 'en_attente' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                Actions
                                <ArrowRight className="h-4 w-4 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => creerOrdreMutation.mutate(conteneur.id)}>
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Créer un ordre
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAffecterClick(conteneur)}>
                                <LinkIcon className="h-4 w-4 mr-2" />
                                Affecter à un ordre
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => ignorerMutation.mutate(conteneur.id)}
                                className="text-destructive"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Ignorer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        {conteneur.statut === 'affecte' && conteneur.ordre_travail && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/ordres/${conteneur.ordre_travail_id}`)}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            {conteneur.ordre_travail.numero}
                          </Button>
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
              <strong>{selectedConteneur?.numero_conteneur}</strong>
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
  );
}
