import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  sendOrdreToLogistiga, 
  prepareLogistigaPayload, 
  formatLogistigaErrors,
} from '@/lib/api/logistiga';

interface OrdreForLogistiga {
  id: number | string;
  numero: string;
  numero_bl?: string;
  client?: { nom: string } | null;
  transitaire?: { nom: string } | null;
  conteneurs?: Array<{ numero: string }>;
}

export function useSendToLogistiga() {
  return useMutation({
    mutationFn: async (ordre: OrdreForLogistiga) => {
      // Préparer le payload
      const payload = prepareLogistigaPayload(ordre);
      
      if (!payload) {
        throw new Error('Données insuffisantes pour envoyer à Logistiga. Vérifiez le numéro BL, le client et les conteneurs.');
      }

      // Envoyer à Logistiga
      const response = await sendOrdreToLogistiga(payload);
      
      if (!response.success) {
        const errorDetails = 'errors' in response ? formatLogistigaErrors(response.errors) : '';
        throw new Error(response.message + (errorDetails ? `\n${errorDetails}` : ''));
      }
      
      return response;
    },
    onSuccess: (data) => {
      toast.success('Ordre envoyé à Logistiga', {
        description: `Numéro Logistiga: ${data.data.numero}`,
      });
    },
    onError: (error: Error) => {
      toast.error('Erreur Logistiga', {
        description: error.message,
      });
    },
  });
}

/**
 * Hook pour vérifier si un ordre peut être envoyé à Logistiga
 */
export function canSendToLogistiga(ordre: OrdreForLogistiga): boolean {
  return !!(
    ordre.numero_bl &&
    ordre.client?.nom &&
    ordre.conteneurs &&
    ordre.conteneurs.length > 0
  );
}
