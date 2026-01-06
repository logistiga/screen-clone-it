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
import { Plus, Search, Eye, Edit, ArrowRight, FileText, Ban, Trash2, Send, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { devis, clients, formatMontant, formatDate, getStatutLabel } from "@/data/mockData";

export default function DevisPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("all");

  const handleAnnuler = (id: string, numero: string) => {
    toast({
      title: "Devis annulé",
      description: `Le devis ${numero} a été annulé.`,
    });
  };

  const handleSupprimer = (id: string, numero: string) => {
    toast({
      title: "Devis supprimé",
      description: `Le devis ${numero} a été supprimé.`,
      variant: "destructive",
    });
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

  const handleConvertir = (id: string, numero: string) => {
    toast({
      title: "Conversion en ordre",
      description: `Le devis ${numero} a été converti en ordre de travail.`,
    });
    navigate("/ordres/nouveau");
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
                              onClick={() => handleConvertir(d.id, d.numero)}
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
                              onClick={() => handleAnnuler(d.id, d.numero)}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Supprimer"
                            className="text-destructive"
                            onClick={() => handleSupprimer(d.id, d.numero)}
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
    </MainLayout>
  );
}
