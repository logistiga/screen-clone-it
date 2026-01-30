import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, User, AtSign, Building2, Users, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { emailTemplateService, notificationService } from "@/services/emailService";

// Interface pour les contacts
interface ContactOption {
  id: string;
  nom: string;
  email: string;
  type: "client" | "transitaire" | "armateur" | "representant" | "contact" | "autre";
  label?: string;
}

// Interface pour les données du document
interface DocumentData {
  id: number | string;
  numero: string;
  clientNom?: string;
  clientEmail?: string;
  transitaireNom?: string;
  transitaireEmail?: string;
  armateurNom?: string;
  armateurEmail?: string;
  representantNom?: string;
  representantEmail?: string;
  contacts?: Array<{
    id: string | number;
    nom: string;
    email?: string;
    fonction?: string;
  }>;
  // Montants
  montantHT?: number;
  montantTTC?: number;
  remiseMontant?: number;
  remiseType?: string;
  tva?: number;
  css?: number;
  resteAPayer?: number;
  // Dates
  dateCreation?: string;
  dateValidite?: string;
  dateEcheance?: string;
  // Autres
  statut?: string;
  categorie?: string;
}

interface EmailModalWithTemplateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: "devis" | "ordre" | "facture" | "note_debut";
  documentData: DocumentData;
  generatePdfBlob?: () => Promise<Blob | null>;
}

// Mapping type document -> type template
const documentTypeToTemplateType: Record<string, string> = {
  devis: "devis",
  ordre: "ordre",
  facture: "facture",
  note_debut: "note_debut",
};

