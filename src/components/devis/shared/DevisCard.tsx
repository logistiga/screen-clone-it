import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Eye, Edit, FileText, MessageCircle, Mail, ArrowRight, Trash2, Ban, Check,
  Container, Package, Wrench, Clock, User, Building2
} from "lucide-react";
import { formatMontant, formatDate, getStatutLabel } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface DevisCardProps {
  devis: any;
  onAction: (type: 'annuler' | 'supprimer' | 'convertir' | 'valider', id: string, numero: string) => void;
  onWhatsApp: (devis: any) => void;
  onEmail: (numero: string, email: string, nom: string) => void;
}

const statutConfig: Record<string, { className: string; icon?: React.ReactNode }> = {
  brouillon: { className: "bg-gray-100 text-gray-700 border-gray-300" },
  envoye: { className: "bg-blue-100 text-blue-700 border-blue-300" },
  accepte: { className: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  refuse: { className: "bg-red-100 text-red-700 border-red-300" },
  expire: { className: "bg-orange-100 text-orange-700 border-orange-300" },
  converti: { className: "bg-purple-100 text-purple-700 border-purple-300" },
};

const categorieConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  Conteneur: { label: "Conteneurs", icon: <Container className="h-3 w-3" />, className: "bg-blue-100 text-blue-800" },
  Lot: { label: "Conventionnel", icon: <Package className="h-3 w-3" />, className: "bg-amber-100 text-amber-800" },
  Independant: { label: "Indépendant", icon: <Wrench className="h-3 w-3" />, className: "bg-purple-100 text-purple-800" },
};

export function DevisCard({ devis, onAction, onWhatsApp, onEmail }: DevisCardProps) {
  const navigate = useNavigate();
  const statut = statutConfig[devis.statut] || statutConfig.brouillon;
  const categorie = categorieConfig[devis.type_document] || categorieConfig.Conteneur;

  // Calcul de la validité
  const validiteProgress = (() => {
    if (!devis.date_validite || !devis.date_creation) return 100;
    const now = new Date();
    const creation = new Date(devis.date_creation);
    const validite = new Date(devis.date_validite);
    const total = validite.getTime() - creation.getTime();
    const elapsed = now.getTime() - creation.getTime();
    const remaining = Math.max(0, Math.min(100, 100 - (elapsed / total) * 100));
    return remaining;
  })();

  const joursRestants = (() => {
    if (!devis.date_validite) return 0;
    const now = new Date();
    const validite = new Date(devis.date_validite);
    return Math.max(0, Math.ceil((validite.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  })();

  const isExpiringSoon = joursRestants <= 7 && joursRestants > 0;
  const isExpired = joursRestants === 0;

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
      "border-l-4",
      devis.statut === 'accepte' ? "border-l-emerald-500" :
      devis.statut === 'envoye' ? "border-l-blue-500" :
      devis.statut === 'refuse' ? "border-l-red-500" :
      devis.statut === 'converti' ? "border-l-purple-500" :
      "border-l-gray-300"
    )}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <button 
              onClick={() => navigate(`/devis/${devis.id}`)}
              className="text-lg font-semibold text-primary hover:underline transition-colors"
            >
              {devis.numero}
            </button>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={cn("text-xs", statut.className)}>
                {getStatutLabel(devis.statut)}
              </Badge>
              <Badge variant="outline" className={cn("text-xs flex items-center gap-1", categorie.className)}>
                {categorie.icon}
                {categorie.label}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-foreground">
              {formatMontant(devis.montant_ttc)}
            </p>
            <p className="text-xs text-muted-foreground">TTC</p>
          </div>
        </div>

        {/* Client */}
        <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted/30">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{devis.client?.nom || "Client inconnu"}</p>
            <p className="text-xs text-muted-foreground truncate">{devis.client?.email}</p>
          </div>
        </div>

        {/* Validité */}
        {devis.statut !== 'converti' && devis.statut !== 'refuse' && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Validité
              </span>
              <span className={cn(
                "font-medium",
                isExpired ? "text-red-600" :
                isExpiringSoon ? "text-amber-600" :
                "text-muted-foreground"
              )}>
                {isExpired ? "Expiré" : `${joursRestants} jour${joursRestants > 1 ? 's' : ''}`}
              </span>
            </div>
            <Progress 
              value={validiteProgress} 
              className={cn(
                "h-1.5",
                isExpired ? "[&>div]:bg-red-500" :
                isExpiringSoon ? "[&>div]:bg-amber-500" :
                "[&>div]:bg-emerald-500"
              )}
            />
          </div>
        )}

        {/* Date */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span>Créé le {formatDate(devis.date_creation || devis.date)}</span>
          {devis.armateur?.nom && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {devis.armateur.nom}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => navigate(`/devis/${devis.id}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {devis.statut !== 'refuse' && devis.statut !== 'expire' && devis.statut !== 'accepte' && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => navigate(`/devis/${devis.id}/modifier`)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => window.open(`/devis/${devis.id}/pdf`, '_blank')}
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-blue-600"
              title="Email"
              onClick={() => onEmail(devis.numero, devis.client?.email || '', devis.client?.nom || '')}
            >
              <Mail className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-emerald-600"
              title="WhatsApp"
              onClick={() => onWhatsApp(devis)}
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-1">
            {(devis.statut === 'brouillon' || devis.statut === 'envoye') && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50"
                onClick={() => onAction('valider', devis.id, devis.numero)}
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            {devis.statut === 'accepte' && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-primary"
                onClick={() => onAction('convertir', devis.id, devis.numero)}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            {devis.statut !== 'refuse' && devis.statut !== 'expire' && devis.statut !== 'accepte' && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-orange-600 hover:bg-orange-50"
                onClick={() => onAction('annuler', devis.id, devis.numero)}
              >
                <Ban className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-destructive hover:bg-red-50"
              onClick={() => onAction('supprimer', devis.id, devis.numero)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
