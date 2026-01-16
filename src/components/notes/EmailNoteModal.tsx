import { useState, useEffect } from "react";
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
import { Mail, Send, User, AtSign, Paperclip } from "lucide-react";
import { useSendNoteDebutEmail } from "@/hooks/use-notes-debut";

interface EmailNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  noteId: string;
  noteNumero: string;
  clientEmail?: string;
  clientNom?: string;
  noteType: string;
}

export function EmailNoteModal({
  open,
  onOpenChange,
  noteId,
  noteNumero,
  clientEmail,
  clientNom,
  noteType,
}: EmailNoteModalProps) {
  const [emailOption, setEmailOption] = useState<"client" | "autre">(
    clientEmail ? "client" : "autre"
  );
  const [customEmail, setCustomEmail] = useState("");
  const [objet, setObjet] = useState("");
  const [message, setMessage] = useState("");

  const sendEmailMutation = useSendNoteDebutEmail();

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setEmailOption(clientEmail ? "client" : "autre");
      setCustomEmail("");
      setObjet(`Note de début ${noteNumero} - ${noteType}`);
      setMessage(
        `Bonjour${clientNom ? ` ${clientNom}` : ''},\n\nVeuillez trouver ci-joint votre note de début ${noteNumero} (${noteType}).\n\nLe document PDF est joint à cet email.\n\nCordialement,\nL'équipe LOGISTIGA`
      );
    }
  }, [open, noteNumero, noteType, clientEmail, clientNom]);

  const handleSend = async () => {
    const email = emailOption === "client" ? clientEmail : customEmail;

    if (!email) {
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return;
    }

    try {
      await sendEmailMutation.mutateAsync({
        id: noteId,
        data: {
          destinataire: email,
          sujet: objet,
          message: message,
        },
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const selectedEmail = emailOption === "client" ? clientEmail : customEmail;
  const isValidEmail = selectedEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(selectedEmail);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Envoyer par email
          </DialogTitle>
          <DialogDescription>
            Envoyer la note <strong>{noteNumero}</strong> par email avec le PDF en pièce jointe
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Attachment indicator */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <Paperclip className="h-4 w-4 text-primary" />
            <span className="text-sm">
              <strong>Pièce jointe :</strong> {noteNumero}.pdf
            </span>
          </div>

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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sendEmailMutation.isPending}>
            Annuler
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={sendEmailMutation.isPending || !isValidEmail} 
            className="gap-2"
          >
            {sendEmailMutation.isPending ? (
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
