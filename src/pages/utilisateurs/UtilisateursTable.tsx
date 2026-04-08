import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Mail, Calendar, Shield, Users, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { User } from "@/services/userService";

interface Props {
  users: User[];
  totalUsers: number;
  totalPages: number;
  currentPage: number;
  setCurrentPage: (p: number | ((p: number) => number)) => void;
  isLoadingUsers: boolean;
  searchTerm: string;
  filterRole: string;
  filterStatut: string;
  getInitials: (name: string) => string;
  getRoleName: (user: User) => string;
  formatDate: (date: string) => string;
  handleOpenAdd: () => void;
  handleOpenEdit: (user: User) => void;
  handleOpenDelete: (user: User) => void;
  handleToggleActif: (user: User) => void;
  toggleActifPending: boolean;
}

export function UtilisateursTable({
  users, totalUsers, totalPages, currentPage, setCurrentPage,
  isLoadingUsers, searchTerm, filterRole, filterStatut,
  getInitials, getRoleName, formatDate,
  handleOpenAdd, handleOpenEdit, handleOpenDelete, handleToggleActif, toggleActifPending,
}: Props) {
  if (isLoadingUsers) {
    return (
      <Card><CardContent className="p-6"><div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-60" /></div>
          </div>
        ))}
      </div></CardContent></Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center">
        <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">Aucun utilisateur trouvé</h3>
        <p className="text-muted-foreground mb-4">
          {searchTerm || filterRole !== 'all' || filterStatut !== 'all'
            ? "Aucun utilisateur ne correspond à vos critères."
            : "Commencez par créer votre premier utilisateur."}
        </p>
        {!searchTerm && filterRole === 'all' && filterStatut === 'all' && (
          <Button onClick={handleOpenAdd} className="gap-2"><Plus className="h-4 w-4" />Nouvel utilisateur</Button>
        )}
      </CardContent></Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b py-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Liste des utilisateurs</CardTitle>
            <CardDescription>{totalUsers} utilisateur{totalUsers > 1 ? 's' : ''} au total</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold">Utilisateur</TableHead>
                <TableHead className="font-semibold">Rôle</TableHead>
                <TableHead className="font-semibold">Statut</TableHead>
                <TableHead className="font-semibold">Créé le</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {users.map((user, index) => (
                  <motion.tr key={user.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ delay: index * 0.03 }} className="border-b hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-primary/20"><AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">{getInitials(user.nom)}</AvatarFallback></Avatar>
                        <div><p className="font-medium text-foreground">{user.nom}</p><div className="flex items-center gap-1.5 text-sm text-muted-foreground"><Mail className="h-3.5 w-3.5" />{user.email}</div></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1.5 font-medium border-primary/30 bg-primary/5 capitalize"><Shield className="h-3 w-3 text-primary" />{getRoleName(user)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={user.actif} onCheckedChange={() => handleToggleActif(user)} disabled={toggleActifPending || user.email === 'admin@logistiga.com'} />
                        <Badge className={user.actif ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-muted text-muted-foreground"}>
                          {user.actif ? <><CheckCircle2 className="h-3 w-3 mr-1" /> Actif</> : <><XCircle className="h-3 w-3 mr-1" /> Inactif</>}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell><div className="flex items-center gap-1.5 text-sm text-muted-foreground"><Calendar className="h-3.5 w-3.5" />{formatDate(user.created_at)}</div></TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(user)} title="Modifier" className="hover:bg-primary/10 hover:text-primary"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleOpenDelete(user)} title="Supprimer"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">Page {currentPage} sur {totalPages}</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
