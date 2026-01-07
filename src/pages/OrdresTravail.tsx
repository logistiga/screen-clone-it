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
import { Plus, Search, Eye, Edit, ArrowRight, Wallet, FileText, Ban, Trash2, Download, CreditCard, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PaiementModal } from "@/components/PaiementModal";
import { PaiementGlobalModal } from "@/components/PaiementGlobalModal";
import { ExportModal } from "@/components/ExportModal";
import { ordresTravail, clients, formatMontant, formatDate, getStatutLabel } from "@/data/mockData";

export default function OrdresTravailPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [confirmAction, setConfirmAction] = useState<{
    type: 'annuler' | 'supprimer' | 'facturer' | null;
    id: string;
    numero: string;
  }>({ type: null, id: '', numero: '' });
  const [paiementModal, setPaiementModal] = useState<{
    open: boolean;
    numero: string;
    montantRestant: number;
  }>({ open: false, numero: '', montantRestant: 0 });
  const [paiementGlobalOpen, setPaiementGlobalOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const resetConfirm = () => setConfirmAction({ type: null, id: '', numero: '' });

  const handleAction = () => {
    const index = ordresTravail.findIndex(o => o.id === confirmAction.id);
    if (index === -1) return resetConfirm();

    if (confirmAction.type === 'annuler') {
      ordresTravail[index].statut = 'annule';
      toast({ title: "Ordre annulé", description: `L'ordre ${confirmAction.numero} a été annulé.` });
    } else if (confirmAction.type === 'supprimer') {
      ordresTravail.splice(index, 1);
      toast({ title: "Ordre supprimé", description: `L'ordre ${confirmAction.numero} a été supprimé.`, variant: "destructive" });
    } else if (confirmAction.type === 'facturer') {
      ordresTravail[index].statut = 'facture';
      toast({ title: "Facturation réussie", description: `L'ordre ${confirmAction.numero} a été converti en facture.` });
      navigate("/factures/nouvelle");
    }
    resetConfirm();
  };

  const filteredOrdres = ordresTravail.filter(o => {
    const client = clients.find(c => c.id === o.clientId);
    const matchSearch = o.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatut = statutFilter === "all" || o.statut === statutFilter;
    const matchType = typeFilter === "all" || o.typeOperation === typeFilter;
    return matchSearch && matchStatut && matchType;
  });

  const totalOrdres = ordresTravail.reduce((sum, o) => sum + o.montantTTC, 0);
  const totalPaye = ordresTravail.reduce((sum, o) => sum + o.montantPaye, 0);
  const ordresEnCours = ordresTravail.filter(o => o.statut === 'en_cours').length;

  const getStatutBadge = (statut: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      en_cours: "outline",
      termine: "default",
      facture: "default",
      annule: "destructive",
    };
    return <Badge variant={variants[statut] || "secondary"}>{getStatutLabel(statut)}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      conteneurs: "bg-blue-100 text-blue-800",
      conventionnel: "bg-purple-100 text-purple-800",
      location: "bg-orange-100 text-orange-800",
      transport: "bg-green-100 text-green-800",
      manutention: "bg-yellow-100 text-yellow-800",
      stockage: "bg-gray-100 text-gray-800",
    };
    return <Badge className={colors[type] || "bg-gray-100"}>{type}</Badge>;
  };

  if (ordresTravail.length === 0) {
    return (
      <MainLayout title="Ordres de Travail">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Aucun ordre de travail</h2>
          <p className="text-muted-foreground mb-6">Commencez par créer votre premier ordre.</p>
          <Button onClick={() => navigate("/ordres/nouveau")} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouvel ordre
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Ordres de Travail">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Ordres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ordresTravail.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Montant Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMontant(totalOrdres)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Payé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatMontant(totalPaye)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En cours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{ordresEnCours}</div>
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
                <SelectItem value="en_cours">En cours</SelectItem>
                <SelectItem value="termine">Terminé</SelectItem>
                <SelectItem value="facture">Facturé</SelectItem>
                <SelectItem value="annule">Annulé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="conteneurs">Conteneurs</SelectItem>
                <SelectItem value="conventionnel">Conventionnel</SelectItem>
                <SelectItem value="location">Location</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
                <SelectItem value="manutention">Manutention</SelectItem>
                <SelectItem value="stockage">Stockage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setPaiementGlobalOpen(true)}>
              <CreditCard className="h-4 w-4" />
              Paiement global
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setExportOpen(true)}>
              <Download className="h-4 w-4" />
              Exporter
            </Button>
            <Button className="gap-2" onClick={() => navigate("/ordres/nouveau")}>
              <Plus className="h-4 w-4" />
              Nouvel ordre
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Montant TTC</TableHead>
                  <TableHead className="text-right">Payé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-40">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrdres.map((ordre) => {
                  const client = clients.find(c => c.id === ordre.clientId);
                  const resteAPayer = ordre.montantTTC - ordre.montantPaye;
                  return (
                    <TableRow key={ordre.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium text-primary hover:underline cursor-pointer" onClick={() => navigate(`/ordres/${ordre.id}`)}>
                        {ordre.numero}
                      </TableCell>
                      <TableCell>{client?.nom}</TableCell>
                      <TableCell>{formatDate(ordre.dateCreation)}</TableCell>
                      <TableCell>{getTypeBadge(ordre.typeOperation)}</TableCell>
                      <TableCell className="text-right">{formatMontant(ordre.montantTTC)}</TableCell>
                      <TableCell className="text-right">
                        <span className={ordre.montantPaye > 0 ? "text-green-600" : ""}>{formatMontant(ordre.montantPaye)}</span>
                        {resteAPayer > 0 && <div className="text-xs text-muted-foreground">Reste: {formatMontant(resteAPayer)}</div>}
                      </TableCell>
                      <TableCell>{getStatutBadge(ordre.statut)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" title="Voir" onClick={() => navigate(`/ordres/${ordre.id}`)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {ordre.statut !== 'facture' && ordre.statut !== 'annule' && (
                            <Button variant="ghost" size="icon" title="Modifier" onClick={() => navigate(`/ordres/${ordre.id}/modifier`)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {ordre.statut !== 'facture' && ordre.statut !== 'annule' && resteAPayer > 0 && (
                            <Button variant="ghost" size="icon" title="Paiement" className="text-green-600"
                              onClick={() => setPaiementModal({ open: true, numero: ordre.numero, montantRestant: resteAPayer })}>
                              <Wallet className="h-4 w-4" />
                            </Button>
                          )}
                          {ordre.statut !== 'facture' && ordre.statut !== 'annule' && (
                            <Button variant="ghost" size="icon" title="Facturer" className="text-primary"
                              onClick={() => setConfirmAction({ type: 'facturer', id: ordre.id, numero: ordre.numero })}>
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" title="PDF" onClick={() => window.open(`/ordres/${ordre.id}/pdf`, '_blank')}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          {ordre.statut !== 'facture' && ordre.statut !== 'annule' && (
                            <Button variant="ghost" size="icon" title="Annuler" className="text-orange-600"
                              onClick={() => setConfirmAction({ type: 'annuler', id: ordre.id, numero: ordre.numero })}>
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" title="Supprimer" className="text-destructive"
                            onClick={() => setConfirmAction({ type: 'supprimer', id: ordre.id, numero: ordre.numero })}>
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
              Êtes-vous sûr de vouloir annuler l'ordre <strong>{confirmAction.numero}</strong> ?
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
              Êtes-vous sûr de vouloir supprimer l'ordre <strong>{confirmAction.numero}</strong> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} className="bg-destructive hover:bg-destructive/90">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmAction.type === 'facturer'} onOpenChange={(open) => !open && resetConfirm()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convertir en facture</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous convertir l'ordre <strong>{confirmAction.numero}</strong> en facture ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>Créer la facture</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PaiementModal
        open={paiementModal.open}
        onOpenChange={(open) => setPaiementModal({ ...paiementModal, open })}
        documentType="ordre"
        documentNumero={paiementModal.numero}
        montantRestant={paiementModal.montantRestant}
      />

      <PaiementGlobalModal open={paiementGlobalOpen} onOpenChange={setPaiementGlobalOpen} />

      <ExportModal open={exportOpen} onOpenChange={setExportOpen} />
    </MainLayout>
  );
}
