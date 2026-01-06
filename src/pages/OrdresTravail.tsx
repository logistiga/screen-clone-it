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
import { Plus, Search, Eye, Edit, ArrowRight, Wallet, FileText, Ban, Trash2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ordresTravail, clients, formatMontant, formatDate, getStatutLabel } from "@/data/mockData";

export default function OrdresTravailPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  // États pour les modales de confirmation
  const [confirmAction, setConfirmAction] = useState<{
    type: 'annuler' | 'supprimer' | null;
    id: string;
    numero: string;
  }>({ type: null, id: '', numero: '' });

  const confirmAnnuler = () => {
    if (confirmAction.type === 'annuler') {
      toast({
        title: "Ordre annulé",
        description: `L'ordre ${confirmAction.numero} a été annulé.`,
      });
      setConfirmAction({ type: null, id: '', numero: '' });
    }
  };

  const confirmSupprimer = () => {
    if (confirmAction.type === 'supprimer') {
      toast({
        title: "Ordre supprimé",
        description: `L'ordre ${confirmAction.numero} a été supprimé.`,
        variant: "destructive",
      });
      setConfirmAction({ type: null, id: '', numero: '' });
    }
  };

  const handleDupliquer = (id: string, numero: string) => {
    toast({
      title: "Ordre dupliqué",
      description: `Une copie de l'ordre ${numero} a été créée.`,
    });
  };

  const handleFacturer = (id: string, numero: string) => {
    toast({
      title: "Facturation",
      description: `L'ordre ${numero} sera facturé.`,
    });
    navigate("/factures/nouvelle");
  };

  const handlePaiement = (id: string, numero: string) => {
    toast({
      title: "Paiement",
      description: `Enregistrement du paiement pour l'ordre ${numero}.`,
    });
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

  return (
    <MainLayout title="Ordres de Travail">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Ordres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ordresTravail.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Montant Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMontant(totalOrdres)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Payé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatMontant(totalPaye)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                En cours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {ordresTravail.filter(o => o.statut === 'en_cours').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
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
          <Button className="gap-2" onClick={() => navigate("/ordres/nouveau")}>
            <Plus className="h-4 w-4" />
            Nouvel ordre
          </Button>
        </div>

        {/* Table */}
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
                    <TableRow key={ordre.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{ordre.numero}</TableCell>
                      <TableCell>{client?.nom}</TableCell>
                      <TableCell>{formatDate(ordre.dateCreation)}</TableCell>
                      <TableCell>{getTypeBadge(ordre.typeOperation)}</TableCell>
                      <TableCell className="text-right">{formatMontant(ordre.montantTTC)}</TableCell>
                      <TableCell className="text-right">
                        <span className={ordre.montantPaye > 0 ? "text-green-600" : ""}>
                          {formatMontant(ordre.montantPaye)}
                        </span>
                        {resteAPayer > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Reste: {formatMontant(resteAPayer)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatutBadge(ordre.statut)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" title="Voir">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {ordre.statut !== 'facture' && ordre.statut !== 'annule' && (
                            <Button variant="ghost" size="icon" title="Modifier">
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {ordre.statut !== 'facture' && ordre.statut !== 'annule' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                title="Paiement" 
                                className="text-green-600"
                                onClick={() => handlePaiement(ordre.id, ordre.numero)}
                              >
                                <Wallet className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                title="Facturer" 
                                className="text-primary"
                                onClick={() => handleFacturer(ordre.id, ordre.numero)}
                              >
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Dupliquer"
                            onClick={() => handleDupliquer(ordre.id, ordre.numero)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="PDF">
                            <FileText className="h-4 w-4" />
                          </Button>
                          {ordre.statut !== 'facture' && ordre.statut !== 'annule' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Annuler"
                              className="text-orange-600"
                              onClick={() => setConfirmAction({ type: 'annuler', id: ordre.id, numero: ordre.numero })}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Supprimer"
                            className="text-destructive"
                            onClick={() => setConfirmAction({ type: 'supprimer', id: ordre.id, numero: ordre.numero })}
                          >
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

      {/* Modal de confirmation pour annulation */}
      <AlertDialog 
        open={confirmAction.type === 'annuler'} 
        onOpenChange={(open) => !open && setConfirmAction({ type: null, id: '', numero: '' })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'annulation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir annuler l'ordre <strong>{confirmAction.numero}</strong> ? 
              Cette action changera le statut de l'ordre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non, garder</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAnnuler} className="bg-orange-600 hover:bg-orange-700">
              Oui, annuler
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de confirmation pour suppression */}
      <AlertDialog 
        open={confirmAction.type === 'supprimer'} 
        onOpenChange={(open) => !open && setConfirmAction({ type: null, id: '', numero: '' })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'ordre <strong>{confirmAction.numero}</strong> ? 
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non, garder</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSupprimer} className="bg-destructive hover:bg-destructive/90">
              Oui, supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
