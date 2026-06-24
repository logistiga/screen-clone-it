# Enregistrement d'une ligne — Indépendant / Transport

Ce document décrit **exactement** comment une ligne de type **Transport** d'un devis/ordre/facture
catégorie « Opérations Indépendantes » est saisie côté front, transformée, envoyée à l'API, validée
et persistée côté backend. Objectif : permettre à une autre application de produire/consommer le
même payload sans ambiguïté.

---

## 1. Contexte

- **Catégorie de document** : `operations_independantes` (mappé en `type_document = "Independant"`).
- **Une ligne = une prestation**. Un même devis peut combiner plusieurs lignes de types différents
  (`transport`, `location`, `manutention`, `autre`, `double_relevage`, `stockage`).
- Le **type d'opération est porté par la ligne** (`type_operation` sur la ligne), pas au niveau du
  document. Le champ `type_operation_indep` au niveau document est rempli en fallback avec la valeur
  de la première ligne pour compatibilité.

---

## 2. Saisie utilisateur (modale `LigneModal`)

Quand l'utilisateur choisit **Type de ligne = Transport**, le formulaire impose les champs suivants :

| Champ UI                | Clé front (`LignePrestationEtendue`) | Obligatoire | Notes |
|-------------------------|--------------------------------------|-------------|-------|
| Type de ligne           | `typeOperation = "transport"`        | ✅          | Fixe la branche transport |
| Point de départ         | `pointDepart`                        | ✅          | Défaut **"Libreville"** (`POINT_DEPART_DEFAUT`) |
| Point d'arrivée         | `pointArrivee`                       | ✅          | Liste fermée `DESTINATIONS_TRANSPORT` (Port-Gentil, Franceville, Oyem, Mouila, Lambaréné, Tchibanga, Makokou, Koulamoutou, Bitam, Gamba, Owendo, Akanda, Ntoum, Kango, Cocobeach, Médouneu, Mitzic, Booué, Lastoursville, Moanda, Mounana, Ndjolé, Bifoun, Lopé) |
| Type de transport       | `typeTransport`                      | ✅          | `conteneur` \| `marchandise` \| `engin` \| `materiel` |
| Mode de trajet          | `modeTrajet`                         | ✅          | `aller_simple` \| `aller_retour` |
| Quantité                | `quantite` (entier ≥ 1)              | ✅          | Nombre de trajets / unités facturées |
| Prix transport (FCFA)   | `prixUnitaire` (entier ≥ 0)          | ✅          | Prix unitaire HT par trajet/unité |
| Description (optionnel) | `description`                        | ❌          | Texte libre ; si vide, dérivé en `"Transport <depart> → <arrivee>"` |

Calcul côté front à la soumission :

```
montantHT = quantite * prixUnitaire
```

Miroir « legacy » écrit aussi sur la ligne avant envoi (pour compat BDD ancienne) :

```
lieuDepart  = pointDepart  (ou "Libreville" si vide)
lieuArrivee = pointArrivee
description = description saisie  OU  "Transport <pointDepart> → <pointArrivee>"
```

---

## 3. Transformation front → payload API

Source : `src/components/devis/shared/useDevisForm.ts` (`buildPayload`).

Au niveau **document** :

```json
{
  "client_id": 123,
  "type_document": "Independant",
  "type_operation_indep": "transport",          // = type_operation de la 1ère ligne (fallback)
  "type_marchandise": "conteneur|materiel|marchandise_generale|engin|autre|null",
  "description_generale": "string|null",
  "observation_interne": "string|null",
  "date_validite": "YYYY-MM-DD",
  "notes": "string|null",
  "remise_type": "pourcentage|montant|null",
  "remise_valeur": 0,
  "taxes_selection": { "selected_tax_codes": ["TVA","CSS"], "has_exoneration": false, "exonerated_tax_codes": [], "motif_exoneration": null },
  "lignes": [ /* voir ci-dessous */ ]
}
```

Au niveau **ligne Transport** (objet dans `lignes[]`) :

```json
{
  "type_operation":  "transport",
  "description":     "Transport Libreville → Franceville",
  "lieu_depart":     "Libreville",
  "lieu_arrivee":    "Franceville",
  "point_depart":    "Libreville",
  "point_arrivee":   "Franceville",
  "type_transport":  "conteneur",
  "mode_trajet":     "aller_retour",
  "materiel":        null,
  "nombre_jours":    null,
  "date_debut":      null,
  "date_fin":        null,
  "quantite":        2,
  "prix_unitaire":   450000
}
```

Règles d'envoi :
- Les clés `lieu_depart` / `lieu_arrivee` sont **doublées** depuis `point_depart` / `point_arrivee`
  pour compat. Une appli tierce peut envoyer uniquement les deux paires identiques.
- Les champs non pertinents pour Transport (`materiel`, `date_debut`, `date_fin`, `nombre_jours`)
  doivent être envoyés à `null` (acceptés en `nullable` côté backend).
- `quantite` et `prix_unitaire` sont **obligatoires** pour que le total HT soit calculé.
- Aucune ligne sans `type_operation` n'est envoyée (filtrée côté front).

---

## 4. Validation et persistance backend

### 4.1 Validation HTTP — `StoreDevisRequest`

