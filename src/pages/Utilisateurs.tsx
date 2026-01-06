import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Pencil, Trash2, Search, UserCheck, UserX, Mail, Phone, Calendar, Shield } from "lucide-react";
import { utilisateurs as initialUtilisateurs, roles, formatDate, Utilisateur } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

export default function UtilisateursPage() {
  const { toast } = useToast();
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>(initialUtilisateurs);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatut, setFilterStatut] = useState<string>("all");
  
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Utilisateur | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    roleId: '',
    actif: true
  });

  const resetForm = () => {
    setFormData({
      nom: '',
      email: '',
      telephone: '',
      roleId: roles[0]?.id || '',
      actif: true
    });
    setSelectedUser(null);
    setIsEditing(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (user: Utilisateur) => {
    setSelectedUser(user);
    setIsEditing(true);
    setFormData({
      nom: user.nom,
      email: user.email,
      telephone: user.telephone || '',
      roleId: user.roleId,
      actif: user.actif
    });
    setShowModal(true);
  };

  const handleOpenDelete = (user: Utilisateur) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleToggleActif = (user: Utilisateur) => {
    setUtilisateurs(prev => prev.map(u =>
      u.id === user.id ? { ...u, actif: !u.actif } : u
    ));
    toast({
      title: "Succès",
      description: `Utilisateur ${user.actif ? 'désactivé' : 'activé'} avec succès`
    });
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = () => {
    if (!formData.nom.trim()) {
      toast({ title: "Erreur", description: "Le nom est obligatoire", variant: "destructive" });
      return;
    }
    if (!formData.email.trim()) {
      toast({ title: "Erreur", description: "L'email est obligatoire", variant: "destructive" });
      return;
    }
    if (!validateEmail(formData.email)) {
      toast({ title: "Erreur", description: "L'email n'est pas valide", variant: "destructive" });
      return;
    }
    if (!formData.roleId) {
      toast({ title: "Erreur", description: "Le rôle est obligatoire", variant: "destructive" });
      return;
    }

    // Vérifier si l'email existe déjà (sauf pour l'utilisateur en cours de modification)
    const emailExists = utilisateurs.some(u => 
      u.email.toLowerCase() === formData.email.toLowerCase() && 
      (!isEditing || u.id !== selectedUser?.id)
    );
    if (emailExists) {
      toast({ title: "Erreur", description: "Cet email est déjà utilisé", variant: "destructive" });
      return;
    }

    if (isEditing && selectedUser) {
      setUtilisateurs(prev => prev.map(u =>
        u.id === selectedUser.id
          ? { 
              ...u, 
              nom: formData.nom.trim(),
              email: formData.email.trim(),
              telephone: formData.telephone.trim() || undefined,
              roleId: formData.roleId,
              actif: formData.actif
            }
          : u
      ));
      toast({ title: "Succès", description: "Utilisateur modifié avec succès" });
    } else {
      const newUser: Utilisateur = {
        id: Date.now().toString(),
        nom: formData.nom.trim(),
        email: formData.email.trim(),
        telephone: formData.telephone.trim() || undefined,
        roleId: formData.roleId,
        actif: formData.actif,
        dateCreation: new Date().toISOString().split('T')[0]
      };
      setUtilisateurs(prev => [...prev, newUser]);
      toast({ title: "Succès", description: "Utilisateur créé avec succès" });
    }

    setShowModal(false);
    resetForm();
  };

  const handleDelete = () => {
    if (!selectedUser) return;
    
    setUtilisateurs(prev => prev.filter(u => u.id !== selectedUser.id));
    toast({ title: "Succès", description: "Utilisateur supprimé avec succès" });
    setShowDeleteDialog(false);
    setSelectedUser(null);
  };

  const getInitials = (nom: string): string => {
    return nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleName = (roleId: string): string => {
    return roles.find(r => r.id === roleId)?.nom || 'Non défini';
  };

  // Filtrage
  const filteredUtilisateurs = utilisateurs.filter(u => {
    const matchSearch = u.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === "all" || u.roleId === filterRole;
    const matchStatut = filterStatut === "all" || 
                       (filterStatut === "actif" && u.actif) ||
                       (filterStatut === "inactif" && !u.actif);
    return matchSearch && matchRole && matchStatut;
  });

  const statsActifs = utilisateurs.filter(u => u.actif).length;
  const statsInactifs = utilisateurs.filter(u => !u.actif).length;

  return (
    <MainLayout title="Gestion des Utilisateurs">
      <div className="space-y-6">
        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <UserCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statsActifs}</p>
                <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg">
                <UserX className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statsInactifs}</p>
                <p className="text-sm text-muted-foreground">Utilisateurs inactifs</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-secondary/50 rounded-lg">
                <Shield className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{roles.length}</p>
                <p className="text-sm text-muted-foreground">Rôles configurés</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filtres et actions */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex flex-col md:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.id}>{role.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatut} onValueChange={setFilterStatut}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="actif">Actifs</SelectItem>
                <SelectItem value="inactif">Inactifs</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleOpenAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvel utilisateur
          </Button>
        </div>

        {/* Table des utilisateurs */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date création</TableHead>
                  <TableHead>Dernière connexion</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUtilisateurs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUtilisateurs.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.photo} />
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {getInitials(user.nom)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.nom}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {user.email}
                          </div>
                          {user.telephone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {user.telephone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Shield className="h-3 w-3" />
                          {getRoleName(user.roleId)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.actif}
                            onCheckedChange={() => handleToggleActif(user)}
                          />
                          <Badge className={user.actif ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-muted text-muted-foreground"}>
                            {user.actif ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(user.dateCreation)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.derniereConnexion ? (
                          <span className="text-sm">{formatDate(user.derniereConnexion)}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Jamais</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(user)} title="Modifier">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-destructive hover:text-destructive" 
                            onClick={() => handleOpenDelete(user)}
                            title="Supprimer"
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
          </CardContent>
        </Card>

        {/* Modal Ajout/Modification */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom complet *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Jean Dupont"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jean.dupont@exemple.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="+241 01 23 45 67"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rôle *</Label>
                <Select value={formData.roleId} onValueChange={(value) => setFormData({ ...formData, roleId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          {role.nom}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <Label htmlFor="actif">Compte actif</Label>
                  <p className="text-sm text-muted-foreground">L'utilisateur peut se connecter</p>
                </div>
                <Switch
                  id="actif"
                  checked={formData.actif}
                  onCheckedChange={(checked) => setFormData({ ...formData, actif: checked })}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Annuler
              </Button>
              <Button onClick={handleSubmit}>
                {isEditing ? 'Enregistrer' : 'Créer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation de suppression */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer l'utilisateur "{selectedUser?.nom}" ?
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
