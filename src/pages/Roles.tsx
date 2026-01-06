import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Shield, Copy } from "lucide-react";
import { roles as initialRoles, Role, Permission } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

const MODULES = [
  { id: 'clients', label: 'Clients' },
  { id: 'devis', label: 'Devis' },
  { id: 'ordres', label: 'Ordres de travail' },
  { id: 'factures', label: 'Factures' },
  { id: 'caisse', label: 'Caisse' },
  { id: 'banque', label: 'Banque' },
  { id: 'reporting', label: 'Reporting' },
  { id: 'parametrage', label: 'Paramétrage' }
];

const ACTIONS = [
  { id: 'voir', label: 'Voir' },
  { id: 'creer', label: 'Créer' },
  { id: 'modifier', label: 'Modifier' },
  { id: 'supprimer', label: 'Supprimer' },
  { id: 'valider', label: 'Valider' },
  { id: 'annuler', label: 'Annuler' },
  { id: 'paiement', label: 'Paiement' },
  { id: 'exporter', label: 'Exporter' }
];

const createEmptyPermissions = (): Permission[] => {
  const permissions: Permission[] = [];
  MODULES.forEach(module => {
    ACTIONS.forEach(action => {
      permissions.push({ module: module.id, action: action.id, autorise: false });
    });
  });
  return permissions;
};

const createFullPermissions = (): Permission[] => {
  const permissions: Permission[] = [];
  MODULES.forEach(module => {
    ACTIONS.forEach(action => {
      permissions.push({ module: module.id, action: action.id, autorise: true });
    });
  });
  return permissions;
};

export default function RolesPage() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    permissions: createEmptyPermissions()
  });

  const resetForm = () => {
    setFormData({
      nom: '',
      description: '',
      permissions: createEmptyPermissions()
    });
    setSelectedRole(null);
    setIsEditing(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (role: Role) => {
    setSelectedRole(role);
    setIsEditing(true);
    setFormData({
      nom: role.nom,
      description: role.description,
      permissions: [...role.permissions]
    });
    setShowModal(true);
  };

  const handleDuplicate = (role: Role) => {
    setSelectedRole(null);
    setIsEditing(false);
    setFormData({
      nom: `${role.nom} (copie)`,
      description: role.description,
      permissions: [...role.permissions]
    });
    setShowModal(true);
  };

  const handleOpenDelete = (role: Role) => {
    setSelectedRole(role);
    setShowDeleteDialog(true);
  };

  const getPermission = (module: string, action: string): boolean => {
    const perm = formData.permissions.find(p => p.module === module && p.action === action);
    return perm?.autorise || false;
  };

  const togglePermission = (module: string, action: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.map(p =>
        p.module === module && p.action === action
          ? { ...p, autorise: !p.autorise }
          : p
      )
    }));
  };

  const toggleModuleAll = (module: string) => {
    const modulePerms = formData.permissions.filter(p => p.module === module);
    const allActive = modulePerms.every(p => p.autorise);
    
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.map(p =>
        p.module === module ? { ...p, autorise: !allActive } : p
      )
    }));
  };

  const toggleActionAll = (action: string) => {
    const actionPerms = formData.permissions.filter(p => p.action === action);
    const allActive = actionPerms.every(p => p.autorise);
    
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.map(p =>
        p.action === action ? { ...p, autorise: !allActive } : p
      )
    }));
  };

  const selectAllPermissions = () => {
    setFormData(prev => ({ ...prev, permissions: createFullPermissions() }));
  };

  const deselectAllPermissions = () => {
    setFormData(prev => ({ ...prev, permissions: createEmptyPermissions() }));
  };

  const handleSubmit = () => {
    if (!formData.nom.trim()) {
      toast({ title: "Erreur", description: "Le nom du rôle est obligatoire", variant: "destructive" });
      return;
    }

    if (isEditing && selectedRole) {
      setRoles(prev => prev.map(r =>
        r.id === selectedRole.id
          ? { ...r, nom: formData.nom, description: formData.description, permissions: formData.permissions }
          : r
      ));
      toast({ title: "Succès", description: "Rôle modifié avec succès" });
    } else {
      const newRole: Role = {
        id: Date.now().toString(),
        nom: formData.nom,
        description: formData.description,
        permissions: formData.permissions
      };
      setRoles(prev => [...prev, newRole]);
      toast({ title: "Succès", description: "Rôle créé avec succès" });
    }

    setShowModal(false);
    resetForm();
  };

  const handleDelete = () => {
    if (!selectedRole) return;
    
    setRoles(prev => prev.filter(r => r.id !== selectedRole.id));
    toast({ title: "Succès", description: "Rôle supprimé avec succès" });
    setShowDeleteDialog(false);
    setSelectedRole(null);
  };

  const getRolePermission = (role: Role, module: string, action: string): boolean => {
    const perm = role.permissions.find(p => p.module === module && p.action === action);
    return perm?.autorise || false;
  };

  const countActivePermissions = (role: Role): number => {
    return role.permissions.filter(p => p.autorise).length;
  };

  return (
    <MainLayout title="Gestion des Rôles">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Définissez les rôles et permissions pour contrôler l'accès aux fonctionnalités
          </p>
          <Button onClick={handleOpenAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau rôle
          </Button>
        </div>

        {/* Roles Grid */}
        <div className="grid gap-6">
          {roles.map(role => (
            <Card key={role.id}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{role.nom}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {countActivePermissions(role)} permissions actives sur {MODULES.length * ACTIONS.length}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDuplicate(role)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleOpenEdit(role)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleOpenDelete(role)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 font-medium">Module</th>
                        {ACTIONS.map(action => (
                          <th key={action.id} className="text-center py-2 px-2 font-medium">
                            {action.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MODULES.map(module => (
                        <tr key={module.id} className="border-b last:border-0">
                          <td className="py-2 px-2 font-medium">{module.label}</td>
                          {ACTIONS.map(action => (
                            <td key={action.id} className="text-center py-2 px-2">
                              <Checkbox
                                checked={getRolePermission(role, module.id, action.id)}
                                disabled
                                className="mx-auto"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modal Ajout/Modification */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Modifier le rôle' : 'Nouveau rôle'}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Infos de base */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom du rôle *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="Ex: Comptable, Commercial..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description du rôle..."
                    rows={1}
                  />
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Permissions</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllPermissions}>
                      Tout sélectionner
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAllPermissions}>
                      Tout désélectionner
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr className="border-b">
                        <th className="text-left py-3 px-3 font-medium">Module</th>
                        {ACTIONS.map(action => (
                          <th key={action.id} className="text-center py-3 px-2 font-medium">
                            <button
                              type="button"
                              onClick={() => toggleActionAll(action.id)}
                              className="hover:text-primary transition-colors"
                            >
                              {action.label}
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MODULES.map(module => (
                        <tr key={module.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => toggleModuleAll(module.id)}
                              className="font-medium hover:text-primary transition-colors text-left"
                            >
                              {module.label}
                            </button>
                          </td>
                          {ACTIONS.map(action => (
                            <td key={action.id} className="text-center py-3 px-2">
                              <Checkbox
                                checked={getPermission(module.id, action.id)}
                                onCheckedChange={() => togglePermission(module.id, action.id)}
                                className="mx-auto"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Annuler
              </Button>
              <Button onClick={handleSubmit}>
                {isEditing ? 'Enregistrer' : 'Créer le rôle'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmation de suppression */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer ce rôle ?</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le rôle "{selectedRole?.nom}" ?
                Cette action est irréversible et pourrait affecter les utilisateurs assignés à ce rôle.
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
