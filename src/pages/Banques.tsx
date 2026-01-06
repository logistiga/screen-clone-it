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
import { Plus, Edit, Trash2, Building2, Save } from "lucide-react";
import { formatMontant } from "@/data/mockData";
import { toast } from "sonner";

interface Banque {
  id: string;
  nom: string;
  numeroCompte: string;
  iban: string;
  swift: string;
  solde: number;
  actif: boolean;
  adresse?: string;
  contact?: string;
}

const initialBanques: Banque[] = [
  {
    id: "1",
    nom: "BGFI Bank",
    numeroCompte: "GA01 0001 0001 0000 0000 01",
    iban: "GA21 4002 1010 0000 0000 0158 026",
    swift: "BGFIGALIB",
    solde: 15000000,
    actif: true,
    adresse: "Boulevard de l'Indépendance, Libreville",
    contact: "+241 01 76 26 13",
  },
  {
    id: "2",
    nom: "UBA Gabon",
    numeroCompte: "GA02 0002 0002 0000 0000 02",
    iban: "GA45 2001 0200 0000 0000 0234 089",
    swift: "UNABORGLI",
    solde: 8500000,
    actif: true,
    adresse: "Avenue du Colonel Parant, Libreville",
    contact: "+241 01 74 32 00",
  },
  {
    id: "3",
    nom: "Orabank Gabon",
    numeroCompte: "GA03 0003 0003 0000 0000 03",
    iban: "GA78 3001 0300 0000 0000 0567 012",
    swift: "OABORGLI",
    solde: 3200000,
    actif: false,
    adresse: "Rue de la Mairie, Port-Gentil",
    contact: "+241 01 55 24 00",
  },
];

