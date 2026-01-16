import { useState, useMemo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, Send, User, AtSign, Building2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Interface pour les contacts additionnels
interface ContactOption {
  id: string;
  nom: string;
  email: string;
  type: "client" | "transitaire" | "contact" | "autre";
  label?: string;
}

interface EmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: "devis" | "ordre" | "facture";
  documentNumero: string;
  clientEmail?: string;
  clientNom?: string;
  montantHT?: number;
  montantTTC?: number;
  remiseMontant?: number;
  remiseType?: string;
  tva?: number;
  css?: number;
  // Nouveaux props pour contacts additionnels
  transitaireEmail?: string;
  transitaireNom?: string;
  contacts?: Array<{
    id: string | number;
    nom: string;
    email?: string;
    fonction?: string;
  }>;
}

export function EmailModal({
  open,
  onOpenChange,
  documentType,
  documentNumero,
  clientEmail,
  clientNom,
  montantHT,
  montantTTC,
  remiseMontant,
  remiseType,
  tva,
  css,
  transitaireEmail,
  transitaireNom,
  contacts = [],
}: EmailModalProps) {
  const { toast } = useToast();
  const [selectedContact, setSelectedContact] = useState<string>(
    clientEmail ? "client" : "autre"
  );
  const [customEmail, setCustomEmail] = useState("");
  const [objet, setObjet] = useState(`Votre ${documentType} ${documentNumero}`);

  const formatMontant = (montant?: number) => {
    if (montant === undefined || montant === null) return "-";
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
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

  // Construire la liste des contacts disponibles
  const availableContacts: ContactOption[] = useMemo(() => {
    const list: ContactOption[] = [];
    
    // Client principal
    if (clientEmail) {
      list.push({
        id: "client",
        nom: clientNom || "Client",
        email: clientEmail,
        type: "client",
        label: "Client principal"
      });
    }
    
    // Transitaire
    if (transitaireEmail) {
      list.push({
        id: "transitaire",
        nom: transitaireNom || "Transitaire",
        email: transitaireEmail,
        type: "transitaire",
        label: "Transitaire"
      });
    }
    
    // Contacts additionnels du client
    contacts.forEach((contact) => {
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
  }, [clientEmail, clientNom, transitaireEmail, transitaireNom, contacts]);

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

  // Générer le message avec détails financiers
  const getDefaultMessage = () => {
    const recipientName = getSelectedName();
    let msg = `Bonjour${recipientName ? ` ${recipientName}` : ''},\n\nVeuillez trouver ci-joint votre ${getDocumentLabel().toLowerCase()} ${documentNumero}.\n\n`;
    
    if (montantHT || montantTTC) {
      msg += `📄 Détails :\n`;
      if (montantHT) msg += `• Montant HT : ${formatMontant(montantHT)}\n`;
      if (remiseMontant && remiseMontant > 0) {
        const typeLabel = remiseType === 'pourcentage' ? '(%)' : '(fixe)';
        msg += `• Remise ${typeLabel} : -${formatMontant(remiseMontant)}\n`;
      }
      if (tva) msg += `• TVA : ${formatMontant(tva)}\n`;
      if (css && css > 0) msg += `• CSS : ${formatMontant(css)}\n`;
      if (montantTTC) msg += `• Total TTC : ${formatMontant(montantTTC)}\n`;
      msg += `\n`;
    }
    
    msg += `Cordialement,\nL'équipe Logistiga`;
    return msg;
  };

  const [message, setMessage] = useState(getDefaultMessage());
  const [isSending, setIsSending] = useState(false);

  // Mettre à jour le message quand le contact change
  const handleContactChange = (value: string) => {
    setSelectedContact(value);
    // Optionnel: régénérer le message avec le nouveau nom
  };

  const getContactIcon = (type: ContactOption["type"]) => {
    switch (type) {
      case "client":
        return <User className="h-4 w-4 text-primary" />;
      case "transitaire":
        return <Building2 className="h-4 w-4 text-blue-600" />;
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

    // Simulation d'envoi
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: "Email envoyé",
      description: `Le ${getDocumentLabel().toLowerCase()} ${documentNumero} a été envoyé à ${email}`,
    });

    setIsSending(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Envoyer par email
          </DialogTitle>
          <DialogDescription>
            Envoyer le {getDocumentLabel().toLowerCase()} <strong>{documentNumero}</strong> par email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Choix du destinataire */}
          <div className="space-y-3">
            <Label>Destinataire</Label>
            <RadioGroup value={selectedContact} onValueChange={handleContactChange}>
              <ScrollArea className={availableContacts.length > 3 ? "h-[180px]" : ""}>
                <div className="space-y-2 pr-2">
                  {/* Contacts disponibles */}
                  {availableContacts.map((contact) => (
                    <div 
                      key={contact.id}
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <RadioGroupItem value={contact.id} id={contact.id} />
                      <Label htmlFor={contact.id} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          {getContactIcon(contact.type)}
                          <span className="font-medium">{contact.nom}</span>
                          {contact.label && (
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {contact.label}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                      </Label>
                    </div>
                  ))}
                  
                  {/* Option pour autre adresse */}
                  <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
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
              />
            </div>
          )}

          {/* Objet */}
          <div className="space-y-2">
            <Label htmlFor="objet">Objet</Label>
            <Input
              id="objet"
              value={objet}
              onChange={(e) => setObjet(e.target.value)}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSending}>
            Annuler
          </Button>
          <Button onClick={handleSend} disabled={isSending} className="gap-2">
            {isSending ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
