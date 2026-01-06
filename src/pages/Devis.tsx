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
import { Plus, Search, Eye, Edit, ArrowRight, FileText, Ban, Trash2, Send, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { devis, clients, formatMontant, formatDate, getStatutLabel } from "@/data/mockData";

export default function DevisPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  
  // États pour les modales de confirmation
  const [confirmAction, setConfirmAction] = useState<{
    type: 'annuler' | 'supprimer' | 'convertir' | null;
    id: string;
    numero: string;
  }>({ type: null, id: '', numero: '' });

  const confirmAnnuler = () => {
    if (confirmAction.type === 'annuler') {
      toast({
        title: "Devis annulé",
        description: `Le devis ${confirmAction.numero} a été annulé.`,
      });
      setConfirmAction({ type: null, id: '', numero: '' });
    }
  };

  const confirmSupprimer = () => {
    if (confirmAction.type === 'supprimer') {
      toast({
        title: "Devis supprimé",
        description: `Le devis ${confirmAction.numero} a été supprimé.`,
        variant: "destructive",
      });
      setConfirmAction({ type: null, id: '', numero: '' });
    }
  };

  const confirmConvertir = () => {
    if (confirmAction.type === 'convertir') {
      toast({
        title: "Conversion réussie",
        description: `Le devis ${confirmAction.numero} a été converti en ordre de travail.`,
      });
      setConfirmAction({ type: null, id: '', numero: '' });
      navigate("/ordres/nouveau");
    }
  };

  const handleEnvoyer = (id: string, numero: string) => {
    toast({
      title: "Devis envoyé",
      description: `Le devis ${numero} a été envoyé au client.`,
    });
  };

  const handleDupliquer = (id: string, numero: string) => {
    toast({
      title: "Devis dupliqué",
      description: `Une copie du devis ${numero} a été créée.`,
    });
  };

  const filteredDevis = devis.filter(d => {
    const client = clients.find(c => c.id === d.clientId);
    const matchSearch = d.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client?.nom.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatut = statutFilter === "all" || d.statut === statutFilter;
    return matchSearch && matchStatut;
  });

  const totalDevis = devis.reduce((sum, d) => sum + d.montantTTC, 0);
  const devisAcceptes = devis.filter(d => d.statut === 'accepte');

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

  return (
    <MainLayout title="Devis">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Devis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{devis.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Montant Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMontant(totalDevis)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Acceptés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{devisAcceptes.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                En attente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {devis.filter(d => d.statut === 'envoye').length}
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

        {/* Table */}
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
                    <TableRow key={d.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{d.numero}</TableCell>
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
                          <Button variant="ghost" size="icon" title="Voir">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {d.statut !== 'refuse' && d.statut !== 'expire' && (
                            <Button variant="ghost" size="icon" title="Modifier">
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {d.statut === 'brouillon' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Envoyer"
                              className="text-blue-600"
                              onClick={() => handleEnvoyer(d.id, d.numero)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {d.statut === 'accepte' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Convertir en ordre" 
                              className="text-primary"
                              onClick={() => setConfirmAction({ type: 'convertir', id: d.id, numero: d.numero })}
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Dupliquer"
                            onClick={() => handleDupliquer(d.id, d.numero)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="PDF">
                            <FileText className="h-4 w-4" />
                          </Button>
                          {d.statut !== 'refuse' && d.statut !== 'expire' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Annuler"
                              className="text-orange-600"
                              onClick={() => setConfirmAction({ type: 'annuler', id: d.id, numero: d.numero })}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Supprimer"
                            className="text-destructive"
                            onClick={() => setConfirmAction({ type: 'supprimer', id: d.id, numero: d.numero })}
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
              Êtes-vous sûr de vouloir annuler le devis <strong>{confirmAction.numero}</strong> ? 
              Cette action changera le statut du devis.
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
              Êtes-vous sûr de vouloir supprimer le devis <strong>{confirmAction.numero}</strong> ? 
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

      {/* Modal de confirmation pour conversion */}
      <AlertDialog 
        open={confirmAction.type === 'convertir'} 
        onOpenChange={(open) => !open && setConfirmAction({ type: null, id: '', numero: '' })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convertir en ordre de travail</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous convertir le devis <strong>{confirmAction.numero}</strong> en ordre de travail ? 
              Les données du devis seront utilisées pour créer l'ordre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmConvertir}>
              Convertir en ordre
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
