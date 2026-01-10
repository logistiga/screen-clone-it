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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Search, 
  Plus,
  Loader2,
  Eye,
  Pencil,
  Trash2,
  Tag,
  ArrowUpCircle,
  ArrowDownCircle
} from "lucide-react";
import { formatMontant } from "@/data/mockData";
import { 
  useCategoriesDepenses, 
  useCreateCategorieDepense, 
  useUpdateCategorieDepense,
  useDeleteCategorieDepense 
} from "@/hooks/use-commercial";
import { CategorieDepense, CategorieDepenseData } from "@/lib/api/commercial";

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

  const { data: categoriesData, isLoading } = useCategoriesDepenses({ 
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

  if (isLoading) {
    return (
      <MainLayout title="Catégories de dépenses">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Catégories de dépenses">
      <div className="space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-primary transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Total catégories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCategories}</div>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ArrowUpCircle className="h-4 w-4 text-red-600" />
                Catégories de sortie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{categoriesSorties}</div>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ArrowUpCircle className="h-4 w-4 text-red-600" />
                Total dépensé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatMontant(totalDepenses)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="Sortie">Sorties</SelectItem>
                <SelectItem value="Entrée">Entrées</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle catégorie
          </Button>
        </div>

        {/* Table */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              Liste des catégories
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Couleur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Nb mouvements</TableHead>
                  <TableHead className="text-right">Total dépensé</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((categorie: CategorieDepense, index: number) => (
                  <TableRow 
                    key={categorie.id}
                    className="transition-all duration-200 animate-fade-in hover:bg-muted/50"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <TableCell className="font-medium">{categorie.nom}</TableCell>
                    <TableCell>
                      {categorie.type === 'Sortie' ? (
                        <Badge variant="secondary" className="gap-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
                          <ArrowUpCircle className="h-3 w-3" />
                          Sortie
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                          <ArrowDownCircle className="h-3 w-3" />
                          Entrée
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {categorie.description || '-'}
                    </TableCell>
                    <TableCell>
                      {categorie.couleur ? (
                        <div className={`w-6 h-6 rounded-full ${getCouleurClass(categorie.couleur)}`} />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={categorie.actif ? "default" : "secondary"}>
                        {categorie.actif ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {categorie.nombre_mouvements || 0}
                    </TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      {formatMontant(categorie.total_depenses || 0)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => navigate(`/categories-depenses/${categorie.id}`)}
                          className="transition-all duration-200 hover:scale-110 hover:bg-primary/10"
                          title="Voir les dépenses"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditModal(categorie)}
                          className="transition-all duration-200 hover:scale-110 hover:bg-primary/10"
                          title="Modifier"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setDeletingCategorie(categorie)}
                          className="transition-all duration-200 hover:scale-110 hover:bg-destructive/10 text-destructive"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {categories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Aucune catégorie trouvée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modal Create/Edit */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
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

            <div className="flex items-center justify-between">
              <Label htmlFor="actif">Catégorie active</Label>
              <Switch
                id="actif"
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
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
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
