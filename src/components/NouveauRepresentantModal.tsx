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
import { useToast } from "@/hooks/use-toast";
import { useCreateRepresentant } from "@/hooks/use-commercial";
import { Loader2 } from "lucide-react";

interface NouveauRepresentantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NouveauRepresentantModal({ open, onOpenChange }: NouveauRepresentantModalProps) {
  const { toast } = useToast();
  const createRepresentant = useCreateRepresentant();
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    adresse: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nom.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom est requis",
        variant: "destructive",
      });
      return;
    }

    createRepresentant.mutate(formData, {
      onSuccess: () => {
        toast({
          title: "Représentant créé",
          description: `${formData.nom} a été ajouté avec succès.`,
        });
        setFormData({ nom: "", email: "", telephone: "", adresse: "" });
        onOpenChange(false);
      },
      onError: (error: unknown) => {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
        const status = axiosError?.response?.status;
        let message = "Une erreur est survenue lors de la création.";
        
        if (status === 401) {
          message = "Session expirée. Veuillez vous reconnecter.";
        } else if (status === 403) {
          message = "Vous n'avez pas les permissions pour créer un représentant.";
        } else if (status === 422) {
          message = axiosError?.response?.data?.message || "Données invalides.";
        } else if (status === 500) {
          message = "Erreur serveur. Veuillez réessayer plus tard.";
        }
        
        toast({
          title: "Erreur",
          description: message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nouveau représentant</DialogTitle>
          <DialogDescription>
            Ajoutez un nouveau représentant partenaire.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Nom du représentant"
                disabled={createRepresentant.isPending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemple.com"
                disabled={createRepresentant.isPending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                placeholder="+241 XX XX XX XX"
                disabled={createRepresentant.isPending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                value={formData.adresse}
                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                placeholder="Adresse complète"
                disabled={createRepresentant.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={createRepresentant.isPending}>
              Annuler
            </Button>
            <Button type="submit" disabled={createRepresentant.isPending}>
              {createRepresentant.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
