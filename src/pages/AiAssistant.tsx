import { useState } from "react";
import { Bot, Settings2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AiChat } from "@/components/ai/AiChat";
import { AiSettings } from "@/components/ai/AiSettings";
import { AiHistory } from "@/components/ai/AiHistory";

const AiAssistant = () => {
  const [activeTab, setActiveTab] = useState("chat");
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();

  const handleLoadSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setActiveTab("chat");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto p-4 gap-4">
      {/* Header */}
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="w-fit">
          <TabsTrigger value="chat" className="gap-1.5">
            <Bot className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <Settings2 className="h-4 w-4" />
            Historique
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings2 className="h-4 w-4" />
            Paramètres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 overflow-hidden mt-3">
          <AiChat sessionId={currentSessionId} onNewSession={() => setCurrentSessionId(undefined)} />
        </TabsContent>

        <TabsContent value="history" className="flex-1 overflow-hidden mt-3">
          <AiHistory onLoadSession={handleLoadSession} />
        </TabsContent>

        <TabsContent value="settings" className="flex-1 overflow-auto mt-3">
          <AiSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AiAssistant;
