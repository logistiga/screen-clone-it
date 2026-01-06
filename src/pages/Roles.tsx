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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Pencil, Trash2, Shield, Copy, Users, FileText, Truck, Receipt, Wallet, Building2, BarChart3, Settings, Mail, CreditCard, TrendingUp, History, Bell, FileSpreadsheet } from "lucide-react";
import { roles as initialRoles, Role, Permission } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

// Définition de toutes les pages avec leurs actions spécifiques
const PAGES_CONFIG = [
  {
    id: 'clients',
    label: 'Clients',
    icon: Users,
    actions: [
      { id: 'voir_liste', label: 'Voir la liste des clients' },
      { id: 'voir_detail', label: 'Voir le détail client' },
      { id: 'creer', label: 'Créer un nouveau client' },
      { id: 'modifier', label: 'Modifier un client' },
      { id: 'supprimer', label: 'Supprimer un client' },
      { id: 'exporter', label: 'Exporter les clients' }
    ]
  },
  {
    id: 'devis',
    label: 'Devis',
    icon: FileText,
    actions: [
      { id: 'voir_liste', label: 'Voir la liste des devis' },
      { id: 'voir_detail', label: 'Voir le détail devis' },
      { id: 'creer', label: 'Créer un nouveau devis' },
      { id: 'modifier', label: 'Modifier un devis' },
      { id: 'supprimer', label: 'Supprimer un devis' },
      { id: 'envoyer_email', label: 'Envoyer par email' },
      { id: 'exporter_pdf', label: 'Exporter en PDF' },
      { id: 'convertir_ordre', label: 'Convertir en ordre de travail' }
    ]
  },
  {
    id: 'ordres',
    label: 'Ordres de Travail',
    icon: Truck,
    actions: [
      { id: 'voir_liste', label: 'Voir la liste des ordres' },
      { id: 'voir_detail', label: 'Voir le détail ordre' },
      { id: 'creer', label: 'Créer un nouvel ordre' },
      { id: 'modifier', label: 'Modifier un ordre' },
      { id: 'supprimer', label: 'Supprimer un ordre' },
      { id: 'terminer', label: 'Marquer comme terminé' },
      { id: 'envoyer_email', label: 'Envoyer par email' },
      { id: 'exporter_pdf', label: 'Exporter en PDF' },
      { id: 'convertir_facture', label: 'Convertir en facture' },
      { id: 'encaisser_paiement', label: 'Encaisser un paiement' }
    ]
  },
  {
    id: 'factures',
    label: 'Factures',
    icon: Receipt,
    actions: [
      { id: 'voir_liste', label: 'Voir la liste des factures' },
      { id: 'voir_detail', label: 'Voir le détail facture' },
      { id: 'creer', label: 'Créer une nouvelle facture' },
      { id: 'modifier', label: 'Modifier une facture' },
      { id: 'supprimer', label: 'Supprimer une facture' },
      { id: 'envoyer_email', label: 'Envoyer par email' },
      { id: 'exporter_pdf', label: 'Exporter en PDF' },
      { id: 'encaisser_paiement', label: 'Encaisser un paiement' },
      { id: 'annuler', label: 'Annuler une facture' }
    ]
  },
  {
    id: 'notes_debut',
    label: 'Notes de Début',
    icon: FileSpreadsheet,
    actions: [
      { id: 'voir_liste', label: 'Voir la liste des notes' },
      { id: 'voir_detail', label: 'Voir le détail note' },
      { id: 'creer', label: 'Créer une nouvelle note' },
      { id: 'modifier', label: 'Modifier une note' },
      { id: 'supprimer', label: 'Supprimer une note' },
      { id: 'envoyer_email', label: 'Envoyer par email' },
      { id: 'exporter_pdf', label: 'Exporter en PDF' }
    ]
  },
  {
    id: 'caisse',
    label: 'Caisse',
    icon: Wallet,
    actions: [
      { id: 'voir', label: 'Voir la caisse' },
      { id: 'entree', label: 'Effectuer une entrée' },
      { id: 'sortie', label: 'Effectuer une sortie' },
      { id: 'transfert_banque', label: 'Transférer vers banque' },
      { id: 'exporter', label: 'Exporter les mouvements' }
    ]
  },
  {
    id: 'caisse_globale',
    label: 'Caisse Globale',
    icon: Wallet,
    actions: [
      { id: 'voir', label: 'Voir la caisse globale' },
      { id: 'paiement_global', label: 'Effectuer un paiement global' },
      { id: 'exporter', label: 'Exporter' }
    ]
  },
  {
    id: 'banques',
    label: 'Banques',
    icon: Building2,
    actions: [
      { id: 'voir_liste', label: 'Voir la liste des banques' },
      { id: 'voir_detail', label: 'Voir le détail banque' },
      { id: 'creer', label: 'Créer une nouvelle banque' },
      { id: 'modifier', label: 'Modifier une banque' },
      { id: 'supprimer', label: 'Supprimer une banque' },
      { id: 'activer_desactiver', label: 'Activer/Désactiver' }
    ]
  },
  {
    id: 'credits',
    label: 'Crédits Bancaires',
    icon: CreditCard,
    actions: [
      { id: 'voir_liste', label: 'Voir la liste des crédits' },
      { id: 'voir_detail', label: 'Voir le détail crédit' },
      { id: 'creer', label: 'Créer un nouveau crédit' },
      { id: 'modifier', label: 'Modifier un crédit' },
      { id: 'rembourser', label: 'Effectuer un remboursement' },
      { id: 'cloturer', label: 'Clôturer un crédit' }
    ]
  },
  {
    id: 'previsions',
    label: 'Prévisions',
    icon: TrendingUp,
    actions: [
      { id: 'voir_liste', label: 'Voir la liste des prévisions' },
      { id: 'creer', label: 'Créer une prévision' },
      { id: 'modifier', label: 'Modifier une prévision' },
      { id: 'supprimer', label: 'Supprimer une prévision' },
      { id: 'approuver', label: 'Approuver une prévision' },
      { id: 'refuser', label: 'Refuser une prévision' }
    ]
  },
  {
    id: 'annulations',
    label: 'Annulations',
    icon: Bell,
    actions: [
      { id: 'voir_liste', label: 'Voir la liste des annulations' },
      { id: 'annuler_devis', label: 'Annuler un devis' },
      { id: 'annuler_ordre', label: 'Annuler un ordre' },
      { id: 'annuler_facture', label: 'Annuler une facture' }
    ]
  },
  {
    id: 'reporting',
    label: 'Reporting',
    icon: BarChart3,
    actions: [
      { id: 'voir', label: 'Voir les rapports' },
      { id: 'exporter_excel', label: 'Exporter en Excel' },
      { id: 'exporter_pdf', label: 'Exporter en PDF' }
    ]
  },
  {
    id: 'tracabilite',
    label: 'Traçabilité',
    icon: History,
    actions: [
      { id: 'voir', label: 'Voir l\'historique des actions' },
      { id: 'filtrer', label: 'Filtrer les actions' },
      { id: 'exporter', label: 'Exporter l\'historique' }
    ]
  },
  {
    id: 'emails',
    label: 'Emails',
    icon: Mail,
    actions: [
      { id: 'voir_modeles', label: 'Voir les modèles' },
      { id: 'creer_modele', label: 'Créer un modèle' },
      { id: 'modifier_modele', label: 'Modifier un modèle' },
      { id: 'supprimer_modele', label: 'Supprimer un modèle' },
      { id: 'configurer_smtp', label: 'Configurer SMTP' },
      { id: 'gerer_automatisation', label: 'Gérer l\'automatisation' },
      { id: 'envoyer_test', label: 'Envoyer email de test' }
    ]
  },
  {
    id: 'utilisateurs',
    label: 'Utilisateurs',
    icon: Users,
    actions: [
      { id: 'voir_liste', label: 'Voir la liste des utilisateurs' },
      { id: 'creer', label: 'Créer un utilisateur' },
      { id: 'modifier', label: 'Modifier un utilisateur' },
      { id: 'supprimer', label: 'Supprimer un utilisateur' },
      { id: 'activer_desactiver', label: 'Activer/Désactiver' },
      { id: 'changer_role', label: 'Changer le rôle' }
    ]
  },
  {
    id: 'roles',
    label: 'Rôles',
    icon: Shield,
    actions: [
      { id: 'voir_liste', label: 'Voir la liste des rôles' },
      { id: 'creer', label: 'Créer un rôle' },
      { id: 'modifier', label: 'Modifier un rôle' },
      { id: 'supprimer', label: 'Supprimer un rôle' },
      { id: 'dupliquer', label: 'Dupliquer un rôle' }
    ]
  },
  {
    id: 'numerotation',
    label: 'Numérotation',
    icon: Settings,
    actions: [
      { id: 'voir', label: 'Voir la configuration' },
      { id: 'modifier_format', label: 'Modifier les formats' },
      { id: 'modifier_compteurs', label: 'Modifier les compteurs' }
    ]
  },
  {
    id: 'taxes',
    label: 'Taxes',
    icon: Settings,
    actions: [
      { id: 'voir', label: 'Voir la configuration' },
      { id: 'modifier', label: 'Modifier les taxes' }
    ]
  }
];

