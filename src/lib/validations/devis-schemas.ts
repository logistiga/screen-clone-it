import { z } from "zod";
import { ValidationResult, validateWithSchema } from "./ordre-schemas";

// ==================== Messages d'erreur en français ====================

const messages = {
  required: "Ce champ est obligatoire",
  string: {
    min: (min: number) => `Doit contenir au moins ${min} caractère${min > 1 ? 's' : ''}`,
    max: (max: number) => `Doit contenir au maximum ${max} caractères`,
    blFormat: "Le numéro de BL doit contenir uniquement des lettres, chiffres et tirets",
  },
  number: {
    positive: "Doit être un nombre positif",
    min: (min: number) => `Doit être au minimum ${min}`,
    max: (max: number) => `Doit être au maximum ${max}`,
  },
  array: {
    min: (min: number) => `Au moins ${min} élément${min > 1 ? 's' : ''} requis`,
  },
  date: {
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

export const devisOperationConteneurSchema = z.object({
  id: z.string(),
  type: z.enum(["arrivee", "stockage", "depotage", "double_relevage", "sortie", "transport", "manutention"], {
    errorMap: () => ({ message: "Type d'opération invalide" }),
  }),
  description: descriptionSchema,
  quantite: quantiteSchema,
  prixUnitaire: prixSchema,
  prixTotal: prixSchema,
});

// ==================== Schéma Ligne Conteneur ====================

export const devisLigneConteneurSchema = z.object({
  id: z.string(),
  numero: numeroConteneurSchema,
  taille: z.enum(["20'", "40'"]).or(z.literal("")),
  description: descriptionSchema,
  prixUnitaire: prixSchema,
  operations: z.array(devisOperationConteneurSchema).optional(),
});

// ==================== Schéma Conteneurs (Import/Export) ====================

export const devisConteneursSchema = z.object({
  typeOperation: z.enum(["import", "export"], {
    errorMap: () => ({ message: "Veuillez sélectionner le type d'opération (Import ou Export)" }),
  }),
  numeroBL: numeroBLSchema,
  armateurId: z.string().optional().or(z.literal("")),
  transitaireId: z.string().optional().or(z.literal("")),
  representantId: z.string().optional().or(z.literal("")),
  conteneurs: z
    .array(devisLigneConteneurSchema)
    .min(1, { message: messages.array.min(1) })
    .refine(
      (conteneurs) => conteneurs.every((c) => c.numero.trim() !== ""),
      { message: "Chaque conteneur doit avoir un numéro" }
    ),
});

// ==================== Schéma Ligne Lot ====================

export const devisLigneLotSchema = z.object({
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

export const devisConventionnelSchema = z.object({
  numeroBL: numeroBLSchema,
  lieuChargement: lieuSchema,
  lieuDechargement: lieuSchema,
  lots: z
    .array(devisLigneLotSchema)
    .min(1, { message: "Au moins un lot est requis" })
    .refine(
      (lots) => lots.every((l) => l.description.trim() !== ""),
      { message: "Chaque lot doit avoir une désignation" }
    ),
});

// ==================== Schéma Prestation Étendue ====================

export const devisLignePrestationSchema = z.object({
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
  lieuChargement: lieuSchema,
  lieuDechargement: lieuSchema,
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

export const devisIndependantSchema = z.object({
  typeOperationIndep: z.enum(["location", "transport", "manutention", "double_relevage", "stockage"], {
    errorMap: () => ({ message: "Veuillez sélectionner un type d'opération" }),
  }),
  lieuChargement: lieuSchema,
  lieuDechargement: lieuSchema,
  prestations: z
    .array(devisLignePrestationSchema)
    .min(1, { message: "Au moins une prestation est requise" }),
});

// ==================== Types inférés ====================

export type DevisConteneursInput = z.infer<typeof devisConteneursSchema>;
export type DevisConventionnelInput = z.infer<typeof devisConventionnelSchema>;
export type DevisIndependantInput = z.infer<typeof devisIndependantSchema>;

// ==================== Helpers de validation ====================

export function validateDevisConteneurs(data: unknown) {
  return validateWithSchema(devisConteneursSchema, data);
}

export function validateDevisConventionnel(data: unknown) {
  return validateWithSchema(devisConventionnelSchema, data);
}

export function validateDevisIndependant(data: unknown) {
  return validateWithSchema(devisIndependantSchema, data);
}
