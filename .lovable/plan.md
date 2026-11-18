# Réponse : rattachement des sorties de caisse à leur document source

## État actuel (vérifié dans le code)
- Aucun champ `reference_source` (ni `source_id`) n'existe sur `mouvements_caisse`.
- Le champ qui porte le lien est `mouvements_caisse.reference`.
- Il est exposé en lecture dans le MCP / connecteur (ressource `mouvements_caisse` : champ `reference`, cherchable).
- Il est aussi renvoyé à l'écran Caisse depuis le dernier envoi en production.

## Contenu de `reference` selon l'origine
- Achat Garage (achats divers, pneus, bons) : `GARAGE-ACHAT-<id>` ; avance : `GARAGE-ACHAT-<id>-T<n>`.
- Prime Garage : `GARAGE-PRIME-<id>`.
- Hors LBV, CNV, OPS, primes locales : identifiant interne de même forme (`<SOURCE>-...-<id>`, suffixe `-T<n>` pour les avances).
- Sorties manuelles : texte libre saisi, souvent vide.

## Limites
- Pour « Achat Garage (Achat divers) », la référence est remplie à chaque décaissement fait par l'application, mais c'est l'**id interne** de l'achat dans l'app Garage, pas son numéro métier (ex. numéro de bon de commande). Ce numéro métier n'est écrit ni dans `reference` ni dans la description.
- Il faut retirer le suffixe `-T<n>` pour regrouper les avances d'un même achat.
- Le type de source n'a pas de champ propre : il se lit dans le préfixe de `reference`.
- La référence saisie par le caissier dans la fenêtre de décaissement est enregistrée seulement sur la tranche fournisseur (`tranches_paiement_fournisseur.reference`), pas sur le mouvement.
- Les anciennes lignes créées avant ces écrans ou saisies à la main peuvent ne pas avoir de référence.

## Évolution possible (si vous la demandez)
Ajouter `source_type`, `source_id` et `source_numero` (numéro métier) sur les nouveaux mouvements, puis les exposer dans le MCP. Aucune reprise des anciennes données.
