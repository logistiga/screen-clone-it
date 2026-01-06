import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, FileText, FileSpreadsheet, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { clients } from "@/data/mockData";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormatExport = "pdf" | "excel";
type FiltreStatut = "tous" | "paye" | "impaye";

export function ExportModal({ open, onOpenChange }: ExportModalProps) {
  const { toast } = useToast();
  const [clientId, setClientId] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>("tous");
  const [format, setFormat] = useState<FormatExport>("pdf");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!clientId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un client.",
        variant: "destructive",
      });
      return;
    }

    if (!dateDebut || !dateFin) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une période.",
        variant: "destructive",
      });
      return;
    }

    if (new Date(dateDebut) > new Date(dateFin)) {
      toast({
        title: "Erreur",
        description: "La date de début doit être antérieure à la date de fin.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    // Simulation d'export
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const client = clients.find((c) => c.id === clientId);
    const statutLabel = filtreStatut === "tous" ? "tous les documents" : filtreStatut === "paye" ? "les documents payés" : "les documents impayés";

    console.log("Export:", {
      clientId,
      clientNom: client?.nom,
      dateDebut,
      dateFin,
      filtreStatut,
      format,
    });

    toast({
      title: `Export ${format.toUpperCase()} généré`,
      description: `Relevé de ${client?.nom} (${statutLabel}) du ${dateDebut} au ${dateFin}.`,
    });

    setIsExporting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Exporter un relevé client
          </DialogTitle>
          <DialogDescription>
            Exporter les documents d'un client pour une période donnée
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Client */}
          <div className="space-y-2">
            <Label>Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Période */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateDebut" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date début
              </Label>
              <Input
                id="dateDebut"
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFin" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date fin
              </Label>
              <Input
                id="dateFin"
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </div>
          </div>

          {/* Filtre statut */}
          <div className="space-y-3">
            <Label>Filtre par statut de paiement</Label>
            <RadioGroup value={filtreStatut} onValueChange={(v) => setFiltreStatut(v as FiltreStatut)}>
              <div className="flex items-center space-x-3 p-2 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="tous" id="tous" />
                <Label htmlFor="tous" className="cursor-pointer flex-1">
                  Tous les documents
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-2 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="paye" id="paye" />
                <Label htmlFor="paye" className="cursor-pointer flex-1 text-green-600">
                  Documents payés uniquement
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-2 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="impaye" id="impaye" />
                <Label htmlFor="impaye" className="cursor-pointer flex-1 text-destructive">
                  Documents impayés uniquement
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Format d'export */}
          <div className="space-y-3">
            <Label>Format d'export</Label>
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  format === "pdf"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setFormat("pdf")}
              >
                <FileText className="h-8 w-8 text-red-600" />
                <div>
                  <p className="font-medium">PDF</p>
                  <p className="text-xs text-muted-foreground">Format document</p>
                </div>
              </div>
              <div
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  format === "excel"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setFormat("excel")}
              >
                <FileSpreadsheet className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium">Excel</p>
                  <p className="text-xs text-muted-foreground">Format tableur</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Annuler
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="gap-2">
            {isExporting ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Export en cours...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Exporter
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
