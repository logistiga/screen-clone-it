import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Database, 
  ChevronDown, 
  ChevronUp,
  Server
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { conteneursTraitesApi, OpsHealthResponse } from "@/lib/api/conteneurs-traites";
import { cn } from "@/lib/utils";

interface OpsConnectionStatusProps {
  syncError?: Error | null;
  onRetrySync?: () => void;
}

export function OpsConnectionStatus({ syncError, onRetrySync }: OpsConnectionStatusProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [healthResult, setHealthResult] = useState<OpsHealthResponse | null>(null);

  const healthMutation = useMutation({
    mutationFn: conteneursTraitesApi.healthOps,
    onSuccess: (data) => {
      setHealthResult(data);
      setShowDetails(true);
    },
    onError: (error: Error & { response?: { data?: OpsHealthResponse; status?: number } }) => {
      // Extraire les données d'erreur de l'API
      const errorData = error.response?.data;
      if (errorData) {
        setHealthResult(errorData);
      } else {
        setHealthResult({
          success: false,
          message: error.message || "Impossible de contacter le serveur",
          debug: { error: error.message },
        });
      }
      setShowDetails(true);
    },
  });

  // Ne rien afficher si pas d'erreur sync et pas de test en cours
  if (!syncError && !healthMutation.isPending && !healthResult) {
    return null;
  }

  const isConnected = healthResult?.success === true;
  const hasError = syncError || (healthResult && !healthResult.success);

  return (
    <Card className={cn(
      "border-2 transition-all duration-300",
      isConnected && "border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-950/20",
      hasError && "border-destructive/50 bg-destructive/5",
      !isConnected && !hasError && "border-amber-500/50 bg-amber-50/30 dark:bg-amber-950/20"
    )}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-full",
                isConnected && "bg-emerald-100 dark:bg-emerald-900/50",
                hasError && "bg-destructive/10",
                !isConnected && !hasError && "bg-amber-100 dark:bg-amber-900/50"
              )}>
                {isConnected ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                ) : hasError ? (
                  <XCircle className="h-5 w-5 text-destructive" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                )}
              </div>
              <div>
                <h4 className="font-medium flex items-center gap-2">
                  Connexion Base OPS
                  {isConnected && (
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300">
                      Connecté
                    </Badge>
                  )}
                  {hasError && (
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                      Erreur
                    </Badge>
                  )}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {healthResult?.message || (syncError ? "La synchronisation a échoué" : "Vérifiez la connexion à la base OPS")}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => healthMutation.mutate()}
                disabled={healthMutation.isPending}
                className="gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", healthMutation.isPending && "animate-spin")} />
                Tester connexion
              </Button>
              {onRetrySync && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={onRetrySync}
                  className="gap-2"
                >
                  <Database className="h-4 w-4" />
                  Réessayer sync
                </Button>
              )}
            </div>
          </div>

          {/* Sync Error Message */}
          {syncError && (
            <div className="bg-destructive/10 rounded-md p-3 text-sm">
              <p className="font-medium text-destructive mb-1">Erreur de synchronisation:</p>
              <p className="text-muted-foreground">{syncError.message}</p>
            </div>
          )}

          {/* Details Toggle */}
          {healthResult?.debug && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="w-fit gap-1 text-muted-foreground hover:text-foreground"
            >
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showDetails ? "Masquer les détails" : "Afficher les détails techniques"}
            </Button>
          )}

          {/* Technical Details */}
          {showDetails && healthResult?.debug && (
            <div className="bg-muted/50 rounded-md p-3 text-sm font-mono space-y-1.5">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Server className="h-4 w-4" />
                <span className="font-sans font-medium">Détails de connexion</span>
              </div>
              
              {healthResult.debug.host && (
                <p><span className="text-muted-foreground">Host:</span> {healthResult.debug.host}</p>
              )}
              {healthResult.debug.database && (
                <p><span className="text-muted-foreground">Database:</span> {healthResult.debug.database}</p>
              )}
              {healthResult.debug.tables_count !== undefined && (
                <p><span className="text-muted-foreground">Tables:</span> {healthResult.debug.tables_count}</p>
              )}
              {healthResult.debug.host_configured !== undefined && (
                <p>
                  <span className="text-muted-foreground">Config Host:</span>{" "}
                  <span className={healthResult.debug.host_configured ? "text-emerald-600" : "text-destructive"}>
                    {healthResult.debug.host_configured ? "✓ Configuré" : "✗ Manquant"}
                  </span>
                </p>
              )}
              {healthResult.debug.database_configured !== undefined && (
                <p>
                  <span className="text-muted-foreground">Config Database:</span>{" "}
                  <span className={healthResult.debug.database_configured ? "text-emerald-600" : "text-destructive"}>
                    {healthResult.debug.database_configured ? "✓ Configuré" : "✗ Manquant"}
                  </span>
                </p>
              )}
              {healthResult.debug.error && (
                <div className="mt-2 pt-2 border-t border-border">
                  <p className="text-destructive break-all">
                    <span className="text-muted-foreground">Erreur:</span> {healthResult.debug.error}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Help Text */}
          {hasError && (
            <p className="text-xs text-muted-foreground">
              💡 Vérifiez les variables <code className="bg-muted px-1 rounded">OPS_DB_*</code> dans le fichier <code className="bg-muted px-1 rounded">.env</code> du backend et exécutez <code className="bg-muted px-1 rounded">php artisan config:clear</code>.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
