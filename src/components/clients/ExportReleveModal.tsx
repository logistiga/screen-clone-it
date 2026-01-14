import { useState, useRef } from "react";
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
import { CalendarIcon, Download, FileText, Receipt, ClipboardList, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Client } from "@/lib/api/commercial";
import { ReleveClientPdf } from "./ReleveClientPdf";

interface ExportReleveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  factures?: any[];
  ordres?: any[];
  devis?: any[];
  paiements?: any[];
}

type DocumentType = 'factures' | 'ordres' | 'devis' | 'paiements';

const documentTypes: { id: DocumentType; label: string; icon: typeof FileText }[] = [
  { id: 'factures', label: 'Factures', icon: Receipt },
  { id: 'ordres', label: 'Ordres de travail', icon: ClipboardList },
  { id: 'devis', label: 'Devis', icon: FileText },
  { id: 'paiements', label: 'Paiements', icon: Receipt },
];

export function ExportReleveModal({ 
  open, 
  onOpenChange, 
  client,
  factures = [],
  ordres = [],
  devis = [],
  paiements = []
}: ExportReleveModalProps) {
  const [dateDebut, setDateDebut] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), 0, 1) // 1er janvier de l'année en cours
  );
  const [dateFin, setDateFin] = useState<Date | undefined>(new Date());
  const [selectedTypes, setSelectedTypes] = useState<DocumentType[]>(['factures', 'ordres', 'devis', 'paiements']);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handleTypeChange = (type: DocumentType, checked: boolean) => {
    if (checked) {
      setSelectedTypes([...selectedTypes, type]);
    } else {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    }
  };

  const handleExport = async () => {
    if (!dateDebut || !dateFin) return;
    
    setIsGenerating(true);
    setShowPreview(true);
    
    // Attendre que le composant soit rendu
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Créer une nouvelle fenêtre pour l'impression
    const printContent = printRef.current;
    if (!printContent) {
      setIsGenerating(false);
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setIsGenerating(false);
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Relevé - ${client.nom} - ${format(new Date(), 'yyyy-MM-dd')}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .font-medium { font-weight: 500; }
            .font-semibold { font-weight: 600; }
            .font-bold { font-weight: 700; }
            .text-green-600 { color: #16a34a; }
            .text-red-600 { color: #dc2626; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-500 { color: #6b7280; }
            .text-blue-600 { color: #2563eb; }
            .text-blue-900 { color: #1e3a8a; }
            .text-green-800 { color: #166534; }
            .text-green-900 { color: #14532d; }
            .text-red-800 { color: #991b1b; }
            .text-red-900 { color: #7f1d1d; }
            .text-yellow-800 { color: #854d0e; }
            .bg-gray-50 { background-color: #f9fafb; }
            .bg-gray-100 { background-color: #f3f4f6; }
            .bg-blue-50 { background-color: #eff6ff; }
            .bg-green-50 { background-color: #f0fdf4; }
            .bg-red-50 { background-color: #fef2f2; }
            .bg-green-100 { background-color: #dcfce7; }
            .bg-red-100 { background-color: #fee2e2; }
            .bg-yellow-100 { background-color: #fef9c3; }
            .bg-blue-100 { background-color: #dbeafe; }
            .border { border: 1px solid #e5e7eb; }
            .border-b { border-bottom: 1px solid #e5e7eb; }
            .border-b-2 { border-bottom: 2px solid #1f2937; }
            .border-t { border-top: 1px solid #e5e7eb; }
            .border-blue-200 { border-color: #bfdbfe; }
            .border-green-200 { border-color: #bbf7d0; }
            .border-red-200 { border-color: #fecaca; }
            .border-gray-200 { border-color: #e5e7eb; }
            .rounded { border-radius: 4px; }
            .rounded-lg { border-radius: 8px; }
            .p-2 { padding: 8px; }
            .p-4 { padding: 16px; }
            .p-8 { padding: 32px; }
            .px-2 { padding-left: 8px; padding-right: 8px; }
            .py-1 { padding-top: 4px; padding-bottom: 4px; }
            .py-8 { padding-top: 32px; padding-bottom: 32px; }
            .pb-2 { padding-bottom: 8px; }
            .pb-4 { padding-bottom: 16px; }
            .pt-4 { padding-top: 16px; }
            .mb-2 { margin-bottom: 8px; }
            .mb-3 { margin-bottom: 12px; }
            .mb-6 { margin-bottom: 24px; }
            .mt-1 { margin-top: 4px; }
            .mt-8 { margin-top: 32px; }
            .text-xs { font-size: 12px; }
            .text-sm { font-size: 14px; }
            .text-lg { font-size: 18px; }
            .text-xl { font-size: 20px; }
            .text-2xl { font-size: 24px; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
            .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
            .gap-4 { gap: 16px; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .items-start { align-items: flex-start; }
            .w-full { width: 100%; }
            @media print {
              body { padding: 0; }
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    
    // Attendre le chargement puis imprimer
    printWindow.onload = () => {
      printWindow.print();
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    };

    setIsGenerating(false);
    setShowPreview(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Exporter le relevé
            </DialogTitle>
            <DialogDescription>
              Sélectionnez la période et les types de documents à inclure dans le relevé de <strong>{client.nom}</strong>.
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
              disabled={selectedTypes.length === 0 || !dateDebut || !dateFin || isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isGenerating ? 'Génération...' : 'Exporter PDF'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contenu PDF caché pour génération */}
      {showPreview && dateDebut && dateFin && (
        <div className="fixed left-[-9999px] top-0">
          <ReleveClientPdf
            ref={printRef}
            client={client}
            dateDebut={dateDebut}
            dateFin={dateFin}
            factures={factures}
            ordres={ordres}
            devis={devis}
            paiements={paiements}
            selectedTypes={selectedTypes}
          />
        </div>
      )}
    </>
  );
}
