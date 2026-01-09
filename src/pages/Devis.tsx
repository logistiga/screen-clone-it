import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Search,
  Filter,
  FileText,
  MoreHorizontal,
  Eye,
  Pencil,
  Copy,
  Send,
  Printer,
  ClipboardList,
  Trash2,
  History,
  Download,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { TablePagination } from "@/components/TablePagination";
import {
  DocumentCommercial,
  CategorieDocument,
  categoriesConfig,
  formatMontant,
  formatDate,
  getStatutLabel,
  getStatutVariant,
} from "@/types/commercial";

// Données mock pour le développement
const mockDevis: DocumentCommercial[] = [
  {
    id: "1",
    numero: "DEV-2025-0001",
    type: "devis",
    categorie: "conteneurs",
    clientId: "1",
    clientNom: "TOTAL GABON",
    date: "2025-01-08",
    dateValidite: "2025-02-08",
    statut: "envoye",
    montantHT: 1500000,
    montantTVA: 270000,
    montantCSS: 15000,
    montantTTC: 1785000,
    montantPaye: 0,
  },
  {
    id: "2",
    numero: "DEV-2025-0002",
    type: "devis",
    categorie: "conventionnel",
    clientId: "2",
    clientNom: "CIMGABON",
    date: "2025-01-07",
    dateValidite: "2025-02-07",
    statut: "brouillon",
    montantHT: 850000,
    montantTVA: 153000,
    montantCSS: 8500,
    montantTTC: 1011500,
    montantPaye: 0,
  },
  {
    id: "3",
    numero: "DEV-2025-0003",
    type: "devis",
    categorie: "operations_independantes",
    clientId: "3",
    clientNom: "OLAM GABON",
    date: "2025-01-06",
    dateValidite: "2025-02-06",
    statut: "accepte",
    montantHT: 2100000,
    montantTVA: 378000,
    montantCSS: 21000,
    montantTTC: 2499000,
    montantPaye: 0,
  },
];

export default function DevisPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categorieFilter, setCategorieFilter] = useState<string>("all");
  const [statutFilter, setStatutFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filtrer les devis
  const filteredDevis = mockDevis.filter((devis) => {
    const matchSearch =
      devis.numero.toLowerCase().includes(search.toLowerCase()) ||
      devis.clientNom?.toLowerCase().includes(search.toLowerCase());
    const matchCategorie =
      categorieFilter === "all" || devis.categorie === categorieFilter;
    const matchStatut =
      statutFilter === "all" || devis.statut === statutFilter;
    return matchSearch && matchCategorie && matchStatut;
  });

  const totalItems = filteredDevis.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedDevis = filteredDevis.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleAction = (action: string, devis: DocumentCommercial) => {
    switch (action) {
      case "view":
        navigate(`/devis/${devis.id}`);
        break;
      case "edit":
        navigate(`/devis/${devis.id}/modifier`);
        break;
      case "duplicate":
        console.log("Dupliquer", devis.id);
        break;
      case "send":
        console.log("Envoyer", devis.id);
        break;
      case "print":
        navigate(`/devis/${devis.id}/pdf`);
        break;
      case "convert":
        console.log("Convertir en ordre", devis.id);
        break;
      case "history":
        console.log("Historique", devis.id);
        break;
      case "delete":
        console.log("Supprimer", devis.id);
        break;
    }
  };

  return (
    <MainLayout
      title="Devis"
      actions={
        <Button onClick={() => navigate("/devis/nouveau")} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau devis
        </Button>
      }
    >
      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockDevis.length}</p>
                <p className="text-sm text-muted-foreground">Total devis</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
                <Send className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {mockDevis.filter((d) => d.statut === "envoye").length}
                </p>
                <p className="text-sm text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                <ClipboardList className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {mockDevis.filter((d) => d.statut === "accepte").length}
                </p>
                <p className="text-sm text-muted-foreground">Acceptés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                <RefreshCw className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatMontant(
                    mockDevis.reduce((sum, d) => sum + d.montantTTC, 0)
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Volume total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro ou client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categorieFilter} onValueChange={setCategorieFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {(Object.keys(categoriesConfig) as CategorieDocument[]).map(
                  (key) => (
                    <SelectItem key={key} value={key}>
                      {categoriesConfig[key].label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            <Select value={statutFilter} onValueChange={setStatutFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="brouillon">Brouillon</SelectItem>
                <SelectItem value="envoye">Envoyé</SelectItem>
                <SelectItem value="accepte">Accepté</SelectItem>
                <SelectItem value="refuse">Refusé</SelectItem>
                <SelectItem value="expire">Expiré</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Validité</TableHead>
                <TableHead className="text-right">Montant TTC</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDevis.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Aucun devis trouvé</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDevis.map((devis) => (
                  <TableRow
                    key={devis.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/devis/${devis.id}`)}
                  >
                    <TableCell className="font-mono font-medium">
                      {devis.numero}
                    </TableCell>
                    <TableCell>{devis.clientNom}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={categoriesConfig[devis.categorie].className}
                      >
                        {categoriesConfig[devis.categorie].label}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(devis.date)}</TableCell>
                    <TableCell>{formatDate(devis.dateValidite)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMontant(devis.montantTTC)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatutVariant(devis.statut)}>
                        {getStatutLabel(devis.statut)}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleAction("view", devis)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAction("edit", devis)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAction("duplicate", devis)}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Dupliquer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleAction("send", devis)}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Envoyer par email
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAction("print", devis)}
                          >
                            <Printer className="h-4 w-4 mr-2" />
                            Imprimer / PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAction("convert", devis)}
                          >
                            <ClipboardList className="h-4 w-4 mr-2" />
                            Convertir en ordre
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleAction("history", devis)}
                          >
                            <History className="h-4 w-4 mr-2" />
                            Historique
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleAction("delete", devis)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="border-t p-4">
              <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
