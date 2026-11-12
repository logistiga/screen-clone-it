import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isValid, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { fetchMcpKeys, revokeMcpKey, type McpKeyStatut } from "@/services/api/mcp-keys.api";
import { CopyField } from "./CopyField";
import { CreateMcpKeyDialog } from "./CreateMcpKeyDialog";

const fmt = (v: string | null) => {
  if (!v) return "—";
  const d = parseISO(v);
  return isValid(d) ? format(d, "dd/MM/yyyy HH:mm", { locale: fr }) : "—";
};

const STATUTS: Record<McpKeyStatut, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  active: { label: "Active", variant: "default" },
  expiree: { label: "Expirée", variant: "secondary" },
  revoquee: { label: "Révoquée", variant: "destructive" },
};

export const McpKeysPanel = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading, isError } = useQuery({ queryKey: ["mcp-keys"], queryFn: fetchMcpKeys });
  const refresh = () => qc.invalidateQueries({ queryKey: ["mcp-keys"] });
  const revoke = useMutation({
    mutationFn: revokeMcpKey,
    onSuccess: () => { refresh(); toast({ title: "Clé révoquée", description: "Elle sera refusée dans moins d'une minute." }); },
    onError: () => toast({ title: "Erreur", description: "Révocation impossible.", variant: "destructive" }),
  });
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-5 w-5 text-primary" />Connexion des IA et agents (MCP)</CardTitle>
          <CardDescription>
            Une clé donne un accès <strong>en lecture seule</strong> (clients, devis, OT, factures, paiements, statistiques). Aucune IA ne peut créer, modifier ou supprimer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <CopyField label="Adresse du serveur MCP" value={meta?.server_url ?? "https://facturation.logistiga.pro/mcp-logistiga/mcp"} />
          <CopyField label="Test de fonctionnement" value={meta?.health_url ?? "https://facturation.logistiga.pro/mcp-logistiga/health"} />
          <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
            <li><strong>ChatGPT</strong> : Paramètres → Connecteurs → Créer. Collez l'URL ChatGPT fournie à la création, authentification « Aucune ».</li>
            <li><strong>Claude, n8n, scripts</strong> : utilisez l'adresse du serveur et le header <code>Authorization: Bearer &lt;clé&gt;</code>.</li>
            <li>Une clé par IA ou agent, pour pouvoir en révoquer une sans couper les autres.</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><KeyRound className="h-5 w-5" />Clés d'accès</CardTitle>
            <CardDescription>La clé complète n'est affichée qu'une seule fois, à la création.</CardDescription>
          </div>
          <CreateMcpKeyDialog meta={meta} onCreated={refresh} />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : isError ? (
            <p className="py-6 text-center text-sm text-destructive">Impossible de charger les clés.</p>
          ) : !data?.data.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Aucune clé créée.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead><TableHead>Clé</TableHead><TableHead>Statut</TableHead>
                    <TableHead>Créée le</TableHead><TableHead>Expire le</TableHead><TableHead>Dernière utilisation</TableHead><TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell><div className="font-medium">{k.name}</div>{k.description && <div className="text-xs text-muted-foreground">{k.description}</div>}</TableCell>
                      <TableCell><code className="text-xs">{k.key_prefix}…</code></TableCell>
                      <TableCell><Badge variant={STATUTS[k.statut].variant}>{STATUTS[k.statut].label}</Badge></TableCell>
                      <TableCell className="text-xs">{fmt(k.created_at)}</TableCell>
                      <TableCell className="text-xs">{k.expires_at ? fmt(k.expires_at) : "Jamais"}</TableCell>
                      <TableCell className="text-xs">{fmt(k.last_used_at)}</TableCell>
                      <TableCell className="text-right">
                        {k.statut === "active" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button size="sm" variant="outline">Révoquer</Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Révoquer « {k.name} » ?</AlertDialogTitle>
                                <AlertDialogDescription>L'IA ou l'agent qui utilise cette clé perdra l'accès. Action définitive.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => revoke.mutate(k.id)}>Révoquer</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
