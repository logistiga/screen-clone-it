import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Ship } from "lucide-react";

interface NouvelArmateurModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NouvelArmateurModal({ open, onOpenChange }: NouvelArmateurModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5" />
            Armateurs
          </DialogTitle>
          <DialogDescription>
            Les armateurs sont synchronisés automatiquement depuis l'application OPS.
            La création manuelle est désactivée.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
