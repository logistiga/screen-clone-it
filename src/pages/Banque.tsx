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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Search, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Building2, 
  CreditCard, 
  Receipt,
  Loader2,
  CalendarIcon,
  Eye,
  Plus
} from "lucide-react";
import { formatMontant, formatDate } from "@/data/mockData";
import { useBanques, usePaiements, useMouvementsCaisse, useDeleteMouvementCaisse } from "@/hooks/use-commercial";
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
import { Trash2, Pencil } from "lucide-react";

export default function BanquePage() {
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [banqueFilter, setBanqueFilter] = useState<string>("all");
  const [dateDebut, setDateDebut] = useState<Date | undefined>();
  const [dateFin, setDateFin] = useState<Date | undefined>();
  const [activeTab, setActiveTab] = useState("mouvements");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [showSortieModal, setShowSortieModal] = useState(false);
  const [editingMouvement, setEditingMouvement] = useState<any>(null);
  const [deletingMouvement, setDeletingMouvement] = useState<any>(null);

  // Charger les banques
  const { data: banques = [], isLoading: banquesLoading } = useBanques({ actif: true });

  // Charger tous les paiements bancaires (virement ET chèque)
  const { data: paiementsData, isLoading: paiementsLoading } = usePaiements({
    search: searchTerm || undefined,
    banque_id: banqueFilter !== 'all' ? banqueFilter : undefined,
    date_debut: dateDebut ? format(dateDebut, 'yyyy-MM-dd') : undefined,
    date_fin: dateFin ? format(dateFin, 'yyyy-MM-dd') : undefined,
    page: currentPage,
    per_page: pageSize,
  });

  // Charger les décaissements bancaires (sorties)
  const { data: decaissementsData, isLoading: decaissementsLoading, refetch: refetchDecaissements } = useMouvementsCaisse({
    type: 'Sortie',
    source: 'banque',
    banque_id: banqueFilter !== 'all' ? banqueFilter : undefined,
    date_debut: dateDebut ? format(dateDebut, 'yyyy-MM-dd') : undefined,
    date_fin: dateFin ? format(dateFin, 'yyyy-MM-dd') : undefined,
    per_page: 1000,
  });

  const deleteMouvement = useDeleteMouvementCaisse();
  const isLoading = banquesLoading || paiementsLoading;
  
  const allPaiements = paiementsData?.data || [];
  const decaissementsList = decaissementsData?.data || [];
  const totalPages = paiementsData?.meta?.last_page || 1;
  const totalItems = paiementsData?.meta?.total || 0;

  // Filtrer uniquement les paiements bancaires (virement et chèque)
  const bankPaiements = allPaiements.filter((p: any) => 
    p.mode_paiement === 'Virement' || p.mode_paiement === 'Chèque'
  );

  // Stats
  const totalBanques = banques.reduce((sum, b) => sum + (b.solde || 0), 0);
  const totalVirements = bankPaiements.filter((p: any) => p.mode_paiement === 'Virement').reduce((sum: number, p: any) => sum + (p.montant || 0), 0);
  const totalCheques = bankPaiements.filter((p: any) => p.mode_paiement === 'Chèque').reduce((sum: number, p: any) => sum + (p.montant || 0), 0);
  const totalEncaissements = bankPaiements.reduce((sum: number, p: any) => sum + (p.montant || 0), 0);
  const totalDecaissements = decaissementsList.reduce((sum: number, d: any) => sum + (d.montant || 0), 0);

  const clearFilters = () => {
    setSearchTerm("");
    setBanqueFilter("all");
    setDateDebut(undefined);
    setDateFin(undefined);
    setCurrentPage(1);
  };

  const handleDeleteMouvement = async () => {
    if (!deletingMouvement) return;
    try {
      await deleteMouvement.mutateAsync(deletingMouvement.id);
      setDeletingMouvement(null);
      refetchDecaissements();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleEditMouvement = (mouvement: any) => {
    setEditingMouvement(mouvement);
    setShowSortieModal(true);
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
  if (banques.length === 0 && bankPaiements.length === 0) {
    return (
      <MainLayout title="Banque">
        <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
          <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Aucun mouvement bancaire</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Les paiements par virement et chèque apparaîtront ici. 
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
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-primary transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Solde Total Banques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMontant(totalBanques)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {banques.length} compte{banques.length > 1 ? 's' : ''} actif{banques.length > 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ArrowDownCircle className="h-4 w-4 text-green-600" />
                Total Encaissements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatMontant(totalEncaissements)}</div>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ArrowUpCircle className="h-4 w-4 text-red-600" />
                Total Décaissements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatMontant(totalDecaissements)}</div>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Virements reçus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{formatMontant(totalVirements)}</div>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Chèques reçus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatMontant(totalCheques)}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              <TabsTrigger value="mouvements">Encaissements</TabsTrigger>
              <TabsTrigger value="decaissements">Décaissements</TabsTrigger>
              <TabsTrigger value="comptes">Comptes bancaires</TabsTrigger>
            </TabsList>
            <Button onClick={() => setShowSortieModal(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle sortie bancaire
            </Button>
          </div>

          <TabsContent value="mouvements" className="space-y-4 mt-4">
            {/* Filters */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={banqueFilter} onValueChange={setBanqueFilter}>
                  <SelectTrigger className="w-full sm:w-48">
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
              </div>
              
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={cn(
                        "w-full sm:w-48 justify-start text-left font-normal",
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
                      onSelect={setDateDebut}
                      initialFocus 
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={cn(
                        "w-full sm:w-48 justify-start text-left font-normal",
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
                      onSelect={setDateFin}
                      initialFocus 
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
                
                {(searchTerm || banqueFilter !== "all" || dateDebut || dateFin) && (
                  <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
                    Réinitialiser les filtres
                  </Button>
                )}
              </div>
            </div>

            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-primary" />
                  Encaissements bancaires
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Document</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Banque</TableHead>
                      <TableHead>Référence</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="w-16">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bankPaiements.map((paiement: any, index: number) => (
                      <TableRow 
                        key={paiement.id}
                        className="transition-all duration-200 animate-fade-in hover:bg-muted/50"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <TableCell>{formatDate(paiement.date)}</TableCell>
                        <TableCell>
                          {paiement.client?.nom || 
                            paiement.facture?.client?.nom || 
                            paiement.ordre?.client?.nom || 
                            '-'}
                        </TableCell>
                        <TableCell>
                          {paiement.document_numero ? (
                            <span 
                              className="text-primary hover:underline cursor-pointer font-medium"
                              onClick={() => {
                                if (paiement.document_type === 'facture' && paiement.facture_id) {
                                  navigate(`/factures/${paiement.facture_id}`);
                                } else if (paiement.ordre_id) {
                                  navigate(`/ordres/${paiement.ordre_id}`);
                                }
                              }}
                            >
                              {paiement.document_numero}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {paiement.mode_paiement === 'Virement' ? (
                            <Badge variant="secondary" className="gap-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200">
                              <Building2 className="h-3 w-3" />
                              Virement
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                              <CreditCard className="h-3 w-3" />
                              Chèque
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {paiement.banque?.nom ? (
                            <Badge variant="outline" className="gap-1">
                              <Building2 className="h-3 w-3" />
                              {paiement.banque.nom}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {paiement.reference || paiement.numero_cheque ? (
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {paiement.reference || paiement.numero_cheque}
                            </code>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          +{formatMontant(paiement.montant)}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              if (paiement.document_type === 'facture' && paiement.facture_id) {
                                navigate(`/factures/${paiement.facture_id}`);
                              } else if (paiement.ordre_id) {
                                navigate(`/ordres/${paiement.ordre_id}`);
                              }
                            }}
                            className="transition-all duration-200 hover:scale-110 hover:bg-primary/10"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {bankPaiements.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                          Aucun encaissement bancaire trouvé
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            )}
          </TabsContent>

          {/* Onglet Décaissements */}
          <TabsContent value="decaissements" className="space-y-4 mt-4">
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpCircle className="h-5 w-5 text-red-600" />
                  Décaissements bancaires (Sorties)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Date</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Bénéficiaire</TableHead>
                      <TableHead>Banque</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {decaissementsList.map((mouvement: any, index: number) => (
                      <TableRow 
                        key={mouvement.id}
                        className="transition-all duration-200 animate-fade-in hover:bg-muted/50"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <TableCell>{formatDate(mouvement.date || mouvement.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {mouvement.categorie}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {mouvement.description}
                        </TableCell>
                        <TableCell>
                          {mouvement.beneficiaire || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          {mouvement.banque?.nom ? (
                            <Badge variant="outline" className="gap-1">
                              <Building2 className="h-3 w-3" />
                              {mouvement.banque.nom}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium text-red-600">
                          -{formatMontant(mouvement.montant)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setDeletingMouvement(mouvement)}
                              className="transition-all duration-200 hover:scale-110 hover:bg-destructive/10 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {decaissementsList.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          Aucun décaissement bancaire trouvé
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comptes" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {banques.map((banque, index) => (
                <Card 
                  key={banque.id} 
                  className="overflow-hidden transition-all duration-300 hover:shadow-lg animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardHeader className="bg-muted/30 pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        {banque.nom}
                      </div>
                      <Badge variant="default" className="bg-green-600">Actif</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Solde actuel</p>
                        <p className="text-3xl font-bold text-primary">
                          {formatMontant(banque.solde || 0)}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground">Paiements reçus</p>
                          <p className="text-sm font-semibold text-green-600">
                            {banque.paiements_count || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total encaissé</p>
                          <p className="text-sm font-semibold text-primary">
                            {formatMontant(banque.paiements_sum_montant || 0)}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t space-y-1 text-xs text-muted-foreground">
                        {banque.numero_compte && (
                          <p><strong>N° Compte:</strong> {banque.numero_compte}</p>
                        )}
                        {banque.iban && <p><strong>IBAN:</strong> {banque.iban}</p>}
                        {banque.swift && <p><strong>SWIFT:</strong> {banque.swift}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {banques.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  Aucun compte bancaire actif.{" "}
                  <span 
                    className="text-primary hover:underline cursor-pointer"
                    onClick={() => navigate('/banques')}
                  >
                    Configurer les banques
                  </span>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal Sortie Bancaire */}
      <SortieBancaireModal
        open={showSortieModal}
        onOpenChange={(open) => {
          setShowSortieModal(open);
          if (!open) setEditingMouvement(null);
        }}
        onSuccess={() => {
          refetchDecaissements();
          setEditingMouvement(null);
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
