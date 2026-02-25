import { useState } from "react";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import api from "@/lib/api";
import { useConfiguration } from "@/hooks/use-commercial";

interface ExportCaisseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PeriodType = "today" | "week" | "month" | "custom";
type ExportFormat = "csv" | "pdf";

interface MouvementCaisse {
  id: number;
  type: string;
  montant: number;
  date: string;
  description: string;
  categorie: string;
  beneficiaire: string | null;
  document_numero: string | null;
  client_nom: string | null;
}

export function ExportCaisseModal({ open, onOpenChange }: ExportCaisseModalProps) {
  const [periodType, setPeriodType] = useState<PeriodType>("today");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("pdf");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [isExporting, setIsExporting] = useState(false);

  const { data: config } = useConfiguration();

  const getDateRange = () => {
    const today = new Date();
    switch (periodType) {
      case "today":
        return { from: startOfDay(today), to: endOfDay(today) };
      case "week":
        return { from: startOfDay(subDays(today, 7)), to: endOfDay(today) };
      case "month":
        return { from: startOfMonth(today), to: endOfMonth(today) };
      case "custom":
        return dateRange;
      default:
        return { from: startOfDay(today), to: endOfDay(today) };
    }
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(montant)) + " FCFA";
  };

  const handleExportCSV = async (range: { from: Date; to: Date }) => {
    const response = await api.get('/exports/caisse-especes', {
      params: {
        date_debut: format(range.from, 'yyyy-MM-dd'),
        date_fin: format(range.to, 'yyyy-MM-dd'),
      },
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const periodLabel = periodType === "today" 
      ? format(range.from, 'dd-MM-yyyy')
      : `${format(range.from, 'dd-MM-yyyy')}_${format(range.to, 'dd-MM-yyyy')}`;
    link.download = `caisse-especes-${periodLabel}.csv`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExportPDF = async (range: { from: Date; to: Date }) => {
    // Fetch data
    const response = await api.get('/caisse', {
      params: {
        date_debut: format(range.from, 'yyyy-MM-dd'),
        date_fin: format(range.to, 'yyyy-MM-dd'),
        source: 'caisse',
        per_page: 1000,
      },
    });

    const mouvements: MouvementCaisse[] = response.data?.data || [];
    
    // Calculate totals
    const totalEntrees = mouvements
      .filter(m => m.type === 'entree')
      .reduce((sum, m) => sum + Number(m.montant), 0);
    const totalSorties = mouvements
      .filter(m => m.type === 'sortie')
      .reduce((sum, m) => sum + Number(m.montant), 0);
    const solde = totalEntrees - totalSorties;

    const entreprise = config?.entreprise;
    const periodLabel = periodType === "today"
      ? format(range.from, "d MMMM yyyy", { locale: fr })
      : `Du ${format(range.from, "d MMM yyyy", { locale: fr })} au ${format(range.to, "d MMM yyyy", { locale: fr })}`;

    const logoUrl = `${window.location.origin}/images/logo-logistiga.png`;

    // Generate HTML with table-based layout for better PDF rendering
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #1a1a1a; background: white; width: 750px;">
        <!-- Header with Logo -->
        <table style="width: 100%; margin-bottom: 20px; border-bottom: 3px solid #3b82f6; padding-bottom: 15px;">
          <tr>
            <td style="vertical-align: top; width: 50%;">
              <img src="${logoUrl}" alt="Logistiga" style="height: 55px; width: auto; margin-bottom: 8px;" crossorigin="anonymous" />
              <div style="font-size: 11px; color: #666; margin-top: 5px;">
                ${entreprise?.adresse || 'Libreville, Gabon'}<br/>
                ${entreprise?.telephone ? `Tél: ${entreprise.telephone}` : ''}
                ${entreprise?.email ? ` | ${entreprise.email}` : ' | contact@logistiga.com'}
              </div>
            </td>
            <td style="text-align: right; vertical-align: top;">
              <div style="font-size: 22px; font-weight: bold; color: #1e40af;">JOURNAL DE CAISSE</div>
              <div style="font-size: 13px; color: #666; margin-top: 5px;">${periodLabel}</div>
              <div style="font-size: 11px; color: #888; margin-top: 3px;">Édité le ${format(new Date(), "d MMMM yyyy 'à' HH:mm", { locale: fr })}</div>
            </td>
          </tr>
        </table>

        <!-- Summary Cards -->
        <table style="width: 100%; margin-bottom: 20px; border-spacing: 10px; border-collapse: separate;">
          <tr>
            <td style="width: 33%; background: #dcfce7; padding: 12px 15px; border-radius: 8px; border-left: 4px solid #22c55e;">
              <div style="font-size: 11px; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">Entrées</div>
              <div style="font-size: 18px; font-weight: bold; color: #15803d; margin-top: 5px;">+${formatMontant(totalEntrees)}</div>
            </td>
            <td style="width: 33%; background: #fee2e2; padding: 12px 15px; border-radius: 8px; border-left: 4px solid #ef4444;">
              <div style="font-size: 11px; color: #991b1b; text-transform: uppercase; letter-spacing: 0.5px;">Sorties</div>
              <div style="font-size: 18px; font-weight: bold; color: #dc2626; margin-top: 5px;">-${formatMontant(totalSorties)}</div>
            </td>
            <td style="width: 33%; background: ${solde >= 0 ? '#dbeafe' : '#fee2e2'}; padding: 12px 15px; border-radius: 8px; border-left: 4px solid ${solde >= 0 ? '#3b82f6' : '#ef4444'};">
              <div style="font-size: 11px; color: ${solde >= 0 ? '#1e40af' : '#991b1b'}; text-transform: uppercase; letter-spacing: 0.5px;">Solde période</div>
              <div style="font-size: 18px; font-weight: bold; color: ${solde >= 0 ? '#2563eb' : '#dc2626'}; margin-top: 5px;">${solde >= 0 ? '+' : ''}${formatMontant(solde)}</div>
            </td>
          </tr>
        </table>

        <!-- Data Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            <tr style="background: #1e40af;">
              <th style="padding: 10px 8px; text-align: left; color: white; font-weight: 600;">Date</th>
              <th style="padding: 10px 8px; text-align: left; color: white; font-weight: 600;">Type</th>
              <th style="padding: 10px 8px; text-align: left; color: white; font-weight: 600;">Description</th>
              <th style="padding: 10px 8px; text-align: left; color: white; font-weight: 600;">Catégorie</th>
              <th style="padding: 10px 8px; text-align: left; color: white; font-weight: 600;">Bénéficiaire</th>
              <th style="padding: 10px 8px; text-align: right; color: white; font-weight: 600;">Montant</th>
            </tr>
          </thead>
          <tbody>
            ${mouvements.length === 0 ? `
              <tr>
                <td colspan="6" style="padding: 30px; text-align: center; color: #666; font-style: italic;">
                  Aucun mouvement pour cette période
                </td>
              </tr>
            ` : mouvements.map((m, index) => `
              <tr style="background: ${index % 2 === 0 ? '#f8fafc' : '#ffffff'};">
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${format(new Date(m.date), 'dd/MM/yyyy')}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">
                  <span style="display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 600; background: ${m.type === 'entree' ? '#dcfce7' : '#fee2e2'}; color: ${m.type === 'entree' ? '#166534' : '#991b1b'};">
                    ${m.type === 'entree' ? 'ENTRÉE' : 'SORTIE'}
                  </span>
                </td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${m.description || '-'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${m.categorie || '-'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${m.client_nom || m.beneficiaire || '-'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: ${m.type === 'entree' ? '#16a34a' : '#dc2626'};">
                  ${m.type === 'entree' ? '+' : '-'}${formatMontant(Number(m.montant))}
                </td>
              </tr>
            `).join('')}
          </tbody>
          ${mouvements.length > 0 ? `
          <tfoot>
            <tr style="background: #e2e8f0; font-weight: bold;">
              <td colspan="5" style="padding: 10px 8px; border-top: 2px solid #1e40af;">TOTAL DE LA PÉRIODE</td>
              <td style="padding: 10px 8px; text-align: right; border-top: 2px solid #1e40af; color: ${solde >= 0 ? '#16a34a' : '#dc2626'}; font-size: 12px;">
                ${solde >= 0 ? '+' : ''}${formatMontant(solde)}
              </td>
            </tr>
          </tfoot>
          ` : ''}
        </table>

        <!-- Solde Caisse -->
        <table style="margin-top: 20px; margin-left: auto; border: 2px solid #333; border-radius: 4px; border-collapse: collapse;">
          <tr>
            <td style="font-size: 13px; font-weight: bold; padding: 12px 30px 12px 20px; color: #333;">SOLDE CAISSE :</td>
            <td style="font-size: 15px; font-weight: bold; padding: 12px 20px 12px 0; color: ${solde >= 0 ? '#16a34a' : '#dc2626'};">
              ${solde >= 0 ? '+' : ''}${formatMontant(solde)}
            </td>
          </tr>
        </table>

        <!-- Footer professionnel -->
        <table style="width: 100%; margin-top: 30px; border-top: 2px solid #e53935; padding-top: 12px;">
          <tr>
            <td style="text-align: center; line-height: 1.8;">
              <div style="font-size: 9px; font-weight: bold; color: #333;">LOGISTIGA SAS au Capital: 218 000 000 F CFA - Siège Social : Owendo SETRAG – (GABON)</div>
              <div style="font-size: 9px; color: #555;">Tel : (+241) 011 70 14 35 / 011 70 14 34 / 011 70 88 50 / 011 70 95 03 | B.P.: 18 486 - NIF : 743 107 W - RCCM : 2016B20135</div>
              <div style="font-size: 9px; color: #555;">Email: info@logistiga.com – Site web: www.logistiga.com</div>
            </td>
          </tr>
        </table>
      </div>
    `;

    // Create container
    const container = document.createElement('div');
    container.innerHTML = html;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.background = 'white';
    document.body.appendChild(container);

    try {
      const periodFilename = periodType === "today" 
        ? format(range.from, 'dd-MM-yyyy')
        : `${format(range.from, 'dd-MM-yyyy')}_${format(range.to, 'dd-MM-yyyy')}`;

      // Use html2canvas + jsPDF for better rendering
      const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');

      // Handle multi-page if needed
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`journal-caisse-${periodFilename}.pdf`);
    } finally {
      document.body.removeChild(container);
    }
  };

  const handleExport = async () => {
    const range = getDateRange();
    
    if (!range.from || !range.to) {
      toast.error("Veuillez sélectionner une période");
      return;
    }

    setIsExporting(true);
    try {
      if (exportFormat === 'csv') {
        await handleExportCSV({ from: range.from, to: range.to });
      } else {
        await handleExportPDF({ from: range.from, to: range.to });
      }

      toast.success("Export téléchargé avec succès");
      onOpenChange(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Erreur lors de l'export");
    } finally {
      setIsExporting(false);
    }
  };

  const range = getDateRange();
  const periodLabel = range.from && range.to
    ? periodType === "today"
      ? format(range.from, "d MMMM yyyy", { locale: fr })
      : `${format(range.from, "d MMM yyyy", { locale: fr })} - ${format(range.to, "d MMM yyyy", { locale: fr })}`
    : "Sélectionnez une période";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Export Caisse (Espèces)
          </DialogTitle>
          <DialogDescription>
            Exportez les mouvements de caisse en espèces pour la période choisie.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format selection */}
          <div className="space-y-3">
            <Label>Format d'export</Label>
            <RadioGroup
              value={exportFormat}
              onValueChange={(value) => setExportFormat(value as ExportFormat)}
              className="grid grid-cols-2 gap-3"
            >
              <div className={cn(
                "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                exportFormat === "pdf" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"
              )}>
                <RadioGroupItem value="pdf" id="pdf" />
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-destructive" />
                  <Label htmlFor="pdf" className="cursor-pointer font-medium">
                    PDF (Journal)
                  </Label>
                </div>
              </div>
              <div className={cn(
                "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                exportFormat === "csv" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/30"
              )}>
                <RadioGroupItem value="csv" id="csv" />
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-success" />
                  <Label htmlFor="csv" className="cursor-pointer font-medium">
                    CSV (Excel)
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Period selection */}
          <div className="space-y-3">
            <Label>Période</Label>
            <RadioGroup
              value={periodType}
              onValueChange={(value) => setPeriodType(value as PeriodType)}
              className="grid grid-cols-2 gap-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="today" id="today" />
                <Label htmlFor="today" className="cursor-pointer font-normal">
                  Aujourd'hui
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="week" id="week" />
                <Label htmlFor="week" className="cursor-pointer font-normal">
                  7 derniers jours
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="month" id="month" />
                <Label htmlFor="month" className="cursor-pointer font-normal">
                  Ce mois
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="cursor-pointer font-normal">
                  Personnalisé
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Custom date range */}
          {periodType === "custom" && (
            <div className="space-y-3">
              <Label>Sélectionnez les dates</Label>
              <div className="grid grid-cols-2 gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? format(dateRange.from, "dd/MM/yyyy") : "Date début"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !dateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? format(dateRange.to, "dd/MM/yyyy") : "Date fin"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Period summary */}
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">Période sélectionnée :</p>
            <p className="font-medium">{periodLabel}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {exportFormat === 'pdf' 
                ? 'Le PDF inclut le logo, un tableau détaillé et le pied de page.'
                : 'Seuls les mouvements en espèces seront exportés.'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleExport} disabled={isExporting || (periodType === "custom" && (!dateRange.from || !dateRange.to))}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Export...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Télécharger {exportFormat.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}