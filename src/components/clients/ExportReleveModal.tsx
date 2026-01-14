import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Download, FileText, Receipt, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePdfDownload } from "@/hooks/use-pdf-download";

interface ExportReleveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientName: string;
}

type DocumentType = 'factures' | 'ordres' | 'devis' | 'paiements';

const documentTypes: { id: DocumentType; label: string; icon: typeof FileText }[] = [
  { id: 'factures', label: 'Factures', icon: Receipt },
  { id: 'ordres', label: 'Ordres de travail', icon: ClipboardList },
  { id: 'devis', label: 'Devis', icon: FileText },
  { id: 'paiements', label: 'Paiements', icon: Receipt },
];

export function ExportReleveModal({ open, onOpenChange, clientName }: ExportReleveModalProps) {
  const [dateDebut, setDateDebut] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), 0, 1) // 1er janvier de l'année en cours
  );
  const [dateFin, setDateFin] = useState<Date | undefined>(new Date());
  const [selectedTypes, setSelectedTypes] = useState<DocumentType[]>(['factures', 'ordres', 'devis', 'paiements']);
  
  const { downloadPdf } = usePdfDownload({ 
    filename: `releve-${clientName}-${format(new Date(), 'yyyy-MM-dd')}.pdf` 
  });

  const handleTypeChange = (type: DocumentType, checked: boolean) => {
    if (checked) {
      setSelectedTypes([...selectedTypes, type]);
    } else {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    }
  };

  const handleExport = () => {
    // Déclencher le téléchargement PDF
    downloadPdf();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exporter le relevé
          </DialogTitle>
          <DialogDescription>
            Sélectionnez la période et les types de documents à inclure dans le relevé.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Période */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Période</Label>
            <div className="grid grid-cols-2 gap-3">
              {/* Date début */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Du</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateDebut && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateDebut ? format(dateDebut, "dd/MM/yyyy", { locale: fr }) : "Début"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateDebut}
                      onSelect={setDateDebut}
                      locale={fr}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date fin */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Au</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateFin && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFin ? format(dateFin, "dd/MM/yyyy", { locale: fr }) : "Fin"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFin}
                      onSelect={setDateFin}
                      locale={fr}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Types de documents */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Types de documents</Label>
            <div className="grid grid-cols-2 gap-3">
              {documentTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <label
                    key={type.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                      selectedTypes.includes(type.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Checkbox
                      checked={selectedTypes.includes(type.id)}
                      onCheckedChange={(checked) => handleTypeChange(type.id, !!checked)}
                    />
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{type.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleExport}
            disabled={selectedTypes.length === 0 || !dateDebut || !dateFin}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Exporter PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
