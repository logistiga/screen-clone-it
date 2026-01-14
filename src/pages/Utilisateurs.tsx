import { useState } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Pencil, Trash2, UserCheck, UserX, Mail, Phone, Calendar, Shield, Users, RefreshCw } from "lucide-react";
import { utilisateurs as initialUtilisateurs, roles, formatDate, Utilisateur } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { DocumentStatCard, DocumentStatCardSkeleton } from "@/components/shared/documents/DocumentStatCard";
import { DocumentFilters } from "@/components/shared/documents/DocumentFilters";
import { DocumentEmptyState } from "@/components/shared/documents/DocumentEmptyState";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function UtilisateursPage() {
  const { toast } = useToast();
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>(initialUtilisateurs);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatut, setFilterStatut] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  
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

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({ title: "Actualisé", description: "Liste des utilisateurs actualisée" });
    }, 500);
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

  // Options pour les filtres
  const statutOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'actif', label: 'Actifs' },
    { value: 'inactif', label: 'Inactifs' },
  ];

  const roleOptions = [
    { value: 'all', label: 'Tous les rôles' },
    ...roles.map(role => ({ value: role.id, label: role.nom }))
  ];

  return (
    <MainLayout title="Gestion des Utilisateurs">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gestion des Utilisateurs</h1>
            <p className="text-muted-foreground mt-1">Gérez les utilisateurs et leurs permissions</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={handleOpenAdd} className="gap-2 shadow-md">
                <Plus className="h-4 w-4" />
                Nouvel utilisateur
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={itemVariants} className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <DocumentStatCard
            title="Total Utilisateurs"
            value={utilisateurs.length}
            icon={Users}
            variant="primary"
            delay={0}
          />
          <DocumentStatCard
            title="Utilisateurs Actifs"
            value={statsActifs}
            icon={UserCheck}
            variant="success"
            delay={0.1}
          />
          <DocumentStatCard
            title="Utilisateurs Inactifs"
            value={statsInactifs}
            icon={UserX}
            variant="warning"
            delay={0.2}
          />
          <DocumentStatCard
            title="Rôles Configurés"
            value={roles.length}
            icon={Shield}
            variant="info"
            delay={0.3}
          />
        </motion.div>

        {/* Filtres */}
        <motion.div variants={itemVariants}>
          <DocumentFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Rechercher par nom ou email..."
            statutFilter={filterStatut}
            onStatutChange={setFilterStatut}
            statutOptions={statutOptions}
            categorieFilter={filterRole}
            onCategorieChange={setFilterRole}
            categorieOptions={roleOptions}
          />
        </motion.div>

        {/* Contenu */}
        {filteredUtilisateurs.length === 0 ? (
          <DocumentEmptyState
            icon={Users}
            title="Aucun utilisateur trouvé"
            description={searchTerm || filterRole !== 'all' || filterStatut !== 'all'
              ? "Aucun utilisateur ne correspond à vos critères de recherche."
              : "Commencez par créer votre premier utilisateur."
            }
            actionLabel="Nouvel utilisateur"
            onAction={handleOpenAdd}
          />
        ) : (
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-none shadow-lg">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-primary" />
                  Liste des utilisateurs
                </CardTitle>
                <CardDescription>
                  {filteredUtilisateurs.length} utilisateur{filteredUtilisateurs.length > 1 ? 's' : ''} affiché{filteredUtilisateurs.length > 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="font-semibold">Utilisateur</TableHead>
                        <TableHead className="font-semibold">Contact</TableHead>
                        <TableHead className="font-semibold">Rôle</TableHead>
                        <TableHead className="font-semibold">Statut</TableHead>
                        <TableHead className="font-semibold">Date création</TableHead>
                        <TableHead className="font-semibold">Dernière connexion</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUtilisateurs.map((user, index) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b hover:bg-muted/30 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border-2 border-primary/20">
                                <AvatarImage src={user.photo} />
                                <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                                  {getInitials(user.nom)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-foreground">{user.nom}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-sm">
                                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-foreground">{user.email}</span>
                              </div>
                              {user.telephone && (
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                  <Phone className="h-3.5 w-3.5" />
                                  {user.telephone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1.5 font-medium border-primary/30 bg-primary/5">
                              <Shield className="h-3 w-3 text-primary" />
                              {getRoleName(user.roleId)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={user.actif}
                                onCheckedChange={() => handleToggleActif(user)}
                              />
                              <Badge className={user.actif 
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20" 
                                : "bg-muted text-muted-foreground"
                              }>
                                {user.actif ? 'Actif' : 'Inactif'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(user.dateCreation)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.derniereConnexion ? (
                              <span className="text-sm text-foreground">{formatDate(user.derniereConnexion)}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">Jamais</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleOpenEdit(user)} 
                                title="Modifier"
                                className="hover:bg-primary/10 hover:text-primary"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-destructive hover:text-destructive hover:bg-destructive/10" 
                                onClick={() => handleOpenDelete(user)}
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
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Modal Ajout/Modification */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {isEditing ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                {isEditing ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom complet *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Jean Dupont"
                  className="transition-all focus:ring-2 focus:ring-primary/20"
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
                  className="transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input
                  id="telephone"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="+241 01 23 45 67"
                  className="transition-all focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rôle *</Label>
                <Select value={formData.roleId} onValueChange={(value) => setFormData({ ...formData, roleId: value })}>
                  <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary" />
                          {role.nom}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div>
                  <Label htmlFor="actif" className="font-medium">Compte actif</Label>
                  <p className="text-sm text-muted-foreground">L'utilisateur peut se connecter</p>
                </div>
                <Switch
                  id="actif"
                  checked={formData.actif}
                  onCheckedChange={(checked) => setFormData({ ...formData, actif: checked })}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} className="gap-2">
                {isEditing ? 'Enregistrer' : 'Créer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation de suppression */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Supprimer cet utilisateur ?
              </AlertDialogTitle>
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
      </motion.div>
    </MainLayout>
  );
}
