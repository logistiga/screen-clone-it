

# Plan: Avoir systématique pour toutes les factures annulées

## Contexte actuel

- La page `AvoirPDF.tsx` (ligne 44) bloque l'affichage si `avoir_genere === false`
- Le backend `AnnulationService` a été mis à jour pour toujours générer un avoir, mais des annulations plus anciennes peuvent avoir `avoir_genere = false`
- Le bouton "Télécharger l'avoir" existe déjà sur la page Factures pour les factures annulées

## Modifications prévues

### 1. Backend - `AnnulationService.php`
Confirmer que `annulerFacture` génère **toujours** un avoir avec numéro et solde, indépendamment du paiement. C'est déjà le cas dans le code actuel.

### 2. Backend - `AnnulationController.php`
Ajouter une logique dans la méthode `show` ou `annulerFacture` : si une annulation de facture existe sans avoir (anciennes données), générer automatiquement le numéro d'avoir au moment de la consultation.

### 3. Frontend - `AvoirPDF.tsx`
- Supprimer la condition `!annulation.avoir_genere` qui bloque l'affichage (ligne 44)
- Si `avoir_genere` est false mais que c'est une annulation de facture, afficher quand même le PDF avec un numéro d'avoir auto-généré
- Adapter le titre du PDF selon le contexte : "AVOIR D'ANNULATION" pour les factures non payées vs "AVOIR" pour les factures payées

### 4. Frontend - `Factures.tsx`
- S'assurer que le bouton "Télécharger l'avoir" fonctionne même si `facture.annulation` n'a pas encore `avoir_genere = true` (fallback vers génération à la volée)

### 5. Backend - Nouvelle route (optionnel)
Ajouter une route `POST /annulations/{id}/ensure-avoir` qui génère l'avoir s'il n'existe pas encore, puis retourne l'annulation mise à jour. Cela couvre les anciennes annulations.

## Résumé des fichiers à modifier
- `backend/app/Services/AnnulationService.php` - confirmer la logique avoir systématique
- `backend/app/Http/Controllers/Api/AnnulationController.php` - auto-génération avoir si manquant
- `src/pages/AvoirPDF.tsx` - supprimer le blocage sur `avoir_genere`
- `src/pages/Factures.tsx` - ajuster le bouton téléchargement avoir

