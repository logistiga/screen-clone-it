import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Percent, 
  Save, 
  RefreshCw, 
  Settings,
  GripVertical,
  Power,
  PowerOff
} from "lucide-react";
import { Taxe, TaxeFormData } from "@/lib/api/taxes";
import { 
  useTaxes, 
  useCreateTaxe, 
  useUpdateTaxe, 
  useDeleteTaxe,
  useToggleTaxeActive 
} from "@/hooks/use-taxes";

interface GestionTaxesProps {
  onRefresh?: () => void;
}

const defaultFormData: TaxeFormData = {
  code: '',
  nom: '',
  taux: 0,
  description: '',
  obligatoire: false,
  active: true,
};

export function GestionTaxes({ onRefresh }: GestionTaxesProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTaxe, setEditingTaxe] = useState<Taxe | null>(null);
  const [taxeToDelete, setTaxeToDelete] = useState<Taxe | null>(null);
  const [formData, setFormData] = useState<TaxeFormData>(defaultFormData);

  // Hooks
  const { data: taxesData, isLoading, refetch } = useTaxes();
  const createMutation = useCreateTaxe();
  const updateMutation = useUpdateTaxe();
  const deleteMutation = useDeleteTaxe();
  const toggleActiveMutation = useToggleTaxeActive();

  const taxes = taxesData?.data || [];

  const handleOpenCreate = () => {
    setEditingTaxe(null);
    setFormData(defaultFormData);
    setShowEditModal(true);
  };

  const handleOpenEdit = (taxe: Taxe) => {
    setEditingTaxe(taxe);
    setFormData({
      code: taxe.code,
      nom: taxe.nom,
      taux: taxe.taux,
      description: taxe.description || '',
      obligatoire: taxe.obligatoire,
      active: taxe.active,
    });
    setShowEditModal(true);
  };

  const handleOpenDelete = (taxe: Taxe) => {
    setTaxeToDelete(taxe);
    setShowDeleteModal(true);
  };

  const handleSave = () => {
    if (!formData.code.trim() || !formData.nom.trim()) {
      return;
    }

    if (editingTaxe) {
      updateMutation.mutate({
        id: editingTaxe.id,
        data: formData,
      }, {
        onSuccess: () => {
          setShowEditModal(false);
          refetch();
          onRefresh?.();
        },
      });
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          setShowEditModal(false);
          refetch();
          onRefresh?.();
        },
      });
    }
  };

  const handleDelete = () => {
    if (!taxeToDelete) return;

    deleteMutation.mutate(taxeToDelete.id, {
      onSuccess: () => {
        setShowDeleteModal(false);
        setTaxeToDelete(null);
        refetch();
        onRefresh?.();
      },
    });
  };

  const handleToggleActive = (taxe: Taxe) => {
    toggleActiveMutation.mutate(taxe.id, {
      onSuccess: () => {
        refetch();
        onRefresh?.();
      },
    });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Configuration des taxes</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Gérez les taxes applicables aux documents
                </p>
              </div>
            </div>
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter une taxe
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-12"></TableHead>
                <TableHead className="font-semibold">Code</TableHead>
                <TableHead className="font-semibold">Nom</TableHead>
                <TableHead className="text-center font-semibold">Taux</TableHead>
                <TableHead className="font-semibold">Description</TableHead>
                <TableHead className="text-center font-semibold">Type</TableHead>
                <TableHead className="text-center font-semibold">Statut</TableHead>
                <TableHead className="text-center font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Aucune taxe configurée
                  </TableCell>
                </TableRow>
              ) : (
                taxes.map((taxe, index) => (
                  <motion.tr
                    key={taxe.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="w-12">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    </TableCell>
                    <TableCell className="font-mono font-bold text-primary">
                      {taxe.code}
                    </TableCell>
                    <TableCell className="font-medium">{taxe.nom}</TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant="secondary" 
                        className="text-sm font-semibold bg-primary/10 text-primary border-0"
                      >
                        {taxe.taux}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {taxe.description || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {taxe.obligatoire ? (
                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                          Obligatoire
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Optionnelle
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={taxe.active ? "default" : "secondary"}
                        className={taxe.active ? "bg-emerald-500/10 text-emerald-600 border-0" : ""}
                      >
                        {taxe.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(taxe)}
                          disabled={toggleActiveMutation.isPending}
                          className="h-8 w-8"
                          title={taxe.active ? 'Désactiver' : 'Activer'}
                        >
                          {taxe.active ? (
                            <Power className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <PowerOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(taxe)}
                          className="h-8 w-8"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDelete(taxe)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>

          {/* Résumé des taxes actives */}
          {taxes.length > 0 && (
            <div className="p-4 bg-muted/30 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    <strong>{taxes.filter(t => t.active).length}</strong> taxes actives sur {taxes.length}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Taux total cumulé:</span>
                  <Badge className="font-mono text-lg bg-primary/10 text-primary border-0">
                    {taxes.filter(t => t.active).reduce((sum, t) => sum + t.taux, 0).toFixed(2)}%
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal création/édition */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Percent className="h-5 w-5 text-primary" />
              </div>
              {editingTaxe ? 'Modifier la taxe' : 'Nouvelle taxe'}
            </DialogTitle>
            <DialogDescription>
              {editingTaxe 
                ? `Modifiez les paramètres de la taxe ${editingTaxe.code}`
                : 'Ajoutez une nouvelle taxe à appliquer sur les documents'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="TVA"
                  className="font-mono uppercase"
                  maxLength={20}
                />
                <p className="text-xs text-muted-foreground">Ex: TVA, CSS, IR...</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taux">Taux (%) *</Label>
                <Input
                  id="taux"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.taux}
                  onChange={(e) => setFormData({ ...formData, taux: parseFloat(e.target.value) || 0 })}
                  className="font-mono"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nom">Nom complet *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Taxe sur la Valeur Ajoutée"
                maxLength={100}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description de la taxe..."
                rows={2}
                maxLength={500}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
              <div>
                <Label className="font-medium">Taxe obligatoire</Label>
                <p className="text-xs text-muted-foreground">
                  Sera appliquée par défaut sur tous les documents
                </p>
              </div>
              <Switch
                checked={formData.obligatoire}
                onCheckedChange={(checked) => setFormData({ ...formData, obligatoire: checked })}
              />
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
              <div>
                <Label className="font-medium">Taxe active</Label>
                <p className="text-xs text-muted-foreground">
                  Peut être sélectionnée lors de la création de documents
                </p>
              </div>
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving || !formData.code.trim() || !formData.nom.trim()}
              className="gap-2"
            >
              {isSaving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {editingTaxe ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal confirmation suppression */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la taxe ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la taxe <strong>{taxeToDelete?.code}</strong> ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
