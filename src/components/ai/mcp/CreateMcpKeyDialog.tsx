import { useState } from "react";
import { AlertTriangle, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createMcpKey, type CreateMcpKeyInput, type McpKeysMeta } from "@/services/api/mcp-keys.api";
import { CopyField } from "./CopyField";

const EXPIRATIONS = [
  { value: "none", label: "Jamais" },
  { value: "30", label: "30 jours" },
  { value: "90", label: "90 jours" },
  { value: "180", label: "6 mois" },
  { value: "365", label: "1 an" },
];

export const CreateMcpKeyDialog = ({ meta, onCreated }: { meta?: McpKeysMeta; onCreated: () => void }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [expiration, setExpiration] = useState("none");
  const [saving, setSaving] = useState(false);
  const [plainKey, setPlainKey] = useState<string | null>(null);
  const { toast } = useToast();

  const reset = () => { setName(""); setDescription(""); setExpiration("none"); setPlainKey(null); };

  const submit = async () => {
    if (name.trim().length < 2) return;
    setSaving(true);
    try {
      const input: CreateMcpKeyInput = { name: name.trim(), description: description.trim() || undefined };
      if (expiration !== "none") input.expires_in_days = Number(expiration) as CreateMcpKeyInput["expires_in_days"];
      const res = await createMcpKey(input);
      setPlainKey(res.plain_key);
      onCreated();
    } catch {
      toast({ title: "Erreur", description: "La clé n'a pas pu être créée.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const base = meta?.server_url ?? "https://facturation.logistiga.pro/mcp-logistiga/mcp";

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button className="gap-1.5"><Plus className="h-4 w-4" />Nouvelle clé</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{plainKey ? "Clé créée" : "Nouvelle clé MCP"}</DialogTitle>
          <DialogDescription>
            {plainKey ? "Copiez la clé maintenant : elle ne sera plus jamais affichée." : "Accès en lecture seule aux données LOGISTIGA pour une IA ou un agent."}
          </DialogDescription>
        </DialogHeader>

        {plainKey ? (
          <div className="space-y-3">
            <div className="flex gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Conservez-la dans un endroit sûr. En cas de perte, révoquez-la et créez-en une nouvelle.
            </div>
            <CopyField label="Clé d'accès" value={plainKey} />
            <CopyField label="URL ChatGPT (authentification : Aucune)" value={base.replace(/\/mcp$/, `/k/${plainKey}/mcp`)} />
            <CopyField label="URL autres clients (Claude, n8n, scripts)" value={base} />
            <CopyField label="Header à envoyer" value={`Authorization: Bearer ${plainKey}`} />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="mcp-name">Nom *</Label>
              <Input id="mcp-name" value={name} maxLength={100} placeholder="Ex. ChatGPT Omar, Agent n8n" onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="mcp-desc">Usage (facultatif)</Label>
              <Input id="mcp-desc" value={description} maxLength={255} placeholder="Ex. Suivi des impayés" onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Expiration</Label>
              <Select value={expiration} onValueChange={setExpiration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPIRATIONS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          {plainKey ? (
            <Button onClick={() => setOpen(false)}>J'ai copié la clé</Button>
          ) : (
            <Button onClick={submit} disabled={saving || name.trim().length < 2}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Créer la clé
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