// Helper pour convertir Blob en base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export function EmailModalWithTemplate({
  open,
  onOpenChange,
  documentType,
  documentData,
  generatePdfBlob,
}: EmailModalWithTemplateProps) {
  const { toast } = useToast();
  const [selectedContact, setSelectedContact] = useState<string>("client");
  const [customEmail, setCustomEmail] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isSending, setIsSending] = useState(false);

  // Charger les templates du type correspondant
  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["email-templates", documentType],
    queryFn: () => emailTemplateService.getAll({ 
      type: documentTypeToTemplateType[documentType], 
      actif: true,
      per_page: 50 
    }),
    enabled: open,
  });

  const templates = useMemo(() => {
    if (!templatesData?.data) return [];
    return Array.isArray(templatesData.data) ? templatesData.data : [];
  }, [templatesData]);

  // Construire la liste des contacts disponibles
  const availableContacts: ContactOption[] = useMemo(() => {
    const list: ContactOption[] = [];
    
    // Client principal
    if (documentData.clientEmail) {
      list.push({
        id: "client",
        nom: documentData.clientNom || "Client",
        email: documentData.clientEmail,
        type: "client",
        label: "Client principal"
      });
    }
    
    // Transitaire
    if (documentData.transitaireEmail) {
      list.push({
        id: "transitaire",
        nom: documentData.transitaireNom || "Transitaire",
        email: documentData.transitaireEmail,
        type: "transitaire",
        label: "Transitaire"
      });
    }

    // Armateur
    if (documentData.armateurEmail) {
      list.push({
        id: "armateur",
        nom: documentData.armateurNom || "Armateur",
        email: documentData.armateurEmail,
        type: "armateur",
        label: "Armateur"
      });
    }

    // Représentant
    if (documentData.representantEmail) {
      list.push({
        id: "representant",
        nom: documentData.representantNom || "Représentant",
        email: documentData.representantEmail,
        type: "representant",
        label: "Représentant"
      });
    }
    
    // Contacts additionnels
    documentData.contacts?.forEach((contact) => {
      if (contact.email) {
        list.push({
          id: `contact-${contact.id}`,
          nom: contact.nom,
          email: contact.email,
          type: "contact",
          label: contact.fonction || "Contact"
        });
      }
    });
    
    return list;
  }, [documentData]);

  // Sélectionner le premier contact disponible par défaut
  useEffect(() => {
    if (availableContacts.length > 0 && selectedContact === "client" && !documentData.clientEmail) {
      setSelectedContact(availableContacts[0].id);
    }
  }, [availableContacts, selectedContact, documentData.clientEmail]);

  // Formater les montants
  const formatMontant = (montant?: number) => {
    if (montant === undefined || montant === null) return "-";
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(montant)) + ' XAF';
  };

  // Formater les dates
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  // Remplacer les variables dans le template
  const replaceVariables = (text: string): string => {
    const recipientName = getSelectedName();
    
    const variables: Record<string, string> = {
      // Client
      client_nom: documentData.clientNom || '',
      
      // Numéros de document
      numero_devis: documentType === 'devis' ? documentData.numero : '',
      numero_facture: documentType === 'facture' ? documentData.numero : '',
      numero_ordre: documentType === 'ordre' ? documentData.numero : '',
      
      // Dates
      date_devis: formatDate(documentData.dateCreation),
      date_facture: formatDate(documentData.dateCreation),
      date_creation: formatDate(documentData.dateCreation),
      date_validite: formatDate(documentData.dateValidite),
      date_echeance: formatDate(documentData.dateEcheance),
      
      // Montants
      montant_ht: formatMontant(documentData.montantHT),
      montant_ttc: formatMontant(documentData.montantTTC),
      remise_montant: formatMontant(documentData.remiseMontant),
      remise_type: documentData.remiseType || '',
      montant_tva: formatMontant(documentData.tva),
      montant_css: formatMontant(documentData.css),
      reste_a_payer: formatMontant(documentData.resteAPayer),
      
      // Autres
      statut: documentData.statut || '',
      categorie: documentData.categorie || '',
      
      // Signature par défaut
      signature: "L'équipe LOGISTIGA",
      
      // Message personnalisé (vide par défaut)
      message_personnalise: '',
    };

    let result = text;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    
    return result;
  };

  // Définir le template par défaut à l'ouverture
  useEffect(() => {
    if (open && templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id.toString());
    }
  }, [open, templates, isLoadingTemplates]);

  // Obtenir le contenu du template pour l'envoi
  const getTemplateContent = (): { objet: string; message: string } => {
    if (selectedTemplateId && templates.length > 0) {
      const template = templates.find(t => t.id.toString() === selectedTemplateId);
      if (template) {
        const plainText = template.contenu
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/p>/gi, '\n\n')
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/\n\n\n+/g, '\n\n')
          .trim();
        return {
          objet: replaceVariables(template.objet),
          message: replaceVariables(plainText)
        };
      }
    }
    // Pas de template, utiliser un message par défaut
    return {
      objet: `Votre ${getDocumentLabel()} ${documentData.numero}`,
      message: getDefaultMessage()
    };
  };

  const getDocumentLabel = () => {
    switch (documentType) {
      case "devis":
        return "Devis";
      case "ordre":
        return "Ordre de travail";
      case "facture":
        return "Facture";
      default:
        return "Document";
    }
  };

  // Obtenir l'email sélectionné
  const getSelectedEmail = (): string | undefined => {
    if (selectedContact === "autre") {
      return customEmail;
    }
    const contact = availableContacts.find(c => c.id === selectedContact);
    return contact?.email;
  };

  // Obtenir le nom du destinataire sélectionné
  const getSelectedName = (): string | undefined => {
    if (selectedContact === "autre") {
      return undefined;
    }
    const contact = availableContacts.find(c => c.id === selectedContact);
    return contact?.nom;
  };

  // Message par défaut si pas de template
  const getDefaultMessage = () => {
    const recipientName = getSelectedName();
    let msg = `Bonjour${recipientName ? ` ${recipientName}` : ''},\n\nVeuillez trouver ci-joint votre ${getDocumentLabel().toLowerCase()} ${documentData.numero}.\n\n`;
    
    if (documentData.montantHT || documentData.montantTTC) {
      msg += `📄 Détails :\n`;
      if (documentData.montantHT) msg += `• Montant HT : ${formatMontant(documentData.montantHT)}\n`;
      if (documentData.remiseMontant && documentData.remiseMontant > 0) {
        const typeLabel = documentData.remiseType === 'pourcentage' ? '(%)' : '(fixe)';
        msg += `• Remise ${typeLabel} : -${formatMontant(documentData.remiseMontant)}\n`;
      }
      if (documentData.tva) msg += `• TVA : ${formatMontant(documentData.tva)}\n`;
      if (documentData.css && documentData.css > 0) msg += `• CSS : ${formatMontant(documentData.css)}\n`;
      if (documentData.montantTTC) msg += `• Total TTC : ${formatMontant(documentData.montantTTC)}\n`;
      msg += `\n`;
    }
    
    msg += `Cordialement,\nL'équipe LOGISTIGA`;
    return msg;
  };

  const getContactIcon = (type: ContactOption["type"]) => {
    switch (type) {
      case "client":
        return <User className="h-4 w-4 text-primary" />;
      case "transitaire":
        return <Building2 className="h-4 w-4 text-blue-600" />;
      case "armateur":
        return <Building2 className="h-4 w-4 text-indigo-600" />;
      case "representant":
        return <User className="h-4 w-4 text-orange-600" />;
      case "contact":
        return <Users className="h-4 w-4 text-emerald-600" />;
      default:
        return <AtSign className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleSend = async () => {
    const email = getSelectedEmail();

    if (!email) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner ou saisir une adresse email.",
        variant: "destructive",
      });
      return;
    }

    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Erreur",
        description: "L'adresse email n'est pas valide.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      // Générer le PDF si la fonction est fournie
      let pdfBase64: string | undefined;
      if (generatePdfBlob) {
        const blob = await generatePdfBlob();
        if (blob) {
          pdfBase64 = await blobToBase64(blob);
        }
      }

      // Appeler le bon service selon le type de document
      const documentId = typeof documentData.id === 'string' ? parseInt(documentData.id) : documentData.id;
      const templateContent = getTemplateContent();
      
      switch (documentType) {
        case 'devis':
          await notificationService.envoyerDevis(documentId, email, templateContent.message, pdfBase64);
          break;
        case 'ordre':
          await notificationService.envoyerOrdre(documentId, email, templateContent.message, pdfBase64);
          break;
        case 'facture':
          await notificationService.envoyerFacture(documentId, email, templateContent.message, pdfBase64);
          break;
        case 'note_debut':
          await notificationService.envoyerNoteDebut(documentId, email, templateContent.message, pdfBase64);
          break;
      }

      toast({
        title: "Email envoyé",
        description: `Le ${getDocumentLabel().toLowerCase()} ${documentData.numero} a été envoyé à ${email}`,
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error("Erreur envoi email:", error);
      const apiMessage = error.response?.data?.message;
      const apiError = error.response?.data?.error;
      const apiErrorId = error.response?.data?.error_id;

      toast({
        title: "Erreur d'envoi",
        description:
          [apiMessage, apiError, apiErrorId ? `ID: ${apiErrorId}` : null]
            .filter(Boolean)
            .join(" — ") || "Une erreur est survenue lors de l'envoi de l'email.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Envoyer par email
          </DialogTitle>
          <DialogDescription>
            Envoyer le {getDocumentLabel().toLowerCase()} <strong>{documentData.numero}</strong> par email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Indicateur du template utilisé */}
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Modèle utilisé :</span>
            {isLoadingTemplates ? (
              <span className="text-sm flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Chargement...
              </span>
            ) : templates.length > 0 ? (
              <Badge variant="secondary">
                {templates.find(t => t.id.toString() === selectedTemplateId)?.nom || templates[0]?.nom}
              </Badge>
            ) : (
              <Badge variant="outline">Modèle par défaut</Badge>
            )}
          </div>

          {/* Choix du destinataire */}
          <div className="space-y-3">
            <Label>Destinataire</Label>
            <RadioGroup value={selectedContact} onValueChange={setSelectedContact}>
              <ScrollArea className={availableContacts.length > 4 ? "h-[200px]" : ""}>
                <div className="space-y-2 pr-2">
                  {/* Contacts disponibles */}
                  {availableContacts.map((contact) => (
                    <div 
                      key={contact.id}
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedContact(contact.id)}
                    >
                      <RadioGroupItem value={contact.id} id={contact.id} />
                      <Label htmlFor={contact.id} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          {getContactIcon(contact.type)}
                          <span className="font-medium">{contact.nom}</span>
                          {contact.label && (
                            <Badge variant="secondary" className="text-xs">
                              {contact.label}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                      </Label>
                    </div>
                  ))}
                  
                  {/* Option pour autre adresse */}
                  <div 
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedContact("autre")}
                  >
                    <RadioGroupItem value="autre" id="autre" />
                    <Label htmlFor="autre" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <AtSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Autre adresse email</span>
                      </div>
                    </Label>
                  </div>
                </div>
              </ScrollArea>
            </RadioGroup>
          </div>

          {/* Champ email personnalisé */}
          {selectedContact === "autre" && (
            <div className="space-y-2">
              <Label htmlFor="customEmail">Adresse email</Label>
              <Input
                id="customEmail"
                type="email"
                placeholder="exemple@domaine.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                autoFocus
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Annuler
          </Button>
          <Button onClick={handleSend} disabled={isSending} className="gap-2">
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Envoyer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
