
# Correction des arrondis : Backend + Frontend

## Résumé des corrections

Appliquer une règle d'arrondi simple et cohérente sur les deux couches :
- **Arrondi mathématique standard à l'entier** (Math.round / round sans décimales)
- 3.6 → 4 | 3.4 → 3

---

## 1. Backend (Priorité absolue)

### Fichier : `backend/app/Traits/CalculeTotauxTrait.php`

| Ligne | Avant | Après |
|-------|-------|-------|
| 171 | `round($montantHTApresRemise * ($taxe['taux'] / 100), 2)` | `round($montantHTApresRemise * ($taxe['taux'] / 100))` |
| 224-225 | `round($remiseMontant, 2)` | `round($remiseMontant)` |
| 259 | `round($montantHTApresRemise, 2)` | `round($montantHTApresRemise)` |
| 260 | `round($remiseMontant, 2)` | `round($remiseMontant)` |
| 261 | `round($taxes['tva'], 2)` | `round($taxes['tva'])` |
| 262 | `round($taxes['css'], 2)` | `round($taxes['css'])` |
| 263 | `round($montantTTC, 2)` | `round($montantTTC)` |

**Résultat** : Tous les montants enregistrés en base seront des entiers.

---

## 2. Frontend

### 2.1 Ajouter helper centralisé

**Fichier : `src/lib/utils.ts`**

```typescript
/**
 * Arrondi mathématique standard pour montants XAF
 * - ≥ 0.5 → supérieur (3.6 → 4)
 * - < 0.5 → inférieur (3.4 → 3)
 */
export function roundMoney(amount: number): number {
  return Math.round(amount);
}
```

### 2.2 Corriger parseInt → parseFloat

| Fichier | Ligne | Champ | Correction |
|---------|-------|-------|------------|
| `OrdreConteneursForm.tsx` | 672 | quantité opération | `parseInt` → `parseFloat` |
| `OrdreConteneursForm.tsx` | 682 | prix opération | `parseInt` → `parseFloat` |
| `OrdreConventionnelForm.tsx` | 258 | quantité lot | `parseInt` → `parseFloat` |
| `OrdreConventionnelForm.tsx` | 271 | prix lot | `parseInt` → `parseFloat` |

### 2.3 Utiliser roundMoney dans useDocumentTaxes

**Fichier : `src/hooks/useDocumentTaxes.ts`** (ligne ~187)

Le code actuel utilise déjà `Math.round`, ce qui est correct. On peut optionnellement importer `roundMoney` pour cohérence.

---

## Fichiers modifiés

| Fichier | Modifications |
|---------|---------------|
| `backend/app/Traits/CalculeTotauxTrait.php` | Retirer tous les `, 2` des appels `round()` |
| `src/lib/utils.ts` | Ajouter fonction `roundMoney()` |
| `src/components/ordres/forms/OrdreConteneursForm.tsx` | 2× `parseInt` → `parseFloat` |
| `src/components/ordres/forms/OrdreConventionnelForm.tsx` | 2× `parseInt` → `parseFloat` |

---

## Résultat attendu

**Exemple : 120 000 XAF HT avec TVA 18% + CSS 1%**
- TVA = 120 000 × 0.18 = 21 600 → **21 600**
- CSS = 120 000 × 0.01 = 1 200 → **1 200**
- TTC = 120 000 + 21 600 + 1 200 = **142 800 XAF** ✓

**Exemple : 123 456 XAF HT**
- TVA = 123 456 × 0.18 = 22 222.08 → **22 222**
- CSS = 123 456 × 0.01 = 1 234.56 → **1 235**
- TTC = 123 456 + 22 222 + 1 235 = **146 913 XAF** ✓
