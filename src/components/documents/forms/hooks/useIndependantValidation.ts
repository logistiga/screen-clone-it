import { useCallback, useState } from "react";
import { TypeMarchandise, LignePrestationEtendue } from "@/types/documents";
import { ordreIndependantSchema } from "@/lib/validations/ordre-schemas";

/**
 * Gestion centralisée de la validation Zod (touched + errors) pour les
 * formulaires Indépendants — utilisée par OrdreIndependantForm.
 */
export function useIndependantValidation(params: {
  enabled: boolean;
  typeMarchandise: TypeMarchandise | "";
  prestations: LignePrestationEtendue[];
}) {
  const { enabled, typeMarchandise, prestations } = params;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback(
    (fieldPath: string) => {
      if (!enabled) return;
      const result = ordreIndependantSchema.safeParse({ typeMarchandise, prestations });
      setErrors((prev) => {
        const next = { ...prev };
        if (!result.success) {
          const fe = result.error.errors.find((e) => e.path.join(".") === fieldPath);
          if (fe) next[fieldPath] = fe.message;
          else delete next[fieldPath];
        } else {
          delete next[fieldPath];
        }
        return next;
      });
    },
    [enabled, typeMarchandise, prestations],
  );

  const handleBlur = useCallback(
    (fieldPath: string) => {
      if (!enabled) return;
      setTouched((p) => ({ ...p, [fieldPath]: true }));
      validateField(fieldPath);
    },
    [enabled, validateField],
  );

  const getFieldError = (fp: string) => (enabled && touched[fp] ? errors[fp] : undefined);

  return { errors, touched, handleBlur, getFieldError };
}
