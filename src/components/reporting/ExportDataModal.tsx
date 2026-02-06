import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Download, FileText, FileSpreadsheet, Calendar, 
  Receipt, FileCheck, Truck, Wallet, Users, 
  Building2, CreditCard, XCircle, BarChart3 
} from "lucide-react";
import { toast } from "sonner";
import { exportApi, ExportType, ExportFilters } from "@/lib/api/reporting";

interface ExportDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients?: { id: string; nom: string }[];
}

type FormatExport = "excel" | "pdf";

interface ExportOption {
  id: ExportType;
  label: string;
  description: string;
  icon: React.ElementType;
  hasClientFilter?: boolean;
  hasStatutFilter?: boolean;
  hasModePaiementFilter?: boolean;
  hasCategorieFilter?: boolean;
}

const exportOptions: ExportOption[] = [
  { 
    id: 'factures', 
    label: 'Factures', 
    description: 'Toutes les factures avec détails',
    icon: Receipt,
    hasClientFilter: true,
    hasStatutFilter: true,
  },
  { 
    id: 'devis', 
    label: 'Devis', 
    description: 'Tous les devis créés',
    icon: FileText,
    hasStatutFilter: true,
  },
  { 
    id: 'ordres-travail', 
    label: 'Ordres de Travail', 
    description: 'Tous les ordres de travail',
    icon: Truck,
    hasClientFilter: true,
    hasStatutFilter: true,
    hasCategorieFilter: true,
  },
  { 
    id: 'paiements', 
    label: 'Paiements', 
    description: 'Historique des paiements',
    icon: Wallet,
    hasModePaiementFilter: true,
  },
  { 
    id: 'clients', 
    label: 'Clients', 
    description: 'Liste des clients',
    icon: Users,
  },
  { 
    id: 'primes', 
    label: 'Primes', 
    description: 'Primes des représentants',
    icon: Wallet,
    hasStatutFilter: true,
  },
  { 
    id: 'caisse', 
    label: 'Mouvements Caisse', 
    description: 'Entrées et sorties de caisse',
    icon: Building2,
    hasCategorieFilter: true,
  },
  { 
    id: 'creances', 
    label: 'Créances', 
    description: 'Factures impayées par client',
    icon: FileCheck,
  },
  { 
    id: 'tresorerie', 
    label: 'Trésorerie', 
    description: 'État de la trésorerie',
    icon: BarChart3,
  },
  { 
    id: 'credits', 
    label: 'Crédits Bancaires', 
    description: 'Emprunts et remboursements',
    icon: CreditCard,
  },
  { 
    id: 'annulations', 
    label: 'Annulations', 
    description: 'Documents annulés et avoirs',
    icon: XCircle,
  },
  { 
    id: 'activite-globale', 
    label: 'Activité Clients', 
    description: 'Synthèse par client',
    icon: Users,
  },
  { 
    id: 'chiffre-affaires', 
    label: 'Chiffre d\'Affaires', 
    description: 'CA mensuel et annuel',
    icon: BarChart3,
  },
  { 
    id: 'tableau-de-bord', 
    label: 'Tableau de Bord', 
    description: 'Synthèse générale',
    icon: BarChart3,
  },
];

const statutsFacture = [
  { value: 'tous', label: 'Tous les statuts' },
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'validee', label: 'Validée' },
  { value: 'partiellement_payee', label: 'Partiellement payée' },
  { value: 'payee', label: 'Payée' },
  { value: 'annulee', label: 'Annulée' },
];

const statutsDevis = [
  { value: 'tous', label: 'Tous les statuts' },
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'envoye', label: 'Envoyé' },
  { value: 'accepte', label: 'Accepté' },
  { value: 'refuse', label: 'Refusé' },
  { value: 'expire', label: 'Expiré' },
];

const statutsOrdre = [
  { value: 'tous', label: 'Tous les statuts' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'termine', label: 'Terminé' },
  { value: 'facture', label: 'Facturé' },
  { value: 'annule', label: 'Annulé' },
];

const statutsPrime = [
  { value: 'tous', label: 'Tous les statuts' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'partiel', label: 'Partiellement payée' },
  { value: 'paye', label: 'Payée' },
];

const categoriesDocument = [
  { value: 'tous', label: 'Toutes les catégories' },
  { value: 'conteneurs', label: 'Conteneurs' },
  { value: 'conventionnel', label: 'Conventionnel' },
  { value: 'independant', label: 'Indépendant' },
];

const modesPaiement = [
  { value: 'tous', label: 'Tous les modes' },
  { value: 'especes', label: 'Espèces' },
  { value: 'virement', label: 'Virement' },
  { value: 'cheque', label: 'Chèque' },
];

