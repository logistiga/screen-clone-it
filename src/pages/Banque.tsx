import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  Search, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Building2, 
  CreditCard, 
  Loader2,
  CalendarIcon,
  Eye,
  Plus,
  Trash2,
  RotateCcw,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Wallet
} from "lucide-react";
import { formatMontant, formatDate } from "@/data/mockData";
import { useBanques, useMouvementsBancaires, useDeleteMouvementCaisse } from "@/hooks/use-commercial";
import { TablePagination } from "@/components/TablePagination";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { SortieBancaireModal } from "@/components/SortieBancaireModal";
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

export default function BanquePage() {
  const navigate = useNavigate();
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [banqueFilter, setBanqueFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateDebut, setDateDebut] = useState<Date | undefined>();
  const [dateFin, setDateFin] = useState<Date | undefined>();
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // Modals
  const [showSortieModal, setShowSortieModal] = useState(false);
  const [deletingMouvement, setDeletingMouvement] = useState<any>(null);
  
  // Comptes bancaires collapsible
  const [showComptes, setShowComptes] = useState(false);

  // Charger les banques
  const { data: banques = [], isLoading: banquesLoading } = useBanques({ actif: true });

  // Charger les mouvements bancaires unifiés
  const { 
    data: mouvementsData, 
    isLoading: mouvementsLoading, 
    refetch: refetchMouvements 
  } = useMouvementsBancaires({
    search: searchTerm || undefined,
    banque_id: banqueFilter !== 'all' ? banqueFilter : undefined,
    type: typeFilter !== 'all' ? (typeFilter as 'entree' | 'sortie') : undefined,
    date_debut: dateDebut ? format(dateDebut, 'yyyy-MM-dd') : undefined,
    date_fin: dateFin ? format(dateFin, 'yyyy-MM-dd') : undefined,
    page: currentPage,
    per_page: pageSize,
  });

  const deleteMouvement = useDeleteMouvementCaisse();
  const isLoading = banquesLoading || mouvementsLoading;
  
  const mouvements = mouvementsData?.data || [];
  const stats = mouvementsData?.stats || {
    total_encaissements: 0,
    total_decaissements: 0,
    nombre_encaissements: 0,
    nombre_decaissements: 0,
    solde_periode: 0,
  };
  const meta = mouvementsData?.meta || { current_page: 1, last_page: 1, per_page: 20, total: 0 };

  // Solde total des banques
  const totalSoldeBanques = banques.reduce((sum, b) => sum + (b.solde || 0), 0);

  const clearFilters = () => {
    setSearchTerm("");
    setBanqueFilter("all");
    setTypeFilter("all");
    setDateDebut(undefined);
    setDateFin(undefined);
    setCurrentPage(1);
  };

  const hasFilters = searchTerm || banqueFilter !== "all" || typeFilter !== "all" || dateDebut || dateFin;

  const handleDeleteMouvement = async () => {
    if (!deletingMouvement) return;
    try {
      // Extraire l'ID réel (format: mouvement_123)
      const realId = deletingMouvement.source_id;
      await deleteMouvement.mutateAsync(String(realId));
      setDeletingMouvement(null);
      refetchMouvements();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleViewDocument = (mouvement: any) => {
    if (mouvement.document_type === 'facture' && mouvement.document_id) {
      navigate(`/factures/${mouvement.document_id}`);
    } else if (mouvement.document_type === 'ordre' && mouvement.document_id) {
      navigate(`/ordres/${mouvement.document_id}`);
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Banque">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  // État vide
  if (banques.length === 0 && mouvements.length === 0) {
    return (
      <MainLayout title="Banque">
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
          <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Aucun mouvement bancaire</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Les paiements par virement et chèque ainsi que les sorties bancaires apparaîtront ici. 
            Configurez d'abord vos comptes bancaires dans Paramétrage → Banques.
          </p>
          <Button onClick={() => navigate('/banques')}>
            <Building2 className="h-4 w-4 mr-2" />
            Configurer les banques
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Banque">
      <div className="space-y-6 animate-fade-in">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-primary transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Solde Total Banques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMontant(totalSoldeBanques)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {banques.length} compte{banques.length > 1 ? 's' : ''} actif{banques.length > 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Encaissements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+{formatMontant(stats.total_encaissements)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.nombre_encaissements} opération{stats.nombre_encaissements > 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                Décaissements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">-{formatMontant(stats.total_decaissements)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.nombre_decaissements} opération{stats.nombre_decaissements > 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Solde Période
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                stats.solde_periode >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {stats.solde_periode >= 0 ? '+' : ''}{formatMontant(stats.solde_periode)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Encaissements - Décaissements
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres unifiés */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              {/* Ligne 1: Recherche, Banque, Type */}
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par client, référence, description..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-9"
                  />
                </div>
                
                <Select value={banqueFilter} onValueChange={(v) => { setBanqueFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Toutes les banques" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les banques</SelectItem>
                    {banques.map((banque) => (
                      <SelectItem key={banque.id} value={banque.id}>
                        {banque.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les mouvements</SelectItem>
                    <SelectItem value="entree">
                      <span className="flex items-center gap-2">
                        <ArrowDownCircle className="h-4 w-4 text-green-600" />
                        Encaissements
                      </span>
                    </SelectItem>
                    <SelectItem value="sortie">
                      <span className="flex items-center gap-2">
                        <ArrowUpCircle className="h-4 w-4 text-red-600" />
                        Décaissements
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Ligne 2: Dates et actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={cn(
                          "w-full sm:w-[160px] justify-start text-left font-normal",
                          !dateDebut && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateDebut ? format(dateDebut, "dd/MM/yyyy", { locale: fr }) : "Date début"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar 
                        mode="single" 
                        selected={dateDebut} 
                        onSelect={(d) => { setDateDebut(d); setCurrentPage(1); }}
                        initialFocus 
                        locale={fr}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={cn(
                          "w-full sm:w-[160px] justify-start text-left font-normal",
                          !dateFin && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFin ? format(dateFin, "dd/MM/yyyy", { locale: fr }) : "Date fin"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar 
                        mode="single" 
                        selected={dateFin} 
                        onSelect={(d) => { setDateFin(d); setCurrentPage(1); }}
                        initialFocus 
                        locale={fr}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  
                  {hasFilters && (
                    <Button variant="ghost" onClick={clearFilters} className="gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Réinitialiser
                    </Button>
                  )}
                </div>

                <Button onClick={() => setShowSortieModal(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nouvelle sortie bancaire
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tableau unifié des mouvements */}
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Mouvements bancaires
              </span>
              <Badge variant="secondary">{meta.total} mouvement{meta.total > 1 ? 's' : ''}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead className="w-[120px]">Type</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Tiers</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Banque</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mouvements.map((mouvement, index) => (
                    <TableRow 
                      key={mouvement.id}
                      className="transition-all duration-200 animate-fade-in hover:bg-muted/50"
                      style={{ animationDelay: `${index * 20}ms` }}
                    >
                      <TableCell className="font-medium">
                        {formatDate(mouvement.date)}
                      </TableCell>
                      <TableCell>
                        {mouvement.type === 'entree' ? (
                          <Badge className="gap-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 hover:bg-green-100">
                            <ArrowDownCircle className="h-3 w-3" />
                            Encaissement
                          </Badge>
                        ) : (
                          <Badge className="gap-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 hover:bg-red-100">
                            <ArrowUpCircle className="h-3 w-3" />
                            Décaissement
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {mouvement.categorie}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {mouvement.tiers || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {mouvement.description ? (
                          mouvement.document_type ? (
                            <span 
                              className="text-primary hover:underline cursor-pointer font-medium truncate block"
                              onClick={() => handleViewDocument(mouvement)}
                            >
                              {mouvement.description}
                            </span>
                          ) : (
                            <span className="truncate block">{mouvement.description}</span>
                          )
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {mouvement.banque ? (
                          <Badge variant="outline" className="gap-1">
                            <Building2 className="h-3 w-3" />
                            {mouvement.banque.nom}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {mouvement.reference ? (
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {mouvement.reference}
                          </code>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-bold",
                        mouvement.type === 'entree' ? "text-green-600" : "text-red-600"
                      )}>
                        {mouvement.type === 'entree' ? '+' : '-'}{formatMontant(mouvement.montant)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {mouvement.document_type && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleViewDocument(mouvement)}
                              className="transition-all duration-200 hover:scale-110 hover:bg-primary/10"
                              title="Voir le document"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {mouvement.source_type === 'mouvement' && (
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setDeletingMouvement(mouvement)}
                              className="transition-all duration-200 hover:scale-110 hover:bg-destructive/10 text-destructive"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {mouvements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <CreditCard className="h-8 w-8 opacity-50" />
                          <p>Aucun mouvement bancaire trouvé</p>
                          {hasFilters && (
                            <Button variant="link" onClick={clearFilters} className="text-primary">
                              Réinitialiser les filtres
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {meta.last_page > 1 && (
          <TablePagination
            currentPage={meta.current_page}
            totalPages={meta.last_page}
            pageSize={pageSize}
            totalItems={meta.total}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
          />
        )}

        {/* Section Comptes Bancaires (collapsible) */}
        <Collapsible open={showComptes} onOpenChange={setShowComptes}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Comptes bancaires
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{banques.length} compte{banques.length > 1 ? 's' : ''}</Badge>
                    <ChevronDown className={cn(
                      "h-5 w-5 transition-transform duration-200",
                      showComptes && "rotate-180"
                    )} />
                  </div>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {banques.map((banque, index) => (
                    <Card 
                      key={banque.id} 
                      className="overflow-hidden transition-all duration-300 hover:shadow-lg animate-fade-in border-l-4 border-l-primary/50"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <CardHeader className="bg-muted/30 pb-3">
                        <CardTitle className="flex items-center justify-between text-base">
                          <span className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            {banque.nom}
                          </span>
                          <Badge variant="default" className="bg-green-600 text-xs">Actif</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Solde actuel</p>
                            <p className="text-2xl font-bold text-primary">
                              {formatMontant(banque.solde || 0)}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                            <div>
                              <p className="text-xs text-muted-foreground">Paiements</p>
                              <p className="text-sm font-semibold">{banque.paiements_count || 0}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Total encaissé</p>
                              <p className="text-sm font-semibold text-green-600">
                                {formatMontant(banque.paiements_sum_montant || 0)}
                              </p>
                            </div>
                          </div>
                          {(banque.numero_compte || banque.iban) && (
                            <div className="pt-2 border-t space-y-1 text-xs text-muted-foreground">
                              {banque.numero_compte && <p><strong>N° Compte:</strong> {banque.numero_compte}</p>}
                              {banque.iban && <p><strong>IBAN:</strong> {banque.iban}</p>}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {banques.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun compte bancaire actif.{" "}
                    <span 
                      className="text-primary hover:underline cursor-pointer"
                      onClick={() => navigate('/banques')}
                    >
                      Configurer les banques
                    </span>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>

      {/* Modal Sortie Bancaire */}
      <SortieBancaireModal
        open={showSortieModal}
        onOpenChange={setShowSortieModal}
        onSuccess={() => {
          refetchMouvements();
        }}
      />

      {/* Dialogue de confirmation de suppression */}
      <AlertDialog open={!!deletingMouvement} onOpenChange={(open) => !open && setDeletingMouvement(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce décaissement de{' '}
              <strong>{deletingMouvement && formatMontant(deletingMouvement.montant)}</strong> ?
              <br />
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteMouvement}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteMouvement.isPending}
            >
              {deleteMouvement.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
