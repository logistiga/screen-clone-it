import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Eye, Edit, Trash2, Ship, User, Truck, AlertCircle, RefreshCw, Banknote, Users, UserCheck, UserX } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { formatMontant } from "@/data/mockData";
import { NouveauTransitaireModal } from "@/components/NouveauTransitaireModal";
import { NouveauRepresentantModal } from "@/components/NouveauRepresentantModal";

import { TablePagination } from "@/components/TablePagination";
import { 
  useTransitaires, 
  useRepresentants, 
  useArmateurs,
  useDeleteTransitaire,
  useDeleteRepresentant,
  useSyncArmateurs
} from "@/hooks/use-commercial";
import {
  PartenaireAvatar,
  PartenaireCard,
  StatCard,
  ViewToggle,
  PartenaireTableSkeleton,
  PartenaireGridSkeleton,
  StatCardSkeleton,
} from "@/components/partenaires";
import { cn } from "@/lib/utils";

export default function PartenairesPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; nom: string; type: string } | null>(null);
  const [showTransitaireModal, setShowTransitaireModal] = useState(false);
  const [showRepresentantModal, setShowRepresentantModal] = useState(false);
  
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  
  // Pagination states
  const [transitairesPage, setTransitairesPage] = useState(1);
  // Par défaut on affiche “tout” (jusqu’à 200) pour éviter l’impression de liste tronquée.
  const [transitairesPageSize, setTransitairesPageSize] = useState(200);
  const [representantsPage, setRepresentantsPage] = useState(1);
  const [representantsPageSize, setRepresentantsPageSize] = useState(10);
  const [armateursPage, setArmateursPage] = useState(1);
  const [armateursPageSize, setArmateursPageSize] = useState(10);

  // Fetch data from API
  const { data: transitairesData, isLoading: isLoadingTransitaires, error: errorTransitaires, refetch: refetchTransitaires } = useTransitaires();
  const { data: representantsData, isLoading: isLoadingRepresentants, error: errorRepresentants, refetch: refetchRepresentants } = useRepresentants();
  const { data: armateursData, isLoading: isLoadingArmateurs, error: errorArmateurs, refetch: refetchArmateurs } = useArmateurs();

  // Garantir que ce sont des tableaux
  const transitaires = Array.isArray(transitairesData) ? transitairesData : [];
  const representants = Array.isArray(representantsData) ? representantsData : [];
  const armateurs = Array.isArray(armateursData) ? armateursData : [];

  // Helper to get error message
  const getErrorMessage = (error: unknown): { title: string; description: string; details?: string } => {
    const axiosError = error as {
      response?: { status?: number; data?: any };
      config?: { baseURL?: string; url?: string };
      message?: string;
    };

    const status = axiosError?.response?.status;
    const apiMsg = axiosError?.response?.data?.message || axiosError?.response?.data?.error;
    const requestUrl = [axiosError?.config?.baseURL, axiosError?.config?.url].filter(Boolean).join('');

    const details = [
      status ? `HTTP ${status}` : undefined,
      requestUrl ? `URL: ${requestUrl}` : undefined,
      typeof apiMsg === 'string' ? `Message: ${apiMsg}` : undefined,
    ]
      .filter(Boolean)
      .join(' • ');

    if (status === 401) {
      return { title: "Session expirée", description: "Votre session a expiré. Veuillez vous reconnecter.", details };
    }
    if (status === 403) {
      return { title: "Accès refusé", description: "Vous n'avez pas les permissions nécessaires.", details };
    }
    if (status === 500) {
      return { title: "Erreur serveur", description: "Le serveur a renvoyé une erreur 500.", details };
    }

    return { title: "Erreur de chargement", description: "Impossible de charger les données.", details };
  };

  // Error UI component
  const ErrorCard = ({ error, onRetry, entityName }: { error: unknown; onRetry: () => void; entityName: string }) => {
    const { title, description, details } = getErrorMessage(error);
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span>{description}</span>
            <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </Button>
          </div>
          {details && (
            <div className="text-xs text-muted-foreground break-words">
              {entityName} • {details}
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  // Delete mutations
  const deleteTransitaireMutation = useDeleteTransitaire();
  const deleteRepresentantMutation = useDeleteRepresentant();
  const syncArmateursMutation = useSyncArmateurs();

  // Filtrage
  const filteredTransitaires = transitaires.filter(t =>
    t.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRepresentants = representants.filter(r =>
    r.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredArmateurs = armateurs.filter(a =>
    a.nom?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination (données déjà chargées côté front)
  const transitairesTotalPages = Math.max(1, Math.ceil(filteredTransitaires.length / transitairesPageSize));
  const representantsTotalPages = Math.max(1, Math.ceil(filteredRepresentants.length / representantsPageSize));
  const armateursTotalPages = Math.max(1, Math.ceil(filteredArmateurs.length / armateursPageSize));

  // Si un filtre / une suppression réduit le nombre de pages, on “clamp” la page courante
  useEffect(() => {
    if (transitairesPage > transitairesTotalPages) setTransitairesPage(transitairesTotalPages);
  }, [transitairesPage, transitairesTotalPages]);

  useEffect(() => {
    if (representantsPage > representantsTotalPages) setRepresentantsPage(representantsTotalPages);
  }, [representantsPage, representantsTotalPages]);

  useEffect(() => {
    if (armateursPage > armateursTotalPages) setArmateursPage(armateursTotalPages);
  }, [armateursPage, armateursTotalPages]);

  // Paginated data
  const paginatedTransitaires = filteredTransitaires.slice(
    (transitairesPage - 1) * transitairesPageSize,
    transitairesPage * transitairesPageSize
  );
  const paginatedRepresentants = filteredRepresentants.slice(
    (representantsPage - 1) * representantsPageSize,
    representantsPage * representantsPageSize
  );
  const paginatedArmateurs = filteredArmateurs.slice(
    (armateursPage - 1) * armateursPageSize,
    armateursPage * armateursPageSize
  );

  const handleDelete = () => {
    if (deleteConfirm) {
      if (deleteConfirm.type === "Transitaire") {
        deleteTransitaireMutation.mutate(deleteConfirm.id);
      } else if (deleteConfirm.type === "Représentant") {
        deleteRepresentantMutation.mutate(deleteConfirm.id);
      } else if (deleteConfirm.type === "Armateur") {
        toast.error("Les armateurs sont synchronisés depuis OPS. Suppression désactivée.");
      }
      setDeleteConfirm(null);
    }
  };

  // Calculer le montant global des primes non payées
  const primesTransitaires = transitaires.reduce((acc, t) => acc + (t.primes_dues || 0), 0);
  const primesRepresentants = representants.reduce((acc, r) => acc + (r.primes_dues || 0), 0);
  const totalPrimesAPayer = primesTransitaires + primesRepresentants;

  // Stats calculations
  const transitairesActifs = transitaires.filter(t => t.actif !== false).length;
  const representantsActifs = representants.filter(r => r.actif !== false).length;
  const armateursActifs = armateurs.filter(a => a.actif !== false).length;

  return (
    <MainLayout title="Partenaires">
      <div className="space-y-6">
        {/* Bandeau sticky pour les primes non payées */}
        {totalPrimesAPayer > 0 && (
          <div className="sticky top-0 z-10">
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                      <Banknote className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-white">
                      <p className="font-semibold text-lg">Primes à payer</p>
                      <div className="flex items-center gap-4 text-sm text-white/90">
                        <span className="flex items-center gap-1.5">
                          <Truck className="h-4 w-4" />
                          Transitaires: {formatMontant(primesTransitaires)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <User className="h-4 w-4" />
                          Représentants: {formatMontant(primesRepresentants)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{formatMontant(totalPrimesAPayer)}</p>
                    <p className="text-sm text-white/80">Montant total</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Recherche et Toggle Vue */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un partenaire..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setTransitairesPage(1);
                setRepresentantsPage(1);
                setArmateursPage(1);
              }}
              className="pl-9"
            />
          </div>
          <ViewToggle view={viewMode} onChange={setViewMode} />
        </div>

        <Tabs defaultValue="transitaires" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="transitaires" className="gap-2 data-[state=active]:shadow-sm">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Transitaires</span>
              <Badge variant="secondary" className="ml-1">{transitaires.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="representants" className="gap-2 data-[state=active]:shadow-sm">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Représentants</span>
              <Badge variant="secondary" className="ml-1">{representants.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="armateurs" className="gap-2 data-[state=active]:shadow-sm">
              <Ship className="h-4 w-4" />
              <span className="hidden sm:inline">Armateurs</span>
              <Badge variant="secondary" className="ml-1">{armateurs.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Onglet Transitaires */}
          <TabsContent value="transitaires" className="mt-6 space-y-6 animate-fade-in">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {isLoadingTransitaires ? (
                <>
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                </>
              ) : (
                <>
                  <StatCard
                    title="Total Transitaires"
                    value={transitaires.length}
                    icon={Users}
                    variant="primary"
                  />
                  <StatCard
                    title="Actifs"
                    value={transitairesActifs}
                    icon={UserCheck}
                    variant="success"
                  />
                  <StatCard
                    title="Inactifs"
                    value={transitaires.length - transitairesActifs}
                    icon={UserX}
                    variant="muted"
                  />
                  <StatCard
                    title="Primes à payer"
                    value={formatMontant(primesTransitaires)}
                    icon={Banknote}
                    variant="warning"
                  />
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end">
              <Button className="gap-2 shadow-sm" onClick={() => setShowTransitaireModal(true)}>
                <Plus className="h-4 w-4" />
                Nouveau transitaire
              </Button>
            </div>

            {errorTransitaires && (
              <ErrorCard error={errorTransitaires} onRetry={() => refetchTransitaires()} entityName="transitaires" />
            )}

            {/* Vue Liste */}
            {viewMode === "list" ? (
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  {isLoadingTransitaires ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Nom</TableHead>
                          <TableHead className="text-right">Primes à payer</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="w-32">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <PartenaireTableSkeleton rows={5} />
                      </TableBody>
                    </Table>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Nom</TableHead>
                            <TableHead className="text-right">Primes à payer</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="w-32">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedTransitaires.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                <Truck className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>Aucun transitaire trouvé</p>
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginatedTransitaires.map((transitaire) => {
                              const primesAPayer = transitaire.primes_dues || 0;
                              return (
                                <TableRow key={transitaire.id} className="group hover:bg-muted/50">
                                  <TableCell>
                                    <div 
                                      className="flex items-center gap-3 cursor-pointer"
                                      onClick={() => navigate(`/partenaires/transitaires/${transitaire.id}`)}
                                    >
                                      <PartenaireAvatar nom={transitaire.nom} />
                                      <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                                        {transitaire.nom}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {primesAPayer > 0 ? (
                                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 font-semibold text-amber-600 dark:text-amber-400">
                                        {formatMontant(primesAPayer)}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant={transitaire.actif !== false ? "default" : "secondary"}
                                      className={cn(
                                        transitaire.actif !== false && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                      )}
                                    >
                                      {transitaire.actif !== false ? "Actif" : "Inactif"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        title="Voir"
                                        onClick={() => navigate(`/partenaires/transitaires/${transitaire.id}`)}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" title="Modifier">
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-destructive"
                                        title="Supprimer"
                                        onClick={() => setDeleteConfirm({ id: transitaire.id, nom: transitaire.nom, type: "Transitaire" })}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                      <TablePagination
                        currentPage={transitairesPage}
                        totalPages={transitairesTotalPages}
                        pageSize={transitairesPageSize}
                        totalItems={filteredTransitaires.length}
                        onPageChange={setTransitairesPage}
                        onPageSizeChange={(size) => { setTransitairesPageSize(size); setTransitairesPage(1); }}
                        pageSizeOptions={[10, 20, 50, 100, 200]}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              /* Vue Grille */
              <>
                {isLoadingTransitaires ? (
                  <PartenaireGridSkeleton count={6} />
                ) : paginatedTransitaires.length === 0 ? (
                  <Card className="py-12">
                    <div className="text-center text-muted-foreground">
                      <Truck className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>Aucun transitaire trouvé</p>
                    </div>
                  </Card>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {paginatedTransitaires.map((transitaire) => (
                        <PartenaireCard
                          key={transitaire.id}
                          id={transitaire.id}
                          nom={transitaire.nom}
                          email={transitaire.email}
                          telephone={transitaire.telephone}
                          adresse={transitaire.adresse}
                          actif={transitaire.actif !== false}
                          primesAPayer={transitaire.primes_dues || 0}
                          type="transitaire"
                          onView={() => navigate(`/partenaires/transitaires/${transitaire.id}`)}
                          onDelete={() => setDeleteConfirm({ id: transitaire.id, nom: transitaire.nom, type: "Transitaire" })}
                        />
                      ))}
                    </div>
                     <TablePagination
                       currentPage={transitairesPage}
                       totalPages={transitairesTotalPages}
                       pageSize={transitairesPageSize}
                       totalItems={filteredTransitaires.length}
                       onPageChange={setTransitairesPage}
                       onPageSizeChange={(size) => { setTransitairesPageSize(size); setTransitairesPage(1); }}
                       pageSizeOptions={[10, 20, 50, 100, 200]}
                     />
                  </>
                )}
              </>
            )}
          </TabsContent>

          {/* Onglet Représentants */}
          <TabsContent value="representants" className="mt-6 space-y-6 animate-fade-in">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {isLoadingRepresentants ? (
                <>
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                </>
              ) : (
                <>
                  <StatCard
                    title="Total Représentants"
                    value={representants.length}
                    icon={Users}
                    variant="primary"
                  />
                  <StatCard
                    title="Actifs"
                    value={representantsActifs}
                    icon={UserCheck}
                    variant="success"
                  />
                  <StatCard
                    title="Inactifs"
                    value={representants.length - representantsActifs}
                    icon={UserX}
                    variant="muted"
                  />
                  <StatCard
                    title="Primes à payer"
                    value={formatMontant(primesRepresentants)}
                    icon={Banknote}
                    variant="warning"
                  />
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end">
              <Button className="gap-2 shadow-sm" onClick={() => setShowRepresentantModal(true)}>
                <Plus className="h-4 w-4" />
                Nouveau représentant
              </Button>
            </div>

            {errorRepresentants && (
              <ErrorCard error={errorRepresentants} onRetry={() => refetchRepresentants()} entityName="représentants" />
            )}

            {/* Vue Liste */}
            {viewMode === "list" ? (
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  {isLoadingRepresentants ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Nom</TableHead>
                          <TableHead className="text-right">Primes à payer</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="w-32">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <PartenaireTableSkeleton rows={5} />
                      </TableBody>
                    </Table>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Nom</TableHead>
                            <TableHead className="text-right">Primes à payer</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="w-32">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedRepresentants.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                <User className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>Aucun représentant trouvé</p>
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginatedRepresentants.map((representant) => {
                              const primesAPayer = representant.primes_dues || 0;
                              const displayName = representant.prenom 
                                ? `${representant.prenom} ${representant.nom}` 
                                : representant.nom;
                              return (
                                <TableRow key={representant.id} className="group hover:bg-muted/50">
                                  <TableCell>
                                    <div 
                                      className="flex items-center gap-3 cursor-pointer"
                                      onClick={() => navigate(`/partenaires/representants/${representant.id}`)}
                                    >
                                      <PartenaireAvatar nom={representant.nom} prenom={representant.prenom} />
                                      <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                                        {displayName}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {primesAPayer > 0 ? (
                                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 font-semibold text-amber-600 dark:text-amber-400">
                                        {formatMontant(primesAPayer)}
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant={representant.actif !== false ? "default" : "secondary"}
                                      className={cn(
                                        representant.actif !== false && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                      )}
                                    >
                                      {representant.actif !== false ? "Actif" : "Inactif"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        title="Voir"
                                        onClick={() => navigate(`/partenaires/representants/${representant.id}`)}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" title="Modifier">
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-destructive"
                                        title="Supprimer"
                                        onClick={() => setDeleteConfirm({ id: representant.id, nom: representant.nom, type: "Représentant" })}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                      <TablePagination
                        currentPage={representantsPage}
                        totalPages={representantsTotalPages}
                        pageSize={representantsPageSize}
                        totalItems={filteredRepresentants.length}
                        onPageChange={setRepresentantsPage}
                        onPageSizeChange={(size) => { setRepresentantsPageSize(size); setRepresentantsPage(1); }}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              /* Vue Grille */
              <>
                {isLoadingRepresentants ? (
                  <PartenaireGridSkeleton count={6} />
                ) : paginatedRepresentants.length === 0 ? (
                  <Card className="py-12">
                    <div className="text-center text-muted-foreground">
                      <User className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>Aucun représentant trouvé</p>
                    </div>
                  </Card>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {paginatedRepresentants.map((representant) => (
                        <PartenaireCard
                          key={representant.id}
                          id={representant.id}
                          nom={representant.nom}
                          prenom={representant.prenom}
                          email={representant.email}
                          telephone={representant.telephone}
                          adresse={representant.adresse}
                          actif={representant.actif !== false}
                          primesAPayer={representant.primes_dues || 0}
                          type="representant"
                          onView={() => navigate(`/partenaires/representants/${representant.id}`)}
                          onDelete={() => setDeleteConfirm({ id: representant.id, nom: representant.nom, type: "Représentant" })}
                        />
                      ))}
                    </div>
                     <TablePagination
                       currentPage={representantsPage}
                       totalPages={representantsTotalPages}
                       pageSize={representantsPageSize}
                       totalItems={filteredRepresentants.length}
                       onPageChange={setRepresentantsPage}
                       onPageSizeChange={(size) => { setRepresentantsPageSize(size); setRepresentantsPage(1); }}
                     />
                  </>
                )}
              </>
            )}
          </TabsContent>

          {/* Onglet Armateurs */}
          <TabsContent value="armateurs" className="mt-6 space-y-6 animate-fade-in">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {isLoadingArmateurs ? (
                <>
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                </>
              ) : (
                <>
                  <StatCard
                    title="Total Armateurs"
                    value={armateurs.length}
                    icon={Ship}
                    variant="primary"
                  />
                  <StatCard
                    title="Actifs"
                    value={armateursActifs}
                    icon={UserCheck}
                    variant="success"
                  />
                  <StatCard
                    title="Inactifs"
                    value={armateurs.length - armateursActifs}
                    icon={UserX}
                    variant="muted"
                  />
                </>
              )}
            </div>

            {/* Actions - Sync instead of create */}
            <div className="flex justify-end">
              <Button 
                className="gap-2 shadow-sm" 
                onClick={() => syncArmateursMutation.mutate()}
                disabled={syncArmateursMutation.isPending}
              >
                <RefreshCw className={`h-4 w-4 ${syncArmateursMutation.isPending ? 'animate-spin' : ''}`} />
                {syncArmateursMutation.isPending ? 'Synchronisation...' : 'Synchroniser depuis OPS'}
              </Button>
            </div>

            {errorArmateurs && (
              <ErrorCard error={errorArmateurs} onRetry={() => refetchArmateurs()} entityName="armateurs" />
            )}

            {/* Vue Liste */}
            {viewMode === "list" ? (
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  {isLoadingArmateurs ? (
                    <Table>
                      <TableHeader>
                         <TableRow className="bg-muted/50">
                           <TableHead>Nom</TableHead>
                           <TableHead>Types de conteneurs</TableHead>
                           <TableHead>Statut</TableHead>
                           <TableHead className="w-32">Actions</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                        <PartenaireTableSkeleton rows={5} />
                      </TableBody>
                    </Table>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                           <TableRow className="bg-muted/50">
                             <TableHead>Nom</TableHead>
                             <TableHead>Types de conteneurs</TableHead>
                             <TableHead>Statut</TableHead>
                             <TableHead className="w-32">Actions</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedArmateurs.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                                <Ship className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>Aucun armateur trouvé</p>
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginatedArmateurs.map((armateur) => (
                              <TableRow key={armateur.id} className="group hover:bg-muted/50">
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <PartenaireAvatar nom={armateur.nom} />
                                    <span className="font-medium text-foreground">
                                      {armateur.nom}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {armateur.types_conteneurs && armateur.types_conteneurs.length > 0 ? (
                                      armateur.types_conteneurs.map((tc) => (
                                        <Badge key={tc} variant="outline" className="text-xs">
                                          {tc}
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-xs text-muted-foreground">—</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                   <Badge 
                                     variant={armateur.actif !== false ? "default" : "secondary"}
                                     className={cn(
                                       armateur.actif !== false && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                     )}
                                   >
                                     {armateur.actif !== false ? "Actif" : "Inactif"}
                                   </Badge>
                                 </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      title="Voir"
                                      onClick={() => navigate(`/partenaires/armateurs/${armateur.id}`)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                      <TablePagination
                        currentPage={armateursPage}
                        totalPages={armateursTotalPages}
                        pageSize={armateursPageSize}
                        totalItems={filteredArmateurs.length}
                        onPageChange={setArmateursPage}
                        onPageSizeChange={(size) => { setArmateursPageSize(size); setArmateursPage(1); }}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              /* Vue Grille */
              <>
                {isLoadingArmateurs ? (
                  <PartenaireGridSkeleton count={6} />
                ) : paginatedArmateurs.length === 0 ? (
                  <Card className="py-12">
                    <div className="text-center text-muted-foreground">
                      <Ship className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>Aucun armateur trouvé</p>
                    </div>
                  </Card>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {paginatedArmateurs.map((armateur) => (
                        <PartenaireCard
                          key={armateur.id}
                          id={armateur.id}
                          nom={armateur.nom}
                          email={armateur.email}
                          telephone={armateur.telephone}
                          adresse={armateur.adresse}
                          actif={armateur.actif !== false}
                          type="armateur"
                          onView={() => navigate(`/partenaires/armateurs/${armateur.id}`)}
                        />
                      ))}
                    </div>
                     <TablePagination
                       currentPage={armateursPage}
                       totalPages={armateursTotalPages}
                       pageSize={armateursPageSize}
                       totalItems={filteredArmateurs.length}
                       onPageChange={setArmateursPage}
                       onPageSizeChange={(size) => { setArmateursPageSize(size); setArmateursPage(1); }}
                     />
                  </>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Modales */}
        <NouveauTransitaireModal
          open={showTransitaireModal}
          onOpenChange={setShowTransitaireModal}
        />
        <NouveauRepresentantModal
          open={showRepresentantModal}
          onOpenChange={setShowRepresentantModal}
        />

        {/* Dialog de confirmation de suppression */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer {deleteConfirm?.type.toLowerCase()} "{deleteConfirm?.nom}" ?
                Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
