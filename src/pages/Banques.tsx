import { useState } from "react";
import { motion } from "framer-motion";
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
import { Plus, Edit, Trash2, Building2, Save, Loader2, Wallet, CheckCircle, CreditCard } from "lucide-react";
import { formatMontant } from "@/data/mockData";
import { useBanques, useCreateBanque, useUpdateBanque, useDeleteBanque } from "@/hooks/use-commercial";
import { Banque } from "@/lib/api/commercial";
import { DocumentStatCard } from "@/components/shared/documents/DocumentStatCard";
import { DocumentFilters } from "@/components/shared/documents/DocumentFilters";
import { DocumentEmptyState } from "@/components/shared/documents/DocumentEmptyState";
import { DocumentLoadingState } from "@/components/shared/documents/DocumentLoadingState";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export default function BanquesPage() {
  const { data: banques = [], isLoading, error } = useBanques();
  const createBanqueMutation = useCreateBanque();
  const updateBanqueMutation = useUpdateBanque();
  const deleteBanqueMutation = useDeleteBanque();

  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBanque, setSelectedBanque] = useState<Banque | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  // Filtrage
  const filteredBanques = banques.filter((banque) => {
    const matchesSearch = !searchTerm || 
      banque.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      banque.numero_compte?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      banque.iban?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Statistiques
  const totalSolde = banques.filter((b) => b.actif).reduce((sum, b) => sum + (b.solde || 0), 0);
  const comptesActifs = banques.filter((b) => b.actif).length;
  const comptesInactifs = banques.filter((b) => !b.actif).length;

  if (isLoading) {
    return (
      <MainLayout title="Gestion des Banques">
        <DocumentLoadingState 
          message="Chargement des banques..."
        />
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
        <DocumentEmptyState
          icon={Building2}
          title="Aucun compte bancaire"
          description="Ajoutez vos comptes bancaires pour gérer les paiements par virement et chèque."
          actionLabel="Nouvelle banque"
          onAction={handleOpenAdd}
        />

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
      <motion.div 
        className="space-y-6"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div 
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          variants={itemVariants}
        >
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              Gestion des Banques
            </h1>
            <p className="text-muted-foreground mt-1">Gérez vos comptes bancaires</p>
          </div>
          <Button onClick={handleOpenAdd} className="transition-all duration-200 hover:scale-105">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle banque
          </Button>
        </motion.div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DocumentStatCard
            title="Total Comptes"
            value={banques.length}
            icon={CreditCard}
            subtitle="comptes bancaires"
            variant="primary"
            delay={0}
          />
          <DocumentStatCard
            title="Comptes Actifs"
            value={comptesActifs}
            icon={CheckCircle}
            subtitle="en service"
            variant="success"
            delay={0.1}
          />
          <DocumentStatCard
            title="Comptes Inactifs"
            value={comptesInactifs}
            icon={Building2}
            subtitle="désactivés"
            variant="warning"
            delay={0.2}
          />
          <DocumentStatCard
            title="Solde Total"
            value={formatMontant(totalSolde)}
            icon={Wallet}
            subtitle="comptes actifs"
            variant={totalSolde >= 0 ? "info" : "danger"}
            delay={0.3}
          />
        </div>

        {/* Filtres */}
        <motion.div variants={itemVariants}>
          <DocumentFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Rechercher par nom, n° compte, IBAN..."
          />
        </motion.div>

        {/* Table */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Liste des comptes bancaires
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({filteredBanques.length} {filteredBanques.length > 1 ? "comptes" : "compte"})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredBanques.length === 0 ? (
                <div className="py-12 text-center">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Aucun compte ne correspond à votre recherche</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setSearchTerm("")}
                  >
                    Réinitialiser la recherche
                  </Button>
                </div>
              ) : (
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
                    {filteredBanques.map((banque, index) => (
                      <motion.tr
                        key={banque.id}
                        variants={itemVariants}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${banque.actif ? 'bg-primary/10' : 'bg-muted'}`}>
                              <Building2 className={`h-4 w-4 ${banque.actif ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                            <p className="font-medium">{banque.nom}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{banque.numero_compte || '-'}</TableCell>
                        <TableCell className="font-mono text-xs">{banque.iban || '-'}</TableCell>
                        <TableCell className="font-mono">{banque.swift || '-'}</TableCell>
                        <TableCell className="text-right">
                          <span className={`font-medium ${(banque.solde || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatMontant(banque.solde || 0)}
                          </span>
                        </TableCell>
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
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

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
