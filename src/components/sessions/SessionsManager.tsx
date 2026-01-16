import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe, 
  Clock, 
  Shield, 
  Trash2, 
  LogOut,
  RefreshCw,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  getSessions, 
  revokeSession, 
  revokeOtherSessions,
  Session,
  SessionStats 
} from '@/lib/sessions';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const DeviceIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'mobile':
      return <Smartphone className="h-5 w-5" />;
    case 'tablet':
      return <Tablet className="h-5 w-5" />;
    default:
      return <Monitor className="h-5 w-5" />;
  }
};

interface SessionCardProps {
  session: Session;
  onRevoke: (id: number) => void;
  isRevoking: boolean;
}

const SessionCard = ({ session, onRevoke, isRevoking }: SessionCardProps) => {
  const lastActive = session.last_active_at 
    ? formatDistanceToNow(new Date(session.last_active_at), { addSuffix: true, locale: fr })
    : 'Jamais';

  const createdAt = formatDistanceToNow(new Date(session.created_at), { addSuffix: true, locale: fr });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`p-4 rounded-lg border ${
        session.is_current 
          ? 'border-primary bg-primary/5' 
          : session.is_expired 
            ? 'border-destructive/50 bg-destructive/5' 
            : 'border-border bg-card'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${
            session.is_current 
              ? 'bg-primary/10 text-primary' 
              : session.is_expired 
                ? 'bg-destructive/10 text-destructive' 
                : 'bg-muted text-muted-foreground'
          }`}>
            <DeviceIcon type={session.device_type} />
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{session.browser}</span>
              {session.is_current && (
                <Badge variant="default" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Session actuelle
                </Badge>
              )}
              {session.is_expired && !session.is_current && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Expirée
                </Badge>
              )}
            </div>
            
            <div className="text-sm text-muted-foreground space-y-0.5">
              <div className="flex items-center gap-1">
                <Monitor className="h-3 w-3" />
                {session.platform}
              </div>
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {session.ip_address || 'IP inconnue'}
                {session.location && ` • ${session.location}`}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Dernière activité: {lastActive}
              </div>
              <div className="text-xs text-muted-foreground/70">
                Créée {createdAt}
              </div>
            </div>
          </div>
        </div>

        {!session.is_current && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRevoke(session.id)}
            disabled={isRevoking}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default function SessionsManager() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevoking, setIsRevoking] = useState(false);
  const [showRevokeAllDialog, setShowRevokeAllDialog] = useState(false);
  const { toast } = useToast();

  const fetchSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getSessions();
      setSessions(data.sessions);
      setStats(data.stats);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les sessions.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevokeSession = async (sessionId: number) => {
    try {
      setIsRevoking(true);
      await revokeSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast({
        title: 'Session révoquée',
        description: 'La session a été déconnectée avec succès.',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de révoquer la session.',
        variant: 'destructive',
      });
    } finally {
      setIsRevoking(false);
    }
  };

  const handleRevokeOthers = async () => {
    try {
      setIsRevoking(true);
      const result = await revokeOtherSessions();
      await fetchSessions();
      setShowRevokeAllDialog(false);
      toast({
        title: 'Sessions révoquées',
        description: result.message,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de révoquer les sessions.',
        variant: 'destructive',
      });
    } finally {
      setIsRevoking(false);
    }
  };

  const otherSessionsCount = sessions.filter(s => !s.is_current).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sessions actives
            </CardTitle>
            <CardDescription>
              Gérez vos sessions de connexion sur différents appareils
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSessions}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total_sessions}</div>
              <div className="text-xs text-muted-foreground">Sessions actives</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.max_sessions}</div>
              <div className="text-xs text-muted-foreground">Maximum autorisé</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.idle_timeout_minutes}min</div>
              <div className="text-xs text-muted-foreground">Timeout inactivité</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">{stats.expired_sessions}</div>
              <div className="text-xs text-muted-foreground">Expirées</div>
            </div>
          </div>
        )}

        {/* Actions */}
        {otherSessionsCount > 0 && (
          <div className="flex justify-end">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowRevokeAllDialog(true)}
              disabled={isRevoking}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnecter les {otherSessionsCount} autre(s) session(s)
            </Button>
          </div>
        )}

        {/* Sessions list */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onRevoke={handleRevokeSession}
                isRevoking={isRevoking}
              />
            ))}
          </AnimatePresence>

          {sessions.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Aucune session active
            </div>
          )}

          {isLoading && (
            <div className="text-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          )}
        </div>
      </CardContent>

      {/* Confirmation dialog */}
      <AlertDialog open={showRevokeAllDialog} onOpenChange={setShowRevokeAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Déconnecter toutes les autres sessions ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va déconnecter {otherSessionsCount} session(s) sur d'autres appareils. 
              Vous devrez vous reconnecter sur ces appareils.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeOthers}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Déconnecter tout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
