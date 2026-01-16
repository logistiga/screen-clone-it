import { useState, useEffect } from "react";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Download, FileSpreadsheet, FileText, Loader2, Wallet, Building2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import api from "@/lib/api";
import { useBanques } from "@/hooks/use-commercial";

interface ExportCaisseGlobaleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PeriodType = "today" | "week" | "month" | "quarter" | "year" | "custom";
type ExportFormat = "pdf" | "excel";
type ExportType = "all" | "entrees" | "sorties";

export function ExportCaisseGlobaleModal({ open, onOpenChange }: ExportCaisseGlobaleModalProps) {
  const [periodType, setPeriodType] = useState<PeriodType>("month");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [exportFormat, setExportFormat] = useState<ExportFormat>("pdf");
  const [exportType, setExportType] = useState<ExportType>("all");
  const [includeCaisse, setIncludeCaisse] = useState(true);
  const [includeBanque, setIncludeBanque] = useState(true);
  const [selectedBanqueId, setSelectedBanqueId] = useState<string>("all");
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const { data: banques = [] } = useBanques();

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setPeriodType("month");
      setExportFormat("pdf");
      setExportType("all");
      setIncludeCaisse(true);
      setIncludeBanque(true);
      setSelectedBanqueId("all");
      setIncludeDetails(true);
      setIncludeSummary(true);
      setDateRange({ from: undefined, to: undefined });
    }
  }, [open]);

  const getDateRange = () => {
    const today = new Date();
    switch (periodType) {
      case "today":
        return { from: startOfDay(today), to: endOfDay(today) };
      case "week":
        return { from: startOfDay(subDays(today, 7)), to: endOfDay(today) };
      case "month":
        return { from: startOfMonth(today), to: endOfMonth(today) };
      case "quarter":
        return { from: startOfDay(subMonths(today, 3)), to: endOfDay(today) };
      case "year":
        return { from: new Date(today.getFullYear(), 0, 1), to: endOfDay(today) };
      case "custom":
        return dateRange;
      default:
        return { from: startOfMonth(today), to: endOfMonth(today) };
    }
  };

  const handleExport = async () => {
    const range = getDateRange();
    
    if (!range.from || !range.to) {
      toast.error("Veuillez sélectionner une période");
      return;
    }

    if (!includeCaisse && !includeBanque) {
      toast.error("Veuillez sélectionner au moins une source (Caisse ou Banque)");
      return;
    }

    setIsExporting(true);
    try {
      // Determine sources
      let source = "all";
      if (includeCaisse && !includeBanque) source = "caisse";
      if (!includeCaisse && includeBanque) source = "banque";

      const params: Record<string, string> = {
        date_debut: format(range.from, 'yyyy-MM-dd'),
        date_fin: format(range.to, 'yyyy-MM-dd'),
        format: exportFormat,
        type: exportType,
        source,
        include_details: includeDetails ? '1' : '0',
        include_summary: includeSummary ? '1' : '0',
      };

      if (selectedBanqueId !== "all" && includeBanque) {
        params.banque_id = selectedBanqueId;
      }

      const response = await api.get('/export/caisse-globale', {
        params,
        responseType: 'blob',
      });

      // Create download link
      const contentType = exportFormat === 'pdf' 
        ? 'application/pdf' 
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const periodLabel = `${format(range.from, 'dd-MM-yyyy')}_${format(range.to, 'dd-MM-yyyy')}`;
      const extension = exportFormat === 'pdf' ? 'pdf' : 'xlsx';
      link.download = `caisse-globale-${periodLabel}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Export ${exportFormat.toUpperCase()} téléchargé avec succès`);
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
    ? `${format(range.from, "d MMM yyyy", { locale: fr })} - ${format(range.to, "d MMM yyyy", { locale: fr })}`
    : "Sélectionnez une période";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Export Caisse Globale
          </DialogTitle>
          <DialogDescription>
            Configurez les options d'export pour générer un rapport complet de votre trésorerie.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format d'export */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Format d'export</Label>
            <Tabs value={exportFormat} onValueChange={(v) => setExportFormat(v as ExportFormat)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pdf" className="gap-2">
                  <FileText className="h-4 w-4" />
                  PDF
                </TabsTrigger>
                <TabsTrigger value="excel" className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Excel
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Période */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Période</Label>
            <RadioGroup
              value={periodType}
              onValueChange={(value) => setPeriodType(value as PeriodType)}
              className="grid grid-cols-3 gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="today" id="today" />
                <Label htmlFor="today" className="cursor-pointer font-normal text-sm">Aujourd'hui</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="week" id="week" />
                <Label htmlFor="week" className="cursor-pointer font-normal text-sm">7 jours</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="month" id="month" />
                <Label htmlFor="month" className="cursor-pointer font-normal text-sm">Ce mois</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="quarter" id="quarter" />
                <Label htmlFor="quarter" className="cursor-pointer font-normal text-sm">3 mois</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="year" id="year" />
                <Label htmlFor="year" className="cursor-pointer font-normal text-sm">Cette année</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="cursor-pointer font-normal text-sm">Personnalisé</Label>
              </div>
            </RadioGroup>

            {periodType === "custom" && (
              <div className="grid grid-cols-2 gap-3 mt-3">
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
            )}
          </div>

          {/* Type de mouvements */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Type de mouvements</Label>
            <RadioGroup
              value={exportType}
              onValueChange={(value) => setExportType(value as ExportType)}
              className="grid grid-cols-3 gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="type-all" />
                <Label htmlFor="type-all" className="cursor-pointer font-normal text-sm">Tous</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="entrees" id="type-entrees" />
                <Label htmlFor="type-entrees" className="cursor-pointer font-normal text-sm">Entrées</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sorties" id="type-sorties" />
                <Label htmlFor="type-sorties" className="cursor-pointer font-normal text-sm">Sorties</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Sources */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Sources</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <Checkbox 
                  id="source-caisse" 
                  checked={includeCaisse}
                  onCheckedChange={(checked) => setIncludeCaisse(!!checked)}
                />
                <Label htmlFor="source-caisse" className="cursor-pointer flex items-center gap-2 flex-1">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                  Caisse (Espèces)
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <Checkbox 
                  id="source-banque" 
                  checked={includeBanque}
                  onCheckedChange={(checked) => setIncludeBanque(!!checked)}
                />
                <Label htmlFor="source-banque" className="cursor-pointer flex items-center gap-2 flex-1">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  Banques
                </Label>
              </div>
            </div>

            {/* Sélection de banque spécifique */}
            {includeBanque && banques.length > 0 && (
              <div className="mt-2">
                <Label className="text-sm text-muted-foreground mb-2 block">Banque spécifique</Label>
                <Select value={selectedBanqueId} onValueChange={setSelectedBanqueId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les banques" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les banques</SelectItem>
                    {banques.map((banque: any) => (
                      <SelectItem key={banque.id} value={String(banque.id)}>
                        {banque.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Options de contenu */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Contenu du rapport</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-3 p-3 rounded-lg border bg-card">
                <Checkbox 
                  id="include-summary" 
                  checked={includeSummary}
                  onCheckedChange={(checked) => setIncludeSummary(!!checked)}
                />
                <Label htmlFor="include-summary" className="cursor-pointer flex-1">
                  <span className="font-medium">Résumé</span>
                  <p className="text-xs text-muted-foreground">Totaux entrées, sorties, soldes par source</p>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border bg-card">
                <Checkbox 
                  id="include-details" 
                  checked={includeDetails}
                  onCheckedChange={(checked) => setIncludeDetails(!!checked)}
                />
                <Label htmlFor="include-details" className="cursor-pointer flex-1">
                  <span className="font-medium">Détail des mouvements</span>
                  <p className="text-xs text-muted-foreground">Liste complète de tous les mouvements</p>
                </Label>
              </div>
            </div>
          </div>

          {/* Résumé */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
            <p className="text-sm font-medium text-primary mb-2">Résumé de l'export</p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>📅 Période : <span className="font-medium text-foreground">{periodLabel}</span></p>
              <p>📄 Format : <span className="font-medium text-foreground">{exportFormat.toUpperCase()}</span></p>
              <p>📊 Type : <span className="font-medium text-foreground">
                {exportType === 'all' ? 'Tous les mouvements' : exportType === 'entrees' ? 'Entrées uniquement' : 'Sorties uniquement'}
              </span></p>
              <p>🏦 Sources : <span className="font-medium text-foreground">
                {includeCaisse && includeBanque ? 'Caisse + Banques' : includeCaisse ? 'Caisse' : includeBanque ? 'Banques' : 'Aucune'}
              </span></p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || (periodType === "custom" && (!dateRange.from || !dateRange.to)) || (!includeCaisse && !includeBanque)}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Génération...
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
