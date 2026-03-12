import { useState, useEffect } from "react";
import { Clock, MessageSquare, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { aiService, type AiSession } from "@/services/aiService";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AiHistoryProps {
  onLoadSession: (sessionId: string) => void;
}

export const AiHistory = ({ onLoadSession }: AiHistoryProps) => {
  const [sessions, setSessions] = useState<AiSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aiService.getSessions()
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Clock className="h-10 w-10 mb-3" />
        <p>Aucune conversation précédente</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-2xl">
      {sessions.map((s) => (
        <Card key={s.session_id} className="hover:bg-muted/50 transition-colors">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Session du {format(new Date(s.started_at), "dd MMM yyyy à HH:mm", { locale: fr })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {s.message_count} messages · Dernier: {format(new Date(s.last_message_at), "HH:mm", { locale: fr })}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => onLoadSession(s.session_id)}>
              Reprendre
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
