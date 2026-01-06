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
import { Plus, Search, Eye, Wallet, Mail, FileText, Ban, Trash2, Copy, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { factures, clients, formatMontant, formatDate, getStatutLabel } from "@/data/mockData";

export default function FacturesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  
  // États pour les modales de confirmation
  const [confirmAction, setConfirmAction] = useState<{
    type: 'annuler' | 'supprimer' | null;
    id: string;
    numero: string;
  }>({ type: null, id: '', numero: '' });

  const confirmAnnuler = () => {
    if (confirmAction.type === 'annuler') {
      toast({
        title: "Facture annulée",
        description: `La facture ${confirmAction.numero} a été annulée.`,
      });
      setConfirmAction({ type: null, id: '', numero: '' });
    }
  };

  const confirmSupprimer = () => {
    if (confirmAction.type === 'supprimer') {
      toast({
        title: "Facture supprimée",
        description: `La facture ${confirmAction.numero} a été supprimée.`,
        variant: "destructive",
      });
      setConfirmAction({ type: null, id: '', numero: '' });
    }
  };

  const handleDupliquer = (id: string, numero: string) => {
    toast({
      title: "Facture dupliquée",
      description: `Une copie de la facture ${numero} a été créée.`,
    });
  };

  const handlePaiement = (id: string, numero: string) => {
    toast({
      title: "Paiement",
      description: `Enregistrement du paiement pour la facture ${numero}.`,
    });
  };

  const handleEnvoyer = (id: string, numero: string) => {
    toast({
      title: "Facture envoyée",
      description: `La facture ${numero} a été envoyée par email.`,
    });
  };

  const filteredFactures = factures.filter(f => {
    const client = clients.find(c => c.id === f.clientId);
    const matchSearch = f.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatut = statutFilter === "all" || f.statut === statutFilter;
    return matchSearch && matchStatut;
  });

  const totalFactures = factures.reduce((sum, f) => sum + f.montantTTC, 0);
  const totalPaye = factures.reduce((sum, f) => sum + f.montantPaye, 0);
  const totalImpaye = totalFactures - totalPaye;

  const getStatutBadge = (statut: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      emise: "outline",
      payee: "default",
      partielle: "secondary",
      impayee: "destructive",
      annulee: "destructive",
    };
    return <Badge variant={variants[statut] || "secondary"}>{getStatutLabel(statut)}</Badge>;
  };

  return (
    <MainLayout title="Factures">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Factures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{factures.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Montant Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMontant(totalFactures)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Encaissé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatMontant(totalPaye)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Impayé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatMontant(totalImpaye)}</div>
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
                <SelectItem value="emise">Émise</SelectItem>
                <SelectItem value="payee">Payée</SelectItem>
                <SelectItem value="partielle">Partielle</SelectItem>
                <SelectItem value="impayee">Impayée</SelectItem>
                <SelectItem value="annulee">Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="gap-2" onClick={() => navigate("/factures/nouvelle")}>
            <Plus className="h-4 w-4" />
            Nouvelle facture
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
                  <TableHead>Échéance</TableHead>
                  <TableHead className="text-right">Montant HT</TableHead>
                  <TableHead className="text-right">TVA (18%)</TableHead>
                  <TableHead className="text-right">CSS (1%)</TableHead>
                  <TableHead className="text-right">Total TTC</TableHead>
                  <TableHead className="text-right">Payé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-48">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFactures.map((facture) => {
                  const client = clients.find(c => c.id === facture.clientId);
                  const resteAPayer = facture.montantTTC - facture.montantPaye;
                  return (
                    <TableRow key={facture.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{facture.numero}</TableCell>
                      <TableCell>{client?.nom}</TableCell>
                      <TableCell>{formatDate(facture.dateCreation)}</TableCell>
                      <TableCell>{formatDate(facture.dateEcheance)}</TableCell>
                      <TableCell className="text-right">{formatMontant(facture.montantHT)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatMontant(facture.tva)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatMontant(facture.css)}</TableCell>
                      <TableCell className="text-right font-medium">{formatMontant(facture.montantTTC)}</TableCell>
                      <TableCell className="text-right">
                        <span className={facture.montantPaye > 0 ? "text-green-600" : ""}>
                          {formatMontant(facture.montantPaye)}
                        </span>
                        {resteAPayer > 0 && facture.statut !== 'payee' && (
                          <div className="text-xs text-destructive">
                            Reste: {formatMontant(resteAPayer)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatutBadge(facture.statut)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" title="Voir">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {facture.statut !== 'payee' && facture.statut !== 'annulee' && (
                            <Button variant="ghost" size="icon" title="Modifier">
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {facture.statut !== 'payee' && facture.statut !== 'annulee' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Paiement" 
                              className="text-green-600"
                              onClick={() => handlePaiement(facture.id, facture.numero)}
                            >
                              <Wallet className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Envoyer par email"
                            className="text-blue-600"
                            onClick={() => handleEnvoyer(facture.id, facture.numero)}
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Dupliquer"
                            onClick={() => handleDupliquer(facture.id, facture.numero)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="PDF">
                            <FileText className="h-4 w-4" />
                          </Button>
                          {facture.statut !== 'payee' && facture.statut !== 'annulee' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Annuler"
                              className="text-orange-600"
                              onClick={() => setConfirmAction({ type: 'annuler', id: facture.id, numero: facture.numero })}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Supprimer"
                            className="text-destructive"
                            onClick={() => setConfirmAction({ type: 'supprimer', id: facture.id, numero: facture.numero })}
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
              Êtes-vous sûr de vouloir annuler la facture <strong>{confirmAction.numero}</strong> ? 
              Cette action changera le statut de la facture.
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
              Êtes-vous sûr de vouloir supprimer la facture <strong>{confirmAction.numero}</strong> ? 
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