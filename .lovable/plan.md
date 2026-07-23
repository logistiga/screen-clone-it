## Objectif

Quand un OT conventionnel est transféré en facture, la valeur de `lots_ordres.description` doit être copiée et affichée dans la facture :
- page détail facture,
- PDF facture,
- factures déjà transférées si elles ont encore `Lot 1` ou une description vide.

## Diagnostic confirmé

- La désignation OT est bien stockée dans `lots_ordres.description`.
- La facture utilise aussi `lots_factures.description` pour afficher `designation` / `description`.
- Le flux de conversion existe déjà, mais la réparation actuelle peut ne pas toucher tous les cas existants, notamment si la catégorie n’est pas normalisée comme attendu ou si les lots facture existent avec une valeur générique.
- Je n’ai pas d’accès direct DB depuis le sandbox (`PGHOST` absent), donc la correction doit être robuste côté code sans requête manuelle en base.

## Plan de correction

1. **Sécuriser la conversion OT → Facture**
   - Dans le service de conversion conventionnel, forcer chaque lot envoyé à la facture avec :
     - `numero_lot`,
     - `description = lots_ordres.description`,
     - `designation = lots_ordres.description`,
     - quantité, prix unitaire, prix total.
   - Ne jamais laisser `numero_lot` remplacer la désignation.

2. **Renforcer la réparation des factures déjà créées**
   - Adapter `FactureMaintenanceService` pour réparer même si la catégorie stockée est `Lot`, `lots`, `Conventionnel`, etc.
   - Faire correspondre les lots par `numero_lot` puis par position.
   - Si `lots_factures.description` est vide ou générique (`Lot 1`, `LOT-1`, etc.), copier `lots_ordres.description`.
   - Si aucun lot facture n’existe, créer les lots facture depuis l’OT lié.

3. **Garantir le chargement API**
   - Dans `FactureController@show`, charger `ordreTravail.lots` avant réparation, relire la facture après réparation, puis retourner les lots corrigés dans `FactureResource`.

4. **Renforcer l’affichage frontend**
   - Dans `FactureItemsTables`, continuer le fallback depuis `ordre_travail.lots`, mais améliorer la correspondance des lots pour couvrir `LOT-1` / `Lot 1` / position.
   - Dans `FacturePDF`, appliquer le même fallback pour que le PDF affiche la désignation OT même si les lots facture sont encore génériques.

5. **Vérification**
   - Vérifier la syntaxe des fichiers modifiés.
   - Vérifier que les fichiers restent sous la limite projet de 300 lignes autant que possible ; si `FacturePDF.tsx` doit être retouché, faire une modification minimale sans refonte large.

## Résultat attendu

Pour une facture transférée depuis un OT comme celui de l’image, la colonne **Désignation** affichera le texte de `lots_ordres.description` au lieu de `Lot 1` ou vide, et le PDF facture utilisera la même désignation.