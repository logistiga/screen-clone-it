import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Search, Eye, Edit, ArrowRight, FileText, Ban, Trash2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EmailModal } from "@/components/EmailModal";
import { devis, clients, formatMontant, formatDate, getStatutLabel } from "@/data/mockData";

export default function DevisPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [confirmAction, setConfirmAction] = useState<{
    type: 'annuler' | 'supprimer' | 'convertir' | null;
    id: string;
    numero: string;
  }>({ type: null, id: '', numero: '' });
  const [emailModal, setEmailModal] = useState<{
    open: boolean;
    numero: string;
    clientEmail: string;
    clientNom: string;
  }>({ open: false, numero: '', clientEmail: '', clientNom: '' });

  const resetConfirm = () => setConfirmAction({ type: null, id: '', numero: '' });

  const handleAction = () => {
    const index = devis.findIndex(d => d.id === confirmAction.id);
    if (index === -1) return resetConfirm();

    if (confirmAction.type === 'annuler') {
      devis[index].statut = 'refuse';
      toast({ title: "Devis annulé", description: `Le devis ${confirmAction.numero} a été annulé.` });
    } else if (confirmAction.type === 'supprimer') {
      devis.splice(index, 1);
      toast({ title: "Devis supprimé", description: `Le devis ${confirmAction.numero} a été supprimé.`, variant: "destructive" });
    } else if (confirmAction.type === 'convertir') {
      toast({ title: "Conversion réussie", description: `Le devis ${confirmAction.numero} a été converti en ordre de travail.` });
      navigate("/ordres/nouveau");
    }
    resetConfirm();
  };

  const filteredDevis = devis.filter(d => {
    const client = clients.find(c => c.id === d.clientId);
    const matchSearch = d.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatut = statutFilter === "all" || d.statut === statutFilter;
    return matchSearch && matchStatut;
  });

  const totalDevis = devis.reduce((sum, d) => sum + d.montantTTC, 0);
  const devisAcceptes = devis.filter(d => d.statut === 'accepte').length;
  const devisEnAttente = devis.filter(d => d.statut === 'envoye').length;

  const getStatutBadge = (statut: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      brouillon: "secondary",
      envoye: "outline",
      accepte: "default",
      refuse: "destructive",
      expire: "destructive",
    };
    return <Badge variant={variants[statut] || "secondary"}>{getStatutLabel(statut)}</Badge>;
  };

  if (devis.length === 0) {
    return (
      <MainLayout title="Devis">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Aucun devis</h2>
          <p className="text-muted-foreground mb-6">Commencez par créer votre premier devis.</p>
          <Button onClick={() => navigate("/devis/nouveau")} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau devis
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Devis">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Devis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{devis.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Montant Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMontant(totalDevis)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Acceptés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{devisAcceptes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{devisEnAttente}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={statutFilter} onValueChange={setStatutFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="brouillon">Brouillon</SelectItem>
                <SelectItem value="envoye">Envoyé</SelectItem>
                <SelectItem value="accepte">Accepté</SelectItem>
                <SelectItem value="refuse">Refusé</SelectItem>
                <SelectItem value="expire">Expiré</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="gap-2" onClick={() => navigate("/devis/nouveau")}>
            <Plus className="h-4 w-4" />
            Nouveau devis
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Validité</TableHead>
                  <TableHead className="text-right">Montant HT</TableHead>
                  <TableHead className="text-right">TVA</TableHead>
                  <TableHead className="text-right">CSS</TableHead>
                  <TableHead className="text-right">Total TTC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-40">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDevis.map((d) => {
                  const client = clients.find(c => c.id === d.clientId);
                  return (
                    <TableRow key={d.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-primary hover:underline cursor-pointer" onClick={() => navigate(`/devis/${d.id}`)}>
                        {d.numero}
                      </TableCell>
                      <TableCell>{client?.nom}</TableCell>
                      <TableCell>{formatDate(d.dateCreation)}</TableCell>
                      <TableCell>{formatDate(d.dateValidite)}</TableCell>
                      <TableCell className="text-right">{formatMontant(d.montantHT)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatMontant(d.tva)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatMontant(d.css)}</TableCell>
                      <TableCell className="text-right font-medium">{formatMontant(d.montantTTC)}</TableCell>
                      <TableCell>{getStatutBadge(d.statut)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" title="Voir" onClick={() => navigate(`/devis/${d.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {d.statut !== 'refuse' && d.statut !== 'expire' && (
                            <Button variant="ghost" size="icon" title="Modifier" onClick={() => navigate(`/devis/${d.id}/modifier`)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" title="PDF" onClick={() => window.open(`/devis/${d.id}/pdf`, '_blank')}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Envoyer par email" className="text-blue-600"
                            onClick={() => setEmailModal({ open: true, numero: d.numero, clientEmail: client?.email || '', clientNom: client?.nom || '' })}>
                            <Mail className="h-4 w-4" />
                          </Button>
                          {d.statut === 'accepte' && (
                            <Button variant="ghost" size="icon" title="Convertir en ordre" className="text-primary"
                              onClick={() => setConfirmAction({ type: 'convertir', id: d.id, numero: d.numero })}>
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          )}
                          {d.statut !== 'refuse' && d.statut !== 'expire' && (
                            <Button variant="ghost" size="icon" title="Annuler" className="text-orange-600"
                              onClick={() => setConfirmAction({ type: 'annuler', id: d.id, numero: d.numero })}>
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" title="Supprimer" className="text-destructive"
                            onClick={() => setConfirmAction({ type: 'supprimer', id: d.id, numero: d.numero })}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={confirmAction.type === 'annuler'} onOpenChange={(open) => !open && resetConfirm()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'annulation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir annuler le devis <strong>{confirmAction.numero}</strong> ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} className="bg-orange-600 hover:bg-orange-700">Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmAction.type === 'supprimer'} onOpenChange={(open) => !open && resetConfirm()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le devis <strong>{confirmAction.numero}</strong> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmAction.type === 'convertir'} onOpenChange={(open) => !open && resetConfirm()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convertir en ordre de travail</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous convertir le devis <strong>{confirmAction.numero}</strong> en ordre de travail ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>Convertir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EmailModal
        open={emailModal.open}
        onOpenChange={(open) => setEmailModal({ ...emailModal, open })}
        documentType="devis"
        documentNumero={emailModal.numero}
        clientEmail={emailModal.clientEmail}
        clientNom={emailModal.clientNom}
      />
    </MainLayout>
  );
}
