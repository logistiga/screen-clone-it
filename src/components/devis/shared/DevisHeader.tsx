import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, Download, Edit, Mail, ArrowRight, Copy, 
  Clock, CalendarDays, FileText, Loader2
} from "lucide-react";
import { formatDate } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { usePdfDownload } from "@/hooks/use-pdf-download";

interface DevisHeaderProps {
  devis: any;
  onConvert?: () => void;
  isConverting?: boolean;
}

const statutConfig: Record<string, { className: string; label: string; bgClass: string }> = {
  brouillon: { className: "bg-gray-100 text-gray-700 border-gray-300", label: "Brouillon", bgClass: "from-gray-500/10 to-gray-500/5" },
  envoye: { className: "bg-blue-100 text-blue-700 border-blue-300", label: "Envoyé", bgClass: "from-blue-500/10 to-blue-500/5" },
  accepte: { className: "bg-emerald-100 text-emerald-700 border-emerald-300", label: "Accepté", bgClass: "from-emerald-500/10 to-emerald-500/5" },
  refuse: { className: "bg-red-100 text-red-700 border-red-300", label: "Refusé", bgClass: "from-red-500/10 to-red-500/5" },
  expire: { className: "bg-orange-100 text-orange-700 border-orange-300", label: "Expiré", bgClass: "from-orange-500/10 to-orange-500/5" },
  converti: { className: "bg-purple-100 text-purple-700 border-purple-300", label: "Converti", bgClass: "from-purple-500/10 to-purple-500/5" },
};

export function DevisHeader({ devis, onConvert, isConverting }: DevisHeaderProps) {
  const navigate = useNavigate();
  const statut = statutConfig[devis.statut] || statutConfig.brouillon;
  const { downloadPdf } = usePdfDownload({ filename: `devis-${devis.numero}.pdf` });

  // Avatar du client
  const clientInitials = devis.client?.nom
    ? devis.client.nom.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : '??';

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 
      'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  return (
    <div className={cn(
      "relative rounded-xl overflow-hidden bg-gradient-to-br p-6",
      statut.bgClass
    )}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left section */}
        <div className="flex items-start gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)} 
            className="shrink-0 bg-background/50 backdrop-blur-sm hover:bg-background/80"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-4">
            {/* Client Avatar */}
            <div className={cn(
              "h-16 w-16 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg",
              getAvatarColor(devis.client?.nom || '')
            )}>
              {clientInitials}
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{devis.numero}</h1>
                <Badge variant="outline" className={cn("text-sm", statut.className)}>
                  {statut.label}
                </Badge>
              </div>
              
              <p className="font-medium text-lg mt-1">{devis.client?.nom || "Client inconnu"}</p>
              
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-4 w-4" />
                  Créé le {formatDate(devis.date_creation || devis.date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Valide jusqu'au {formatDate(devis.date_validite)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-background/50 backdrop-blur-sm hover:bg-background/80"
            onClick={downloadPdf}
          >
            <Download className="h-4 w-4" />
            Télécharger PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-background/50 backdrop-blur-sm hover:bg-background/80"
            onClick={() => navigate(`/devis/${devis.id}/modifier`)}
            disabled={devis.statut === 'converti'}
          >
            <Edit className="h-4 w-4" />
            Modifier
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="gap-2 text-blue-600 bg-background/50 backdrop-blur-sm hover:bg-blue-50"
          >
            <Mail className="h-4 w-4" />
            Envoyer
          </Button>
          {devis.statut !== 'converti' && devis.statut !== 'refuse' && onConvert && (
            <Button 
              size="sm"
              className="gap-2 shadow-md" 
              onClick={onConvert}
              disabled={isConverting}
            >
              {isConverting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Convertir en ordre
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function DevisHeaderSkeleton() {
  return (
    <div className="rounded-xl bg-muted/30 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-5 w-40" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>
    </div>
  );
}
