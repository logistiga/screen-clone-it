import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Send, Loader2, Sparkles, RefreshCw, Ship, Package, TrendingUp, Wallet, AlertTriangle, Users, Truck, FileText, BarChart3 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { aiService, type AiMessage } from "@/services/aiService";
import { cn } from "@/lib/utils";

interface SuggestionCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  suggestions: { label: string; message: string }[];
}

const SUGGESTION_CATEGORIES: SuggestionCategory[] = [
  {
    id: "general",
    label: "Général",
    icon: Sparkles,
    suggestions: [
      { label: "📊 Résumé du mois", message: "Fais-moi un résumé complet des performances de ce mois : chiffre d'affaires, nombre d'ordres, conteneurs traités, et tendances par rapport au mois précédent." },
      { label: "📈 Prédictions CA", message: "Analyse prédictive du chiffre d'affaires pour les 3 prochains mois basée sur les tendances actuelles." },
      { label: "🎯 KPI critiques", message: "Quels sont les KPI critiques à surveiller cette semaine ? Y a-t-il des indicateurs en zone de danger ?" },
    ],
  },
  {
    id: "conteneurs",
    label: "Conteneurs",
    icon: Package,
    suggestions: [
      { label: "📦 Conteneurs en attente", message: "Combien de conteneurs sont actuellement en attente de traitement ? Quels sont les plus anciens et les plus urgents ?" },
      { label: "🔄 Statut sync OPS", message: "Quel est l'état de la synchronisation avec OPS ? Combien de conteneurs ont été importés aujourd'hui et cette semaine ?" },
      { label: "⚠️ Anomalies conteneurs", message: "Y a-t-il des anomalies détectées sur les conteneurs ? Des conteneurs oubliés ou des écarts entre OPS et nos données locales ?" },
      { label: "📊 Taux rotation", message: "Quel est le taux de rotation moyen des conteneurs au port d'Owendo ? Quels armateurs ont les rotations les plus lentes ?" },
    ],
  },
  {
    id: "logistique",
    label: "Logistique",
    icon: Truck,
    suggestions: [
      { label: "🚚 Flotte camions", message: "Quel est l'état actuel de la flotte de 40 camions ? Combien sont opérationnels, en maintenance ou en panne ?" },
      { label: "🚢 Top armateurs", message: "Quels sont les 5 armateurs avec le plus de mouvements ce mois-ci ? Y a-t-il de nouveaux armateurs détectés par la sync OPS ?" },
      { label: "📋 Ordres en retard", message: "Combien d'ordres de travail sont en retard ou en attente depuis plus de 48h ? Quels clients sont impactés ?" },
      { label: "🏗️ Opérations Owendo", message: "Résumé des opérations au port d'Owendo aujourd'hui : arrivées, sorties, manutentions en cours." },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: Wallet,
    suggestions: [
      { label: "💰 Trésorerie", message: "Quel est l'état actuel de ma trésorerie ? Solde caisse espèces, solde banque, et prévisions pour la fin du mois." },
      { label: "📋 Factures impayées", message: "Liste les factures impayées classées par ancienneté. Quel est le montant total des créances et quels clients sont les plus en retard ?" },
      { label: "💳 Notes de débit", message: "Résumé des notes de débit du mois : ouvertures de port, détentions, réparations. Montant total et répartition par type." },
      { label: "📊 Rentabilité clients", message: "Quels sont mes 10 meilleurs clients en termes de CA ? Y a-t-il des clients non rentables à identifier ?" },
    ],
  },
  {
    id: "risques",
    label: "Risques",
    icon: AlertTriangle,
    suggestions: [
      { label: "⚠️ Clients à risque", message: "Quels sont les clients à risque avec des factures impayées depuis plus de 30 jours ? Propose un plan de recouvrement priorisé." },
      { label: "🔴 Surestaries", message: "Y a-t-il des conteneurs en surestarie ou proches de la limite de franchise ? Quel est le coût estimé des pénalités ?" },
      { label: "📉 Tendances négatives", message: "Y a-t-il des tendances négatives dans les données : baisse de CA, augmentation des impayés, hausse des anomalies ?" },
      { label: "🛡️ Audit récent", message: "Résumé des dernières actions d'audit : connexions suspectes, modifications inhabituelles, tentatives d'accès non autorisées." },
    ],
  },
];

interface AiChatProps {
  sessionId?: string;
  onNewSession: () => void;
}

export const AiChat = ({ sessionId: initialSessionId, onNewSession }: AiChatProps) => {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);
  const [activeCategory, setActiveCategory] = useState("general");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (initialSessionId) {
      setSessionId(initialSessionId);
      aiService.getSessionMessages(initialSessionId).then(setMessages).catch(() => {});
    }
  }, [initialSessionId]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: AiMessage = { role: "user", content: content.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await aiService.chat(content.trim(), sessionId);
      setSessionId(response.session_id);
      setMessages(prev => [...prev, { role: "assistant", content: response.message }]);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Erreur inconnue";
      toast({ title: "Erreur IA", description: errMsg, variant: "destructive" });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const resetChat = () => {
    setMessages([]);
    setSessionId(undefined);
    setInput("");
    onNewSession();
  };

  const currentCategory = SUGGESTION_CATEGORIES.find(c => c.id === activeCategory) || SUGGESTION_CATEGORIES[0];

  return (
    <Card className="flex flex-col h-full overflow-hidden border-border">
      {/* Header */}
      {messages.length > 0 && (
        <div className="flex justify-end p-2 border-b border-border">
          <Button variant="outline" size="sm" onClick={resetChat}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Nouvelle conversation
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
            <div className="p-4 rounded-full bg-primary/10">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <div className="text-center max-w-lg">
              <h2 className="text-lg font-semibold text-foreground mb-1">Assistant IA LogistiGA</h2>
              <p className="text-sm text-muted-foreground">
                Expert en gestion portuaire, conteneurs et logistique au Gabon.
                Analysez vos données métier en temps réel.
              </p>
            </div>

            {/* Category tabs */}
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full max-w-2xl">
              <TabsList className="w-full flex-wrap h-auto gap-1 bg-transparent p-0 justify-center">
                {SUGGESTION_CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <TabsTrigger
                      key={cat.id}
                      value={cat.id}
                      className="gap-1.5 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {cat.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>

            {/* Suggestions for active category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl">
              {currentCategory.suggestions.map((s) => (
                <button
                  key={s.label}
                  onClick={() => sendMessage(s.message)}
                  className="text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {s.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {s.message}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "assistant" && (
                  <div className="shrink-0 mt-1 p-1.5 rounded-md bg-primary/10">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={cn(
                  "rounded-lg px-4 py-3 max-w-[80%] text-sm",
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                )}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="shrink-0 mt-1 p-1.5 rounded-md bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyse en cours...
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border p-4">
        {messages.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {[
              { label: "📦 Conteneurs", message: "Quel est l'état actuel des conteneurs en attente ?" },
              { label: "💰 Trésorerie", message: "Résumé de la trésorerie du jour." },
              { label: "📋 Impayés", message: "Liste les factures impayées avec plan de recouvrement." },
              { label: "🚚 Flotte", message: "Statut de la flotte de camions." },
            ].map((s) => (
              <Badge key={s.label} variant="outline" className="cursor-pointer hover:bg-primary/10 text-xs py-1" onClick={() => sendMessage(s.message)}>
                {s.label}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex: Combien de conteneurs sont en surestarie cette semaine ?"
            className="min-h-[44px] max-h-[120px] resize-none"
            disabled={isLoading}
            rows={1}
          />
          <Button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} size="icon" className="shrink-0 h-[44px] w-[44px]">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
