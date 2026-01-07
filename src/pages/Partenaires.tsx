import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Search, Eye, Edit, Trash2, Ship, User, Truck, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatMontant } from "@/data/mockData";
import { NouveauTransitaireModal } from "@/components/NouveauTransitaireModal";
import { NouveauRepresentantModal } from "@/components/NouveauRepresentantModal";
import { NouvelArmateurModal } from "@/components/NouvelArmateurModal";
import { TablePagination } from "@/components/TablePagination";
import { 
  useTransitaires, 
  useRepresentants, 
  useArmateurs,
  useDeleteTransitaire,
  useDeleteRepresentant,
  useDeleteArmateur
} from "@/hooks/use-commercial";

export default function PartenairesPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; nom: string; type: string } | null>(null);
  const [showTransitaireModal, setShowTransitaireModal] = useState(false);
  const [showRepresentantModal, setShowRepresentantModal] = useState(false);
  const [showArmateurModal, setShowArmateurModal] = useState(false);
  
  // Pagination states
  const [transitairesPage, setTransitairesPage] = useState(1);
  const [transitairesPageSize, setTransitairesPageSize] = useState(10);
  const [representantsPage, setRepresentantsPage] = useState(1);
  const [representantsPageSize, setRepresentantsPageSize] = useState(10);
  const [armateursPage, setArmateursPage] = useState(1);
  const [armateursPageSize, setArmateursPageSize] = useState(10);

  // Fetch data from API
  const { data: transitaires = [], isLoading: isLoadingTransitaires } = useTransitaires();
  const { data: representants = [], isLoading: isLoadingRepresentants } = useRepresentants();
  const { data: armateurs = [], isLoading: isLoadingArmateurs } = useArmateurs();

  // Delete mutations
  const deleteTransitaireMutation = useDeleteTransitaire();
  const deleteRepresentantMutation = useDeleteRepresentant();
  const deleteArmateurMutation = useDeleteArmateur();

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
        deleteArmateurMutation.mutate(deleteConfirm.id);
      }
      setDeleteConfirm(null);
    }
  };

  const isLoading = isLoadingTransitaires || isLoadingRepresentants || isLoadingArmateurs;

  return (
    <MainLayout title="Partenaires">
      <div className="space-y-6">
        {/* Recherche */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un partenaire..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs defaultValue="transitaires" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transitaires" className="gap-2">
              <Truck className="h-4 w-4" />
              Transitaires ({transitaires.length})
            </TabsTrigger>
            <TabsTrigger value="representants" className="gap-2">
              <User className="h-4 w-4" />
              Représentants ({representants.length})
            </TabsTrigger>
            <TabsTrigger value="armateurs" className="gap-2">
              <Ship className="h-4 w-4" />
              Armateurs ({armateurs.length})
            </TabsTrigger>
          </TabsList>

          {/* Onglet Transitaires */}
          <TabsContent value="transitaires" className="mt-6 space-y-6">
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Transitaires
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{transitaires.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Actifs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {transitaires.filter(t => t.actif !== false).length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Inactifs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-muted-foreground">
                    {transitaires.filter(t => t.actif === false).length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions + Table */}
            <div className="flex justify-end">
              <Button className="gap-2" onClick={() => setShowTransitaireModal(true)}>
                <Plus className="h-4 w-4" />
                Nouveau transitaire
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {isLoadingTransitaires ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Nom</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Adresse</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="w-32">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedTransitaires.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              Aucun transitaire trouvé
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedTransitaires.map((transitaire) => (
                            <TableRow key={transitaire.id} className="cursor-pointer hover:bg-muted/50">
                              <TableCell 
                                className="font-medium text-primary hover:underline cursor-pointer"
                                onClick={() => navigate(`/partenaires/transitaires/${transitaire.id}`)}
                              >
                                {transitaire.nom}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">{transitaire.email || '-'}</div>
                                <div className="text-xs text-muted-foreground">{transitaire.telephone || '-'}</div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {transitaire.adresse || '-'}
                              </TableCell>
                              <TableCell>
                                <Badge variant={transitaire.actif !== false ? "default" : "secondary"}>
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
                          ))
                        )}
                      </TableBody>
                    </Table>
                    <TablePagination
                      currentPage={transitairesPage}
                      totalPages={Math.ceil(filteredTransitaires.length / transitairesPageSize)}
                      pageSize={transitairesPageSize}
                      totalItems={filteredTransitaires.length}
                      onPageChange={setTransitairesPage}
                      onPageSizeChange={(size) => { setTransitairesPageSize(size); setTransitairesPage(1); }}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Représentants */}
          <TabsContent value="representants" className="mt-6 space-y-6">
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Représentants
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{representants.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Actifs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {representants.filter(r => r.actif !== false).length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Inactifs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-muted-foreground">
                    {representants.filter(r => r.actif === false).length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions + Table */}
            <div className="flex justify-end">
              <Button className="gap-2" onClick={() => setShowRepresentantModal(true)}>
                <Plus className="h-4 w-4" />
                Nouveau représentant
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {isLoadingRepresentants ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Nom</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Adresse</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="w-32">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedRepresentants.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              Aucun représentant trouvé
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedRepresentants.map((representant) => (
                            <TableRow key={representant.id} className="cursor-pointer hover:bg-muted/50">
                              <TableCell 
                                className="font-medium text-primary hover:underline cursor-pointer"
                                onClick={() => navigate(`/partenaires/representants/${representant.id}`)}
                              >
                                {representant.nom}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">{representant.email || '-'}</div>
                                <div className="text-xs text-muted-foreground">{representant.telephone || '-'}</div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {representant.adresse || '-'}
                              </TableCell>
                              <TableCell>
                                <Badge variant={representant.actif !== false ? "default" : "secondary"}>
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
                          ))
                        )}
                      </TableBody>
                    </Table>
                    <TablePagination
                      currentPage={representantsPage}
                      totalPages={Math.ceil(filteredRepresentants.length / representantsPageSize)}
                      pageSize={representantsPageSize}
                      totalItems={filteredRepresentants.length}
                      onPageChange={setRepresentantsPage}
                      onPageSizeChange={(size) => { setRepresentantsPageSize(size); setRepresentantsPage(1); }}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Armateurs */}
          <TabsContent value="armateurs" className="mt-6 space-y-6">
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Armateurs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{armateurs.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Actifs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {armateurs.filter(a => a.actif !== false).length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Actions + Table */}
            <div className="flex justify-end">
              <Button className="gap-2" onClick={() => setShowArmateurModal(true)}>
                <Plus className="h-4 w-4" />
                Nouvel armateur
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {isLoadingArmateurs ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Nom</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Adresse</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="w-32">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedArmateurs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              Aucun armateur trouvé
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedArmateurs.map((armateur) => (
                            <TableRow key={armateur.id} className="cursor-pointer hover:bg-muted/50">
                              <TableCell className="font-medium">
                                {armateur.nom}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">{armateur.email || '-'}</div>
                                <div className="text-xs text-muted-foreground">{armateur.telephone || '-'}</div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {armateur.adresse || '-'}
                              </TableCell>
                              <TableCell>
                                <Badge variant={armateur.actif !== false ? "default" : "secondary"}>
                                  {armateur.actif !== false ? "Actif" : "Inactif"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" title="Modifier">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-destructive"
                                    title="Supprimer"
                                    onClick={() => setDeleteConfirm({ id: armateur.id, nom: armateur.nom, type: "Armateur" })}
                                  >
                                    <Trash2 className="h-4 w-4" />
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
                      totalPages={Math.ceil(filteredArmateurs.length / armateursPageSize)}
                      pageSize={armateursPageSize}
                      totalItems={filteredArmateurs.length}
                      onPageChange={setArmateursPage}
                      onPageSizeChange={(size) => { setArmateursPageSize(size); setArmateursPage(1); }}
                    />
                  </>
                )}
              </CardContent>
            </Card>
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
        <NouvelArmateurModal
          open={showArmateurModal}
          onOpenChange={setShowArmateurModal}
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
