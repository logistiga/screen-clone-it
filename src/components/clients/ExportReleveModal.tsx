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
import { CalendarIcon, Download, FileText, Receipt, ClipboardList, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Client } from "@/lib/api/commercial";

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

const formatMontant = (montant: number) => {
  return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
};

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
    new Date(new Date().getFullYear(), 0, 1)
  );
  const [dateFin, setDateFin] = useState<Date | undefined>(new Date());
  const [selectedTypes, setSelectedTypes] = useState<DocumentType[]>(['factures', 'ordres', 'devis', 'paiements']);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleTypeChange = (type: DocumentType, checked: boolean) => {
    if (checked) {
      setSelectedTypes([...selectedTypes, type]);
    } else {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    }
  };

  const filterByPeriod = (items: any[], dateField: string) => {
    if (!dateDebut || !dateFin) return items;
    return items.filter(item => {
      if (!item[dateField]) return false;
      const itemDate = new Date(item[dateField]);
      return itemDate >= dateDebut && itemDate <= dateFin;
    });
  };

  const handleExport = () => {
    if (!dateDebut || !dateFin) return;
    
    setIsGenerating(true);

    // Filtrer les données
    const filteredFactures = selectedTypes.includes('factures') 
      ? filterByPeriod(factures, 'date_facture') 
      : [];
    const filteredOrdres = selectedTypes.includes('ordres') 
      ? filterByPeriod(ordres, 'date') 
      : [];
    const filteredDevis = selectedTypes.includes('devis') 
      ? filterByPeriod(devis, 'date') 
      : [];
    const filteredPaiements = selectedTypes.includes('paiements') 
      ? filterByPeriod(paiements, 'date') 
      : [];

    // Calculs des totaux
    const totalFactures = filteredFactures.reduce((sum, f) => sum + (f.montant_ttc || 0), 0);
    const totalPaye = filteredFactures.reduce((sum, f) => sum + (f.montant_paye || 0), 0);
    const soldeFactures = totalFactures - totalPaye;

    // Générer le HTML du PDF
    const htmlContent = generatePdfHtml({
      client,
      dateDebut,
      dateFin,
      filteredFactures,
      filteredOrdres,
      filteredDevis,
      filteredPaiements,
      totalFactures,
      totalPaye,
      soldeFactures,
      selectedTypes,
    });

    // Ouvrir dans une nouvelle fenêtre
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Attendre le chargement puis imprimer
      setTimeout(() => {
        printWindow.print();
        setIsGenerating(false);
        onOpenChange(false);
      }, 250);
    } else {
      setIsGenerating(false);
      alert('Veuillez autoriser les popups pour générer le PDF');
    }
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
            Sélectionnez la période et les types de documents à inclure dans le relevé de <strong>{client.nom}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Période */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Période</Label>
            <div className="grid grid-cols-2 gap-3">
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
  );
}

