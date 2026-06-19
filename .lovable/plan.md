## Problème

Sur la page **Ordres de Travail**, choisir « Indépendant » (ou « Conteneurs » / « Conventionnel ») dans le filtre catégorie ne filtre rien : la liste continue d'afficher des OT conteneurs.

## Cause

Le frontend (`src/pages/ordres-travail/ordres-helpers.tsx` L36-41) envoie les valeurs normalisées modernes :
- `conteneurs`
- `conventionnel`
- `operations_independantes`

Mais le backend (`backend/app/Http/Controllers/Api/OrdreTravailController.php` L70) n'accepte que les anciennes valeurs :
```php
if ($request->filled('categorie') && in_array($request->get('categorie'), ['Conteneur', 'Lot', 'Independant'])) {
    $query->where('categorie', $request->get('categorie'));
}
```
La nouvelle valeur n'étant pas dans `in_array`, **le `where` n'est jamais ajouté** → aucun filtrage côté serveur. Idem la facture/devis si même schéma.

De plus, même si on l'ajoutait à la liste, le `where('categorie', $value)` ne matcherait qu'une seule orthographe ; or la table contient un mélange d'anciennes et nouvelles valeurs (`Conteneur` / `conteneurs`, `Lot` / `conventionnel`, `Independant` / `operations_independantes` / `divers`).

## Correction

Dans `OrdreTravailController.php` (méthode `index`), remplacer le filtre par un `whereIn` basé sur `DocumentCategory::equivalentValues()` qui retourne toutes les orthographes équivalentes :

```php
use App\Support\DocumentCategory;

if ($request->filled('categorie')) {
    $valeurs = DocumentCategory::equivalentValues($request->get('categorie'));
    if (!empty($valeurs)) {
        $query->whereIn('categorie', $valeurs);
    }
}
```

Appliquer la même correction dans la méthode `stats()` (L114-115) pour que les statistiques respectent le filtre.

## Vérification

1. Filtrer « Indépendant » → seulement les OT indépendants apparaissent (incluant ceux stockés en `divers` / `Independant`).
2. Filtrer « Conteneurs » → seulement les conteneurs.
3. Filtrer « Conventionnel » → seulement les lots.
4. « Toutes catégories » → liste complète inchangée.

## Hors scope

Pas de changement frontend, pas de changement des contrôleurs Devis/Factures (à appliquer dans un second temps si le même bug y existe — à confirmer avant).
