import { useState, useEffect } from "react";
import { Save, TestTube, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { aiService, type AiSettingData, type AiProvider } from "@/services/aiService";

export const AiSettings = () => {
  const [providers, setProviders] = useState<Record<string, AiProvider>>({});
  const [form, setForm] = useState<Partial<AiSettingData> & { api_key?: string }>({
    provider: 'ollama',
    api_url: '',
    model: 'mistral:7b',
    max_context_length: 20,
    system_prompt: '',
    extra_config: { temperature: 0.7, max_tokens: 2000 },
  });
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    aiService.getSettings().then(({ setting, providers: p }) => {
      setProviders(p);
      if (setting) {
        setForm({
          provider: setting.provider,
          api_url: setting.api_url || '',
          model: setting.model,
          max_context_length: setting.max_context_length,
          system_prompt: setting.system_prompt || '',
          extra_config: setting.extra_config || { temperature: 0.7, max_tokens: 2000 },
        });
      }
    }).catch(() => {
      toast({ title: "Erreur", description: "Impossible de charger les paramètres.", variant: "destructive" });
    }).finally(() => setLoading(false));
  }, []);

  const currentProvider = providers[form.provider || 'ollama'];

  const handleSave = async () => {
    setSaving(true);
    try {
      await aiService.updateSettings({ ...form, api_key: apiKey || undefined });
      toast({ title: "Succès", description: "Paramètres IA mis à jour." });
      setApiKey('');
    } catch {
      toast({ title: "Erreur", description: "Impossible de sauvegarder.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await aiService.testConnection();
      setTestResult({
        success: result.success,
        message: result.success ? `Connexion OK: "${result.response}"` : result.error || 'Erreur inconnue',
      });
    } catch {
      setTestResult({ success: false, message: 'Erreur de communication.' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Provider IA</CardTitle>
          <CardDescription>Choisis ton provider IA pour les réponses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={form.provider} onValueChange={(v) => {
              const p = providers[v];
              setForm(f => ({ ...f, provider: v, model: p?.models[0] || '', api_url: v === 'ollama' ? 'http://187.124.38.130:11434' : '' }));
            }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(providers).map(([key, p]) => (
                  <SelectItem key={key} value={key}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Modèle</Label>
            <Select value={form.model} onValueChange={(v) => setForm(f => ({ ...f, model: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {currentProvider?.models.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.provider === 'ollama' && (
            <div className="space-y-2">
              <Label>URL Ollama</Label>
              <Input value={form.api_url || ''} onChange={(e) => setForm(f => ({ ...f, api_url: e.target.value }))} placeholder="http://187.124.38.130:11434" />
            </div>
          )}

          {currentProvider?.needs_key && (
            <div className="space-y-2">
              <Label>Clé API {currentProvider.label}</Label>
              <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-... (laisser vide pour garder l'existante)" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Longueur du contexte (derniers messages)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[form.max_context_length || 20]}
                onValueChange={([v]) => setForm(f => ({ ...f, max_context_length: v }))}
                min={5} max={100} step={5}
                className="flex-1"
              />
              <span className="text-sm font-medium w-8 text-right">{form.max_context_length}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Température ({((form.extra_config as Record<string, number>)?.temperature ?? 0.7).toFixed(1)})</Label>
            <Slider
              value={[((form.extra_config as Record<string, number>)?.temperature ?? 0.7)]}
              onValueChange={([v]) => setForm(f => ({ ...f, extra_config: { ...f.extra_config as Record<string, unknown>, temperature: v } }))}
              min={0} max={1} step={0.1}
            />
          </div>

          <div className="space-y-2">
            <Label>Max tokens</Label>
            <Input
              type="number"
              value={(form.extra_config as Record<string, number>)?.max_tokens ?? 2000}
              onChange={(e) => setForm(f => ({ ...f, extra_config: { ...f.extra_config as Record<string, unknown>, max_tokens: parseInt(e.target.value) || 2000 } }))}
              min={100} max={8000}
            />
          </div>
        </CardContent>
      </Card>

      {/* System Prompt */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Prompt système</CardTitle>
          <CardDescription>Instructions de base pour l'assistant IA</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={form.system_prompt || ''}
            onChange={(e) => setForm(f => ({ ...f, system_prompt: e.target.value }))}
            rows={6}
            placeholder="Tu es l'assistant IA de Logistiga..."
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Sauvegarder
        </Button>
        <Button variant="outline" onClick={handleTest} disabled={testing}>
          {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TestTube className="h-4 w-4 mr-2" />}
          Tester la connexion
        </Button>
      </div>

      {testResult && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${testResult.success ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-destructive/10 text-destructive'}`}>
          {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {testResult.message}
        </div>
      )}
    </div>
  );
};
