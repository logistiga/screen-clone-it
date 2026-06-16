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

interface OrdreIndependantFormProps {
  onDataChange: (data: OrdreIndependantData) => void;
  initialData?: Partial<OrdreIndependantData>;
}

export interface OrdreIndependantData {
  /** @deprecated conservé pour compat ; ne plus utiliser */
  typeOperationIndep: TypeOperationIndep | "";
  typeMarchandise: TypeMarchandise | "";
  descriptionGenerale: string;
  observationInterne: string;
  prestations: LignePrestationEtendue[];
  montantHT: number;
}

export default function OrdreIndependantForm({ onDataChange, initialData }: OrdreIndependantFormProps) {
  const lastInitKey = useRef<string>("");
  const [typeMarchandise, setTypeMarchandise] = useState<TypeMarchandise | "">(
    initialData?.typeMarchandise ?? ""
  );
  const [descriptionGenerale, setDescriptionGenerale] = useState(initialData?.descriptionGenerale ?? "");
  const [observationInterne, setObservationInterne] = useState(initialData?.observationInterne ?? "");
  const [prestations, setPrestations] = useState<LignePrestationEtendue[]>(
    initialData?.prestations?.length ? initialData.prestations : [getInitialPrestationEtendue()]
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Synchroniser avec initialData
  useEffect(() => {
    if (!initialData) return;
    const initKey = JSON.stringify({
      tm: initialData.typeMarchandise ?? "",
      dg: initialData.descriptionGenerale ?? "",
      oi: initialData.observationInterne ?? "",
      prestations: (initialData.prestations ?? []).map((p) => ({
        id: p.id,
        typeOperation: p.typeOperation,
        description: p.description,
        quantite: p.quantite,
        prixUnitaire: p.prixUnitaire,
      })),
    });
    if (initKey === lastInitKey.current) return;
    if (initialData.typeMarchandise !== undefined) setTypeMarchandise(initialData.typeMarchandise ?? "");
    if (initialData.descriptionGenerale !== undefined)
      setDescriptionGenerale(initialData.descriptionGenerale ?? "");
    if (initialData.observationInterne !== undefined)
      setObservationInterne(initialData.observationInterne ?? "");
    if (initialData.prestations && initialData.prestations.length > 0) {
      // Fallback : si lignes sans typeOperation mais avec typeOperationIndep (ancien) -> hériter
      const oldType = initialData.typeOperationIndep;
      setPrestations(
        initialData.prestations.map((p) => ({
          ...p,
          typeOperation: p.typeOperation || (oldType as TypeOperationIndep | "") || "",
        }))
      );
    }
    lastInitKey.current = initKey;
  }, [initialData]);

  const validateField = useCallback(
    (fieldPath: string) => {
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
    [typeMarchandise, prestations]
  );

  const handleBlur = (fieldPath: string) => {
    setTouched((p) => ({ ...p, [fieldPath]: true }));
    validateField(fieldPath);
  };

  const getFieldError = (fp: string) => (touched[fp] ? errors[fp] : undefined);

  const calculateTotalPrestations = (items: LignePrestationEtendue[]) =>
    items.reduce((s, p) => s + (p.montantHT || 0), 0);

  const pushParent = (
    items: LignePrestationEtendue[],
    overrides?: Partial<OrdreIndependantData>
  ) => {
    onDataChange({
      typeOperationIndep: "",
      typeMarchandise,
      descriptionGenerale,
      observationInterne,
      prestations: items,
      montantHT: calculateTotalPrestations(items),
      ...overrides,
    });
  };

  useEffect(() => {
    pushParent(prestations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prestations, typeMarchandise, descriptionGenerale, observationInterne]);

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
            <FormError message={getFieldError("typeMarchandise")} />
          </div>

          <div className="space-y-2">
            <Label>Description générale</Label>
            <Textarea
              placeholder="Description de l'opération (visible sur le document)"
              value={descriptionGenerale}
              onChange={(e) => setDescriptionGenerale(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Observation interne</Label>
            <Textarea
              placeholder="Notes internes (non imprimées sur le PDF)"
              value={observationInterne}
              onChange={(e) => setObservationInterne(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <OperationsIndependantesForm
        prestations={prestations}
        onAddPrestation={handleAddPrestation}
        onRemovePrestation={handleRemovePrestation}
        onPrestationChange={handlePrestationChange}
        errors={errors}
        touched={touched}
        onBlur={handleBlur}
      />
    </div>
  );
}
