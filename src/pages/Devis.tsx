import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, Search, Filter, Eye, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MainLayout } from "@/components/layout/MainLayout";
import { TablePagination } from "@/components/TablePagination";
import { useDevis, useDeleteDevis } from "@/hooks/use-commercial";
import { toast } from "sonner";

const getStatutBadge = (statut: string) => {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    brouillon: { variant: "secondary", label: "Brouillon" },
    envoye: { variant: "default", label: "Envoyé" },
    accepte: { variant: "default", label: "Accepté" },
    refuse: { variant: "destructive", label: "Refusé" },
    expire: { variant: "outline", label: "Expiré" },
    converti: { variant: "default", label: "Converti" },
  };
  const config = variants[statut] || { variant: "secondary", label: statut };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(montant);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("fr-FR");
};

export default function DevisPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  
  const { data: devisData, isLoading, error } = useDevis({
    search,
    statut: statutFilter || undefined,
    page,
    per_page: 10,
  });
  
  const deleteMutation = useDeleteDevis();
  
  const devisList = devisData?.data || [];
  const meta = devisData?.meta;

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce devis ?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <MainLayout title="Devis">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Devis</h1>
            <p className="text-muted-foreground">Gérez vos devis clients</p>
          </div>
          <Button onClick={() => navigate("/devis/nouveau")}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau devis
          </Button>
        </div>

        {/* Filtres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par numéro ou client..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statutFilter || "all"} onValueChange={(val) => setStatutFilter(val === "all" ? "" : val)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="brouillon">Brouillon</SelectItem>
                  <SelectItem value="envoye">Envoyé</SelectItem>
                  <SelectItem value="accepte">Accepté</SelectItem>
                  <SelectItem value="refuse">Refusé</SelectItem>
                  <SelectItem value="expire">Expiré</SelectItem>
                  <SelectItem value="converti">Converti</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mb-4" />
                <p>Module Devis en cours de reconstruction</p>
                <p className="text-sm">Les données seront disponibles prochainement</p>
              </div>
            ) : devisList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mb-4" />
                <p>Aucun devis trouvé</p>
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => navigate("/devis/nouveau")}
                >
                  Créer votre premier devis
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Validité</TableHead>
                    <TableHead className="text-right">Montant TTC</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devisList.map((devis: any) => (
                    <TableRow
                      key={devis.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/devis/${devis.id}`)}
                    >
                      <TableCell className="font-medium">{devis.numero}</TableCell>
                      <TableCell>{devis.client?.nom || "-"}</TableCell>
                      <TableCell>{formatDate(devis.date_creation || devis.created_at)}</TableCell>
                      <TableCell>{formatDate(devis.date_validite)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMontant(devis.montant_ttc || 0)}
                      </TableCell>
                      <TableCell>{getStatutBadge(devis.statut)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/devis/${devis.id}`); }}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/devis/${devis.id}/modifier`); }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => { e.stopPropagation(); handleDelete(devis.id); }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <TablePagination
            currentPage={page}
            totalPages={meta.last_page}
            pageSize={meta.per_page}
            totalItems={meta.total}
            onPageChange={setPage}
            onPageSizeChange={() => {}}
          />
        )}
      </div>
    </MainLayout>
  );
}