export default function BanquesPage() {
  const [banques, setBanques] = useState<Banque[]>(initialBanques);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBanque, setSelectedBanque] = useState<Banque | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nom: "",
    numeroCompte: "",
    iban: "",
    swift: "",
    solde: "",
    adresse: "",
    contact: "",
    actif: true,
  });

  const resetForm = () => {
    setFormData({
      nom: "",
      numeroCompte: "",
      iban: "",
      swift: "",
      solde: "",
      adresse: "",
      contact: "",
      actif: true,
    });
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
      numeroCompte: banque.numeroCompte,
      iban: banque.iban,
      swift: banque.swift,
      solde: banque.solde.toString(),
      adresse: banque.adresse || "",
      contact: banque.contact || "",
      actif: banque.actif,
    });
    setSelectedBanque(banque);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleOpenDelete = (banque: Banque) => {
    setSelectedBanque(banque);
    setShowDeleteDialog(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nom || !formData.numeroCompte) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    if (isEditing && selectedBanque) {
      // Update existing
      setBanques(
        banques.map((b) =>
          b.id === selectedBanque.id
            ? {
                ...b,
                nom: formData.nom,
                numeroCompte: formData.numeroCompte,
                iban: formData.iban,
                swift: formData.swift.toUpperCase(),
                solde: parseFloat(formData.solde) || b.solde,
                adresse: formData.adresse,
                contact: formData.contact,
                actif: formData.actif,
              }
            : b
        )
      );
      toast.success(`Banque ${formData.nom} modifiée avec succès`);
    } else {
      // Add new
      const newBanque: Banque = {
        id: String(Date.now()),
        nom: formData.nom,
        numeroCompte: formData.numeroCompte,
        iban: formData.iban,
        swift: formData.swift.toUpperCase(),
        solde: parseFloat(formData.solde) || 0,
        adresse: formData.adresse,
        contact: formData.contact,
        actif: formData.actif,
      };
      setBanques([...banques, newBanque]);
      toast.success(`Banque ${formData.nom} ajoutée avec succès`);
    }

    setShowModal(false);
    resetForm();
  };

  const handleDelete = () => {
    if (selectedBanque) {
      if (selectedBanque.solde > 0) {
        toast.error(
          "Impossible de supprimer une banque avec un solde positif. Videz le compte d'abord."
        );
        setShowDeleteDialog(false);
        return;
      }
      setBanques(banques.filter((b) => b.id !== selectedBanque.id));
      toast.success(`Banque ${selectedBanque.nom} supprimée`);
    }
    setShowDeleteDialog(false);
    setSelectedBanque(null);
  };

  const handleToggleActif = (banque: Banque) => {
    setBanques(
      banques.map((b) =>
        b.id === banque.id ? { ...b, actif: !b.actif } : b
      )
    );
    toast.success(
      `Banque ${banque.nom} ${!banque.actif ? "activée" : "désactivée"}`
    );
  };

  const totalSolde = banques
    .filter((b) => b.actif)
    .reduce((sum, b) => sum + b.solde, 0);

  return (
    <MainLayout title="Gestion des Banques">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              Gestion des Banques
            </h1>
            <p className="text-muted-foreground">
              Gérez vos comptes bancaires et leurs informations
            </p>
          </div>
          <Button onClick={handleOpenAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle banque
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{banques.length}</p>
                <p className="text-sm text-muted-foreground">Comptes bancaires</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">
                  {banques.filter((b) => b.actif).length}
                </p>
                <p className="text-sm text-muted-foreground">Comptes actifs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {formatMontant(totalSolde)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Solde total (comptes actifs)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
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
                {banques.map((banque) => (
                  <TableRow key={banque.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{banque.nom}</p>
                        {banque.adresse && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {banque.adresse}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {banque.numeroCompte}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {banque.iban}
                    </TableCell>
                    <TableCell className="font-mono">{banque.swift}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMontant(banque.solde)}
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
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleOpenDelete(banque)}
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

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Modifier la banque" : "Nouvelle banque"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Modifiez les informations du compte bancaire"
                : "Ajoutez un nouveau compte bancaire"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom de la banque *</Label>
              <Input
                id="nom"
                placeholder="Ex: BGFI Bank"
                value={formData.nom}
                onChange={(e) =>
                  setFormData({ ...formData, nom: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numeroCompte">N° de compte *</Label>
                <Input
                  id="numeroCompte"
                  placeholder="GA01 0001 0001..."
                  value={formData.numeroCompte}
                  onChange={(e) =>
                    setFormData({ ...formData, numeroCompte: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="swift">Code SWIFT</Label>
                <Input
                  id="swift"
                  placeholder="BGFIGALIB"
                  value={formData.swift}
                  onChange={(e) =>
                    setFormData({ ...formData, swift: e.target.value.toUpperCase() })
                  }
                  maxLength={11}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="iban">IBAN</Label>
              <Input
                id="iban"
                placeholder="GA21 4002 1010 0000..."
                value={formData.iban}
                onChange={(e) =>
                  setFormData({ ...formData, iban: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="solde">Solde initial (FCFA)</Label>
              <Input
                id="solde"
                type="number"
                placeholder="0"
                value={formData.solde}
                onChange={(e) =>
                  setFormData({ ...formData, solde: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  placeholder="Adresse de l'agence"
                  value={formData.adresse}
                  onChange={(e) =>
                    setFormData({ ...formData, adresse: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Contact</Label>
                <Input
                  id="contact"
                  placeholder="+241 01 XX XX XX"
                  value={formData.contact}
                  onChange={(e) =>
                    setFormData({ ...formData, contact: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="actif"
                checked={formData.actif}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, actif: checked })
                }
              />
              <Label htmlFor="actif">Compte actif</Label>
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
            <AlertDialogTitle>Supprimer ce compte bancaire ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le compte{" "}
              <strong>{selectedBanque?.nom}</strong> ?
              {selectedBanque && selectedBanque.solde > 0 && (
                <span className="block mt-2 text-destructive">
                  ⚠️ Ce compte a un solde de {formatMontant(selectedBanque.solde)}.
                  Vous devez d'abord vider le compte.
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
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
