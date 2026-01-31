import { useState } from "react";
import { 
  Bug, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  AlertCircle,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import api from "@/lib/api";

interface DebugData {
  apiUrl?: string;
  request?: any;
  response?: any;
  error?: any;
  queryStatus?: {
    isLoading?: boolean;
    isError?: boolean;
    isRefetching?: boolean;
  };
  stats?: any;
  timestamp?: string;
  duration?: number;
}

interface DebugPanelProps {
  title?: string;
  data: DebugData;
  onRefresh?: () => void;
}

export function DebugPanel({ title = "Debug API", data, onRefresh }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [opsStatus, setOpsStatus] = useState<{
    testing: boolean;
    result: any;
  }>({ testing: false, result: null });
  const [syncStatus, setSyncStatus] = useState<{
    syncing: boolean;
    result: any;
  }>({ syncing: false, result: null });

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      toast.success("Données copiées");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Échec de la copie");
    }
  };

  const testOpsConnection = async () => {
    setOpsStatus({ testing: true, result: null });
    try {
      const response = await api.get('/sync-diagnostic/health-ops');
      setOpsStatus({ testing: false, result: response.data });
    } catch (error: any) {
      setOpsStatus({ 
        testing: false, 
        result: { 
          success: false, 
          error: error.response?.data?.message || error.message || 'Erreur de connexion'
        } 
      });
    }
  };

  const syncFromOps = async () => {
    setSyncStatus({ syncing: true, result: null });
    try {
      const response = await api.post('/sync-diagnostic/sync-conteneurs');
      setSyncStatus({ syncing: false, result: response.data });
      if (response.data.success) {
        toast.success(response.data.message || 'Synchronisation réussie');
        // Rafraîchir les données après sync
        onRefresh?.();
      }
    } catch (error: any) {
      setSyncStatus({ 
        syncing: false, 
        result: { 
          success: false, 
          error: error.response?.data?.message || error.message || 'Erreur de synchronisation'
        } 
      });
      toast.error('Erreur lors de la synchronisation');
    }
  };

  const getStatusBadge = () => {
    if (data.queryStatus?.isLoading || data.queryStatus?.isRefetching) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700"><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Chargement</Badge>;
    }
    if (data.error || data.queryStatus?.isError) {
      return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Erreur</Badge>;
    }
    if (data.response) {
      return <Badge variant="outline" className="bg-green-50 text-green-700"><Check className="h-3 w-3 mr-1" /> 200 OK</Badge>;
    }
    return <Badge variant="secondary">En attente</Badge>;
  };

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  return (
    <Card className="border-dashed border-orange-300 bg-orange-50/50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto hover:bg-transparent">
                <Bug className="h-4 w-4 text-orange-600" />
                <CardTitle className="text-sm font-medium text-orange-800">{title}</CardTitle>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              {data.duration && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {data.duration}ms
                </Badge>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
              {onRefresh && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* API Endpoint */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Endpoint</p>
              <code className="text-xs bg-background px-2 py-1 rounded border block">
                GET {data.apiUrl || '/conteneurs-en-attente'}
              </code>
            </div>

            {/* Timestamp */}
            {data.timestamp && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Dernière requête</p>
                <p className="text-xs">{data.timestamp}</p>
              </div>
            )}

            {/* Request */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Paramètres requête</p>
              <pre className="text-xs bg-background p-2 rounded border overflow-x-auto max-h-24">
                {formatJson(data.request || {})}
              </pre>
            </div>

            {/* Response */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Réponse {data.response?.data?.length !== undefined && `(${data.response.data.length} éléments)`}
              </p>
              <pre className="text-xs bg-background p-2 rounded border overflow-x-auto max-h-48">
                {data.error 
                  ? formatJson({ error: data.error.message || data.error })
                  : formatJson(data.response || 'Aucune réponse')
                }
              </pre>
            </div>

            {/* Stats */}
            {data.stats && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Stats</p>
                <pre className="text-xs bg-background p-2 rounded border overflow-x-auto max-h-24">
                  {formatJson(data.stats)}
                </pre>
              </div>
            )}

            {/* OPS Connection Test */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Test Logistiga OPS</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={testOpsConnection}
                  disabled={opsStatus.testing}
                  className="h-7 text-xs"
                >
                  {opsStatus.testing ? (
                    <><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Test en cours...</>
                  ) : (
                    <><Wifi className="h-3 w-3 mr-1" /> Tester connexion OPS</>
                  )}
                </Button>
              </div>
              
              {opsStatus.result && (
                <div className={`p-2 rounded border text-xs ${
                  opsStatus.result.success 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {opsStatus.result.success ? (
                      <><Wifi className="h-3 w-3" /> Connecté</>
                    ) : (
                      <><WifiOff className="h-3 w-3" /> Non connecté</>
                    )}
                  </div>
                  <pre className="overflow-x-auto">
                    {formatJson(opsStatus.result)}
                  </pre>
                </div>
              )}
            </div>

            {/* Sync from OPS */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Importer depuis OPS</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={syncFromOps}
                  disabled={syncStatus.syncing}
                  className="h-7 text-xs"
                >
                  {syncStatus.syncing ? (
                    <><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Synchronisation...</>
                  ) : (
                    <><Download className="h-3 w-3 mr-1" /> Récupérer conteneurs OPS</>
                  )}
                </Button>
              </div>
              
              {syncStatus.result && (
                <div className={`p-2 rounded border text-xs ${
                  syncStatus.result.success 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <pre className="overflow-x-auto">
                    {formatJson(syncStatus.result)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
