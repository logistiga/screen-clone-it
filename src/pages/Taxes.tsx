import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, Edit, Trash2, Percent, Save } from "lucide-react";
import { toast } from "sonner";

interface Taxe {
  id: string;
  code: string;
  nom: string;
  taux: number;
  description: string;
  obligatoire: boolean;
  active: boolean;
}

const initialTaxes: Taxe[] = [
  {
    id: "1",
    code: "TVA",
    nom: "Taxe sur la Valeur Ajoutée",
    taux: 18,
    description: "Taxe applicable sur toutes les prestations de services",
    obligatoire: true,
    active: true,
  },
  {
    id: "2",
    code: "CSS",
    nom: "Contribution Spéciale de Solidarité",
    taux: 1,
    description: "Contribution au titre de la solidarité nationale",
    obligatoire: true,
    active: true,
  },
];

export default function TaxesPage() {
  const [taxes, setTaxes] = useState<Taxe[]>(initialTaxes);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTaxe, setSelectedTaxe] = useState<Taxe | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    nom: "",
    taux: "",
    description: "",
    obligatoire: false,
    active: true,
  });

  const resetForm = () => {
    setFormData({
      code: "",
      nom: "",
      taux: "",
      description: "",
      obligatoire: false,
      active: true,
    });
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsEditing(false);
    setSelectedTaxe(null);
    setShowModal(true);
  };

  const handleOpenEdit = (taxe: Taxe) => {
    setFormData({
      code: taxe.code,
      nom: taxe.nom,
      taux: taxe.taux.toString(),
      description: taxe.description,
      obligatoire: taxe.obligatoire,
      active: taxe.active,
    });
    setSelectedTaxe(taxe);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleOpenDelete = (taxe: Taxe) => {
    setSelectedTaxe(taxe);
    setShowDeleteDialog(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.nom || !formData.taux) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (isEditing && selectedTaxe) {
      // Update existing
      setTaxes(
        taxes.map((t) =>
          t.id === selectedTaxe.id
            ? {
                ...t,
                code: formData.code.toUpperCase(),
                nom: formData.nom,
                taux: parseFloat(formData.taux),
                description: formData.description,
                obligatoire: formData.obligatoire,
                active: formData.active,
              }
            : t
        )
      );
      toast.success(`Taxe ${formData.code} modifiée avec succès`);
    } else {
      // Add new
      const newTaxe: Taxe = {
        id: String(Date.now()),
        code: formData.code.toUpperCase(),
        nom: formData.nom,
        taux: parseFloat(formData.taux),
        description: formData.description,
        obligatoire: formData.obligatoire,
        active: formData.active,
      };
      setTaxes([...taxes, newTaxe]);
      toast.success(`Taxe ${formData.code} ajoutée avec succès`);
    }

    setShowModal(false);
    resetForm();
  };

  const handleDelete = () => {
    if (selectedTaxe) {
      if (selectedTaxe.obligatoire) {
        toast.error("Impossible de supprimer une taxe obligatoire");
        setShowDeleteDialog(false);
        return;
      }
      setTaxes(taxes.filter((t) => t.id !== selectedTaxe.id));
      toast.success(`Taxe ${selectedTaxe.code} supprimée`);
    }
    setShowDeleteDialog(false);
    setSelectedTaxe(null);
  };

  const handleToggleActive = (taxe: Taxe) => {
    if (taxe.obligatoire) {
      toast.error("Impossible de désactiver une taxe obligatoire");
      return;
    }
    setTaxes(
      taxes.map((t) =>
        t.id === taxe.id ? { ...t, active: !t.active } : t
      )
    );
    toast.success(
      `Taxe ${taxe.code} ${!taxe.active ? "activée" : "désactivée"}`
    );
  };

  return (
    <MainLayout title="Taxes">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Percent className="h-6 w-6 text-primary" />
              Configuration des Taxes
            </h1>
            <p className="text-muted-foreground">
              Gérez les taxes applicables aux factures et ordres de travail
            </p>
          </div>
          <Button onClick={handleOpenAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle taxe
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des taxes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead className="text-center">Taux</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Obligatoire</TableHead>
                  <TableHead className="text-center">Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxes.map((taxe) => (
                  <TableRow key={taxe.id}>
                    <TableCell className="font-mono font-bold">
                      {taxe.code}
                    </TableCell>
                    <TableCell className="font-medium">{taxe.nom}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="text-lg">
                        {taxe.taux}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {taxe.description}
                    </TableCell>
                    <TableCell className="text-center">
                      {taxe.obligatoire ? (
                        <Badge variant="default">Oui</Badge>
                      ) : (
                        <Badge variant="outline">Non</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={taxe.active}
                        onCheckedChange={() => handleToggleActive(taxe)}
                        disabled={taxe.obligatoire}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(taxe)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleOpenDelete(taxe)}
                          disabled={taxe.obligatoire}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Résumé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-primary">
                  {taxes.length}
                </p>
                <p className="text-sm text-muted-foreground">Taxes configurées</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-600">
                  {taxes.filter((t) => t.active).length}
                </p>
                <p className="text-sm text-muted-foreground">Taxes actives</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-amber-600">
                  {taxes
                    .filter((t) => t.active)
                    .reduce((sum, t) => sum + t.taux, 0)}
                  %
                </p>
                <p className="text-sm text-muted-foreground">Taux total cumulé</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Modifier la taxe" : "Nouvelle taxe"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Modifiez les informations de la taxe"
                : "Ajoutez une nouvelle taxe au système"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  placeholder="Ex: TVA"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  maxLength={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taux">Taux (%) *</Label>
                <Input
                  id="taux"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="18"
                  value={formData.taux}
                  onChange={(e) =>
                    setFormData({ ...formData, taux: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">Nom complet *</Label>
              <Input
                id="nom"
                placeholder="Taxe sur la Valeur Ajoutée"
                value={formData.nom}
                onChange={(e) =>
                  setFormData({ ...formData, nom: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Description de la taxe..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="obligatoire"
                  checked={formData.obligatoire}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, obligatoire: checked })
                  }
                />
                <Label htmlFor="obligatoire">Taxe obligatoire</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, active: checked })
                  }
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
              >
                Annuler
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? "Enregistrer" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette taxe ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la taxe{" "}
              <strong>{selectedTaxe?.code}</strong> ({selectedTaxe?.nom}) ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
