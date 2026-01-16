import { useState } from "react";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Download, FileSpreadsheet, Loader2 } from "lucide-react";
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

interface ExportCaisseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PeriodType = "today" | "week" | "month" | "custom";

export function ExportCaisseModal({ open, onOpenChange }: ExportCaisseModalProps) {
  const [periodType, setPeriodType] = useState<PeriodType>("today");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [isExporting, setIsExporting] = useState(false);

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

  const handleExport = async () => {
    const range = getDateRange();
    
    if (!range.from || !range.to) {
      toast.error("Veuillez sélectionner une période");
      return;
    }

    setIsExporting(true);
    try {
      const response = await api.get('/export/caisse-especes', {
        params: {
          date_debut: format(range.from, 'yyyy-MM-dd'),
          date_fin: format(range.to, 'yyyy-MM-dd'),
        },
        responseType: 'blob',
      });

      // Create download link
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
      <DialogContent className="sm:max-w-[450px]">
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
              Seuls les mouvements en espèces seront exportés.
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
                Télécharger CSV
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
