import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Users, Plus, Search, Trash2, Loader2 } from "lucide-react";
import { Role } from "@/services/roleService";
import { useRole, useAvailableUsers, useAssignUsers, useUnassignUser } from "@/hooks/use-roles";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedRole: Role | null;
}

export function RolesUsersModal({ open, onOpenChange, selectedRole }: Props) {
  const [showAddUsers, setShowAddUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState<number[]>([]);

  const { data: roleDetail, isLoading: isLoadingRoleDetail, refetch: refetchRoleDetail } = useRole(open && selectedRole ? selectedRole.id : null);
  const { data: availableUsersData, isLoading: isLoadingAvailableUsers } = useAvailableUsers(
    showAddUsers && selectedRole ? selectedRole.id : null,
    userSearchTerm || undefined
  );

  const assignUsers = useAssignUsers();
  const unassignUser = useUnassignUser();

  const handleClose = (val: boolean) => {
    onOpenChange(val);
    if (!val) {
      setShowAddUsers(false);
      setSelectedUsersToAdd([]);
      setUserSearchTerm("");
    }
  };

  const handleUnassignUser = async (userId: number) => {
    if (!selectedRole) return;
    await unassignUser.mutateAsync({ roleId: selectedRole.id, userId });
    refetchRoleDetail();
  };

  const handleAssignUsers = async () => {
    if (!selectedRole || selectedUsersToAdd.length === 0) return;
    await assignUsers.mutateAsync({ roleId: selectedRole.id, userIds: selectedUsersToAdd });
    setSelectedUsersToAdd([]);
    setShowAddUsers(false);
    setUserSearchTerm("");
    refetchRoleDetail();
  };

  const toggleUserSelection = (userId: number) => {
    setSelectedUsersToAdd(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const availableUsers = availableUsersData?.data || [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gestion des utilisateurs - Rôle "{selectedRole?.name}"
          </DialogTitle>
          <DialogDescription>{roleDetail?.users?.length || 0} utilisateur(s) assigné(s) à ce rôle</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="flex gap-2 mb-4">
            <Button variant={!showAddUsers ? "default" : "outline"} size="sm" onClick={() => setShowAddUsers(false)}>
              <Users className="h-4 w-4 mr-2" />Utilisateurs actuels
            </Button>
            <Button variant={showAddUsers ? "default" : "outline"} size="sm" onClick={() => setShowAddUsers(true)}>
              <Plus className="h-4 w-4 mr-2" />Ajouter des utilisateurs
            </Button>
          </div>

          {!showAddUsers ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {isLoadingRoleDetail ? (
                <div className="space-y-3">{[1, 2, 3].map(i => (<div key={i} className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-1 flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div></div>))}</div>
              ) : roleDetail?.users && roleDetail.users.length > 0 ? (
                roleDetail.users.map((user: any) => (
                  <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-primary">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Badge variant={user.actif ? "default" : "secondary"} className="flex-shrink-0">{user.actif ? "Actif" : "Inactif"}</Badge>
                    <Button variant="ghost" size="icon" className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleUnassignUser(user.id)} disabled={unassignUser.isPending}>
                      {unassignUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground mb-4">Aucun utilisateur n'a ce rôle</p>
                  <Button size="sm" onClick={() => setShowAddUsers(true)}><Plus className="h-4 w-4 mr-2" />Ajouter des utilisateurs</Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher un utilisateur..." value={userSearchTerm} onChange={(e) => setUserSearchTerm(e.target.value)} className="pl-9" />
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
                {isLoadingAvailableUsers ? (
                  <div className="space-y-3">{[1, 2, 3].map(i => (<div key={i} className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-1 flex-1"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div></div>))}</div>
                ) : availableUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">Aucun utilisateur disponible</div>
                ) : (
                  availableUsers.map((user: any) => (
                    <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => toggleUserSelection(user.id)}>
                      <Checkbox checked={selectedUsersToAdd.includes(user.id)} onCheckedChange={() => toggleUserSelection(user.id)} />
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-primary">{user.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {showAddUsers && selectedUsersToAdd.length > 0 && (
            <Button onClick={handleAssignUsers} disabled={assignUsers.isPending} className="gap-2">
              {assignUsers.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Assigner {selectedUsersToAdd.length} utilisateur{selectedUsersToAdd.length > 1 ? 's' : ''}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