// Fonction pour générer le HTML du PDF
function generatePdfHtml({
  client,
  dateDebut,
  dateFin,
  filteredFactures,
  filteredOrdres,
  filteredDevis,
  filteredPaiements,
  totalFactures,
  totalPaye,
  soldeFactures,
  selectedTypes,
}: {
  client: Client;
  dateDebut: Date;
  dateFin: Date;
  filteredFactures: any[];
  filteredOrdres: any[];
  filteredDevis: any[];
  filteredPaiements: any[];
  totalFactures: number;
  totalPaye: number;
  soldeFactures: number;
  selectedTypes: string[];
}) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  let facturesHtml = '';
  if (selectedTypes.includes('factures') && filteredFactures.length > 0) {
    facturesHtml = `
      <div class="section">
        <h3>Factures (${filteredFactures.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Date</th>
              <th class="text-right">Montant TTC</th>
              <th class="text-right">Payé</th>
              <th class="text-right">Reste</th>
              <th class="text-center">Statut</th>
            </tr>
          </thead>
          <tbody>
            ${filteredFactures.map(f => `
              <tr>
                <td class="font-medium">${f.numero || '-'}</td>
                <td>${formatDate(f.date_facture)}</td>
                <td class="text-right">${formatMontant(f.montant_ttc || 0)}</td>
                <td class="text-right text-green">${formatMontant(f.montant_paye || 0)}</td>
                <td class="text-right text-red">${formatMontant((f.montant_ttc || 0) - (f.montant_paye || 0))}</td>
                <td class="text-center">
                  <span class="badge ${f.statut === 'payee' ? 'badge-green' : f.statut === 'partielle' ? 'badge-yellow' : 'badge-red'}">
                    ${f.statut === 'payee' ? 'Payée' : f.statut === 'partielle' ? 'Partielle' : 'Impayée'}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="2"><strong>Total</strong></td>
              <td class="text-right"><strong>${formatMontant(totalFactures)}</strong></td>
              <td class="text-right text-green"><strong>${formatMontant(totalPaye)}</strong></td>
              <td class="text-right text-red"><strong>${formatMontant(soldeFactures)}</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }

  let ordresHtml = '';
  if (selectedTypes.includes('ordres') && filteredOrdres.length > 0) {
    const totalOrdres = filteredOrdres.reduce((sum, o) => sum + (o.montant_ttc || 0), 0);
    ordresHtml = `
      <div class="section">
        <h3>Ordres de travail (${filteredOrdres.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Date</th>
              <th>Référence</th>
              <th class="text-right">Montant TTC</th>
              <th class="text-center">Statut</th>
            </tr>
          </thead>
          <tbody>
            ${filteredOrdres.map(o => `
              <tr>
                <td class="font-medium">${o.numero || '-'}</td>
                <td>${formatDate(o.date)}</td>
                <td>${o.reference || '-'}</td>
                <td class="text-right">${formatMontant(o.montant_ttc || 0)}</td>
                <td class="text-center">
                  <span class="badge ${o.statut === 'termine' || o.statut === 'facture' ? 'badge-green' : o.statut === 'en_cours' ? 'badge-blue' : 'badge-gray'}">
                    ${o.statut === 'termine' ? 'Terminé' : o.statut === 'facture' ? 'Facturé' : o.statut === 'en_cours' ? 'En cours' : o.statut || '-'}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="3"><strong>Total</strong></td>
              <td class="text-right"><strong>${formatMontant(totalOrdres)}</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }

  let devisHtml = '';
  if (selectedTypes.includes('devis') && filteredDevis.length > 0) {
    const totalDevis = filteredDevis.reduce((sum, d) => sum + (d.montant_ttc || 0), 0);
    devisHtml = `
      <div class="section">
        <h3>Devis (${filteredDevis.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Date</th>
              <th class="text-right">Montant TTC</th>
              <th class="text-center">Statut</th>
            </tr>
          </thead>
          <tbody>
            ${filteredDevis.map(d => `
              <tr>
                <td class="font-medium">${d.numero || '-'}</td>
                <td>${formatDate(d.date)}</td>
                <td class="text-right">${formatMontant(d.montant_ttc || 0)}</td>
                <td class="text-center">
                  <span class="badge ${d.statut === 'accepte' || d.statut === 'converti' ? 'badge-green' : d.statut === 'refuse' ? 'badge-red' : 'badge-blue'}">
                    ${d.statut === 'accepte' ? 'Accepté' : d.statut === 'converti' ? 'Converti' : d.statut === 'refuse' ? 'Refusé' : d.statut || '-'}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="2"><strong>Total</strong></td>
              <td class="text-right"><strong>${formatMontant(totalDevis)}</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }

  let paiementsHtml = '';
  if (selectedTypes.includes('paiements') && filteredPaiements.length > 0) {
    const totalPaiements = filteredPaiements.reduce((sum, p) => sum + (p.montant || 0), 0);
    paiementsHtml = `
      <div class="section">
        <h3>Paiements (${filteredPaiements.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Référence</th>
              <th>Date</th>
              <th>Mode</th>
              <th class="text-right">Montant</th>
            </tr>
          </thead>
          <tbody>
            ${filteredPaiements.map(p => `
              <tr>
                <td class="font-medium">${p.reference || '#' + p.id}</td>
                <td>${formatDate(p.date)}</td>
                <td>${p.mode_paiement || '-'}</td>
                <td class="text-right text-green font-medium">${formatMontant(p.montant || 0)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="3"><strong>Total</strong></td>
              <td class="text-right text-green"><strong>${formatMontant(totalPaiements)}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }

  const noDataMessage = filteredFactures.length === 0 && filteredOrdres.length === 0 && 
    filteredDevis.length === 0 && filteredPaiements.length === 0 
    ? '<div class="no-data">Aucune donnée trouvée pour la période sélectionnée.</div>' 
    : '';

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Relevé - ${client.nom} - ${format(new Date(), 'yyyy-MM-dd')}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; padding: 30px; font-size: 12px; color: #333; }
        .header { border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { font-size: 22px; margin-bottom: 5px; }
        .header .subtitle { color: #666; }
        .header .date { text-align: right; font-size: 11px; color: #666; }
        .client-info { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; border: 1px solid #ddd; }
        .client-info h2 { font-size: 14px; margin-bottom: 8px; }
        .client-info p { margin: 3px 0; }
        .summary { display: flex; gap: 15px; margin-bottom: 25px; }
        .summary-card { flex: 1; padding: 15px; border-radius: 5px; text-align: center; border: 1px solid; }
        .summary-card.blue { background: #eff6ff; border-color: #bfdbfe; }
        .summary-card.green { background: #f0fdf4; border-color: #bbf7d0; }
        .summary-card.red { background: #fef2f2; border-color: #fecaca; }
        .summary-card .label { font-size: 11px; margin-bottom: 5px; }
        .summary-card.blue .label { color: #2563eb; }
        .summary-card.green .label { color: #16a34a; }
        .summary-card.red .label { color: #dc2626; }
        .summary-card .value { font-size: 16px; font-weight: bold; }
        .summary-card.blue .value { color: #1e3a8a; }
        .summary-card.green .value { color: #14532d; }
        .summary-card.red .value { color: #991b1b; }
        .section { margin-bottom: 25px; }
        .section h3 { font-size: 14px; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-medium { font-weight: 500; }
        .text-green { color: #16a34a; }
        .text-red { color: #dc2626; }
        .total-row { background: #f5f5f5; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 10px; }
        .badge-green { background: #dcfce7; color: #166534; }
        .badge-red { background: #fee2e2; color: #991b1b; }
        .badge-yellow { background: #fef9c3; color: #854d0e; }
        .badge-blue { background: #dbeafe; color: #1e40af; }
        .badge-gray { background: #f3f4f6; color: #374151; }
        .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; font-size: 10px; color: #666; }
        .no-data { text-align: center; padding: 40px; color: #666; }
        @media print {
          body { padding: 0; }
          @page { margin: 1.5cm; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h1>RELEVÉ DE COMPTE</h1>
            <p class="subtitle">Période: ${format(dateDebut, "dd MMMM yyyy", { locale: fr })} - ${format(dateFin, "dd MMMM yyyy", { locale: fr })}</p>
          </div>
          <div class="date">
            Généré le ${format(new Date(), "dd/MM/yyyy à HH:mm", { locale: fr })}
          </div>
        </div>
      </div>

      <div class="client-info">
        <h2>Client</h2>
        <p><strong>${client.nom}</strong></p>
        ${client.email ? `<p>${client.email}</p>` : ''}
        ${client.telephone ? `<p>${client.telephone}</p>` : ''}
        ${client.adresse ? `<p>${client.adresse}</p>` : ''}
        ${client.ville || client.pays ? `<p>${[client.ville, client.pays].filter(Boolean).join(', ')}</p>` : ''}
      </div>

      <div class="summary">
        <div class="summary-card blue">
          <div class="label">Total Facturé</div>
          <div class="value">${formatMontant(totalFactures)}</div>
        </div>
        <div class="summary-card green">
          <div class="label">Total Payé</div>
          <div class="value">${formatMontant(totalPaye)}</div>
        </div>
        <div class="summary-card ${soldeFactures > 0 ? 'red' : 'green'}">
          <div class="label">Solde Dû</div>
          <div class="value">${formatMontant(soldeFactures)}</div>
        </div>
      </div>

      ${facturesHtml}
      ${ordresHtml}
      ${devisHtml}
      ${paiementsHtml}
      ${noDataMessage}

      <div class="footer">
        Document généré automatiquement - ${format(new Date(), "dd/MM/yyyy HH:mm")}
      </div>
    </body>
    </html>
  `;
}
