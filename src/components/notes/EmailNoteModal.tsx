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

interface EmailNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteNumero: string;
  clientEmail?: string;
  clientNom?: string;
  noteType: string;
}

export function EmailNoteModal({
  open,
  onOpenChange,
  noteNumero,
  clientEmail,
  clientNom,
  noteType,
}: EmailNoteModalProps) {
  const { toast } = useToast();
  const [emailOption, setEmailOption] = useState<"client" | "autre">(
    clientEmail ? "client" : "autre"
  );
  const [customEmail, setCustomEmail] = useState("");
  const [objet, setObjet] = useState(`Note de début ${noteNumero} - ${noteType}`);
  const [message, setMessage] = useState(
    `Bonjour,\n\nVeuillez trouver ci-joint votre note de début ${noteNumero} (${noteType}).\n\nCordialement,\nL'équipe Lojistiga`
  );
  const [isSending, setIsSending] = useState(false);

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
      description: `La note ${noteNumero} a été envoyée à ${email}`,
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
            Envoyer la note <strong>{noteNumero}</strong> par email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Destinataire</Label>
            <RadioGroup value={emailOption} onValueChange={(v) => setEmailOption(v as "client" | "autre")}>
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
