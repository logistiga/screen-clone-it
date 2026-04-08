import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Eye, FileText, Globe, Monitor, XCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getActionConfig, getModuleLabel } from "./constants";
import type { AuditEntry } from "@/services/auditService";

interface TracabiliteDetailModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  audit: AuditEntry | null;
}

const formatDateTime = (dateStr: string) => { try { return format(new Date(dateStr), "dd/MM/yyyy HH:mm:ss", { locale: fr }); } catch { return dateStr; } };

export function TracabiliteDetailModal({ open, onOpenChange, audit }: TracabiliteDetailModalProps) {
  if (!audit) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-primary" />Détail de l'action</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wide">Date & Heure</p><p className="font-medium">{formatDateTime(audit.created_at)}</p></div>
              <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wide">Utilisateur</p><p className="font-medium">{audit.user?.name || "Système"}</p></div>
              <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wide">Action</p><Badge className={getActionConfig(audit.action).color}>{getActionConfig(audit.action).label}</Badge></div>
              <div className="space-y-1"><p className="text-xs text-muted-foreground uppercase tracking-wide">Module</p><Badge variant="outline">{getModuleLabel(audit.module)}</Badge></div>
            </div>
            <Separator />

            {audit.document_numero && (
              <>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Document</p>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div><p className="font-mono font-medium">{audit.document_numero}</p><p className="text-xs text-muted-foreground">{audit.document_type} #{audit.document_id}</p></div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {audit.details && (
              <>
                <div className="space-y-2"><p className="text-xs text-muted-foreground uppercase tracking-wide">Détails</p><p className="text-sm bg-muted/50 p-3 rounded-lg">{audit.details}</p></div>
                <Separator />
              </>
            )}

            {(audit.old_values || audit.new_values) && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Modifications</p>
                <div className="grid grid-cols-2 gap-4">
                  {audit.old_values && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-red-600 flex items-center gap-1"><XCircle className="h-4 w-4" />Anciennes valeurs</p>
                      <pre className="text-xs bg-red-50 dark:bg-red-900/20 p-3 rounded-lg overflow-auto max-h-48">{JSON.stringify(audit.old_values, null, 2)}</pre>
                    </div>
                  )}
                  {audit.new_values && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" />Nouvelles valeurs</p>
                      <pre className="text-xs bg-green-50 dark:bg-green-900/20 p-3 rounded-lg overflow-auto max-h-48">{JSON.stringify(audit.new_values, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator />
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Informations techniques</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">IP:</span><code className="bg-muted px-1.5 py-0.5 rounded text-xs">{audit.ip_address || "N/A"}</code></div>
                <div className="flex items-center gap-2"><Monitor className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">ID:</span><code className="bg-muted px-1.5 py-0.5 rounded text-xs">#{audit.id}</code></div>
              </div>
              {audit.user_agent && <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded overflow-x-auto">{audit.user_agent}</div>}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
