import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

function getErrorMessage(error: unknown): { title: string; description: string; details?: string } {
  const axiosError = error as {
    response?: { status?: number; data?: any };
    config?: { baseURL?: string; url?: string };
    message?: string;
  };

  const status = axiosError?.response?.status;
  const apiMsg = axiosError?.response?.data?.message || axiosError?.response?.data?.error;
  const requestUrl = [axiosError?.config?.baseURL, axiosError?.config?.url].filter(Boolean).join('');

  const details = [
    status ? `HTTP ${status}` : undefined,
    requestUrl ? `URL: ${requestUrl}` : undefined,
    typeof apiMsg === 'string' ? `Message: ${apiMsg}` : undefined,
  ].filter(Boolean).join(' • ');

  if (status === 401) return { title: "Session expirée", description: "Votre session a expiré. Veuillez vous reconnecter.", details };
  if (status === 403) return { title: "Accès refusé", description: "Vous n'avez pas les permissions nécessaires.", details };
  if (status === 500) return { title: "Erreur serveur", description: "Le serveur a renvoyé une erreur 500.", details };
  return { title: "Erreur de chargement", description: "Impossible de charger les données.", details };
}

interface ErrorCardProps {
  error: unknown;
  onRetry: () => void;
  entityName: string;
}

export function PartenairesErrorCard({ error, onRetry, entityName }: ErrorCardProps) {
  const { title, description, details } = getErrorMessage(error);
  return (
    <Alert variant="destructive" className="my-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span>{description}</span>
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Réessayer
          </Button>
        </div>
        {details && (
          <div className="text-xs text-muted-foreground break-words">
            {entityName} • {details}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
