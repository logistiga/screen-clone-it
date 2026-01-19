import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Clock, CheckCircle2, XCircle, Loader2, Smartphone, MapPin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

interface PendingApprovalState {
  suspiciousLoginId?: number;
  reasons?: string[];
  location?: string;
  userEmail?: string;
}

export default function PendingApprovalPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  
  const state = location.state as PendingApprovalState | undefined;
  
  const [status, setStatus] = useState<'pending' | 'approved' | 'blocked'>('pending');
  const [countdown, setCountdown] = useState(300); // 5 minutes max
  const [pollCount, setPollCount] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = useCallback(async () => {
    if (!state?.suspiciousLoginId) return;
    
    setIsChecking(true);
    try {
      const response = await api.get(`/security/suspicious-login/${state.suspiciousLoginId}/status`);
      const newStatus = response.data?.status;
      
      if (newStatus === 'approved') {
        setStatus('approved');
        // Redirection après un court délai pour montrer le succès
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);
      } else if (newStatus === 'blocked') {
        setStatus('blocked');
        // Déconnecter l'utilisateur après un délai
        setTimeout(async () => {
          await logout();
          navigate('/login', { replace: true });
        }, 3000);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du statut:', error);
    } finally {
      setIsChecking(false);
      setPollCount(prev => prev + 1);
    }
  }, [state?.suspiciousLoginId, navigate, logout]);

  // Polling automatique toutes les 5 secondes
  useEffect(() => {
    if (status !== 'pending') return;
    
    const interval = setInterval(() => {
      checkStatus();
    }, 5000);

    // Vérification initiale
    checkStatus();

    return () => clearInterval(interval);
  }, [checkStatus, status]);

  // Countdown timer
  useEffect(() => {
    if (status !== 'pending') return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressValue = ((300 - countdown) / 300) * 100;

  const handleCancel = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Si pas d'ID de connexion suspecte, rediriger vers login
  useEffect(() => {
    if (!state?.suspiciousLoginId) {
      navigate('/login', { replace: true });
    }
  }, [state, navigate]);

  if (!state?.suspiciousLoginId) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-2 border-warning/50 shadow-xl overflow-hidden">
          {/* Header animé */}
          <div className={`p-6 text-center ${
            status === 'approved' 
              ? 'bg-gradient-to-r from-success to-success/80' 
              : status === 'blocked'
                ? 'bg-gradient-to-r from-destructive to-destructive/80'
                : 'bg-gradient-to-r from-warning to-warning/80'
          }`}>
            <motion.div
              animate={status === 'pending' ? { 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              } : {}}
              transition={{ 
                duration: 2, 
                repeat: status === 'pending' ? Infinity : 0,
                ease: "easeInOut"
              }}
              className="inline-block"
            >
              {status === 'approved' ? (
                <CheckCircle2 className="h-16 w-16 text-white mx-auto" />
              ) : status === 'blocked' ? (
                <XCircle className="h-16 w-16 text-white mx-auto" />
              ) : (
                <Shield className="h-16 w-16 text-white mx-auto" />
              )}
            </motion.div>
            
            <h1 className="mt-4 text-xl font-bold text-white">
              {status === 'approved' 
                ? 'Connexion approuvée !'
                : status === 'blocked'
                  ? 'Connexion bloquée'
                  : 'Vérification de sécurité'}
            </h1>
          </div>

          <CardContent className="p-6 space-y-6">
            {status === 'pending' && (
              <>
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground">
                    Votre connexion nécessite une validation par l'administrateur.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Un email a été envoyé pour approbation.
                  </p>
                </div>

                {/* Raisons de l'alerte */}
                {state.reasons && state.reasons.length > 0 && (
                  <div className="bg-warning/10 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium text-warning-foreground flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Raison de la vérification :
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {state.reasons.map((reason, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Localisation */}
                {state.location && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>Localisation détectée : {state.location}</span>
                  </div>
                )}

                {/* Timer et progress */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      En attente de validation...
                    </span>
                    <span className="font-mono text-primary">{formatTime(countdown)}</span>
                  </div>
                  <Progress value={progressValue} className="h-2" />
                </div>

                {/* Indicateur de polling */}
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  {isChecking ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  <span>Vérification automatique (#{pollCount})</span>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <Button 
                    variant="outline" 
                    onClick={checkStatus}
                    disabled={isChecking}
                    className="w-full"
                  >
                    {isChecking ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Vérification...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Vérifier maintenant
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    onClick={handleCancel}
                    className="w-full text-muted-foreground"
                  >
                    Annuler et se déconnecter
                  </Button>
                </div>
              </>
            )}

            {status === 'approved' && (
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
                </motion.div>
                <p className="text-muted-foreground">
                  Votre connexion a été approuvée par l'administrateur.
                </p>
                <p className="text-sm text-muted-foreground">
                  Redirection en cours...
                </p>
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
              </div>
            )}

            {status === 'blocked' && (
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <XCircle className="h-12 w-12 text-destructive mx-auto" />
                </motion.div>
                <p className="text-muted-foreground">
                  Votre connexion a été bloquée par l'administrateur.
                </p>
                <p className="text-sm text-muted-foreground">
                  Si vous pensez qu'il s'agit d'une erreur, contactez le support.
                </p>
                <p className="text-xs text-muted-foreground">
                  Déconnexion automatique...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info de contact */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Compte : {state.userEmail}
        </p>
      </motion.div>
    </div>
  );
}
