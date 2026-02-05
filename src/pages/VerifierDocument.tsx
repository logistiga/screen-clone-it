import { useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, FileText, User, Calendar, CreditCard } from "lucide-react";
import logoLogistiga from "@/assets/lojistiga-logo.png";
import { formatMontant, formatDate } from "@/data/mockData";

interface DocumentInfo {
  type: string;
  numero: string;
  date: string;
  client: string;
  montantTTC: number;
  montantPaye: number;
  reste: number;
  statut: string;
}

const TYPE_LABELS: Record<string, string> = {
  facture: "Facture",
  ordre: "Ordre de Travail",
  ot: "Ordre de Travail",
  devis: "Devis",
};

/**
 * Page publique de vérification de document via QR code
 * Les données sont encodées directement dans l'URL (pas d'API requise)
 */
export default function VerifierDocumentPage() {
  const [searchParams] = useSearchParams();

  const documentInfo = useMemo<DocumentInfo | null>(() => {
    const dataParam = searchParams.get("data");
    if (!dataParam) return null;

    try {
      const parsed = JSON.parse(decodeURIComponent(dataParam));
      const montantTTC = parsed.m || 0;
      const montantPaye = parsed.p || 0;
      
      return {
        type: TYPE_LABELS[parsed.t] || parsed.t || "Document",
        numero: parsed.n || "",
        date: parsed.d || "",
        client: parsed.c || "",
        montantTTC,
        montantPaye,
        reste: montantTTC - montantPaye,
        statut: parsed.s || "",
      };
    } catch {
      return null;
    }
  }, [searchParams]);

  const getStatutBadge = (statut: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      en_cours: { variant: "default", label: "En cours" },
      termine: { variant: "secondary", label: "Terminé" },
      payee: { variant: "secondary", label: "Payée" },
      paye: { variant: "secondary", label: "Payé" },
      validee: { variant: "default", label: "Validée" },
      valide: { variant: "default", label: "Validé" },
      annule: { variant: "destructive", label: "Annulé" },
      annulee: { variant: "destructive", label: "Annulée" },
      brouillon: { variant: "outline", label: "Brouillon" },
      en_attente: { variant: "outline", label: "En attente" },
      emise: { variant: "default", label: "Émise" },
      partielle: { variant: "outline", label: "Partiellement payée" },
      impayee: { variant: "destructive", label: "Impayée" },
    };
    const config = variants[statut] || { variant: "outline" as const, label: statut };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 shadow-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <img src={logoLogistiga} alt="LOGISTIGA" className="h-14 w-auto mx-auto mb-4" />
          <h1 className="text-xl font-bold text-primary">Vérification de Document</h1>
          <p className="text-sm text-muted-foreground">Système de validation LOGISTIGA</p>
        </div>

        {/* Status */}
        <div className="flex justify-center mb-6">
          {documentInfo ? (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-full">
              <CheckCircle className="h-6 w-6" />
              <span className="font-semibold text-lg">Document Authentique</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-destructive bg-destructive/10 px-4 py-3 rounded-full">
              <XCircle className="h-6 w-6" />
              <span className="font-semibold">Document Non Valide</span>
            </div>
          )}
        </div>

        {/* Document Details */}
        {documentInfo && (
          <div className="space-y-4">
            {/* Type & Numéro */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{documentInfo.type}</p>
                  <p className="font-bold text-xl">{documentInfo.numero}</p>
                </div>
                <div>
                  {getStatutBadge(documentInfo.statut)}
                </div>
              </div>
            </div>

            {/* Informations */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p className="font-medium">{documentInfo.client}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Date d'émission</p>
                  <p className="font-medium">{formatDate(documentInfo.date)}</p>
                </div>
              </div>

              {/* Montants */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Informations financières</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-bold">{formatMontant(documentInfo.montantTTC)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <p className="text-xs text-muted-foreground">Payé</p>
                    <p className="font-bold text-green-600">{formatMontant(documentInfo.montantPaye)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <p className="text-xs text-muted-foreground">Reste</p>
                    <p className={`font-bold ${documentInfo.reste > 0 ? 'text-destructive' : 'text-green-600'}`}>
                      {formatMontant(documentInfo.reste)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t text-center">
          <p className="text-xs text-muted-foreground">
            LOGISTIGA SAS - Système de vérification sécurisé
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Vérifié le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
          </p>
        </div>
      </Card>
    </div>
  );
}
