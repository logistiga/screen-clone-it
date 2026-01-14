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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Send, User, AtSign, MessageCircle, Copy, Check, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { openWhatsAppShare } from "@/lib/whatsapp";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: "devis" | "ordre" | "facture";
  documentNumero: string;
  documentId: string;
  clientEmail?: string;
  clientNom?: string;
  clientTelephone?: string;
  montantTTC?: number;
}

export function ShareModal({
  open,
  onOpenChange,
  documentType,
  documentNumero,
  documentId,
  clientEmail,
  clientNom,
  clientTelephone,
  montantTTC,
}: ShareModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"email" | "whatsapp">("email");
  const [emailOption, setEmailOption] = useState<"client" | "autre">(
    clientEmail ? "client" : "autre"
  );
  const [customEmail, setCustomEmail] = useState("");
  const [objet, setObjet] = useState(`Votre ${getDocumentLabel(documentType)} ${documentNumero}`);
  const [message, setMessage] = useState(
    `Bonjour,\n\nVeuillez trouver ci-joint votre ${getDocumentLabel(documentType).toLowerCase()} ${documentNumero}.\n\nCordialement,\nL'équipe Lojistiga`
  );
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);

  // Get base URL for PDF link
  const pdfUrl = `${window.location.origin}/${documentType === 'ordre' ? 'ordres' : documentType === 'facture' ? 'factures' : 'devis'}/${documentId}/pdf`;

  function getDocumentLabel(type: string) {
    switch (type) {
      case "devis":
        return "Devis";
      case "ordre":
        return "Ordre de travail";
      case "facture":
        return "Facture";
      default:
        return "Document";
    }
  }

  const formatMontant = (montant?: number) => {
    if (!montant) return "";
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FCFA';
  };

  // Generate WhatsApp message
  const whatsappMessage = `Bonjour${clientNom ? ` ${clientNom}` : ''},

Veuillez trouver ci-dessous votre ${getDocumentLabel(documentType).toLowerCase()} n° *${documentNumero}*${montantTTC ? ` d'un montant de *${formatMontant(montantTTC)}*` : ''}.

📄 *Lien du document :*
${pdfUrl}

Pour toute question, n'hésitez pas à nous contacter.

Cordialement,
L'équipe Lojistiga`;

  const handleSendEmail = async () => {
    const email = emailOption === "client" ? clientEmail : customEmail;

    if (!email) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une adresse email.",
        variant: "destructive",
      });
      return;
    }

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
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast({
      title: "Email envoyé",
      description: `Le ${documentType} ${documentNumero} a été envoyé à ${email}`,
    });

    setIsSending(false);
    onOpenChange(false);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopied(true);
    toast({
      title: "Message copié",
      description: "Le message a été copié dans le presse-papiers",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    openWhatsAppShare(whatsappMessage);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Partager le document
          </DialogTitle>
          <DialogDescription>
            Partagez le {getDocumentLabel(documentType).toLowerCase()} <strong>{documentNumero}</strong>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "email" | "whatsapp")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
          </TabsList>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="space-y-3">
              <Label>Destinataire</Label>
              <RadioGroup
                value={emailOption}
                onValueChange={(v) => setEmailOption(v as "client" | "autre")}
                className="space-y-2"
              >
                {clientEmail && (
                  <div className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="client" id="client" />
                    <Label htmlFor="client" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{clientNom || "Client"}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{clientEmail}</p>
                    </Label>
                  </div>
                )}
                <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="autre" id="autre" />
                  <Label htmlFor="autre" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <AtSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Autre destinataire</span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {emailOption === "autre" && (
                <Input
                  type="email"
                  placeholder="email@exemple.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="objet">Objet</Label>
              <Input
                id="objet"
                value={objet}
                onChange={(e) => setObjet(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleSendEmail}
                disabled={isSending}
                className="gap-2"
              >
                {isSending ? (
                  <>Envoi en cours...</>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Envoyer
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Message prêt à partager</Label>
              <div className="relative">
                <Textarea
                  value={whatsappMessage}
                  readOnly
                  rows={10}
                  className="bg-muted/30 text-sm pr-12"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleCopyMessage}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Ce message inclut le lien vers le document PDF
              </p>
            </div>

            {clientTelephone && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                <span className="text-sm">
                  Envoi à : <strong>{clientNom}</strong> ({clientTelephone})
                </span>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleCopyMessage}
                variant="secondary"
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Copier
              </Button>
              <Button
                onClick={handleOpenWhatsApp}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <MessageCircle className="h-4 w-4" />
                Ouvrir WhatsApp
                <ExternalLink className="h-3 w-3" />
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
