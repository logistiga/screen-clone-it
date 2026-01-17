import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  emailTemplateService,
  emailAutomationService,
  emailConfigService,
  notificationService,
  EmailTemplate,
  EmailAutomation,
  EmailConfig,
} from "@/services/emailService";

// ============================================
// EMAIL TEMPLATES HOOKS
// ============================================

export function useEmailTemplates(params?: {
  search?: string;
  type?: string;
  actif?: boolean;
  page?: number;
  per_page?: number;
}) {
  return useQuery({
    queryKey: ["email-templates", params],
    queryFn: () => emailTemplateService.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useEmailTemplate(id: number) {
  return useQuery({
    queryKey: ["email-template", id],
    queryFn: () => emailTemplateService.getById(id),
    enabled: !!id,
  });
}

export function useEmailTemplateTypes() {
  return useQuery({
    queryKey: ["email-template-types"],
    queryFn: () => emailTemplateService.getTypes(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useCreateEmailTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Partial<EmailTemplate>) => emailTemplateService.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({
        title: "Modèle créé",
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la création du modèle",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EmailTemplate> }) =>
      emailTemplateService.update(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      queryClient.invalidateQueries({ queryKey: ["email-template"] });
      toast({
        title: "Modèle modifié",
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la modification du modèle",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteEmailTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => emailTemplateService.delete(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({
        title: "Modèle supprimé",
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la suppression du modèle",
        variant: "destructive",
      });
    },
  });
}

export function useDuplicateEmailTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => emailTemplateService.duplicate(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({
        title: "Modèle dupliqué",
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la duplication du modèle",
        variant: "destructive",
      });
    },
  });
}

export function useToggleEmailTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => emailTemplateService.toggleActif(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({
        title: response.template.actif ? "Modèle activé" : "Modèle désactivé",
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors du changement de statut",
        variant: "destructive",
      });
    },
  });
}

export function usePreviewEmailTemplate() {
  return useMutation({
    mutationFn: (id: number) => emailTemplateService.preview(id),
  });
}

// ============================================
// EMAIL AUTOMATIONS HOOKS
// ============================================

export function useEmailAutomations(params?: {
  search?: string;
  declencheur?: string;
  actif?: boolean;
  page?: number;
  per_page?: number;
}) {
  return useQuery({
    queryKey: ["email-automations", params],
    queryFn: () => emailAutomationService.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useEmailAutomation(id: number) {
  return useQuery({
    queryKey: ["email-automation", id],
    queryFn: () => emailAutomationService.getById(id),
    enabled: !!id,
  });
}

export function useEmailDeclencheurs() {
  return useQuery({
    queryKey: ["email-declencheurs"],
    queryFn: () => emailAutomationService.getDeclencheurs(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useEmailDelaiUnites() {
  return useQuery({
    queryKey: ["email-delai-unites"],
    queryFn: () => emailAutomationService.getDelaiUnites(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useCreateEmailAutomation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Partial<EmailAutomation>) => emailAutomationService.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["email-automations"] });
      toast({
        title: "Automatisation créée",
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la création de l'automatisation",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateEmailAutomation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EmailAutomation> }) =>
      emailAutomationService.update(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["email-automations"] });
      queryClient.invalidateQueries({ queryKey: ["email-automation"] });
      toast({
        title: "Automatisation modifiée",
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la modification de l'automatisation",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteEmailAutomation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => emailAutomationService.delete(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["email-automations"] });
      toast({
        title: "Automatisation supprimée",
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la suppression de l'automatisation",
        variant: "destructive",
      });
    },
  });
}

export function useToggleEmailAutomation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => emailAutomationService.toggleActif(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["email-automations"] });
      toast({
        title: response.automation.actif ? "Automatisation activée" : "Automatisation désactivée",
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors du changement de statut",
        variant: "destructive",
      });
    },
  });
}

// ============================================
// EMAIL CONFIG HOOKS
// ============================================

export function useEmailConfig() {
  return useQuery({
    queryKey: ["email-config"],
    queryFn: () => emailConfigService.get(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateEmailConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: Partial<EmailConfig>) => emailConfigService.update(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["email-config"] });
      toast({
        title: "Configuration sauvegardée",
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de la sauvegarde de la configuration",
        variant: "destructive",
      });
    },
  });
}

export function useSendTestEmail() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ email, templateId }: { email: string; templateId?: number }) =>
      emailConfigService.sendTest(email, templateId),
    onSuccess: (response) => {
      toast({
        title: "Email de test envoyé",
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de l'envoi de l'email de test",
        variant: "destructive",
      });
    },
  });
}

// ============================================
// NOTIFICATION HOOKS
// ============================================

export function useEnvoyerFacture() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ factureId, email, message, pdfBase64 }: { factureId: number; email?: string; message?: string; pdfBase64?: string }) =>
      notificationService.envoyerFacture(factureId, email, message, pdfBase64),
    onSuccess: (response) => {
      toast({
        title: "Facture envoyée",
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de l'envoi de la facture",
        variant: "destructive",
      });
    },
  });
}

export function useEnvoyerDevis() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ devisId, email, message, pdfBase64 }: { devisId: number; email?: string; message?: string; pdfBase64?: string }) =>
      notificationService.envoyerDevis(devisId, email, message, pdfBase64),
    onSuccess: (response) => {
      toast({
        title: "Devis envoyé",
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de l'envoi du devis",
        variant: "destructive",
      });
    },
  });
}

export function useEnvoyerOrdre() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ ordreId, email, message, pdfBase64 }: { ordreId: number; email?: string; message?: string; pdfBase64?: string }) =>
      notificationService.envoyerOrdre(ordreId, email, message, pdfBase64),
    onSuccess: (response) => {
      toast({
        title: "Ordre de travail envoyé",
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de l'envoi de l'ordre de travail",
        variant: "destructive",
      });
    },
  });
}

export function useEnvoyerRappel() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (factureId: number) => notificationService.envoyerRappel(factureId),
    onSuccess: (response) => {
      toast({
        title: "Rappel envoyé",
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de l'envoi du rappel",
        variant: "destructive",
      });
    },
  });
}

export function useRappelsAutomatiques() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: () => notificationService.rappelsAutomatiques(),
    onSuccess: (response) => {
      toast({
        title: "Rappels automatiques",
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors des rappels automatiques",
        variant: "destructive",
      });
    },
  });
}

export function useEnvoyerEmailPersonnalise() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ destinataire, sujet, contenu }: { destinataire: string; sujet: string; contenu: string }) =>
      notificationService.envoyerEmailPersonnalise(destinataire, sujet, contenu),
    onSuccess: (response) => {
      toast({
        title: "Email envoyé",
        description: response.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.response?.data?.message || "Erreur lors de l'envoi de l'email",
        variant: "destructive",
      });
    },
  });
}
