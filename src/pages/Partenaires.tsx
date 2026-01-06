import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Eye, Edit, Trash2, Ship, User, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { formatMontant } from "@/data/mockData";
import { 
  transitairesData, 
  representantsData, 
  armateursData,
  getPrimesTransitaire,
  getPrimesRepresentant,
  getTotalPrimesDues,
  getTotalPrimesPayees
} from "@/data/partenairesData";
import { NouveauTransitaireModal } from "@/components/NouveauTransitaireModal";
import { NouveauRepresentantModal } from "@/components/NouveauRepresentantModal";
import { NouvelArmateurModal } from "@/components/NouvelArmateurModal";

export default function PartenairesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; nom: string; type: string } | null>(null);
  const [showTransitaireModal, setShowTransitaireModal] = useState(false);
  const [showRepresentantModal, setShowRepresentantModal] = useState(false);
  const [showArmateurModal, setShowArmateurModal] = useState(false);

  // Filtrage
  const filteredTransitaires = transitairesData.filter(t =>
    t.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRepresentants = representantsData.filter(r =>
    r.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredArmateurs = armateursData.filter(a =>
    a.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats transitaires
  const totalPrimesDuesTransitaires = transitairesData.reduce((sum, t) => 
    sum + getTotalPrimesDues(getPrimesTransitaire(t.id)), 0
  );
  const totalPrimesPayeesTransitaires = transitairesData.reduce((sum, t) => 
    sum + getTotalPrimesPayees(getPrimesTransitaire(t.id)), 0
  );

  // Stats représentants
  const totalPrimesDuesRepresentants = representantsData.reduce((sum, r) => 
    sum + getTotalPrimesDues(getPrimesRepresentant(r.id)), 0
  );
  const totalPrimesPayeesRepresentants = representantsData.reduce((sum, r) => 
    sum + getTotalPrimesPayees(getPrimesRepresentant(r.id)), 0
  );

  const handleDelete = () => {
    if (deleteConfirm) {
      toast({
        title: `${deleteConfirm.type} supprimé`,
        description: `${deleteConfirm.nom} a été supprimé.`,
        variant: "destructive",
      });
      setDeleteConfirm(null);
    }
  };

  return (
    <MainLayout title="Partenaires">
      <div className="space-y-6">
        {/* Recherche */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un partenaire..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs defaultValue="transitaires" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transitaires" className="gap-2">
              <Truck className="h-4 w-4" />
              Transitaires ({transitairesData.length})
            </TabsTrigger>
            <TabsTrigger value="representants" className="gap-2">
              <User className="h-4 w-4" />
              Représentants ({representantsData.length})
            </TabsTrigger>
            <TabsTrigger value="armateurs" className="gap-2">
              <Ship className="h-4 w-4" />
              Armateurs ({armateursData.length})
            </TabsTrigger>
          </TabsList>

          {/* Onglet Transitaires */}
          <TabsContent value="transitaires" className="mt-6 space-y-6">
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Transitaires
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{transitairesData.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Primes Dues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{formatMontant(totalPrimesDuesTransitaires)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Primes Payées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatMontant(totalPrimesPayeesTransitaires)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Actions + Table */}
            <div className="flex justify-end">
              <Button className="gap-2" onClick={() => setShowTransitaireModal(true)}>
                <Plus className="h-4 w-4" />
                Nouveau transitaire
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Nom</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Primes Dues</TableHead>
                      <TableHead className="text-right">Primes Payées</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransitaires.map((transitaire) => {
                      const primes = getPrimesTransitaire(transitaire.id);
                      const primesDues = getTotalPrimesDues(primes);
                      const primesPayees = getTotalPrimesPayees(primes);
                      
                      return (
                        <TableRow key={transitaire.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell 
                            className="font-medium text-primary hover:underline cursor-pointer"
                            onClick={() => navigate(`/partenaires/transitaires/${transitaire.id}`)}
                          >
                            {transitaire.nom}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{transitaire.email}</div>
                            <div className="text-xs text-muted-foreground">{transitaire.telephone}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            {primesDues > 0 ? (
                              <Badge variant="destructive">{formatMontant(primesDues)}</Badge>
                            ) : (
                              <Badge variant="secondary">0 XAF</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-green-600 font-medium">{formatMontant(primesPayees)}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                title="Voir"
                                onClick={() => navigate(`/partenaires/transitaires/${transitaire.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Modifier">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-destructive"
                                title="Supprimer"
                                onClick={() => setDeleteConfirm({ id: transitaire.id, nom: transitaire.nom, type: "Transitaire" })}
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
          </TabsContent>

          {/* Onglet Représentants */}
          <TabsContent value="representants" className="mt-6 space-y-6">
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Représentants
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{representantsData.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Primes Dues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{formatMontant(totalPrimesDuesRepresentants)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Primes Payées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatMontant(totalPrimesPayeesRepresentants)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Actions + Table */}
            <div className="flex justify-end">
              <Button className="gap-2" onClick={() => setShowRepresentantModal(true)}>
                <Plus className="h-4 w-4" />
                Nouveau représentant
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Nom</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead className="text-right">Primes Dues</TableHead>
                      <TableHead className="text-right">Primes Payées</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRepresentants.map((representant) => {
                      const primes = getPrimesRepresentant(representant.id);
                      const primesDues = getTotalPrimesDues(primes);
                      const primesPayees = getTotalPrimesPayees(primes);
                      
                      return (
                        <TableRow key={representant.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell 
                            className="font-medium text-primary hover:underline cursor-pointer"
                            onClick={() => navigate(`/partenaires/representants/${representant.id}`)}
                          >
                            {representant.nom}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{representant.email}</div>
                            <div className="text-xs text-muted-foreground">{representant.telephone}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            {primesDues > 0 ? (
                              <Badge variant="destructive">{formatMontant(primesDues)}</Badge>
                            ) : (
                              <Badge variant="secondary">0 XAF</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="text-green-600 font-medium">{formatMontant(primesPayees)}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                title="Voir"
                                onClick={() => navigate(`/partenaires/representants/${representant.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Modifier">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-destructive"
                                title="Supprimer"
                                onClick={() => setDeleteConfirm({ id: representant.id, nom: representant.nom, type: "Représentant" })}
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
          </TabsContent>

          {/* Onglet Armateurs */}
          <TabsContent value="armateurs" className="mt-6 space-y-6">
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Armateurs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{armateursData.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Armateurs Actifs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{armateursData.filter(a => a.actif).length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Actions + Table */}
            <div className="flex justify-end">
              <Button className="gap-2" onClick={() => setShowArmateurModal(true)}>
                <Plus className="h-4 w-4" />
                Nouvel armateur
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Nom</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredArmateurs.map((armateur) => (
                      <TableRow key={armateur.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{armateur.nom}</TableCell>
                        <TableCell>
                          {armateur.email && <div className="text-sm">{armateur.email}</div>}
                          {armateur.telephone && <div className="text-xs text-muted-foreground">{armateur.telephone}</div>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={armateur.actif ? "default" : "secondary"}>
                            {armateur.actif ? "Actif" : "Inactif"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" title="Modifier">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive"
                              title="Supprimer"
                              onClick={() => setDeleteConfirm({ id: armateur.id, nom: armateur.nom, type: "Armateur" })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <NouveauTransitaireModal 
        open={showTransitaireModal} 
        onOpenChange={setShowTransitaireModal} 
      />
      <NouveauRepresentantModal 
        open={showRepresentantModal} 
        onOpenChange={setShowRepresentantModal} 
      />
      <NouvelArmateurModal 
        open={showArmateurModal} 
        onOpenChange={setShowArmateurModal} 
      />

      {/* Modal de confirmation suppression */}
      <AlertDialog 
        open={!!deleteConfirm} 
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer {deleteConfirm?.type?.toLowerCase()} <strong>{deleteConfirm?.nom}</strong> ? 
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non, annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Oui, supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
