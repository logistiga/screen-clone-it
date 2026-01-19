import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, AlertTriangle, Loader2, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';

type ActionType = 'approve' | 'block';
type Status = 'loading' | 'success' | 'error' | 'expired' | 'already_processed';

interface ActionResult {
  status: Status;
  message: string;
  details?: string;
}

const SecurityActionPage = () => {
  const { token, action } = useParams<{ token: string; action: string }>();
  const [result, setResult] = useState<ActionResult>({ 
    status: 'loading', 
    message: 'Traitement en cours...' 
  });

  useEffect(() => {
    const processAction = async () => {
      if (!token || !action) {
        setResult({
          status: 'error',
          message: 'Lien invalide',
          details: 'Le lien de validation est incomplet ou malformé.'
        });
        return;
      }

      if (action !== 'approve' && action !== 'block') {
        setResult({
          status: 'error',
          message: 'Action non reconnue',
          details: 'Cette action n\'est pas valide.'
        });
        return;
      }

      try {
        const response = await api.get(`/security/suspicious-login/${token}/${action}`);
        
        if (response.data.success) {
          setResult({
            status: 'success',
            message: action === 'approve' 
              ? 'Connexion approuvée !' 
              : 'Connexion bloquée !',
            details: action === 'approve'
              ? 'L\'utilisateur peut maintenant accéder à son compte.'
              : 'L\'utilisateur a été déconnecté et ne pourra pas se reconnecter depuis cet appareil.'
          });
        } else {
          setResult({
            status: 'error',
            message: response.data.message || 'Une erreur est survenue',
          });
        }
      } catch (error: any) {
        const status = error.response?.status;
        const message = error.response?.data?.message;

        if (status === 404) {
          setResult({
            status: 'expired',
            message: 'Lien expiré ou invalide',
            details: 'Ce lien de validation n\'existe plus ou a déjà été utilisé.'
          });
        } else if (status === 400) {
          // Déjà traité
          setResult({
            status: 'already_processed',
            message: message || 'Cette connexion a déjà été traitée',
            details: 'Aucune action supplémentaire n\'est requise.'
          });
        } else {
          setResult({
            status: 'error',
            message: 'Erreur de connexion',
            details: 'Impossible de contacter le serveur. Veuillez réessayer.'
          });
        }
      }
    };

    processAction();
  }, [token, action]);

  const getIcon = () => {
    switch (result.status) {
      case 'loading':
        return <Loader2 className="h-16 w-16 text-primary animate-spin" />;
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'error':
        return <XCircle className="h-16 w-16 text-destructive" />;
      case 'expired':
        return <AlertTriangle className="h-16 w-16 text-amber-500" />;
      case 'already_processed':
        return <Shield className="h-16 w-16 text-blue-500" />;
    }
  };

  const getCardClass = () => {
    switch (result.status) {
      case 'success':
        return 'border-green-200 bg-green-50/50';
      case 'error':
        return 'border-destructive/50 bg-destructive/5';
      case 'expired':
        return 'border-amber-200 bg-amber-50/50';
      case 'already_processed':
        return 'border-blue-200 bg-blue-50/50';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className={`w-full max-w-md ${getCardClass()}`}>
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            {getIcon()}
          </div>
          <CardTitle className="text-2xl">
            {result.message}
          </CardTitle>
          {result.details && (
            <CardDescription className="text-base">
              {result.details}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="text-center">
          {result.status !== 'loading' && (
            <p className="text-sm text-muted-foreground mb-4">
              Vous pouvez fermer cette page en toute sécurité.
            </p>
          )}
          
          {result.status === 'success' && action === 'approve' && (
            <div className="mt-4 p-4 bg-green-100 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ L'utilisateur a été notifié et peut maintenant continuer à utiliser l'application.
              </p>
            </div>
          )}
          
          {result.status === 'success' && action === 'block' && (
            <div className="mt-4 p-4 bg-red-100 rounded-lg">
              <p className="text-sm text-red-800">
                🚫 La session de l'utilisateur a été invalidée. S'il s'agissait d'une tentative frauduleuse, 
                nous vous recommandons de contacter l'utilisateur pour l'informer.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityActionPage;
