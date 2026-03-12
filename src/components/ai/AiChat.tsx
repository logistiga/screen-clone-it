import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Send, Loader2, Sparkles, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { aiService, type AiMessage } from "@/services/aiService";
import { cn } from "@/lib/utils";

const QUICK_SUGGESTIONS = [
  { label: "📊 Résumé du mois", message: "Fais-moi un résumé complet des performances de ce mois." },
  { label: "⚠️ Clients à risque", message: "Quels sont les clients à risque avec des factures impayées ?" },
  { label: "💰 Trésorerie", message: "Quel est l'état actuel de ma trésorerie ?" },
  { label: "📋 Factures impayées", message: "Liste les factures impayées avec un plan de recouvrement." },
  { label: "📈 Prédictions CA", message: "Analyse prédictive du chiffre d'affaires." },
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load session messages if sessionId provided
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
      setMessages(prev => prev.slice(0, -1)); // Remove user msg on error
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
          <div className="flex flex-col items-center justify-center h-full gap-6 py-12">
            <div className="p-4 rounded-full bg-primary/10">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
            <div className="text-center max-w-md">
              <h2 className="text-lg font-semibold text-foreground mb-2">Bienvenue dans l'Assistant IA</h2>
              <p className="text-sm text-muted-foreground">
                Posez vos questions sur vos données métier. L'IA analyse vos données en temps réel.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {QUICK_SUGGESTIONS.map((s) => (
                <Badge
                  key={s.label}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 hover:border-primary transition-colors py-2 px-3 text-sm"
                  onClick={() => sendMessage(s.message)}
                >
                  {s.label}
                </Badge>
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
            {QUICK_SUGGESTIONS.slice(0, 3).map((s) => (
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
            placeholder="Posez votre question..."
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