```php
'type_operation_indep' => 'nullable|string|in:location,transport,manutention,double_relevage,stockage',
'lignes'               => 'nullable|array',
'lignes.*.type_operation' => 'nullable|string|max:100',
'lignes.*.lieu_depart'    => 'nullable|string|max:255',
'lignes.*.lieu_arrivee'   => 'nullable|string|max:255',
'lignes.*.point_depart'   => 'nullable|string|max:100',
'lignes.*.point_arrivee'  => 'nullable|string|max:100',
'lignes.*.type_transport' => 'nullable|string|max:30',
'lignes.*.mode_trajet'    => 'nullable|string|max:20',
'lignes.*.materiel'       => 'nullable|string|max:150',
'lignes.*.nombre_jours'   => 'nullable|integer|min:0',
'lignes.*.date_debut'     => 'nullable|date',
'lignes.*.date_fin'       => 'nullable|date',
'lignes.*.quantite'       => 'nullable|numeric|min:0',
'lignes.*.prix_unitaire'  => 'nullable|numeric|min:0',
```

### 4.2 Validation métier — `TransportService::validerDonnees`

```php
- lieu_depart  obligatoire (sinon : "Lieu de départ requis pour le transport")
- lieu_arrivee obligatoire (sinon : "Lieu d'arrivée requis pour le transport")
```

> Le backend lit `lieu_depart` / `lieu_arrivee` : c'est pourquoi le front les remplit toujours.

### 4.3 Normalisation — `TransportService::normaliserLigne`

```php
$data['type_operation'] = 'transport';
$data['quantite']       = $data['quantite']       ?? 1;
$data['prix_unitaire']  = $data['prix_unitaire']  ?? 0;
```

### 4.4 Calcul du montant — `TransportService::calculerMontant`

```
montant_ht_ligne = quantite * prix_unitaire
```

Le total HT du document est la somme de toutes les lignes ; remise, TVA et CSS sont appliquées
par `CalculeTotauxTrait` en respectant `remise_*` et `taxes_selection` du document.

### 4.5 Stockage

Table : **`lignes_devis`** (équivalents : `lignes_ordres`, `lignes_factures`).
Colonnes ajoutées par la migration `2026_06_18_000001_add_ligne_operation_fields` :

```
point_depart   VARCHAR(100) NULL
point_arrivee  VARCHAR(100) NULL
type_transport VARCHAR(30)  NULL
mode_trajet    VARCHAR(20)  NULL
materiel       VARCHAR(150) NULL
nombre_jours   INT UNSIGNED NULL
```

Plus les colonnes historiques : `type_operation`, `description`, `lieu_depart`, `lieu_arrivee`,
`date_debut`, `date_fin`, `quantite`, `prix_unitaire`, `montant_ht`.

---

## 5. Exemple complet de requête `POST /api/devis`

```http
POST /api/devis
Content-Type: application/json
X-XSRF-TOKEN: <csrf>
```

```json
{
  "client_id": 42,
  "type_document": "Independant",
  "type_operation_indep": "transport",
  "type_marchandise": "conteneur",
  "description_generale": "Transport conteneur DRY 40' Libreville → Franceville",
  "observation_interne": null,
  "date_validite": "2026-07-31",
  "notes": null,
  "remise_type": null,
  "remise_valeur": 0,
  "taxes_selection": {
    "selected_tax_codes": ["TVA", "CSS"],
    "has_exoneration": false,
    "exonerated_tax_codes": [],
    "motif_exoneration": null
  },
  "lignes": [
    {
      "type_operation": "transport",
      "description":    "Transport Libreville → Franceville",
      "lieu_depart":    "Libreville",
      "lieu_arrivee":   "Franceville",
      "point_depart":   "Libreville",
      "point_arrivee":  "Franceville",
      "type_transport": "conteneur",
      "mode_trajet":    "aller_retour",
      "materiel":       null,
      "nombre_jours":   null,
      "date_debut":     null,
      "date_fin":       null,
      "quantite":       2,
      "prix_unitaire":  450000
    }
  ]
}
```

Résultat attendu côté serveur :
- `montant_ht_brut`    = 2 × 450 000 = **900 000 FCFA**
- `montant_ht`         = 900 000 − remise (0) = **900 000**
- `tva` / `css`        = calculés via `taxes_selection`
- `montant_ttc`        = HT après remise + taxes

---

## 6. Valeurs autorisées (récap énumérations)

| Champ            | Valeurs                                                          |
|------------------|------------------------------------------------------------------|
| `type_operation` (ligne) | `transport`, `location`, `manutention`, `double_relevage`, `stockage`, `autre` |
| `type_operation_indep` (document) | identique à ci-dessus (sauf `autre`) |
| `type_transport` | `conteneur`, `marchandise`, `engin`, `materiel`                  |
| `mode_trajet`    | `aller_simple`, `aller_retour`                                   |
| `type_marchandise` | `conteneur`, `materiel`, `marchandise_generale`, `engin`, `autre` |
| `point_arrivee`  | Liste fermée des destinations (voir §2)                          |

---

## 7. Checklist pour l'appli externe

1. Toujours envoyer `type_document = "Independant"` ET `type_operation` sur **chaque** ligne.
2. Pour Transport, remplir **les deux paires** `point_*` et `lieu_*` avec la même valeur.
3. `quantite ≥ 1` et `prix_unitaire ≥ 0`, sinon le total sera 0.
4. Mettre à `null` (pas omettre) les champs non utilisés (`materiel`, `date_debut`, etc.).
5. `taxes_selection` doit lister explicitement les codes de taxes voulus (`TVA`, `CSS`, …).
6. Pas de `montant_ht` ni `remise_montant` envoyés : recalculés serveur.