interface PagePermission {
  pageId: string;
  actionId: string;
  autorise: boolean;
}

const createEmptyPermissions = (): PagePermission[] => {
  const permissions: PagePermission[] = [];
  PAGES_CONFIG.forEach(page => {
    page.actions.forEach(action => {
      permissions.push({ pageId: page.id, actionId: action.id, autorise: false });
    });
  });
  return permissions;
};

const createFullPermissions = (): PagePermission[] => {
  const permissions: PagePermission[] = [];
  PAGES_CONFIG.forEach(page => {
    page.actions.forEach(action => {
      permissions.push({ pageId: page.id, actionId: action.id, autorise: true });
    });
  });
  return permissions;
};

// Convertir les anciennes permissions vers le nouveau format
const convertOldPermissions = (oldPerms: Permission[]): PagePermission[] => {
  const newPerms = createEmptyPermissions();
  // Simple mapping - activer toutes les actions d'une page si l'ancien module avait des permissions
  oldPerms.forEach(oldPerm => {
    if (oldPerm.autorise) {
      newPerms.forEach(newPerm => {
        if (newPerm.pageId === oldPerm.module) {
          newPerm.autorise = true;
        }
      });
    }
  });
  return newPerms;
};

interface RoleWithPagePermissions {
  id: string;
  nom: string;
  description: string;
  permissions: PagePermission[];
}

