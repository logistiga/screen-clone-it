import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LignePrestationEtendue,
  TypeOperationIndepCreation,
  calculateDaysBetween,
  getOperationsIndepLabels,
} from "@/types/documents";
import {
  DESTINATIONS_TRANSPORT,
  TYPE_TRANSPORT_LABELS,
  MODE_TRAJET_LABELS,
  POINT_DEPART_DEFAUT,
} from "@/data/transportData";
import { MATERIELS_LOCATION, MATERIELS_MANUTENTION } from "@/data/materielsData";
import { formatMontant } from "@/data/mockData";
import { toast } from "sonner";

interface LigneModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (ligne: LignePrestationEtendue) => void;
  initial?: LignePrestationEtendue | null;
}

const computeMontant = (l: LignePrestationEtendue): number =>
  (l.quantite || 0) * (l.prixUnitaire || 0);

export default function LigneModal({ open, onClose, onSubmit, initial }: LigneModalProps) {
  const [ligne, setLigne] = useState<LignePrestationEtendue>(() => initial ?? defaultLigne());
  const isEdit = !!initial?.id && !!initial?.typeOperation;
  const labels = getOperationsIndepLabels();

  useEffect(() => {
    if (open) setLigne(initial ?? defaultLigne());
  }, [open, initial]);

  const setField = <K extends keyof LignePrestationEtendue>(k: K, v: LignePrestationEtendue[K]) =>
    setLigne((p) => ({ ...p, [k]: v }));

  // Recalcul quantité/montant pour location
  useEffect(() => {
    if (ligne.typeOperation === "location" && ligne.dateDebut && ligne.dateFin) {
      const jours = calculateDaysBetween(ligne.dateDebut, ligne.dateFin);
      setLigne((p) => ({
        ...p,
        nombreJours: jours,
        quantite: jours,
        montantHT: jours * (p.prixUnitaire || 0),
      }));
    }
  }, [ligne.typeOperation, ligne.dateDebut, ligne.dateFin]);

  const montant = useMemo(() => computeMontant(ligne), [ligne.quantite, ligne.prixUnitaire]);

  const validate = (): string | null => {
    if (!ligne.typeOperation) return "Sélectionnez un type de ligne";
    const t = ligne.typeOperation;
    if (t === "transport") {
      if (!ligne.pointArrivee) return "Point d'arrivée requis";
      if (!ligne.typeTransport) return "Type de transport requis";
      if (!ligne.modeTrajet) return "Mode de trajet requis";
      if (!ligne.quantite || ligne.quantite < 1) return "Quantité requise";
      if (ligne.prixUnitaire == null || ligne.prixUnitaire < 0) return "Prix requis";
    } else if (t === "location") {
      if (!ligne.materiel) return "Matériel à louer requis";
      if (!ligne.dateDebut || !ligne.dateFin) return "Dates de location requises";
      if (ligne.prixUnitaire == null || ligne.prixUnitaire < 0) return "Prix par jour requis";
    } else if (t === "manutention") {
      if (!ligne.materiel) return "Matériel utilisé requis";
      if (!ligne.quantite || ligne.quantite < 1) return "Quantité requise";
    } else if (t === "autre") {
      if (!ligne.description?.trim()) return "Description requise";
      if (!ligne.quantite || ligne.quantite < 1) return "Quantité requise";
    }
    return null;
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    const finalLigne: LignePrestationEtendue = {
      ...ligne,
      id: ligne.id || String(Date.now()),
      pointDepart: ligne.typeOperation === "transport" ? (ligne.pointDepart || POINT_DEPART_DEFAUT) : ligne.pointDepart,
      // Mirroir BDD legacy
      lieuDepart: ligne.typeOperation === "transport" ? (ligne.pointDepart || POINT_DEPART_DEFAUT) : ligne.lieuDepart || "",
      lieuArrivee: ligne.typeOperation === "transport" ? (ligne.pointArrivee || "") : ligne.lieuArrivee || "",
      description: deriveDescription(ligne),
      montantHT: computeMontant(ligne),
    };
    onSubmit(finalLigne);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la ligne" : "Ajouter une ligne"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type de ligne */}
          <div className="space-y-2">
            <Label>Type de ligne *</Label>
            <Select
              value={ligne.typeOperation || undefined}
              onValueChange={(v) => setField("typeOperation", v as TypeOperationIndepCreation)}
            >
              <SelectTrigger className="h-11"><SelectValue placeholder="Choisir un type" /></SelectTrigger>
              <SelectContent>
                {(Object.keys(labels) as TypeOperationIndepCreation[]).map((k) => (
                  <SelectItem key={k} value={k}>{labels[k].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Une opération peut combiner plusieurs types de lignes.</p>
          </div>

          {/* TRANSPORT */}
          {ligne.typeOperation === "transport" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Point de départ *</Label>
                  <Input value={ligne.pointDepart || POINT_DEPART_DEFAUT} onChange={(e) => setField("pointDepart", e.target.value)} className="h-11" />
                  <p className="text-xs text-muted-foreground">Toutes les distances sont calculées au départ de Libreville.</p>
                </div>
                <div className="space-y-2">
                  <Label>Point d'arrivée *</Label>
                  <Select value={ligne.pointArrivee || undefined} onValueChange={(v) => setField("pointArrivee", v)}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Choisir une destination" /></SelectTrigger>
                    <SelectContent>{DESTINATIONS_TRANSPORT.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type de transport *</Label>
                  <Select value={ligne.typeTransport || undefined} onValueChange={(v) => setField("typeTransport", v as any)}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent>{Object.entries(TYPE_TRANSPORT_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mode de trajet *</Label>
                  <Select value={ligne.modeTrajet || undefined} onValueChange={(v) => setField("modeTrajet", v as any)}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent>{Object.entries(MODE_TRAJET_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NumberField label="Quantité *" value={ligne.quantite} onChange={(v) => setField("quantite", v)} min={1} />
                <NumberField label="Prix transport (FCFA) *" value={ligne.prixUnitaire} onChange={(v) => setField("prixUnitaire", v)} />
              </div>
              <TextAreaField label="Description (optionnel)" value={ligne.description} onChange={(v) => setField("description", v)} />
            </>
          )}

          {/* LOCATION */}
          {ligne.typeOperation === "location" && (
            <>
              <div className="space-y-2">
                <Label>Matériel à louer *</Label>
                <Select value={ligne.materiel || undefined} onValueChange={(v) => setField("materiel", v)}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Choisir un matériel" /></SelectTrigger>
                  <SelectContent>{MATERIELS_LOCATION.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date de début *</Label>
                  <Input type="date" value={ligne.dateDebut || ""} onChange={(e) => setField("dateDebut", e.target.value)} className="h-11" />
                </div>
                <div className="space-y-2">
                  <Label>Date de fin *</Label>
                  <Input type="date" value={ligne.dateFin || ""} onChange={(e) => setField("dateFin", e.target.value)} className="h-11" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NumberField label="Nombre de jours *" value={ligne.nombreJours || 1} onChange={(v) => { setField("nombreJours", v); setField("quantite", v); }} min={1} />
                <NumberField label="Prix par jour (FCFA) *" value={ligne.prixUnitaire} onChange={(v) => setField("prixUnitaire", v)} />
              </div>
              <TextAreaField label="Description (optionnel)" value={ligne.description} onChange={(v) => setField("description", v)} />
              <TotalBanner label="Total location" montant={montant} />
            </>
          )}

          {/* MANUTENTION */}
          {ligne.typeOperation === "manutention" && (
            <>
              <div className="space-y-2">
                <Label>Matériel utilisé *</Label>
                <Select value={ligne.materiel || undefined} onValueChange={(v) => setField("materiel", v)}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Choisir un matériel" /></SelectTrigger>
                  <SelectContent>{MATERIELS_MANUTENTION.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <TextAreaField label="Description" value={ligne.description} onChange={(v) => setField("description", v)} placeholder="Détails de la prestation de manutention" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NumberField label="Quantité *" value={ligne.quantite} onChange={(v) => setField("quantite", v)} min={1} />
                <NumberField label="Prix unitaire (FCFA) *" value={ligne.prixUnitaire} onChange={(v) => setField("prixUnitaire", v)} />
              </div>
              <TotalBanner label="Total manutention" montant={montant} />
            </>
          )}

          {/* AUTRE */}
          {ligne.typeOperation === "autre" && (
            <>
              <TextAreaField label="Description *" value={ligne.description} onChange={(v) => setField("description", v)} placeholder="Décrire la prestation" required />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NumberField label="Quantité *" value={ligne.quantite} onChange={(v) => setField("quantite", v)} min={1} />
                <NumberField label="Prix unitaire (FCFA) *" value={ligne.prixUnitaire} onChange={(v) => setField("prixUnitaire", v)} />
              </div>
              <TotalBanner label="Total" montant={montant} />
            </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
          <Button type="button" onClick={handleSubmit}>{isEdit ? "Enregistrer" : "Ajouter"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function defaultLigne(): LignePrestationEtendue {
  return {
    id: "",
    typeOperation: "",
    description: "",
    quantite: 1,
    prixUnitaire: 0,
    montantHT: 0,
    pointDepart: POINT_DEPART_DEFAUT,
    pointArrivee: "",
    typeTransport: "",
    modeTrajet: "",
    materiel: "",
    dateDebut: "",
    dateFin: "",
    nombreJours: 1,
  };
}

function deriveDescription(l: LignePrestationEtendue): string {
  // On garde toujours la description saisie par l'utilisateur (peut être vide).
  // Le "trajet" (Transport X → Y) est désormais affiché à partir de pointDepart/pointArrivee
  // et n'écrase plus la description.
  return (l.description || "").trim();
}

function NumberField({ label, value, onChange, min = 0 }: { label: string; value?: number; onChange: (v: number) => void; min?: number }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type="number" min={min} value={value ?? ""} onChange={(e) => onChange(parseInt(e.target.value) || 0)} className="h-11" />
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder, required }: { label: string; value?: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <div className="space-y-2">
      <Label>{label}{required ? " *" : ""}</Label>
      <Textarea value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} />
    </div>
  );
}

function TotalBanner({ label, montant }: { label: string; montant: number }) {
  return (
    <div className="rounded-md bg-muted/40 px-3 py-2 text-sm">
      {label} : <span className="font-semibold">{formatMontant(montant)}</span>
    </div>
  );
}
