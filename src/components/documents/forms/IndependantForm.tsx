import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormError } from "@/components/ui/form-error";
import {
  TypeOperationIndep,
  TypeMarchandise,
  LignePrestationEtendue,
  getInitialPrestationEtendue,
  getTypeMarchandiseLabels,
  calculateDaysBetween,
} from "@/types/documents";
import { ordreIndependantSchema } from "@/lib/validations/ordre-schemas";
import OperationsIndependantesForm from "@/components/operations/OperationsIndependantesForm";

/**
 * Données communes à tous les formulaires Indépendant
 * (Devis / Ordre / Facture). `lieuChargement` / `lieuDechargement`
 * ne sont utilisés que côté Devis mais conservés ici pour simplifier.
 */
export interface IndependantFormData {
  /** @deprecated conservé pour compat ; ne plus utiliser */
  typeOperationIndep: TypeOperationIndep | "";
  typeMarchandise: TypeMarchandise | "";
  descriptionGenerale: string;
  observationInterne: string;
  lieuChargement?: string;
  lieuDechargement?: string;
  prestations: LignePrestationEtendue[];
  montantHT: number;
}

export interface IndependantFormInitial extends Partial<IndependantFormData> {}

interface IndependantFormProps {
  onDataChange: (data: IndependantFormData) => void;
  initialData?: IndependantFormInitial | null;
  /** Suivre les lieux de chargement/déchargement (Devis uniquement). */
  trackLieux?: boolean;
  /** Activer la validation Zod + FormError (Ordre uniquement). */
  withValidation?: boolean;
}

