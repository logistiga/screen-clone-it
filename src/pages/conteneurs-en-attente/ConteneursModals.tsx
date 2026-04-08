import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RefreshCw, Link as LinkIcon } from "lucide-react";
import { ConteneurTraite } from "@/lib/api/conteneurs-traites";

interface Props {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  selectedConteneur: ConteneurTraite | null;
  selectedOrdreId: string;
  setSelectedOrdreId: (v: string) => void;
  ordres: any[];
  handleConfirm: () => void;
  isPending: boolean;
}

export function ConteneursAffecterDialog({ isOpen, setIsOpen, selectedConteneur, selectedOrdreId, setSelectedOrdreId, ordres, handleConfirm, isPending }: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Affecter à un ordre de travail</DialogTitle>
          <DialogDescription>
            Sélectionnez l'ordre de travail auquel affecter le conteneur{" "}
            <strong className="font-mono">{selectedConteneur?.numero_conteneur}</strong>
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select value={selectedOrdreId} onValueChange={setSelectedOrdreId}>
            <SelectTrigger><SelectValue placeholder="Choisir un ordre de travail" /></SelectTrigger>
            <SelectContent>
              {ordres.map((ordre: any) => (
                <SelectItem key={ordre.id} value={String(ordre.id)}>{ordre.numero} - {ordre.client?.nom || 'Client inconnu'}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
          <Button onClick={handleConfirm} disabled={!selectedOrdreId || isPending}>
            {isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <LinkIcon className="h-4 w-4 mr-2" />}
            Affecter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
