import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Eye, EyeOff, Shield, Loader2 } from "lucide-react";
import { User, UserRole } from "@/services/userService";

interface Props {
  showModal: boolean; setShowModal: (v: boolean) => void;
  showDeleteDialog: boolean; setShowDeleteDialog: (v: boolean) => void;
  selectedUser: User | null;
  isEditing: boolean;
  showPassword: boolean; setShowPassword: (v: boolean) => void;
  formData: { nom: string; email: string; password: string; password_confirmation: string; role: string; actif: boolean };
  setFormData: (fn: any) => void;
  roles: UserRole[];
  validateForm: () => boolean;
  handleSubmit: () => void;
  handleDelete: () => void;
  createPending: boolean;
  updatePending: boolean;
  deletePending: boolean;
}

export function UtilisateursModals({
  showModal, setShowModal, showDeleteDialog, setShowDeleteDialog,
  selectedUser, isEditing, showPassword, setShowPassword,
  formData, setFormData, roles, validateForm, handleSubmit, handleDelete,
  createPending, updatePending, deletePending,
}: Props) {
  return (
    <>
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEditing ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
              {isEditing ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
            </DialogTitle>
            <DialogDescription>{isEditing ? 'Modifiez les informations de l\'utilisateur' : 'Créez un nouveau compte utilisateur'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom complet *</Label>
              <Input id="nom" value={formData.nom} maxLength={100} onChange={(e) => setFormData((prev: any) => ({ ...prev, nom: e.target.value }))} placeholder="Jean Dupont" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={formData.email} maxLength={255} onChange={(e) => setFormData((prev: any) => ({ ...prev, email: e.target.value }))} placeholder="jean.dupont@exemple.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe {!isEditing && '*'}{isEditing && <span className="text-muted-foreground font-normal"> (laisser vide pour conserver)</span>}</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={formData.password} maxLength={100} onChange={(e) => setFormData((prev: any) => ({ ...prev, password: e.target.value }))} placeholder={isEditing ? '••••••••' : 'Min. 8 caractères'} className="pr-10" />
                <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {(formData.password || !isEditing) && (
              <div className="space-y-2">
                <Label htmlFor="password_confirmation">Confirmer le mot de passe *</Label>
                <Input id="password_confirmation" type={showPassword ? 'text' : 'password'} value={formData.password_confirmation} maxLength={100} onChange={(e) => setFormData((prev: any) => ({ ...prev, password_confirmation: e.target.value }))} placeholder="Confirmer le mot de passe" />
                {formData.password && formData.password_confirmation && formData.password !== formData.password_confirmation && (
                  <p className="text-sm text-destructive">Les mots de passe ne correspondent pas</p>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="role">Rôle *</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData((prev: any) => ({ ...prev, role: value }))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un rôle" /></SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.name}>
                      <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /><span className="capitalize">{role.name}</span></div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
              <div><Label htmlFor="actif" className="font-medium">Compte actif</Label><p className="text-sm text-muted-foreground">L'utilisateur peut se connecter</p></div>
              <Switch id="actif" checked={formData.actif} onCheckedChange={(checked) => setFormData((prev: any) => ({ ...prev, actif: checked }))} />
            </div>
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={!validateForm() || createPending || updatePending} className="gap-2">
              {(createPending || updatePending) && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEditing ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive"><Trash2 className="h-5 w-5" />Supprimer cet utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>Êtes-vous sûr de vouloir supprimer l'utilisateur "<strong>{selectedUser?.nom}</strong>" ? Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deletePending}>
              {deletePending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
