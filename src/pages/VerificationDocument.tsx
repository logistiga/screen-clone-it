import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, FileText, ArrowLeft, User, Calendar, CreditCard, Package } from "lucide-react";
import logoLogistiga from "@/assets/lojistiga-logo.png";
import { formatMontant, formatDate } from "@/data/mockData";

interface DocumentData {
  type: string;
  numero: string;
  date: string;
  client?: string;
  typeOperation?: string;
  montantTTC: number;
  montantPaye: number;
  reste: number;
  statut: string;
  url: string;
}

export default function VerificationDocumentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const data = searchParams.get("data");
    if (data) {
      try {
        const parsed = JSON.parse(decodeURIComponent(data));
        setDocumentData(parsed);
        setIsValid(true);
      } catch (e) {
        setError("QR Code invalide ou corrompu");
        setIsValid(false);
      }
    } else {
      setError("Aucune donnée trouvée");
      setIsValid(false);
    }
  }, [searchParams]);

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ORDRE_TRAVAIL: "Ordre de Travail",
      CONNAISSEMENT: "Connaissement",
      DEVIS: "Devis",
      FACTURE: "Facture"
    };
    return labels[type] || type;
  };

  const getStatutBadge = (statut: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      en_cours: { variant: "default", label: "En cours" },
      termine: { variant: "secondary", label: "Terminé" },
      paye: { variant: "secondary", label: "Payé" },
      annule: { variant: "destructive", label: "Annulé" },
      en_attente: { variant: "outline", label: "En attente" }
    };
    const config = variants[statut] || { variant: "outline" as const, label: statut };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getOperationLabel = (type: string) => {
    const labels: Record<string, string> = {
      conteneurs: "Conteneurs",
      conventionnel: "Conventionnel",
      location: "Location",
      transport: "Transport",
      manutention: "Manutention",
      stockage: "Stockage"
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 shadow-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <img src={logoLogistiga} alt="LOGISTIGA" className="h-12 w-auto mx-auto mb-4" />
          <h1 className="text-xl font-bold text-primary">Vérification de Document</h1>
          <p className="text-sm text-muted-foreground">Système de validation QR Code</p>
        </div>

        {/* Status */}
        <div className="flex justify-center mb-6">
          {isValid ? (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Document Authentique</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-destructive bg-destructive/10 px-4 py-2 rounded-full">
              <XCircle className="h-5 w-5" />
              <span className="font-semibold">{error || "Document Non Valide"}</span>
            </div>
          )}
        </div>

        {/* Document Details */}
        {documentData && (
          <div className="space-y-4">
            {/* Type & Numéro */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{getTypeLabel(documentData.type)}</p>
                  <p className="font-bold text-lg">{documentData.numero}</p>
                </div>
                <div className="ml-auto">
                  {getStatutBadge(documentData.statut)}
                </div>
              </div>
            </div>

            {/* Informations */}
            <div className="space-y-3">
              {documentData.client && (
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Client</p>
                    <p className="font-medium">{documentData.client}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Date d'émission</p>
                  <p className="font-medium">{formatDate(documentData.date)}</p>
                </div>
              </div>

              {documentData.typeOperation && (
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Type d'opération</p>
                    <p className="font-medium">{getOperationLabel(documentData.typeOperation)}</p>
                  </div>
                </div>
              )}

              {/* Montants */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Informations financières</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-2 rounded">
                    <p className="text-xs text-muted-foreground">Total TTC</p>
                    <p className="font-bold text-sm">{formatMontant(documentData.montantTTC)}</p>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <p className="text-xs text-muted-foreground">Payé</p>
                    <p className="font-bold text-sm text-green-600">{formatMontant(documentData.montantPaye)}</p>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <p className="text-xs text-muted-foreground">Reste</p>
                    <p className={`font-bold text-sm ${documentData.reste > 0 ? 'text-destructive' : 'text-green-600'}`}>
                      {formatMontant(documentData.reste)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Accueil
              </Button>
              {documentData.url && (
                <Button 
                  className="flex-1"
                  onClick={() => window.location.href = documentData.url}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Voir le document
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t text-center">
          <p className="text-xs text-muted-foreground">
            LOGISTIGA SAS - Système de vérification sécurisé
          </p>
          <p className="text-xs text-muted-foreground">
            Ce document a été vérifié le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
          </p>
        </div>
      </Card>
    </div>
  );
}
