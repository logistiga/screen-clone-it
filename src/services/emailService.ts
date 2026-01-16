import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://facturation.logistiga.com/backend/api";

// Types
export interface EmailTemplate {
  id: number;
  nom: string;
  type: "devis" | "ordre" | "facture" | "relance" | "confirmation" | "notification" | "custom";
  objet: string;
  contenu: string;
  variables: string[];
  actif: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EmailAutomation {
  id: number;
  nom: string;
  declencheur: string;
  template_id: number;
  template?: EmailTemplate;
  delai: number;
  delai_unite: "minutes" | "heures" | "jours";
  actif: boolean;
  conditions: string;
  created_at?: string;
  updated_at?: string;
}

export interface EmailConfig {
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_password: string;
  expediteur_nom: string;
  expediteur_email: string;
  reply_to: string;
  signature: string;
  copie_archive: string;
  ssl: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// Helper pour les headers d'authentification
const getAuthHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

// ============================================
// EMAIL TEMPLATES
// ============================================

export const emailTemplateService = {
  // Liste des templates
  async getAll(params?: {
    search?: string;
    type?: string;
    actif?: boolean;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<EmailTemplate>> {
    const response = await axios.get(`${API_URL}/email-templates`, {
      headers: getAuthHeaders(),
      params,
    });
    return response.data;
  },

  // Obtenir un template
  async getById(id: number): Promise<EmailTemplate> {
    const response = await axios.get(`${API_URL}/email-templates/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Créer un template
  async create(data: Partial<EmailTemplate>): Promise<{ message: string; template: EmailTemplate }> {
    const response = await axios.post(`${API_URL}/email-templates`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Mettre à jour un template
  async update(id: number, data: Partial<EmailTemplate>): Promise<{ message: string; template: EmailTemplate }> {
    const response = await axios.put(`${API_URL}/email-templates/${id}`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Supprimer un template
  async delete(id: number): Promise<{ message: string }> {
    const response = await axios.delete(`${API_URL}/email-templates/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Dupliquer un template
  async duplicate(id: number): Promise<{ message: string; template: EmailTemplate }> {
    const response = await axios.post(`${API_URL}/email-templates/${id}/duplicate`, {}, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Basculer l'état actif
  async toggleActif(id: number): Promise<{ message: string; template: EmailTemplate }> {
    const response = await axios.post(`${API_URL}/email-templates/${id}/toggle`, {}, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Prévisualiser un template
  async preview(id: number): Promise<{ template: EmailTemplate; preview: { objet: string; contenu: string }; variables: string[] }> {
    const response = await axios.post(`${API_URL}/email-templates/${id}/preview`, {}, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Obtenir les types disponibles
  async getTypes(): Promise<Record<string, string>> {
    const response = await axios.get(`${API_URL}/email-templates/types`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};

// ============================================
// EMAIL AUTOMATIONS
// ============================================

export const emailAutomationService = {
  // Liste des automatisations
  async getAll(params?: {
    search?: string;
    declencheur?: string;
    actif?: boolean;
    page?: number;
    per_page?: number;
  }): Promise<PaginatedResponse<EmailAutomation>> {
    const response = await axios.get(`${API_URL}/email-automations`, {
      headers: getAuthHeaders(),
      params,
    });
    return response.data;
  },

  // Obtenir une automatisation
  async getById(id: number): Promise<EmailAutomation> {
    const response = await axios.get(`${API_URL}/email-automations/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Créer une automatisation
  async create(data: Partial<EmailAutomation>): Promise<{ message: string; automation: EmailAutomation }> {
    const response = await axios.post(`${API_URL}/email-automations`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Mettre à jour une automatisation
  async update(id: number, data: Partial<EmailAutomation>): Promise<{ message: string; automation: EmailAutomation }> {
    const response = await axios.put(`${API_URL}/email-automations/${id}`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Supprimer une automatisation
  async delete(id: number): Promise<{ message: string }> {
    const response = await axios.delete(`${API_URL}/email-automations/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Basculer l'état actif
  async toggleActif(id: number): Promise<{ message: string; automation: EmailAutomation }> {
    const response = await axios.post(`${API_URL}/email-automations/${id}/toggle`, {}, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Obtenir les déclencheurs disponibles
  async getDeclencheurs(): Promise<Record<string, string>> {
    const response = await axios.get(`${API_URL}/email-automations/declencheurs`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Obtenir les unités de délai
  async getDelaiUnites(): Promise<Record<string, string>> {
    const response = await axios.get(`${API_URL}/email-automations/delai-unites`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Obtenir les automatisations pour un déclencheur
  async getForDeclencheur(declencheur: string): Promise<EmailAutomation[]> {
    const response = await axios.get(`${API_URL}/email-automations/for-declencheur/${declencheur}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};

// ============================================
// EMAIL CONFIG
// ============================================

export const emailConfigService = {
  // Obtenir la configuration
  async get(): Promise<EmailConfig> {
    const response = await axios.get(`${API_URL}/email-config`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Mettre à jour la configuration
  async update(data: Partial<EmailConfig>): Promise<{ message: string }> {
    const response = await axios.put(`${API_URL}/email-config`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Envoyer un email de test
  async sendTest(email: string, templateId?: number): Promise<{ message: string }> {
    const response = await axios.post(`${API_URL}/email-config/test`, {
      email,
      template_id: templateId,
    }, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};

// ============================================
// NOTIFICATIONS (Envoi d'emails)
// ============================================

export const notificationService = {
  // Envoyer une facture
  async envoyerFacture(factureId: number, email?: string, message?: string): Promise<{ message: string }> {
    const response = await axios.post(`${API_URL}/notifications/facture/${factureId}/envoyer`, {
      email,
      message,
    }, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Envoyer un devis
  async envoyerDevis(devisId: number, email?: string, message?: string): Promise<{ message: string }> {
    const response = await axios.post(`${API_URL}/notifications/devis/${devisId}/envoyer`, {
      email,
      message,
    }, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Envoyer un ordre de travail
  async envoyerOrdre(ordreId: number, email?: string, message?: string): Promise<{ message: string }> {
    const response = await axios.post(`${API_URL}/notifications/ordre/${ordreId}/envoyer`, {
      email,
      message,
    }, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Envoyer une confirmation de paiement
  async envoyerConfirmationPaiement(paiementId: number, email?: string): Promise<{ message: string }> {
    const response = await axios.post(`${API_URL}/notifications/paiement/${paiementId}/confirmation`, {
      email,
    }, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Envoyer un rappel de facture
  async envoyerRappel(factureId: number): Promise<{ message: string }> {
    const response = await axios.post(`${API_URL}/notifications/facture/${factureId}/rappel`, {}, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Déclencher les rappels automatiques
  async rappelsAutomatiques(): Promise<{ message: string; resultats: any }> {
    const response = await axios.post(`${API_URL}/notifications/rappels-automatiques`, {}, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  // Envoyer un email personnalisé
  async envoyerEmailPersonnalise(destinataire: string, sujet: string, contenu: string): Promise<{ message: string }> {
    const response = await axios.post(`${API_URL}/notifications/email-personnalise`, {
      destinataire,
      sujet,
      contenu,
    }, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },
};
