import { useState, useCallback } from "react";
import { z } from "zod";
import { ValidationResult, validateWithSchema } from "@/lib/validations/ordre-schemas";

interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>;
  onValidationError?: (errors: Record<string, string>) => void;
}

interface UseFormValidationResult<T> {
  errors: Record<string, string>;
  validate: (data: unknown) => ValidationResult<T>;
  validateField: (fieldPath: string, value: unknown, fullData: unknown) => string | null;
  clearErrors: () => void;
  clearFieldError: (fieldPath: string) => void;
  setFieldError: (fieldPath: string, message: string) => void;
  hasErrors: boolean;
  getFieldError: (fieldPath: string) => string | undefined;
}

export function useFormValidation<T>({
  schema,
  onValidationError,
}: UseFormValidationOptions<T>): UseFormValidationResult<T> {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = useCallback(
    (data: unknown): ValidationResult<T> => {
      const result = validateWithSchema(schema, data);

      if (!result.success) {
        setErrors(result.errors);
        onValidationError?.(result.errors);
      } else {
        setErrors({});
      }

      return result;
    },
    [schema, onValidationError]
  );

  const validateField = useCallback(
    (fieldPath: string, value: unknown, fullData: unknown): string | null => {
      // Create a partial validation for just this field
      const result = validateWithSchema(schema, fullData);
      
      if (!result.success && result.errors[fieldPath]) {
        setErrors((prev) => ({
          ...prev,
          [fieldPath]: result.errors[fieldPath],
        }));
        return result.errors[fieldPath];
      }

      // Clear the error for this field if it's now valid
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldPath];
        return next;
      });

      return null;
    },
    [schema]
  );

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((fieldPath: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldPath];
      return next;
    });
  }, []);

  const setFieldError = useCallback((fieldPath: string, message: string) => {
    setErrors((prev) => ({
      ...prev,
      [fieldPath]: message,
    }));
  }, []);

  const getFieldError = useCallback(
    (fieldPath: string): string | undefined => {
      return errors[fieldPath];
    },
    [errors]
  );

  const hasErrors = Object.keys(errors).length > 0;

  return {
    errors,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    setFieldError,
    hasErrors,
    getFieldError,
  };
}
