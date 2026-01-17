import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, Loader2, Anchor, Container, Wrench, PackageOpen, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { usePdfDownload } from "@/hooks/use-pdf-download";
import { useNoteDebut } from "@/hooks/use-notes-debut";
import { DocumentHeader, DocumentFooter } from "@/components/documents/DocumentLayout";
import { EmailModalWithTemplate } from "@/components/EmailModalWithTemplate";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const typeConfig: Record<string, { label: string; icon: typeof Anchor }> = {
  ouverture_port: { label: "Ouverture de port", icon: Anchor },
  "Ouverture Port": { label: "Ouverture de port", icon: Anchor },
  detention: { label: "Détention", icon: Container },
  Detention: { label: "Détention", icon: Container },
  reparation: { label: "Réparation conteneur", icon: Wrench },
  Reparation: { label: "Réparation conteneur", icon: Wrench },
  relache: { label: "Relâche", icon: PackageOpen },
  Relache: { label: "Relâche", icon: PackageOpen },
};

export default function NoteDebutPDF() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { data: note, isLoading, error } = useNoteDebut(id);
  
  const { contentRef, downloadPdf, generatePdfBlob } = usePdfDownload({ 
    filename: `Note_${note?.numero || 'unknown'}` 
  });

  const [showEmailModal, setShowEmailModal] = useState(false);

  // Auto-download on load
  useEffect(() => {
    if (note) {
      const timer = setTimeout(() => {
        downloadPdf();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [note, downloadPdf]);

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return "0";
    return new Intl.NumberFormat("fr-FR").format(value);
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: fr });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">Note non trouvée</p>
        <Button onClick={() => navigate("/notes-debut")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux notes
        </Button>
      </div>
    );
  }

  const typeInfo = typeConfig[note.type] || { label: "Note de début", icon: Anchor };
  const TypeIcon = typeInfo.icon;
  
  const montantTotal = note.montant_total || note.montant_ttc || note.montant_ht || 0;
  const montantPaye = note.montant_paye || 0;
  const montantAvance = note.montant_avance || 0;
  const remaining = montantTotal - montantPaye - montantAvance;

  const clientName = note.client?.nom || (note.client as any)?.raison_sociale || '-';
  const clientAdresse = note.client?.adresse || '';
  const clientTel = note.client?.telephone || '';
  const clientEmail = note.client?.email || '';

  const dateCreation = note.date_creation || note.date || note.created_at;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Toolbar - Hidden in print */}
      <div className="print:hidden sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/notes-debut/${id}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">Aperçu PDF - {note.numero}</h1>
              <p className="text-sm text-muted-foreground">Note de début - {typeInfo.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={downloadPdf} className="gap-2">
              <Download className="h-4 w-4" />
              Télécharger PDF
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowEmailModal(true)} 
              className="gap-2 transition-all duration-200 hover:scale-105"
            >
              <Mail className="h-4 w-4" />
              Envoyer par email
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Content - A4 Format */}
      <div className="container py-8 print:py-0 flex justify-center animate-fade-in">
        <Card 
          ref={contentRef} 
          className="bg-white print:shadow-none print:border-none relative"
          style={{ width: '210mm', minHeight: '297mm', padding: '15mm' }}
        >
          {/* En-tête du document */}
          <DocumentHeader
            title={`NOTE DE DÉBUT - ${typeInfo.label.toUpperCase()}`}
            numero={note.numero}
            dateLabel="Date"
            date={formatDate(dateCreation)}
          />

          <Separator className="my-4" />

          {/* Type de note avec icône */}
          <div className="flex items-center justify-center gap-2 mb-6 py-3 bg-primary/5 rounded-lg">
            <TypeIcon className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-primary">{typeInfo.label}</span>
          </div>

          {/* Informations client */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">Émetteur</h3>
              <div className="space-y-1 text-sm">
                <p className="font-bold text-lg">LOGISTIGA SAS</p>
                <p>Owendo SETRAG – GABON</p>
                <p>Tel: (+241) 011 70 14 35</p>
                <p>Email: info@logistiga.com</p>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">Client</h3>
              <div className="space-y-1 text-sm">
                <p className="font-bold text-lg">{clientName}</p>
                {clientAdresse && <p>{clientAdresse}</p>}
                {clientTel && <p>Tel: {clientTel}</p>}
                {clientEmail && <p>Email: {clientEmail}</p>}
              </div>
            </div>
          </div>

          {/* Détails de la note */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">Détails de l'opération</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {note.conteneur_numero && (
                    <tr className="border-b">
                      <td className="py-2 px-4 bg-muted/30 font-medium w-1/3">N° Conteneur</td>
                      <td className="py-2 px-4 font-mono">{note.conteneur_numero}</td>
                    </tr>
                  )}
                  {note.bl_numero && (
                    <tr className="border-b">
                      <td className="py-2 px-4 bg-muted/30 font-medium">N° BL</td>
                      <td className="py-2 px-4">{note.bl_numero}</td>
                    </tr>
                  )}
                  {note.navire && (
                    <tr className="border-b">
                      <td className="py-2 px-4 bg-muted/30 font-medium">Navire</td>
                      <td className="py-2 px-4">{note.navire}</td>
                    </tr>
                  )}
                  {(note.date_debut || note.date_debut_stockage) && (
                    <tr className="border-b">
                      <td className="py-2 px-4 bg-muted/30 font-medium">Date de début</td>
                      <td className="py-2 px-4">{formatDate(note.date_debut || note.date_debut_stockage)}</td>
                    </tr>
                  )}
                  {(note.date_fin || note.date_fin_stockage) && (
                    <tr className="border-b">
                      <td className="py-2 px-4 bg-muted/30 font-medium">Date de fin</td>
                      <td className="py-2 px-4">{formatDate(note.date_fin || note.date_fin_stockage)}</td>
                    </tr>
                  )}
                  {(note.nombre_jours || note.jours_stockage) && (
                    <tr className="border-b">
                      <td className="py-2 px-4 bg-muted/30 font-medium">Nombre de jours</td>
                      <td className="py-2 px-4 font-bold">{note.nombre_jours || note.jours_stockage} jours</td>
                    </tr>
                  )}
                  {note.tarif_journalier && (
                    <tr className="border-b">
                      <td className="py-2 px-4 bg-muted/30 font-medium">Tarif journalier</td>
                      <td className="py-2 px-4">{formatCurrency(note.tarif_journalier)} FCFA</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Description */}
          {(note.description || note.observations || note.notes) && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase">Description</h3>
              <p className="text-sm border rounded-lg p-3 bg-muted/20">
                {note.description || note.observations || note.notes}
              </p>
            </div>
          )}

          {/* Montants */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">Récapitulatif financier</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 px-4 font-medium">Montant Total</td>
                    <td className="py-3 px-4 text-right font-bold text-lg">{formatCurrency(montantTotal)} FCFA</td>
                  </tr>
                  {montantAvance > 0 && (
                    <tr className="border-b">
                      <td className="py-2 px-4 text-muted-foreground">Avance</td>
                      <td className="py-2 px-4 text-right text-cyan-600">-{formatCurrency(montantAvance)} FCFA</td>
                    </tr>
                  )}
                  {montantPaye > 0 && (
                    <tr className="border-b">
                      <td className="py-2 px-4 text-muted-foreground">Montant payé</td>
                      <td className="py-2 px-4 text-right text-green-600">-{formatCurrency(montantPaye)} FCFA</td>
                    </tr>
                  )}
                  <tr className="bg-primary/5">
                    <td className="py-3 px-4 font-bold">Reste à payer</td>
                    <td className={`py-3 px-4 text-right font-bold text-lg ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(remaining)} FCFA
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Coordonnées bancaires */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase">Coordonnées bancaires</h3>
            <div className="grid grid-cols-2 gap-4 text-xs border rounded-lg p-3 bg-muted/20">
              <div>
                <p className="font-medium">BGFI Bank Gabon</p>
                <p className="text-muted-foreground">N°: 40003 04140 41041658011 78</p>
              </div>
              <div>
                <p className="font-medium">UGB</p>
                <p className="text-muted-foreground">N°: 40002 00043 90000338691 84</p>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 mt-8 mb-8">
            <div className="text-center">
              <p className="text-sm font-medium mb-12">Le Client</p>
              <div className="border-t border-dashed pt-2">
                <p className="text-xs text-muted-foreground">Signature et cachet</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium mb-12">LOGISTIGA SAS</p>
              <div className="border-t border-dashed pt-2">
                <p className="text-xs text-muted-foreground">Signature et cachet</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <DocumentFooter />
        </Card>
      </div>

      {/* Email Modal */}
      <EmailModalWithTemplate
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        documentType="note_debut"
        documentData={{
          id: note.id,
          numero: note.numero,
          dateCreation: dateCreation,
          montantTTC: montantTotal,
          clientNom: clientName,
          clientEmail: clientEmail,
        }}
        generatePdfBlob={generatePdfBlob}
      />

      {/* Print Styles */}
      <style>{`
        @media print {
          body { 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden { display: none !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
          .print\\:py-0 { padding-top: 0 !important; padding-bottom: 0 !important; }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}
