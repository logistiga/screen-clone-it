import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Edit, Trash2, Building2, Save, Loader2 } from "lucide-react";
import { formatMontant } from "@/data/mockData";
import { useBanques, useCreateBanque, useUpdateBanque, useDeleteBanque } from "@/hooks/use-commercial";
import { Banque } from "@/lib/api/commercial";

export default function BanquesPage() {
  const { data: banques = [], isLoading, error } = useBanques();
  const createBanqueMutation = useCreateBanque();
  const updateBanqueMutation = useUpdateBanque();
  const deleteBanqueMutation = useDeleteBanque();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBanque, setSelectedBanque] = useState<Banque | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    nom: "",
    numero_compte: "",
    iban: "",
    swift: "",
    solde: "",
    actif: true,
  });

  const resetForm = () => {
    setFormData({ nom: "", numero_compte: "", iban: "", swift: "", solde: "", actif: true });
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsEditing(false);
    setSelectedBanque(null);
    setShowModal(true);
  };

  const handleOpenEdit = (banque: Banque) => {
    setFormData({
      nom: banque.nom,
      numero_compte: banque.numero_compte || "",
      iban: banque.iban || "",
      swift: banque.swift || "",
      solde: String(banque.solde || 0),
      actif: banque.actif,
    });
    setSelectedBanque(banque);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom) return;

    const data = {
      nom: formData.nom,
      numero_compte: formData.numero_compte,
      iban: formData.iban,
      swift: formData.swift.toUpperCase(),
      solde: parseFloat(formData.solde) || 0,
      actif: formData.actif,
    };

    if (isEditing && selectedBanque) {
      await updateBanqueMutation.mutateAsync({ id: selectedBanque.id, data });
    } else {
      await createBanqueMutation.mutateAsync(data);
    }
    setShowModal(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (selectedBanque) {
      await deleteBanqueMutation.mutateAsync(selectedBanque.id);
    }
    setShowDeleteDialog(false);
    setSelectedBanque(null);
  };

  const handleToggleActif = async (banque: Banque) => {
    await updateBanqueMutation.mutateAsync({
      id: banque.id,
      data: { actif: !banque.actif },
    });
  };

  const totalSolde = banques.filter((b) => b.actif).reduce((sum, b) => sum + (b.solde || 0), 0);

  if (isLoading) {
    return (
      <MainLayout title="Gestion des Banques">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Gestion des Banques">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-destructive">Erreur lors du chargement des banques</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
            Réessayer
          </Button>
        </div>
      </MainLayout>
    );
  }

  // État vide
  if (banques.length === 0) {
    return (
      <MainLayout title="Gestion des Banques">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Aucun compte bancaire</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Ajoutez vos comptes bancaires pour gérer les paiements par virement et chèque.
          </p>
          <Button onClick={handleOpenAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle banque
          </Button>
        </div>

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouvelle banque</DialogTitle>
              <DialogDescription>Ajoutez un nouveau compte bancaire</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom de la banque *</Label>
                <Input
                  id="nom"
                  placeholder="Ex: BGFI Bank"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero_compte">N° de compte</Label>
                  <Input
                    id="numero_compte"
                    value={formData.numero_compte}
                    onChange={(e) => setFormData({ ...formData, numero_compte: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="swift">Code SWIFT</Label>
                  <Input
                    id="swift"
                    value={formData.swift}
                    onChange={(e) => setFormData({ ...formData, swift: e.target.value.toUpperCase() })}
                    maxLength={11}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="iban">IBAN</Label>
                <Input
                  id="iban"
                  value={formData.iban}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="solde">Solde initial (FCFA)</Label>
                <Input
                  id="solde"
                  type="number"
                  value={formData.solde}
                  onChange={(e) => setFormData({ ...formData, solde: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="actif"
                  checked={formData.actif}
                  onCheckedChange={(checked) => setFormData({ ...formData, actif: checked })}
                />
                <Label htmlFor="actif">Compte actif</Label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createBanqueMutation.isPending}>
                  {createBanqueMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Ajouter
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Gestion des Banques">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              Gestion des Banques
            </h1>
            <p className="text-muted-foreground">Gérez vos comptes bancaires</p>
          </div>
          <Button onClick={handleOpenAdd} className="transition-all duration-200 hover:scale-105">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle banque
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{banques.length}</p>
                <p className="text-sm text-muted-foreground">Comptes bancaires</p>
              </div>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {banques.filter((b) => b.actif).length}
                </p>
                <p className="text-sm text-muted-foreground">Comptes actifs</p>
              </div>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{formatMontant(totalSolde)}</p>
                <p className="text-sm text-muted-foreground">Solde total (actifs)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Liste des comptes bancaires</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Banque</TableHead>
                  <TableHead>N° Compte</TableHead>
                  <TableHead>IBAN</TableHead>
                  <TableHead>SWIFT</TableHead>
                  <TableHead className="text-right">Solde</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banques.map((banque, index) => (
                  <TableRow 
                    key={banque.id}
                    className="transition-all duration-200 animate-fade-in hover:bg-muted/50"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <TableCell>
                      <p className="font-medium">{banque.nom}</p>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{banque.numero_compte || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{banque.iban || '-'}</TableCell>
                    <TableCell className="font-mono">{banque.swift || '-'}</TableCell>
                    <TableCell className="text-right font-medium">{formatMontant(banque.solde || 0)}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={banque.actif}
                        onCheckedChange={() => handleToggleActif(banque)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(banque)}
                          className="transition-all duration-200 hover:scale-110 hover:bg-primary/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive transition-all duration-200 hover:scale-110 hover:bg-destructive/10"
                          onClick={() => {
                            setSelectedBanque(banque);
                            setShowDeleteDialog(true);
                          }}
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
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Modifier la banque" : "Nouvelle banque"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Modifiez les informations du compte" : "Ajoutez un nouveau compte bancaire"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom de la banque *</Label>
              <Input
                id="nom"
                placeholder="Ex: BGFI Bank"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero_compte">N° de compte</Label>
                <Input
                  id="numero_compte"
                  value={formData.numero_compte}
                  onChange={(e) => setFormData({ ...formData, numero_compte: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="swift">Code SWIFT</Label>
                <Input
                  id="swift"
                  value={formData.swift}
                  onChange={(e) => setFormData({ ...formData, swift: e.target.value.toUpperCase() })}
                  maxLength={11}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="iban">IBAN</Label>
              <Input
                id="iban"
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="solde">Solde (FCFA)</Label>
              <Input
                id="solde"
                type="number"
                value={formData.solde}
                onChange={(e) => setFormData({ ...formData, solde: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="actif"
                checked={formData.actif}
                onCheckedChange={(checked) => setFormData({ ...formData, actif: checked })}
              />
              <Label htmlFor="actif">Compte actif</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={createBanqueMutation.isPending || updateBanqueMutation.isPending}
              >
                {(createBanqueMutation.isPending || updateBanqueMutation.isPending) ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isEditing ? "Enregistrer" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce compte bancaire ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le compte <strong>{selectedBanque?.nom}</strong> ?
              {selectedBanque && (selectedBanque.solde || 0) > 0 && (
                <span className="block mt-2 text-destructive">
                  ⚠️ Ce compte a un solde de {formatMontant(selectedBanque.solde || 0)}.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteBanqueMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