export default function RolesPage() {
  const { toast } = useToast();
  
  // Convertir les rôles initiaux
  const [roles, setRoles] = useState<RoleWithPagePermissions[]>(
    initialRoles.map(r => ({
      ...r,
      permissions: convertOldPermissions(r.permissions)
    }))
  );
  
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleWithPagePermissions | null>(null);
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

  const handleOpenEdit = (role: RoleWithPagePermissions) => {
    setSelectedRole(role);
    setIsEditing(true);
    setFormData({
      nom: role.nom,
      description: role.description,
      permissions: [...role.permissions]
    });
    setShowModal(true);
  };

  const handleDuplicate = (role: RoleWithPagePermissions) => {
    setSelectedRole(null);
    setIsEditing(false);
    setFormData({
      nom: `${role.nom} (copie)`,
      description: role.description,
      permissions: [...role.permissions]
    });
    setShowModal(true);
  };

  const handleOpenDelete = (role: RoleWithPagePermissions) => {
    setSelectedRole(role);
    setShowDeleteDialog(true);
  };

  const getPermission = (pageId: string, actionId: string): boolean => {
    const perm = formData.permissions.find(p => p.pageId === pageId && p.actionId === actionId);
    return perm?.autorise || false;
  };

  const togglePermission = (pageId: string, actionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.map(p =>
        p.pageId === pageId && p.actionId === actionId
          ? { ...p, autorise: !p.autorise }
          : p
      )
    }));
  };

  const togglePageAll = (pageId: string) => {
    const pagePerms = formData.permissions.filter(p => p.pageId === pageId);
    const allActive = pagePerms.every(p => p.autorise);
    
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.map(p =>
        p.pageId === pageId ? { ...p, autorise: !allActive } : p
      )
    }));
  };

  const isPageFullyActive = (pageId: string): boolean => {
    const pagePerms = formData.permissions.filter(p => p.pageId === pageId);
    return pagePerms.every(p => p.autorise);
  };

  const isPagePartiallyActive = (pageId: string): boolean => {
    const pagePerms = formData.permissions.filter(p => p.pageId === pageId);
    const activeCount = pagePerms.filter(p => p.autorise).length;
    return activeCount > 0 && activeCount < pagePerms.length;
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
      const newRole: RoleWithPagePermissions = {
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

  const getRolePermission = (role: RoleWithPagePermissions, pageId: string, actionId: string): boolean => {
    const perm = role.permissions.find(p => p.pageId === pageId && p.actionId === actionId);
    return perm?.autorise || false;
  };

  const countActivePermissions = (role: RoleWithPagePermissions): number => {
    return role.permissions.filter(p => p.autorise).length;
  };

  const countPageActivePermissions = (role: RoleWithPagePermissions, pageId: string): number => {
    return role.permissions.filter(p => p.pageId === pageId && p.autorise).length;
  };

  const getTotalPermissions = (): number => {
    return PAGES_CONFIG.reduce((acc, page) => acc + page.actions.length, 0);
  };

  return (
    <MainLayout title="Gestion des Rôles">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Définissez les rôles et permissions pour contrôler l'accès aux pages et fonctionnalités
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
                        {countActivePermissions(role)} permissions actives sur {getTotalPermissions()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDuplicate(role)} title="Dupliquer">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleOpenEdit(role)} title="Modifier">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleOpenDelete(role)} title="Supprimer">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {PAGES_CONFIG.map(page => {
                    const activeCount = countPageActivePermissions(role, page.id);
                    const Icon = page.icon;
                    return (
                      <AccordionItem key={page.id} value={page.id}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span>{page.label}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${activeCount === page.actions.length ? 'bg-green-100 text-green-700' : activeCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}>
                              {activeCount}/{page.actions.length}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pl-7 pt-2">
                            {page.actions.map(action => (
                              <div key={action.id} className="flex items-center gap-2">
                                <Checkbox
                                  checked={getRolePermission(role, page.id, action.id)}
                                  disabled
                                />
                                <span className="text-sm">{action.label}</span>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
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
                  <Label className="text-base font-semibold">Permissions par page</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllPermissions}>
                      Tout sélectionner
                    </Button>
                    <Button variant="outline" size="sm" onClick={deselectAllPermissions}>
                      Tout désélectionner
                    </Button>
                  </div>
                </div>

                <Accordion type="multiple" className="w-full border rounded-lg">
                  {PAGES_CONFIG.map(page => {
                    const Icon = page.icon;
                    const fullyActive = isPageFullyActive(page.id);
                    const partiallyActive = isPagePartiallyActive(page.id);
                    
                    return (
                      <AccordionItem key={page.id} value={page.id} className="border-b last:border-0">
                        <AccordionTrigger className="hover:no-underline px-4">
                          <div className="flex items-center gap-3 flex-1">
                            <Checkbox
                              checked={fullyActive}
                              className={partiallyActive ? "data-[state=checked]:bg-amber-500" : ""}
                              onCheckedChange={() => togglePageAll(page.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{page.label}</span>
                            <span className="text-xs text-muted-foreground">
                              ({page.actions.length} actions)
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8 pt-2">
                            {page.actions.map(action => (
                              <div key={action.id} className="flex items-center gap-2 p-2 rounded hover:bg-muted/50">
                                <Checkbox
                                  id={`${page.id}-${action.id}`}
                                  checked={getPermission(page.id, action.id)}
                                  onCheckedChange={() => togglePermission(page.id, action.id)}
                                />
                                <Label htmlFor={`${page.id}-${action.id}`} className="text-sm cursor-pointer flex-1">
                                  {action.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
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
