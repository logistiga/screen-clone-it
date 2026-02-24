
## Correction de l'arrondi des montants "Reste a payer"

### Le probleme

Quand le systeme calcule `montant_ttc - montant_paye`, le resultat peut etre un nombre decimal (ex: 11.9 au lieu de 12). L'affichage arrondit visuellement a "12 FCFA" mais le champ de saisie du paiement recoit la valeur brute 11.9, ce qui cree une incoherence.

### La cause

La fonction `roundMoney()` (arrondi mathematique standard pour les montants XAF) existe deja dans `src/lib/utils.ts` mais n'est pas appliquee lors du calcul du reste a payer.

### Corrections a apporter

**1. `src/pages/OrdreDetail.tsx` (ligne 86)**
- Appliquer `roundMoney` au calcul : `const resteAPayer = roundMoney((ordre.montant_ttc || 0) - (ordre.montant_paye || 0));`

**2. `src/pages/FactureDetail.tsx`**
- Meme correction sur le calcul du reste a payer des factures

**3. `src/pages/NotesDebut.tsx`**
- Meme correction pour les notes de debit

**4. `src/pages/NoteDebutDetail.tsx`**
- Meme correction pour le detail note de debit

**5. `src/components/PaiementGlobalOrdresModal.tsx` (ligne 94)**
- Arrondir `montantRestant: roundMoney(o.montant_ttc - (o.montant_paye || 0))`

**6. `src/components/PaiementModal.tsx` (ligne 136)**
- Arrondir le resultat du calcul dynamique d'exoneration : `return roundMoney(Math.max(0, montantEffectif - montantDejaPaye));`

### Resultat attendu

Le champ "Montant du paiement" affichera toujours un entier coherent avec le "Reste a payer" affiche dans l'en-tete du modal (12 au lieu de 11.9).
