

# Ajouter un champ Description pour les OT Conventionnels

## Ce qui va changer

Un champ texte libre "Description" sera ajout dans le formulaire de creation et modification des ordres de travail de type Conventionnel. Ce champ permettra de decrire globalement la marchandise ou l'operation (ex: "Riz en vrac - 500 tonnes", "Bois debite pour export").

## Modifications prevues

### 1. Formulaire OT Conventionnel
- Ajout d'un champ `Textarea` "Description" dans la section "Informations du lot", entre le numero BL et les lieux de chargement/dechargement
- Champ optionnel, texte libre

### 2. Interface TypeScript
- Ajout de `description: string` dans `OrdreConventionnelData`

### 3. Schema de validation
- Ajout du champ `description` (optionnel, max 500 caracteres) dans `ordreConventionnelSchema`

### 4. Envoi au backend
- Le champ `description` sera envoye dans le payload comme `notes` (champ existant dans le modele `OrdreTravail`)
- Fichier `NouvelOrdre.tsx` et `ModifierOrdre.tsx` : mapper `conventionnelData.description` vers le champ `notes` du payload API

### 5. Apercu (OrdrePreview)
- Affichage de la description dans le panneau de previsualisation quand elle est renseignee

### 6. Page de modification
- Pre-remplissage du champ description depuis les donnees existantes (`notes` de l'OT)

---

## Details techniques

**Fichiers modifies :**
- `src/components/ordres/forms/OrdreConventionnelForm.tsx` — ajout du champ Textarea
- `src/lib/validations/ordre-schemas.ts` — ajout dans le schema Zod
- `src/pages/NouvelOrdre.tsx` — mapping vers le payload API
- `src/pages/ModifierOrdre.tsx` — pre-remplissage + mapping
- `src/components/ordres/shared/OrdrePreview.tsx` — affichage dans l'apercu

Aucune modification backend necessaire : le champ `notes` existe deja dans le modele `OrdreTravail` et est accepte par les requetes Store/Update.
