/**
 * Service d'intégration avec l'API Logistiga
 * Permet d'envoyer les ordres de travail vers Logistiga pour la gestion logistique
 */

import axios from 'axios';

const LOGISTIGA_API_URL = 'https://suivitc.logistiga.com/backend/api';

// Types pour l'API Logistiga
export interface LogistigaContainer {
  numero_conteneur: string;
}

export interface LogistigaOrdrePayload {
  booking_number: string;
  client_nom: string;
  transitaire_nom?: string;
  containers: LogistigaContainer[];
}

export interface LogistigaSuccessResponse {
  success: true;
  message: string;
  data: {
    id: number;
    numero: string;
    status: string;
  };
}

export interface LogistigaErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export type LogistigaResponse = LogistigaSuccessResponse | LogistigaErrorResponse;

/**
 * Envoie un ordre de travail vers l'API Logistiga
 */
export async function sendOrdreToLogistiga(payload: LogistigaOrdrePayload): Promise<LogistigaResponse> {
  try {
    const response = await axios.post<LogistigaSuccessResponse>(
      `${LOGISTIGA_API_URL}/ordres-externes`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );
    
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      // Erreur de validation ou autre erreur API
      return error.response.data as LogistigaErrorResponse;
    }
    
    // Erreur réseau ou autre
    return {
      success: false,
      message: error.message || 'Erreur de connexion avec Logistiga',
    };
  }
}

/**
 * Prépare le payload pour l'API Logistiga à partir d'un ordre de travail
 */
export function prepareLogistigaPayload(ordre: {
  numero_bl?: string;
  client?: { nom: string } | null;
  transitaire?: { nom: string } | null;
  conteneurs?: Array<{ numero: string }>;
}): LogistigaOrdrePayload | null {
  // Vérifier les champs obligatoires
  if (!ordre.numero_bl || !ordre.client?.nom) {
    return null;
  }

  // Vérifier qu'il y a au moins un conteneur
  if (!ordre.conteneurs || ordre.conteneurs.length === 0) {
    return null;
  }

  return {
    booking_number: ordre.numero_bl,
    client_nom: ordre.client.nom,
    transitaire_nom: ordre.transitaire?.nom,
    containers: ordre.conteneurs.map(c => ({
      numero_conteneur: c.numero,
    })),
  };
}

/**
 * Formate les erreurs de validation Logistiga pour l'affichage
 */
export function formatLogistigaErrors(errors?: Record<string, string[]>): string {
  if (!errors) return '';
  
  return Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('\n');
}