export function ExportDataModal({ open, onOpenChange, clients = [] }: ExportDataModalProps) {
  const navigate = useNavigate();
  const [selectedExports, setSelectedExports] = useState<ExportType[]>(['factures']);
  const [format, setFormat] = useState<FormatExport>("excel");
  const [dateDebut, setDateDebut] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [dateFin, setDateFin] = useState(() => new Date().toISOString().split('T')[0]);
  const [clientId, setClientId] = useState("tous");
  const [statut, setStatut] = useState("tous");
  const [modePaiement, setModePaiement] = useState("tous");
  const [categorie, setCategorie] = useState("tous");
  const [isExporting, setIsExporting] = useState(false);
  const [annee, setAnnee] = useState(new Date().getFullYear());

  const toggleExport = (exportId: ExportType) => {
    setSelectedExports(prev => 
      prev.includes(exportId) 
        ? prev.filter(e => e !== exportId)
        : [...prev, exportId]
    );
  };

  // Déterminer les statuts à afficher selon le type sélectionné
  const getStatutsForType = () => {
    if (selectedExports.includes('ordres-travail')) return statutsOrdre;
    if (selectedExports.includes('primes')) return statutsPrime;
    if (selectedExports.includes('devis')) return statutsDevis;
    return statutsFacture;
  };

  // Types de reporting qui utilisent le PDF client-side
  const pdfReportingTypes: ExportType[] = ['tableau-de-bord', 'chiffre-affaires', 'activite-globale', 'tresorerie', 'creances'];

  const handleExport = async () => {
    if (selectedExports.length === 0) {
      toast.error("Veuillez sélectionner au moins un type de données");
      return;
    }

    // Si format PDF et type reporting → naviguer vers la page PDF dédiée
    if (format === 'pdf') {
      const hasReportingType = selectedExports.some(e => pdfReportingTypes.includes(e));
      if (hasReportingType) {
        onOpenChange(false);
        navigate(`/reporting/pdf?annee=${annee}`);
        return;
      }
    }

    setIsExporting(true);

    try {
      for (const exportType of selectedExports) {
        const filters: ExportFilters = {
          date_debut: dateDebut,
          date_fin: dateFin,
        };

        if (clientId !== 'tous') {
          filters.client_id = clientId;
        }
        if (statut !== 'tous') {
          filters.statut = statut;
        }
        if (modePaiement !== 'tous') {
          filters.mode_paiement = modePaiement;
        }
        if (categorie !== 'tous') {
          filters.categorie = categorie;
        }
        if (exportType === 'tableau-de-bord' || exportType === 'chiffre-affaires') {
          filters.annee = annee;
        }

        await exportApi.downloadExport(exportType, filters, format === 'excel' ? 'csv' : 'pdf');
      }

      toast.success(`Export ${format.toUpperCase()} généré avec succès`, {
        description: `${selectedExports.length} fichier(s) téléchargé(s)`
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Erreur export:', error);
      toast.error("Erreur lors de l'export", {
        description: "Veuillez réessayer"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const showClientFilter = selectedExports.some(e => 
    exportOptions.find(o => o.id === e)?.hasClientFilter
  );
  const showStatutFilter = selectedExports.some(e => 
    exportOptions.find(o => o.id === e)?.hasStatutFilter
  );
  const showModePaiementFilter = selectedExports.some(e => 
    exportOptions.find(o => o.id === e)?.hasModePaiementFilter
  );
  const showCategorieFilter = selectedExports.some(e => 
    exportOptions.find(o => o.id === e)?.hasCategorieFilter
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Exporter des données
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les données à exporter, le format et la période
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Types de données */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Type de données</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {exportOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedExports.includes(option.id);
                return (
                  <div
                    key={option.id}
                    onClick={() => toggleExport(option.id)}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Checkbox checked={isSelected} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{option.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {option.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Période */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Période</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateDebut" className="flex items-center gap-1 text-sm">
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
                <Label htmlFor="dateFin" className="flex items-center gap-1 text-sm">
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
            {(selectedExports.includes('tableau-de-bord') || selectedExports.includes('chiffre-affaires')) && (
              <div className="space-y-2">
                <Label>Année de référence</Label>
                <Select value={String(annee)} onValueChange={(v) => setAnnee(Number(v))}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026].map(a => (
                      <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Filtres conditionnels */}
          {(showClientFilter || showStatutFilter || showModePaiementFilter || showCategorieFilter) && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Filtres</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {showClientFilter && clients.length > 0 && (
                  <div className="space-y-2">
                    <Label>Client</Label>
                    <Select value={clientId} onValueChange={setClientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les clients" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tous">Tous les clients</SelectItem>
                        {clients.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {showStatutFilter && (
                  <div className="space-y-2">
                    <Label>Statut</Label>
                    <Select value={statut} onValueChange={setStatut}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getStatutsForType().map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {showModePaiementFilter && (
                  <div className="space-y-2">
                    <Label>Mode de paiement</Label>
                    <Select value={modePaiement} onValueChange={setModePaiement}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {modesPaiement.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {showCategorieFilter && (
                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Select value={categorie} onValueChange={setCategorie}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesDocument.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Format */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Format d'export</Label>
            <RadioGroup 
              value={format} 
              onValueChange={(v) => setFormat(v as FormatExport)}
              className="grid grid-cols-2 gap-4"
            >
              <div
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  format === "excel"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setFormat("excel")}
              >
                <RadioGroupItem value="excel" id="excel" className="sr-only" />
                <FileSpreadsheet className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium">Excel (CSV)</p>
                  <p className="text-xs text-muted-foreground">Format tableur</p>
                </div>
              </div>
              <div
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  format === "pdf"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setFormat("pdf")}
              >
                <RadioGroupItem value="pdf" id="pdf" className="sr-only" />
                <FileText className="h-8 w-8 text-red-600" />
                <div>
                  <p className="font-medium">PDF</p>
                  <p className="text-xs text-muted-foreground">Format document</p>
                </div>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Annuler
          </Button>
          <Button onClick={handleExport} disabled={isExporting || selectedExports.length === 0} className="gap-2">
            {isExporting ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Export en cours...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Exporter ({selectedExports.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