export default function IndependantForm({
  onDataChange,
  initialData,
  trackLieux = false,
  withValidation = false,
}: IndependantFormProps) {
  const lastInitKey = useRef<string>("");
  const [typeMarchandise, setTypeMarchandise] = useState<TypeMarchandise | "">(
    initialData?.typeMarchandise ?? ""
  );
  const [descriptionGenerale, setDescriptionGenerale] = useState(
    initialData?.descriptionGenerale ?? ""
  );
  const [observationInterne, setObservationInterne] = useState(
    initialData?.observationInterne ?? ""
  );
  const [lieuChargement, setLieuChargement] = useState(initialData?.lieuChargement ?? "");
  const [lieuDechargement, setLieuDechargement] = useState(initialData?.lieuDechargement ?? "");
  const [prestations, setPrestations] = useState<LignePrestationEtendue[]>(
    initialData?.prestations?.length ? initialData.prestations : [getInitialPrestationEtendue()]
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Sync avec initialData (anti-boucle via lastInitKey)
  useEffect(() => {
    if (!initialData) return;
    const key = JSON.stringify({
      tm: initialData.typeMarchandise ?? "",
      dg: initialData.descriptionGenerale ?? "",
      oi: initialData.observationInterne ?? "",
      ps: (initialData.prestations ?? []).map((p) => p.id),
    });
    if (key === lastInitKey.current) return;
    if (initialData.typeMarchandise !== undefined)
      setTypeMarchandise(initialData.typeMarchandise ?? "");
    if (initialData.descriptionGenerale !== undefined)
      setDescriptionGenerale(initialData.descriptionGenerale ?? "");
    if (initialData.observationInterne !== undefined)
      setObservationInterne(initialData.observationInterne ?? "");
    if (initialData.prestations?.length) {
      const oldType = initialData.typeOperationIndep;
      setPrestations(
        initialData.prestations.map((p) => ({
          ...p,
          typeOperation: p.typeOperation || (oldType as TypeOperationIndep | "") || "",
        }))
      );
    }
    lastInitKey.current = key;
  }, [initialData]);

  const totalHT = (items: LignePrestationEtendue[]) =>
    items.reduce((s, p) => s + (p.montantHT || 0), 0);

  useEffect(() => {
    const payload: IndependantFormData = {
      typeOperationIndep: "",
      typeMarchandise,
      descriptionGenerale,
      observationInterne,
      prestations,
      montantHT: totalHT(prestations),
    };
    if (trackLieux) {
      payload.lieuChargement = lieuChargement;
      payload.lieuDechargement = lieuDechargement;
    }
    onDataChange(payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeMarchandise, descriptionGenerale, observationInterne, prestations, lieuChargement, lieuDechargement]);

  const validateField = useCallback(
    (fieldPath: string) => {
      if (!withValidation) return;
      const data = { typeMarchandise, prestations };
      const result = ordreIndependantSchema.safeParse(data);
      if (!result.success) {
        const fe = result.error.errors.find((e) => e.path.join(".") === fieldPath);
        if (fe) setErrors((p) => ({ ...p, [fieldPath]: fe.message }));
        else
          setErrors((p) => {
            const n = { ...p };
            delete n[fieldPath];
            return n;
          });
      } else {
        setErrors((p) => {
          const n = { ...p };
          delete n[fieldPath];
          return n;
        });
      }
    },
    [withValidation, typeMarchandise, prestations]
  );

  const handleBlur = (fieldPath: string) => {
    if (!withValidation) return;
    setTouched((p) => ({ ...p, [fieldPath]: true }));
    validateField(fieldPath);
  };

  const getFieldError = (fp: string) =>
    withValidation && touched[fp] ? errors[fp] : undefined;

  const handleAddPrestation = () => {
    setPrestations([...prestations, { ...getInitialPrestationEtendue(), id: String(Date.now()) }]);
  };
  const handleRemovePrestation = (id: string) => {
    if (prestations.length > 1) setPrestations(prestations.filter((p) => p.id !== id));
  };
  const handlePrestationChange = (
    id: string,
    field: keyof LignePrestationEtendue,
    value: string | number
  ) => {
    setPrestations((curr) =>
      curr.map((p) => {
        if (p.id !== id) return p;
        const updated: LignePrestationEtendue = { ...p, [field]: value } as LignePrestationEtendue;
        if (field === "dateDebut" || field === "dateFin") {
          const d = field === "dateDebut" ? String(value) : updated.dateDebut || "";
          const f = field === "dateFin" ? String(value) : updated.dateFin || "";
          if (d && f) {
            updated.quantite = calculateDaysBetween(d, f);
            updated.montantHT = updated.quantite * updated.prixUnitaire;
          }
        }
        if (field === "quantite" || field === "prixUnitaire") {
          updated.montantHT = updated.quantite * updated.prixUnitaire;
        }
        if (trackLieux && field === "lieuDepart") setLieuChargement(String(value));
        if (trackLieux && field === "lieuArrivee") setLieuDechargement(String(value));
        return updated;
      })
    );
  };

  const marchandiseLabels = getTypeMarchandiseLabels();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations marchandise</CardTitle>
          <CardDescription>Type, description et observation pour cette opération.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Type de marchandise *</Label>
            <Select
              value={typeMarchandise || undefined}
              onValueChange={(v) => {
                setTypeMarchandise(v as TypeMarchandise);
                handleBlur("typeMarchandise");
              }}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(marchandiseLabels) as TypeMarchandise[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {marchandiseLabels[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {withValidation && <FormError message={getFieldError("typeMarchandise")} />}
          </div>

          <div className="space-y-2">
            <Label>Description générale</Label>
            <Textarea
              value={descriptionGenerale}
              onChange={(e) => setDescriptionGenerale(e.target.value)}
              rows={3}
              placeholder="Description de l'opération (visible sur le document)"
            />
          </div>

          <div className="space-y-2">
            <Label>Observation interne</Label>
            <Textarea
              value={observationInterne}
              onChange={(e) => setObservationInterne(e.target.value)}
              rows={3}
              placeholder="Notes internes (non imprimées sur le PDF)"
            />
          </div>
        </CardContent>
      </Card>

      <OperationsIndependantesForm
        prestations={prestations}
        onAddPrestation={handleAddPrestation}
        onRemovePrestation={handleRemovePrestation}
        onPrestationChange={handlePrestationChange}
        onReplacePrestations={setPrestations}
        errors={withValidation ? errors : undefined}
        touched={withValidation ? touched : undefined}
        onBlur={withValidation ? handleBlur : undefined}
      />
    </div>
  );
}
