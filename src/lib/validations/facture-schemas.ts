import { z } from "zod";

// ==================== Messages d'erreur en français ====================

const messages = {
  required: "Ce champ est obligatoire",
  string: {
    min: (min: number) => `Doit contenir au moins ${min} caractère${min > 1 ? 's' : ''}`,
    max: (max: number) => `Doit contenir au maximum ${max} caractères`,
    blFormat: "Le numéro de BL doit contenir uniquement des lettres, chiffres et tirets",
    containerFormat: "Le numéro de conteneur doit être au format standard (ex: MSKU1234567)",
  },
  number: {
    positive: "Doit être un nombre positif",
    min: (min: number) => `Doit être au minimum ${min}`,
    max: (max: number) => `Doit être au maximum ${max}`,
    integer: "Doit être un nombre entier",
  },
  array: {
    min: (min: number) => `Au moins ${min} élément${min > 1 ? 's' : ''} requis`,
  },
  date: {
    invalid: "Date invalide",
    future: "La date de fin doit être postérieure à la date de début",
  },
  select: {
    required: "Veuillez sélectionner une option",
  },
};

// ==================== Schémas de base réutilisables ====================

const numeroBLSchema = z
  .string()
  .trim()
  .min(1, { message: messages.required })
  .max(50, { message: messages.string.max(50) })
  .regex(/^[A-Za-z0-9/\-]+$/, { message: messages.string.blFormat });

const numeroConteneurSchema = z
  .string()
  .trim()
  .min(1, { message: "Le numéro de conteneur est obligatoire" })
  .max(20, { message: messages.string.max(20) });

const descriptionSchema = z
  .string()
  .trim()
  .max(500, { message: messages.string.max(500) })
  .optional()
  .or(z.literal(""));

const prixSchema = z
  .number({ invalid_type_error: "Doit être un nombre" })
  .min(0, { message: messages.number.positive })
  .max(1000000000, { message: messages.number.max(1000000000) });

const quantiteSchema = z
  .number({ invalid_type_error: "Doit être un nombre" })
  .min(1, { message: messages.number.min(1) })
  .max(10000, { message: messages.number.max(10000) });

const lieuSchema = z
  .string()
  .trim()
  .max(255, { message: messages.string.max(255) })
  .optional()
  .or(z.literal(""));

const dateOptionalSchema = z
  .string()
  .optional()
  .or(z.literal(""));

// ==================== Schéma Opération Conteneur ====================

export const factureOperationConteneurSchema = z.object({
  id: z.string(),
  type: z.enum(["arrivee", "stockage", "depotage", "double_relevage", "sortie", "transport", "manutention", "escorte"], {
    errorMap: () => ({ message: "Type d'opération invalide" }),
  }),
  description: descriptionSchema,
  quantite: quantiteSchema,
  prixUnitaire: prixSchema,
  prixTotal: prixSchema,
});

// ==================== Schéma Ligne Conteneur ====================

export const factureLigneConteneurSchema = z.object({
  id: z.string(),
  numero: numeroConteneurSchema,
  taille: z.enum(["20'", "40'", ""], {
    errorMap: () => ({ message: "Veuillez sélectionner une taille (20' ou 40')" }),
  }).refine((val) => val !== "", { message: "La taille du conteneur est obligatoire" }),
  description: descriptionSchema,
  prixUnitaire: prixSchema,
  operations: z.array(factureOperationConteneurSchema).optional(),
});

// ==================== Schéma Conteneurs Facture ====================

export const factureConteneursSchema = z.object({
  typeOperation: z.enum(["import", "export", ""], {
    errorMap: () => ({ message: "Veuillez sélectionner Import ou Export" }),
  }).refine((val) => val !== "", { message: "Le type d'opération est obligatoire" }),
  numeroBL: numeroBLSchema,
  armateurId: z
    .string()
    .min(1, { message: "L'armateur est obligatoire" }),
  transitaireId: z.string().optional().or(z.literal("")),
  representantId: z.string().optional().or(z.literal("")),
  primeTransitaire: prixSchema.optional().default(0),
  primeRepresentant: prixSchema.optional().default(0),
  conteneurs: z
    .array(factureLigneConteneurSchema)
    .min(1, { message: messages.array.min(1) })
    .refine(
      (conteneurs) => conteneurs.every((c) => c.numero.trim() !== ""),
      { message: "Chaque conteneur doit avoir un numéro" }
    ),
});

// ==================== Schéma Ligne Lot ====================

