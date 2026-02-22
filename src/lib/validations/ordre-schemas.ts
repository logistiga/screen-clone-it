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
  .min(1, { message: messages.required })
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

export const operationConteneurSchema = z.object({
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

export const ligneConteneurSchema = z.object({
  id: z.string(),
  numero: numeroConteneurSchema,
  taille: z.enum(["20'", "40'", ""], {
    errorMap: () => ({ message: "Veuillez sélectionner une taille (20' ou 40')" }),
  }).refine((val) => val !== "", { message: "La taille du conteneur est obligatoire" }),
  description: descriptionSchema,
  prixUnitaire: prixSchema,
  operations: z.array(operationConteneurSchema).optional(),
});

// ==================== Schéma Conteneurs (Import/Export) ====================

export const ordreConteneursSchema = z.object({
  typeOperation: z.enum(["import", "export"], {
    errorMap: () => ({ message: "Veuillez sélectionner le type d'opération (Import ou Export)" }),
  }),
  numeroBL: numeroBLSchema,
  armateurId: z.string().optional().or(z.literal("")),
  transitaireId: z.string().optional().or(z.literal("")),
  representantId: z.string().optional().or(z.literal("")),
  primeTransitaire: prixSchema.optional().default(0),
  primeRepresentant: prixSchema.optional().default(0),
  conteneurs: z
    .array(ligneConteneurSchema)
    .min(1, { message: messages.array.min(1) })
    .refine(
      (conteneurs) => conteneurs.every((c) => c.numero.trim() !== ""),
      { message: "Chaque conteneur doit avoir un numéro" }
    ),
});

// ==================== Schéma Ligne Lot ====================

export const ligneLotSchema = z.object({
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

export const ordreConventionnelSchema = z.object({
  numeroBL: numeroBLSchema,
  description: descriptionSchema,
  lieuChargement: lieuSchema,
  lieuDechargement: lieuSchema,
  lots: z
    .array(ligneLotSchema)
    .min(1, { message: "Au moins un lot est requis" })
    .refine(
      (lots) => lots.every((l) => l.description.trim() !== ""),
      { message: "Chaque lot doit avoir une désignation" }
    ),
});

// ==================== Schéma Prestation Étendue ====================

export const lignePrestationEtendueSchema = z.object({
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

export const ordreIndependantSchema = z.object({
  typeOperationIndep: z.enum(["location", "transport", "manutention", "double_relevage", "stockage"], {
    errorMap: () => ({ message: "Veuillez sélectionner un type d'opération" }),
  }),
  prestations: z
    .array(lignePrestationEtendueSchema)
    .min(1, { message: "Au moins une prestation est requise" }),
});

// ==================== Schéma Global Ordre de Travail ====================

export const ordreSchema = z.object({
  clientId: z
    .string()
    .min(1, { message: "Le client est obligatoire" }),
  categorie: z.enum(["conteneurs", "conventionnel", "operations_independantes"], {
    errorMap: () => ({ message: "Veuillez sélectionner une catégorie" }),
  }),
  notes: z
    .string()
    .trim()
    .max(2000, { message: messages.string.max(2000) })
    .optional()
    .or(z.literal("")),
  remiseType: z.enum(["none", "pourcentage", "montant"]).optional(),
  remiseValeur: prixSchema.optional().default(0),
});

// ==================== Types inférés ====================

export type OrdreConteneursInput = z.infer<typeof ordreConteneursSchema>;
export type OrdreConventionnelInput = z.infer<typeof ordreConventionnelSchema>;
export type OrdreIndependantInput = z.infer<typeof ordreIndependantSchema>;
export type OrdreInput = z.infer<typeof ordreSchema>;

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

export function validateOrdreConteneurs(data: unknown) {
  return validateWithSchema(ordreConteneursSchema, data);
}

export function validateOrdreConventionnel(data: unknown) {
  return validateWithSchema(ordreConventionnelSchema, data);
}

export function validateOrdreIndependant(data: unknown) {
  return validateWithSchema(ordreIndependantSchema, data);
}

export function validateOrdre(data: unknown) {
  return validateWithSchema(ordreSchema, data);
}
