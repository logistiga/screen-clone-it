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
  { label: "📊 Résumé du mois", message: "Fais-moi un résumé complet des performances de ce mois : chiffre d'affaires, paiements reçus, factures impayées, état de la trésorerie." },
  { label: "⚠️ Clients à risque", message: "Quels sont les clients à risque ? Identifie ceux qui ont des factures impayées ou en retard et recommande des actions de relance." },
  { label: "💰 État trésorerie", message: "Quel est l'état actuel de ma trésorerie ? Analyse les entrées et sorties du mois et donne-moi des recommandations." },
  { label: "📋 Factures impayées", message: "Liste-moi toutes les factures impayées avec les montants et les clients concernés. Propose un plan de recouvrement." },
  { label: "📈 Prédictions CA", message: "Quelles sont les tendances de mon chiffre d'affaires ? Fais une analyse prédictive basée sur les données disponibles." },
];

const AiAssistant = () => {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: AiMessage = { role: "user", content: content.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await aiService.chat(updatedMessages);
      setMessages(prev => [...prev, { role: "assistant", content: response.message }]);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Erreur inconnue";
      toast({
        title: "Erreur IA",
        description: errMsg,
        variant: "destructive",
      });
      // Remove the user message on error
      setMessages(messages);
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
    setInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto p-4 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Assistant IA</h1>
            <p className="text-sm text-muted-foreground">
              Analyse, prédictions et recommandations pour votre activité
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={resetChat}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Nouvelle conversation
          </Button>
        )}
      </div>

      {/* Chat area */}
      <Card className="flex-1 flex flex-col overflow-hidden border-border">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 py-12">
              <div className="p-4 rounded-full bg-primary/10">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <div className="text-center max-w-md">
                <h2 className="text-lg font-semibold text-foreground mb-2">
                  Bienvenue dans l'Assistant IA
                </h2>
                <p className="text-sm text-muted-foreground">
                  Posez vos questions sur vos données métier : clients, factures, trésorerie, performances...
                  L'IA analyse vos données en temps réel.
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
                <div
                  key={i}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="shrink-0 mt-1 p-1.5 rounded-md bg-primary/10">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-lg px-4 py-3 max-w-[80%] text-sm",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}
                  >
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
                <Badge
                  key={s.label}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 text-xs py-1"
                  onClick={() => sendMessage(s.message)}
                >
                  {s.label}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question..."
              className="min-h-[44px] max-h-[120px] resize-none"
              disabled={isLoading}
              rows={1}
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="shrink-0 h-[44px] w-[44px]"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AiAssistant;
