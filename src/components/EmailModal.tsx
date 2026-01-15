import { useState } from "react";
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
import { Mail, Send, User, AtSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
}: EmailModalProps) {
  const { toast } = useToast();
  const [emailOption, setEmailOption] = useState<"client" | "autre">(
    clientEmail ? "client" : "autre"
  );
  const [customEmail, setCustomEmail] = useState("");
  const [objet, setObjet] = useState(`Votre ${documentType} ${documentNumero}`);

  const formatMontant = (montant?: number) => {
    if (montant === undefined || montant === null) return "-";
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  };

  // Générer le message avec détails financiers
  const getDefaultMessage = () => {
    let msg = `Bonjour${clientNom ? ` ${clientNom}` : ''},\n\nVeuillez trouver ci-joint votre ${getDocumentLabel().toLowerCase()} ${documentNumero}.\n\n`;
    
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
    
    msg += `Cordialement,\nL'équipe Lojistiga`;
    return msg;
  };

  const [message, setMessage] = useState(getDefaultMessage());
  const [isSending, setIsSending] = useState(false);

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

  const handleSend = async () => {
    const email = emailOption === "client" ? clientEmail : customEmail;

    if (!email) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une adresse email.",
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
      description: `Le ${documentType} ${documentNumero} a été envoyé à ${email}`,
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
            Envoyer le {getDocumentLabel().toLowerCase()} <strong>{documentNumero}</strong> par
            email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Choix du destinataire */}
          <div className="space-y-3">
            <Label>Destinataire</Label>
            <RadioGroup value={emailOption} onValueChange={(v) => setEmailOption(v as any)}>
              {clientEmail && (
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                  <RadioGroupItem value="client" id="client" />
                  <Label htmlFor="client" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{clientNom}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{clientEmail}</p>
                  </Label>
                </div>
              )}
              <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="autre" id="autre" />
                <Label htmlFor="autre" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <AtSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Autre adresse email</span>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Champ email personnalisé */}
          {emailOption === "autre" && (
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
