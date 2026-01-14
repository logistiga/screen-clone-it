import { useState, useMemo } from "react";
import { motion } from "framer-motion";
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
import { Plus, Edit, Trash2, Percent, Save, RefreshCw, CheckCircle2, XCircle, Calculator } from "lucide-react";
import { toast } from "sonner";
import { DocumentStatCard } from "@/components/shared/documents/DocumentStatCard";
import { DocumentFilters } from "@/components/shared/documents/DocumentFilters";
import { DocumentEmptyState } from "@/components/shared/documents/DocumentEmptyState";

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

const statusOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "active", label: "Actives" },
  { value: "inactive", label: "Inactives" },
];

const typeOptions = [
  { value: "all", label: "Tous les types" },
  { value: "obligatoire", label: "Obligatoires" },
  { value: "optionnel", label: "Optionnelles" },
];

export default function TaxesPage() {
  const [taxes, setTaxes] = useState<Taxe[]>(initialTaxes);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedTaxe, setSelectedTaxe] = useState<Taxe | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statutFilter, setStatutFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    nom: "",
    taux: "",
    description: "",
    obligatoire: false,
    active: true,
  });

  // Filtered taxes
  const filteredTaxes = useMemo(() => {
    return taxes.filter((taxe) => {
      const matchesSearch = 
        taxe.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        taxe.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        taxe.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatut = 
        statutFilter === "all" ||
        (statutFilter === "active" && taxe.active) ||
        (statutFilter === "inactive" && !taxe.active);
      
      const matchesType = 
        typeFilter === "all" ||
        (typeFilter === "obligatoire" && taxe.obligatoire) ||
        (typeFilter === "optionnel" && !taxe.obligatoire);
      
      return matchesSearch && matchesStatut && matchesType;
    });
  }, [taxes, searchTerm, statutFilter, typeFilter]);

  // Stats
  const totalTaxes = taxes.length;
  const activeTaxes = taxes.filter((t) => t.active).length;
  const inactiveTaxes = taxes.filter((t) => !t.active).length;
  const tauxTotal = taxes.filter((t) => t.active).reduce((sum, t) => sum + t.taux, 0);

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

  const handleRefresh = () => {
    toast.success("Données actualisées");
  };

  return (
    <MainLayout title="Taxes">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Percent className="h-6 w-6 text-primary" />
              </div>
              Configuration des Taxes
            </h1>
            <p className="text-muted-foreground mt-1">
              Gérez les taxes applicables aux factures et ordres de travail
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={handleOpenAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle taxe
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DocumentStatCard
            title="Total taxes"
            value={totalTaxes}
            icon={Percent}
            variant="primary"
            delay={0}
          />
          <DocumentStatCard
            title="Taxes actives"
            value={activeTaxes}
            icon={CheckCircle2}
            variant="success"
            delay={0.1}
          />
          <DocumentStatCard
            title="Taxes inactives"
            value={inactiveTaxes}
            icon={XCircle}
            variant="warning"
            delay={0.2}
          />
          <DocumentStatCard
            title="Taux total cumulé"
            value={`${tauxTotal}%`}
            icon={Calculator}
            variant="info"
            delay={0.3}
          />
        </div>

        {/* Filters */}
        <DocumentFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Rechercher une taxe..."
          statutFilter={statutFilter}
          onStatutChange={setStatutFilter}
          statutOptions={statusOptions}
          categorieFilter={typeFilter}
          onCategorieChange={setTypeFilter}
          categorieOptions={typeOptions}
        />

        {/* Table */}
        {filteredTaxes.length === 0 ? (
          <DocumentEmptyState
            icon={Percent}
            title={searchTerm || statutFilter !== "all" || typeFilter !== "all" 
              ? "Aucune taxe trouvée" 
              : "Aucune taxe configurée"}
            description={searchTerm || statutFilter !== "all" || typeFilter !== "all"
              ? "Essayez de modifier vos critères de recherche"
              : "Commencez par ajouter votre première taxe"}
            actionLabel={!searchTerm && statutFilter === "all" && typeFilter === "all" ? "Nouvelle taxe" : undefined}
            onAction={!searchTerm && statutFilter === "all" && typeFilter === "all" ? handleOpenAdd : undefined}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Liste des taxes</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-semibold">Code</TableHead>
                      <TableHead className="font-semibold">Nom</TableHead>
                      <TableHead className="text-center font-semibold">Taux</TableHead>
                      <TableHead className="font-semibold">Description</TableHead>
                      <TableHead className="text-center font-semibold">Type</TableHead>
                      <TableHead className="text-center font-semibold">Statut</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTaxes.map((taxe, index) => (
                      <motion.tr
                        key={taxe.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
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
                          {taxe.description}
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
                          <Switch
                            checked={taxe.active}
                            onCheckedChange={() => handleToggleActive(taxe)}
                            disabled={taxe.obligatoire}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(taxe)}
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleOpenDelete(taxe)}
                              disabled={taxe.obligatoire}
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

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Percent className="h-5 w-5 text-primary" />
              </div>
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
                  className="font-mono"
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
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Switch
                  id="obligatoire"
                  checked={formData.obligatoire}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, obligatoire: checked })
                  }
                />
                <Label htmlFor="obligatoire" className="cursor-pointer">Taxe obligatoire</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, active: checked })
                  }
                />
                <Label htmlFor="active" className="cursor-pointer">Active</Label>
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
              <Button type="submit" className="gap-2">
                <Save className="h-4 w-4" />
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
