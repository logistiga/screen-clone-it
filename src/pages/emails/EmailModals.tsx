import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Mail, Eye, Zap, Send, Check, TestTube, Loader2 } from "lucide-react";
import type { EmailTemplate, EmailAutomation } from "@/services/emailService";

const typeLabels: Record<string, { label: string }> = {
  devis: { label: "Devis" }, ordre: { label: "Ordre de travail" }, facture: { label: "Facture" },
  relance: { label: "Relance" }, confirmation: { label: "Confirmation" },
  notification: { label: "Notification" }, custom: { label: "Personnalisé" },
};

interface TemplateModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isEditing: boolean;
  form: Partial<EmailTemplate>;
  onFormChange: (f: Partial<EmailTemplate>) => void;
  onSave: () => void;
  isPending: boolean;
}

export function TemplateModal({ open, onOpenChange, isEditing, form, onFormChange, onSave, isPending }: TemplateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" />{isEditing ? "Modifier le modèle" : "Nouveau modèle d'email"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nom du modèle *</Label>
              <Input value={form.nom || ""} onChange={e => onFormChange({ ...form, nom: e.target.value })} placeholder="Ex: Envoi de devis" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={value => onFormChange({ ...form, type: value as EmailTemplate["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(typeLabels).map(([key, { label }]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Objet de l'email *</Label>
            <Input value={form.objet || ""} onChange={e => onFormChange({ ...form, objet: e.target.value })} placeholder="Ex: Votre devis {{numero_devis}}" />
          </div>
          <div className="space-y-2">
            <Label>Contenu de l'email *</Label>
            <Textarea value={form.contenu || ""} onChange={e => onFormChange({ ...form, contenu: e.target.value })} rows={12} placeholder="Rédigez le contenu de l'email..." />
            <p className="text-xs text-muted-foreground">Utilisez {`{{variable}}`} pour insérer des données dynamiques.</p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Switch checked={form.actif || false} onCheckedChange={checked => onFormChange({ ...form, actif: checked })} />
            <Label>Modèle actif</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={onSave} className="gap-2" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {isEditing ? "Enregistrer" : "Créer le modèle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface PreviewModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template: EmailTemplate | null;
  previewData: { objet: string; contenu: string } | null;
}

export function PreviewModal({ open, onOpenChange, template, previewData }: PreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-primary" />Aperçu: {template?.nom}</DialogTitle></DialogHeader>
        {template && (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Objet:</p>
              <p className="font-medium">{previewData?.objet || template.objet}</p>
            </div>
            <div className="p-4 border rounded-lg bg-card">
              <p className="text-sm text-muted-foreground mb-2">Contenu:</p>
              <pre className="whitespace-pre-wrap text-sm font-sans">{previewData?.contenu || template.contenu}</pre>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Variables disponibles:</p>
              <div className="flex flex-wrap gap-2">
                {(template.variables || []).map(v => <Badge key={v} variant="outline" className="bg-primary/10">{`{{${v}}}`}</Badge>)}
              </div>
            </div>
          </div>
        )}
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Fermer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AutomationModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isEditing: boolean;
  form: Partial<EmailAutomation>;
  onFormChange: (f: Partial<EmailAutomation>) => void;
  onSave: () => void;
  isPending: boolean;
  templates: EmailTemplate[];
  declencheurs: Record<string, string> | undefined;
  delaiUnites: Record<string, string> | undefined;
}

export function AutomationModal({ open, onOpenChange, isEditing, form, onFormChange, onSave, isPending, templates, declencheurs, delaiUnites }: AutomationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" />{isEditing ? "Modifier l'automatisation" : "Nouvelle automatisation"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nom *</Label>
            <Input value={form.nom || ""} onChange={e => onFormChange({ ...form, nom: e.target.value })} placeholder="Ex: Envoi automatique facture" />
          </div>
          <div className="space-y-2">
            <Label>Déclencheur</Label>
            <Select value={form.declencheur} onValueChange={v => onFormChange({ ...form, declencheur: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{declencheurs && Object.entries(declencheurs).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Modèle d'email *</Label>
            <Select value={form.template_id?.toString()} onValueChange={v => onFormChange({ ...form, template_id: parseInt(v) })}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un modèle" /></SelectTrigger>
              <SelectContent>{templates.filter(t => t.actif).map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.nom}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Délai</Label>
              <Input type="number" min="0" value={form.delai || 0} onChange={e => onFormChange({ ...form, delai: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <Label>Unité</Label>
              <Select value={form.delai_unite} onValueChange={v => onFormChange({ ...form, delai_unite: v as EmailAutomation["delai_unite"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{delaiUnites && Object.entries(delaiUnites).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Conditions (optionnel)</Label>
            <Textarea value={form.conditions || ""} onChange={e => onFormChange({ ...form, conditions: e.target.value })} placeholder="Description des conditions d'envoi..." rows={2} />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Switch checked={form.actif || false} onCheckedChange={checked => onFormChange({ ...form, actif: checked })} />
            <Label>Automatisation active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={onSave} className="gap-2" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {isEditing ? "Enregistrer" : "Créer l'automatisation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface TestEmailModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  testEmail: string;
  onTestEmailChange: (v: string) => void;
  testTemplateId: number | null;
  onTestTemplateIdChange: (v: number | null) => void;
  onSend: () => void;
  isPending: boolean;
  templates: EmailTemplate[];
}

export function TestEmailModal({ open, onOpenChange, testEmail, onTestEmailChange, testTemplateId, onTestTemplateIdChange, onSend, isPending, templates }: TestEmailModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle className="flex items-center gap-2"><TestTube className="h-5 w-5 text-primary" />Envoyer un email de test</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Modèle à tester *</Label>
            <Select value={testTemplateId?.toString() || ""} onValueChange={v => onTestTemplateIdChange(parseInt(v))}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un modèle" /></SelectTrigger>
              <SelectContent>{templates.filter(t => t.actif).map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.nom}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Adresse email de test *</Label>
            <Input type="email" value={testEmail} onChange={e => onTestEmailChange(e.target.value)} placeholder="test@example.com" />
          </div>
          <p className="text-sm text-muted-foreground">Un email sera envoyé avec des données de test pour vérifier le rendu du modèle.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={onSend} disabled={isPending} className="gap-2">
            {isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Envoi en cours...</> : <><Send className="h-4 w-4" />Envoyer le test</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
