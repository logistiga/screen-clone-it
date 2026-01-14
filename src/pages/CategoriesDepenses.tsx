import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Plus,
  Loader2,
  Eye,
  Pencil,
  Trash2,
  Tag,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Wallet
} from "lucide-react";
import { formatMontant } from "@/data/mockData";
import { 
  useCategoriesDepenses, 
  useCreateCategorieDepense, 
  useUpdateCategorieDepense,
  useDeleteCategorieDepense 
} from "@/hooks/use-commercial";
import { CategorieDepense, CategorieDepenseData } from "@/lib/api/commercial";
import { DocumentStatCard } from "@/components/shared/documents/DocumentStatCard";
import { DocumentFilters } from "@/components/shared/documents/DocumentFilters";
import { DocumentLoadingState } from "@/components/shared/documents/DocumentLoadingState";
import { DocumentEmptyState } from "@/components/shared/documents/DocumentEmptyState";

const COULEURS = [
  { value: 'red', label: 'Rouge', class: 'bg-red-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { value: 'yellow', label: 'Jaune', class: 'bg-yellow-500' },
  { value: 'green', label: 'Vert', class: 'bg-green-500' },
  { value: 'blue', label: 'Bleu', class: 'bg-blue-500' },
  { value: 'purple', label: 'Violet', class: 'bg-purple-500' },
  { value: 'pink', label: 'Rose', class: 'bg-pink-500' },
  { value: 'gray', label: 'Gris', class: 'bg-gray-500' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'Tous les types' },
  { value: 'Sortie', label: 'Sorties' },
  { value: 'Entrée', label: 'Entrées' },
];

export default function CategoriesDepensesPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editingCategorie, setEditingCategorie] = useState<CategorieDepense | null>(null);
  const [deletingCategorie, setDeletingCategorie] = useState<CategorieDepense | null>(null);

  // Form state
  const [formData, setFormData] = useState<CategorieDepenseData>({
    nom: '',
    description: '',
    type: 'Sortie',
    couleur: '',
    actif: true,
  });

  const { data: categoriesData, isLoading, refetch } = useCategoriesDepenses({ 
    search: searchTerm || undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    with_stats: true
  });
  const createCategorie = useCreateCategorieDepense();
  const updateCategorie = useUpdateCategorieDepense();
  const deleteCategorie = useDeleteCategorieDepense();

  const categories = categoriesData?.data || [];

  // Stats
  const totalCategories = categories.length;
  const categoriesSorties = categories.filter((c: CategorieDepense) => c.type === 'Sortie').length;
  const categoriesEntrees = categories.filter((c: CategorieDepense) => c.type === 'Entrée').length;
  const totalDepenses = categories.reduce((sum: number, c: CategorieDepense) => sum + (c.total_depenses || 0), 0);

  const openCreateModal = () => {
    setEditingCategorie(null);
    setFormData({
      nom: '',
      description: '',
      type: 'Sortie',
      couleur: '',
      actif: true,
    });
    setShowModal(true);
  };

  const openEditModal = (categorie: CategorieDepense) => {
    setEditingCategorie(categorie);
    setFormData({
      nom: categorie.nom,
      description: categorie.description || '',
      type: categorie.type,
      couleur: categorie.couleur || '',
      actif: categorie.actif,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.nom.trim()) {
      return;
    }

    try {
      if (editingCategorie) {
        await updateCategorie.mutateAsync({
          id: editingCategorie.id,
          data: formData
        });
      } else {
        await createCategorie.mutateAsync(formData);
      }
      setShowModal(false);
      setEditingCategorie(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleDelete = async () => {
    if (!deletingCategorie) return;
    try {
      await deleteCategorie.mutateAsync(deletingCategorie.id);
      setDeletingCategorie(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const getCouleurClass = (couleur?: string) => {
    const c = COULEURS.find(c => c.value === couleur);
    return c?.class || 'bg-gray-400';
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
  };

  const hasActiveFilters = searchTerm !== "" || typeFilter !== "all";

  if (isLoading) {
    return (
      <MainLayout title="Catégories de dépenses">
        <DocumentLoadingState message="Chargement des catégories..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Catégories de dépenses">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Catégories de dépenses</h1>
            <p className="text-muted-foreground">
              Gérez les catégories pour organiser vos mouvements financiers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </Button>
            <Button onClick={openCreateModal} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle catégorie
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <DocumentStatCard
            title="Total catégories"
            value={totalCategories}
            icon={Tag}
            variant="primary"
            delay={0}
          />
          <DocumentStatCard
            title="Catégories de sortie"
            value={categoriesSorties}
            icon={ArrowUpCircle}
            variant="danger"
            delay={0.1}
          />
          <DocumentStatCard
            title="Catégories d'entrée"
            value={categoriesEntrees}
            icon={ArrowDownCircle}
            variant="success"
            delay={0.2}
          />
          <DocumentStatCard
            title="Total dépensé"
            value={formatMontant(totalDepenses)}
            icon={Wallet}
            variant="warning"
            delay={0.3}
          />
        </div>

        {/* Filters */}
        <DocumentFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Rechercher une catégorie..."
          statutFilter={typeFilter}
          onStatutChange={setTypeFilter}
          statutOptions={TYPE_OPTIONS}
        />

        {/* Table */}
        {categories.length === 0 && !hasActiveFilters ? (
          <DocumentEmptyState
            icon={Tag}
            title="Aucune catégorie"
            description="Commencez par créer votre première catégorie de dépenses pour organiser vos mouvements."
            actionLabel="Nouvelle catégorie"
            onAction={openCreateModal}
          />
        ) : categories.length === 0 && hasActiveFilters ? (
          <DocumentEmptyState
            icon={Tag}
            title="Aucun résultat"
            description="Aucune catégorie ne correspond à vos critères de recherche."
            actionLabel="Effacer les filtres"
            onAction={handleClearFilters}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10">
                    <Tag className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Liste des catégories</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {categories.length} catégorie{categories.length > 1 ? 's' : ''} trouvée{categories.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Nom</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="hidden md:table-cell">Description</TableHead>
                      <TableHead>Couleur</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">Mouvements</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((categorie: CategorieDepense, index: number) => (
                      <motion.tr
                        key={categorie.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.3 }}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">{categorie.nom}</TableCell>
                        <TableCell>
                          {categorie.type === 'Sortie' ? (
                            <Badge variant="secondary" className="gap-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
                              <ArrowUpCircle className="h-3 w-3" />
                              Sortie
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
                              <ArrowDownCircle className="h-3 w-3" />
                              Entrée
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-muted-foreground hidden md:table-cell">
                          {categorie.description || '-'}
                        </TableCell>
                        <TableCell>
                          {categorie.couleur ? (
                            <div className={`w-6 h-6 rounded-full ${getCouleurClass(categorie.couleur)} ring-2 ring-offset-2 ring-offset-background ring-transparent`} />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={categorie.actif ? "default" : "secondary"}
                            className={categorie.actif ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200" : ""}
                          >
                            {categorie.actif ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium hidden sm:table-cell">
                          {categorie.nombre_mouvements || 0}
                        </TableCell>
                        <TableCell className="text-right font-medium text-red-600 dark:text-red-400">
                          {formatMontant(categorie.total_depenses || 0)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => navigate(`/categories-depenses/${categorie.id}`)}
                              className="h-8 w-8 transition-all duration-200 hover:scale-110 hover:bg-primary/10"
                              title="Voir les dépenses"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openEditModal(categorie)}
                              className="h-8 w-8 transition-all duration-200 hover:scale-110 hover:bg-primary/10"
                              title="Modifier"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setDeletingCategorie(categorie)}
                              className="h-8 w-8 transition-all duration-200 hover:scale-110 hover:bg-destructive/10 text-destructive"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>

      {/* Modal Create/Edit */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Tag className="h-4 w-4 text-primary" />
              </div>
              {editingCategorie ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </DialogTitle>
            <DialogDescription>
              {editingCategorie ? 'Modifiez les informations de la catégorie' : 'Ajoutez une nouvelle catégorie de dépenses'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                placeholder="Ex: Transport, Fournitures..."
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Type *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: 'Entrée' | 'Sortie') => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sortie">Sortie (Dépense)</SelectItem>
                  <SelectItem value="Entrée">Entrée (Recette)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description de la catégorie..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex flex-wrap gap-2">
                {COULEURS.map((couleur) => (
                  <button
                    key={couleur.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, couleur: couleur.value })}
                    className={`w-8 h-8 rounded-full ${couleur.class} ${
                      formData.couleur === couleur.value 
                        ? 'ring-2 ring-offset-2 ring-primary' 
                        : 'hover:scale-110'
                    } transition-all`}
                    title={couleur.label}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
              <div>
                <p className="text-sm font-medium">Catégorie active</p>
                <p className="text-xs text-muted-foreground">Cette catégorie sera disponible pour les mouvements</p>
              </div>
              <Switch
                checked={formData.actif}
                onCheckedChange={(checked) => setFormData({ ...formData, actif: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createCategorie.isPending || updateCategorie.isPending || !formData.nom.trim()}
              className="gap-2"
            >
              {(createCategorie.isPending || updateCategorie.isPending) ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                editingCategorie ? 'Modifier' : 'Créer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Delete */}
      <AlertDialog open={!!deletingCategorie} onOpenChange={(open) => !open && setDeletingCategorie(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Trash2 className="h-4 w-4 text-destructive" />
              </div>
              Confirmer la suppression
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la catégorie "{deletingCategorie?.nom}" ?
              <br />
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteCategorie.isPending}
            >
              {deleteCategorie.isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
