import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { TablePagination } from "@/components/TablePagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useFactures, useOrdres } from "@/hooks/use-commercial";
import { formatMontant, formatDate } from "@/data/mockData";
import { 
  Search, 
  Eye, 
  FileText,
  ClipboardList,
  Loader2,
  AlertCircle,
  X,
  CheckCircle,
  XCircle,
  Download,
  FileSpreadsheet
} from "lucide-react";
import { AnimatedTableBody, AnimatedTableRow } from "@/components/ui/animated-table";
import { toast } from "sonner";
import html2pdf from "html2pdf.js";

type DocumentType = "factures" | "ordres" | "all";

export function DocumentsTaxesList() {
  const navigate = useNavigate();
  const [documentType, setDocumentType] = useState<DocumentType>("factures");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Fetch data
  const { data: facturesData, isLoading: isLoadingFactures } = useFactures({
    page: 1,
    per_page: 500,
  });
  const { data: ordresData, isLoading: isLoadingOrdres } = useOrdres({
    page: 1,
    per_page: 500,
  });

  const isLoading = isLoadingFactures || isLoadingOrdres;

  // Helper to detect exoneration
  const getExonerationStatus = (doc: any) => {
    const taxesSelection = doc.taxes_selection;
    if (taxesSelection?.has_exoneration && Array.isArray(taxesSelection.exonerated_tax_codes)) {
      return {
        hasTva: taxesSelection.exonerated_tax_codes.includes('TVA'),
        hasCss: taxesSelection.exonerated_tax_codes.includes('CSS'),
        motif: taxesSelection.motif_exoneration || doc.motif_exoneration || '',
      };
    }
    return {
      hasTva: !!doc.exonere_tva,
      hasCss: !!doc.exonere_css,
      motif: doc.motif_exoneration || '',
    };
  };

  // Normalize documents
  const normalizeDocument = (doc: any, type: "facture" | "ordre") => {
    const exo = getExonerationStatus(doc);
    return {
      id: doc.id,
      numero: doc.numero,
      type,
      date: doc.date_creation || doc.date_facture || doc.date,
      client: doc.client?.nom || "-",
      montantHT: doc.montant_ht || 0,
      tva: doc.montant_tva ?? doc.tva ?? 0,
      css: doc.montant_css ?? doc.css ?? 0,
      ttc: doc.montant_ttc || 0,
      exonereTva: exo.hasTva,
      exonereCss: exo.hasCss,
      motifExoneration: exo.motif,
      statut: doc.statut,
    };
  };

  // Build combined list
  const factures = (facturesData?.data || []).map((f: any) => normalizeDocument(f, "facture"));
  const ordres = (ordresData?.data || []).map((o: any) => normalizeDocument(o, "ordre"));

  let documents: any[] = [];
  if (documentType === "factures") {
    documents = factures;
  } else if (documentType === "ordres") {
    documents = ordres;
  } else {
    documents = [...factures, ...ordres];
  }

  // Apply search filter
  if (searchTerm) {
    const search = searchTerm.toLowerCase();
    documents = documents.filter(
      (d) =>
        d.numero?.toLowerCase().includes(search) ||
        d.client?.toLowerCase().includes(search)
    );
  }

  // Sort by date descending
  documents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Pagination
  const totalItems = documents.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedDocuments = documents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Statistics
  const totalTva = documents.reduce((sum, d) => sum + (d.exonereTva ? 0 : d.tva), 0);
  const totalCss = documents.reduce((sum, d) => sum + (d.exonereCss ? 0 : d.css), 0);
  const totalExoTva = documents.filter((d) => d.exonereTva).length;
  const totalExoCss = documents.filter((d) => d.exonereCss).length;

  const getTypeBadge = (type: "facture" | "ordre") => {
    if (type === "facture") {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 gap-1">
          <FileText className="h-3 w-3" />
          Facture
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 gap-1">
        <ClipboardList className="h-3 w-3" />
        OT
      </Badge>
    );
  };

  const getExonerationCell = (isExonere: boolean, montant: number) => {
    if (isExonere) {
      return (
        <div className="flex items-center gap-1.5 text-green-600">
          <XCircle className="h-4 w-4" />
          <span className="text-xs font-medium">Exonéré</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5">
        <CheckCircle className="h-4 w-4 text-muted-foreground/50" />
        <span className="font-medium">{formatMontant(montant)}</span>
      </div>
    );
  };

  // Export Excel (CSV)
  const handleExportExcel = () => {
    if (documents.length === 0) {
      toast.error("Aucun document à exporter");
      return;
    }

    const headers = ["Type", "Numéro", "Date", "Client", "Montant HT", "TVA", "Exo TVA", "CSS", "Exo CSS", "Montant TTC"];
    const rows = documents.map((doc) => [
      doc.type === "facture" ? "Facture" : "Ordre",
      doc.numero,
      formatDate(doc.date),
      doc.client,
      doc.montantHT.toFixed(2),
      doc.exonereTva ? "0" : doc.tva.toFixed(2),
      doc.exonereTva ? "Oui" : "Non",
      doc.exonereCss ? "0" : doc.css.toFixed(2),
      doc.exonereCss ? "Oui" : "Non",
      doc.ttc.toFixed(2),
    ]);

    // Add totals row
    rows.push([]);
    rows.push([
      "TOTAUX",
      "",
      "",
      `${documents.length} documents`,
      documents.reduce((s, d) => s + d.montantHT, 0).toFixed(2),
      totalTva.toFixed(2),
      `${totalExoTva} exo.`,
      totalCss.toFixed(2),
      `${totalExoCss} exo.`,
      documents.reduce((s, d) => s + d.ttc, 0).toFixed(2),
    ]);

    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.join(";")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `documents-taxes-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("Export Excel téléchargé");
  };

  // Export PDF
  const handleExportPdf = () => {
    if (documents.length === 0) {
      toast.error("Aucun document à exporter");
      return;
    }

    const typeLabel = documentType === "factures" ? "Factures" : documentType === "ordres" ? "Ordres de Travail" : "Tous les documents";
    
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #333; margin-bottom: 5px;">Récapitulatif des Taxes</h1>
        <p style="color: #666; margin-bottom: 20px;">${typeLabel} - ${new Date().toLocaleDateString('fr-FR')}</p>
        
        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; flex: 1;">
            <div style="font-size: 12px; color: #856404;">TVA collectée</div>
            <div style="font-size: 18px; font-weight: bold; color: #856404;">${formatMontant(totalTva)}</div>
            <div style="font-size: 10px; color: #856404;">${totalExoTva} exonérations</div>
          </div>
          <div style="background: #cce5ff; padding: 15px; border-radius: 8px; flex: 1;">
            <div style="font-size: 12px; color: #004085;">CSS collecté</div>
            <div style="font-size: 18px; font-weight: bold; color: #004085;">${formatMontant(totalCss)}</div>
            <div style="font-size: 10px; color: #004085;">${totalExoCss} exonérations</div>
          </div>
          <div style="background: #d4edda; padding: 15px; border-radius: 8px; flex: 1;">
            <div style="font-size: 12px; color: #155724;">Total à reverser</div>
            <div style="font-size: 18px; font-weight: bold; color: #155724;">${formatMontant(totalTva + totalCss)}</div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Type</th>
              <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Numéro</th>
              <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Date</th>
              <th style="border: 1px solid #dee2e6; padding: 8px; text-align: left;">Client</th>
              <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">HT</th>
              <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">TVA</th>
              <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">CSS</th>
              <th style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">TTC</th>
            </tr>
          </thead>
          <tbody>
            ${documents.map((doc) => `
              <tr>
                <td style="border: 1px solid #dee2e6; padding: 6px;">${doc.type === "facture" ? "Facture" : "OT"}</td>
                <td style="border: 1px solid #dee2e6; padding: 6px; font-family: monospace;">${doc.numero}</td>
                <td style="border: 1px solid #dee2e6; padding: 6px;">${formatDate(doc.date)}</td>
                <td style="border: 1px solid #dee2e6; padding: 6px; max-width: 100px; overflow: hidden; text-overflow: ellipsis;">${doc.client}</td>
                <td style="border: 1px solid #dee2e6; padding: 6px; text-align: right;">${formatMontant(doc.montantHT)}</td>
                <td style="border: 1px solid #dee2e6; padding: 6px; text-align: right; ${doc.exonereTva ? 'color: #28a745; font-weight: bold;' : ''}">${doc.exonereTva ? 'Exonéré' : formatMontant(doc.tva)}</td>
                <td style="border: 1px solid #dee2e6; padding: 6px; text-align: right; ${doc.exonereCss ? 'color: #28a745; font-weight: bold;' : ''}">${doc.exonereCss ? 'Exonéré' : formatMontant(doc.css)}</td>
                <td style="border: 1px solid #dee2e6; padding: 6px; text-align: right; font-weight: bold;">${formatMontant(doc.ttc)}</td>
              </tr>
            `).join('')}
            <tr style="background: #f8f9fa; font-weight: bold;">
              <td colspan="4" style="border: 1px solid #dee2e6; padding: 8px;">TOTAUX (${documents.length} documents)</td>
              <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${formatMontant(documents.reduce((s, d) => s + d.montantHT, 0))}</td>
              <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${formatMontant(totalTva)}</td>
              <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${formatMontant(totalCss)}</td>
              <td style="border: 1px solid #dee2e6; padding: 8px; text-align: right;">${formatMontant(documents.reduce((s, d) => s + d.ttc, 0))}</td>
            </tr>
          </tbody>
        </table>

        <p style="margin-top: 20px; font-size: 10px; color: #999;">
          Généré le ${new Date().toLocaleString('fr-FR')}
        </p>
      </div>
    `;

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    html2pdf()
      .set({
        margin: 10,
        filename: `documents-taxes-${new Date().toISOString().split("T")[0]}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
      })
      .from(container)
      .save()
      .then(() => {
        document.body.removeChild(container);
        toast.success("Export PDF téléchargé");
      });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-card to-primary/5">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Documents</p>
            <p className="text-2xl font-bold">{documents.length}</p>
            <p className="text-xs text-muted-foreground">
              {documentType === "factures" ? "factures" : documentType === "ordres" ? "ordres" : "documents"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-card to-amber-500/5">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">TVA collectée</p>
            <p className="text-2xl font-bold text-amber-600">{formatMontant(totalTva)}</p>
            <p className="text-xs text-muted-foreground">{totalExoTva} exonérations</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-card to-blue-500/5">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">CSS collecté</p>
            <p className="text-2xl font-bold text-blue-600">{formatMontant(totalCss)}</p>
            <p className="text-xs text-muted-foreground">{totalExoCss} exonérations</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-card to-green-500/5">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total taxes</p>
            <p className="text-2xl font-bold text-green-600">{formatMontant(totalTva + totalCss)}</p>
            <p className="text-xs text-muted-foreground">à reverser</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1">
              <Select 
                value={documentType} 
                onValueChange={(v: DocumentType) => { 
                  setDocumentType(v); 
                  setCurrentPage(1); 
                }}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Type de document" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="factures">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Factures uniquement
                    </div>
                  </SelectItem>
                  <SelectItem value="ordres">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-amber-600" />
                      Ordres de travail
                    </div>
                  </SelectItem>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      Tous les documents
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par n°, client..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 pr-9"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportExcel}
                disabled={documents.length === 0}
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportPdf}
                disabled={documents.length === 0}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Type</TableHead>
              <TableHead>Numéro</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Montant HT</TableHead>
              <TableHead className="text-right">TVA (18%)</TableHead>
              <TableHead className="text-right">CSS (1%)</TableHead>
              <TableHead className="text-right">Montant TTC</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <AnimatedTableBody>
            {paginatedDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-10 w-10 text-muted-foreground/50" />
                    <p className="text-muted-foreground">Aucun document trouvé</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedDocuments.map((doc, index) => (
                <AnimatedTableRow key={`${doc.type}-${doc.id}`} index={index} className="hover:bg-muted/50">
                  <TableCell>{getTypeBadge(doc.type)}</TableCell>
                  <TableCell className="font-mono font-medium">{doc.numero}</TableCell>
                  <TableCell>{formatDate(doc.date)}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{doc.client}</TableCell>
                  <TableCell className="text-right">{formatMontant(doc.montantHT)}</TableCell>
                  <TableCell className="text-right">
                    {getExonerationCell(doc.exonereTva, doc.tva)}
                  </TableCell>
                  <TableCell className="text-right">
                    {getExonerationCell(doc.exonereCss, doc.css)}
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatMontant(doc.ttc)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(doc.type === "facture" ? `/factures/${doc.id}` : `/ordres/${doc.id}`)}
                      title="Voir détails"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </AnimatedTableRow>
              ))
            )}
          </AnimatedTableBody>
        </Table>

        {totalItems > 0 && (
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
        )}
      </Card>
    </div>
  );
}
