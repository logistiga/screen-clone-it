## Objectif
Afficher **numéro de lot + désignation** sur les PDF Facture et OT conventionnels (format `Lot N — Désignation`).

## Constat
- `src/pages/OrdrePDF.tsx` : déjà OK (`${numero} — ${designation}`).
- `src/pages/FacturePDF.tsx` (`buildLignesConventionnel`, ligne ~138) : affiche `designation || numeroLot` → le numéro disparaît quand la désignation existe.
- Blade backend `backend/resources/views/pdf/facture.blade.php` : à vérifier/aligner sur le même format (utilisé si le PDF est généré côté serveur).

## Changements
1. **`src/pages/FacturePDF.tsx`** — dans `buildLignesConventionnel`, remplacer :
   ```
   description: designation || numeroLot
   ```
   par :
   ```
   description: designation ? `${numeroLot} — ${designation}` : numeroLot
   ```

2. **`backend/resources/views/pdf/facture.blade.php`** — appliquer la même concaténation `Lot N — Désignation` sur la colonne description des lots conventionnels (lecture rapide + patch si nécessaire).

3. **Vérification** : relire les deux fichiers après patch, aucun changement de logique métier ni de calculs.

## Hors périmètre
- Pas de modification backend PHP (services, resources, controllers).
- Pas de refonte du composant `FactureItemsTables` (page détail déjà OK).