export const factureLigneLotSchema = z.object({
  id: z.string(),
  numeroLot: z
    .string()
    .trim()
    .max(50, { message: messages.string.max(50) })
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .trim()
    .min(1, { message: "La désignation du lot est obligatoire" })
    .max(255, { message: messages.string.max(255) }),
  quantite: quantiteSchema,
  prixUnitaire: prixSchema,
  prixTotal: prixSchema,
});

// ==================== Schéma Conventionnel (Lots) ====================

export const factureConventionnelSchema = z.object({
  numeroBL: numeroBLSchema,
  lieuChargement: z
    .string()
    .trim()
    .min(1, { message: "Le lieu de chargement est obligatoire" })
    .max(255, { message: messages.string.max(255) }),
  lieuDechargement: z
    .string()
    .trim()
    .min(1, { message: "Le lieu de déchargement est obligatoire" })
    .max(255, { message: messages.string.max(255) }),
  lots: z
    .array(factureLigneLotSchema)
    .min(1, { message: "Au moins un lot est requis" })
    .refine(
      (lots) => lots.every((l) => l.description.trim() !== ""),
      { message: "Chaque lot doit avoir une désignation" }
    ),
});

// ==================== Schéma Prestation Étendue ====================

export const factureLignePrestationSchema = z.object({
  id: z.string(),
  description: z
    .string()
    .trim()
    .min(1, { message: "La description de la prestation est obligatoire" })
    .max(500, { message: messages.string.max(500) }),
  quantite: quantiteSchema,
  prixUnitaire: prixSchema,
  montantHT: prixSchema,
  lieuDepart: lieuSchema,
  lieuArrivee: lieuSchema,
  dateDebut: dateOptionalSchema,
  dateFin: dateOptionalSchema,
}).refine(
  (data) => {
    if (data.dateDebut && data.dateFin) {
      return new Date(data.dateFin) >= new Date(data.dateDebut);
    }
    return true;
  },
  { message: messages.date.future, path: ["dateFin"] }
);

// ==================== Schéma Opérations Indépendantes ====================

export const factureIndependantSchema = z.object({
  typeOperationIndep: z.enum(["location", "transport", "manutention", "double_relevage", "stockage"], {
    errorMap: () => ({ message: "Veuillez sélectionner un type d'opération" }),
  }),
  prestations: z
    .array(factureLignePrestationSchema)
    .min(1, { message: "Au moins une prestation est requise" }),
});

// ==================== Types inférés ====================

export type FactureConteneursInput = z.infer<typeof factureConteneursSchema>;
export type FactureConventionnelInput = z.infer<typeof factureConventionnelSchema>;
export type FactureIndependantInput = z.infer<typeof factureIndependantSchema>;

// ==================== Fonction de validation avec messages formatés ====================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors: Record<string, string>;
  firstError?: string;
}

export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
      errors: {},
    };
  }

  const errors: Record<string, string> = {};
  let firstError: string | undefined;

  result.error.errors.forEach((err) => {
    const path = err.path.join(".");
    if (!errors[path]) {
      errors[path] = err.message;
      if (!firstError) {
        firstError = err.message;
      }
    }
  });

  return {
    success: false,
    errors,
    firstError,
  };
}

// ==================== Helpers de validation par catégorie ====================

export function validateFactureConteneurs(data: unknown) {
  return validateWithSchema(factureConteneursSchema, data);
}

export function validateFactureConventionnel(data: unknown) {
  return validateWithSchema(factureConventionnelSchema, data);
}

export function validateFactureIndependant(data: unknown) {
  return validateWithSchema(factureIndependantSchema, data);
}

// ==================== Validation de champs individuels ====================

export function validateField(
  schema: z.ZodSchema,
  fieldPath: string,
  value: unknown
): string | null {
  try {
    schema.parse(value);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldError = error.errors.find(
        (e) => e.path.join(".") === fieldPath || e.path.length === 0
      );
      return fieldError?.message || error.errors[0]?.message || null;
    }
    return null;
  }
}

// Schémas pour validation inline
export const fieldSchemas = {
  numeroBL: numeroBLSchema,
  numeroConteneur: numeroConteneurSchema,
  description: z.string().trim().min(1, { message: messages.required }),
  prix: prixSchema,
  quantite: quantiteSchema,
  lieu: z.string().trim().min(1, { message: messages.required }),
  armateurId: z.string().min(1, { message: "L'armateur est obligatoire" }),
  taille: z.enum(["20'", "40'"], { errorMap: () => ({ message: "Veuillez sélectionner une taille" }) }),
};
