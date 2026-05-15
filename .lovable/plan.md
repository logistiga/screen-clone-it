# Fix: "Field 'numero' doesn't have a default value" on devis creation

## Root cause

`DevisServiceFactory::creer()` (line 83) generates `$data['numero']` then calls `Devis::create($data)`. But in `App\Models\Devis`, `numero` is **not in `$fillable`** (it's intentionally listed as guarded/calculated, lines 38-47). Mass-assignment silently drops it, so the INSERT runs without `numero` and MySQL rejects it (column has no default).

The same issue affects `date_creation` (also not fillable) — it's not raising an error today only because the column likely allows NULL, but it should be persisted too.

## Fix

In `backend/app/Services/Devis/DevisServiceFactory.php`, change the create step inside `creer()` to set generated fields outside mass-assignment:

```php
$numero = $this->genererNumero();
$dateCreation = $data['date_creation'] ?? now()->toDateString();
unset($data['numero'], $data['date_creation']);
$data['statut'] = $data['statut'] ?? 'brouillon';

// extract relations as before
...

$devis = new Devis();
$devis->forceFill([
    'numero' => $numero,
    'date_creation' => $dateCreation,
])->fill($data)->save();
```

Apply the same pattern in `dupliquer()` (line ~229) which also calls `creer()` — already covered transitively.

Verify `modifier()` (line ~120) doesn't try to overwrite `numero` via mass-assignment; if it does, also strip it before `update()`.

## Verification

1. Create a new devis from `/devis/nouveau` (Indépendant / double_relevage like the failing payload). Expect 201 with a `numero` like `DEV-2026-XXXX`.
2. Confirm `numero` is incremented in `configurations` (`prochain_numero_devis`).
3. Spot-check that creating a Conteneur and Conventionnel devis still works.

## Out of scope

No DB migrations, no frontend changes, no other controllers touched.
