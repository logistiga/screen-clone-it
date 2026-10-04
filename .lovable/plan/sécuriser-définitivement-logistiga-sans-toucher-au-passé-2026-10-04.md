# Sécuriser définitivement LogistiGA (sans toucher au passé)

Principe : chaque règle est protégée côté serveur (et base quand possible). Les anciennes anomalies sont seulement détectées et exportées, jamais corrigées.

## Déjà fait (OT + Factures)
- Facturation OT verrouillée (1 OT = 1 facture, même en simultané), OT annulé non facturable.
- Ouvrir un OT ne réenregistre plus rien.
- OT avec paiement non supprimable ; OT avec facture payée/annulée non modifiable.
- Facture annulée non modifiable ; suppression facture remet l'OT « En cours ».

## Lot 1 — Statuts et paiements (point 6, 7)
- Constantes centrales des statuts facture/OT (`annulee`, `payee`, …) utilisées partout, plus aucune chaîne en dur.
- Un seul service « recalculer paiements » : `montant_paye` = somme des paiements valides, puis statut. Appelé après ajout/annulation de paiement, avoir, remboursement.
- Remplace le recalcul automatique ajouté au tour précédent (qui pouvait toucher d'anciennes factures lors d'un simple réenregistrement) : le statut n'est recalculé que lors d'une opération de paiement.
- Règles de modification facture : brouillon = libre, émise = modifiable, partiellement payée / payée / annulée = montants bloqués.

## Lot 2 — Trop-perçu, avoirs, annulations (points 8, 9)
- Paiement supérieur au reste à payer : **refusé** avec message clair (en attendant la règle comptable « excédent → avoir »).
- Annulation déjà validée, paiement déjà annulé, avoir épuisé ou dépassé : refusés, avec verrou et transaction complète.

## Lot 3 — Calculs centralisés (points 2, 3)
- Un seul calculateur serveur (quantité × prix, remise %, remise fixe, HT, TVA, CSS, TTC) pour Devis, OT, Facture, toutes catégories.
- Le serveur ignore les totaux envoyés par le navigateur et recalcule toujours.
- Conversions Devis→OT, Devis→Facture, OT→Facture : copie contrôlée (client, lignes, taxes, remise, références, montants).

## Lot 4 — Clients et double soumission (points 1, 5)
- Modifier Client = mise à jour uniquement (aucun chemin de création).
- Détection de doublon à la création : même téléphone, email ou NIF/RCCM → refus ; nom seul semblable → simple avertissement.
- Anti double envoi côté serveur (clé unique par action) sur : créer devis, convertir, facturer, payer, annuler paiement, avoir, email.

## Lot 5 — Lectures et suppressions (points 10, 11)
- Revue de toutes les routes de consultation : aucune écriture.
- Suppression : client avec documents interdit (archivage), facture/OT avec paiement interdit.

## Lot 6 — Base de données (point 12)
- Index unique « une facture par OT » : **impossible tant que les 2 OT doublement facturés existent**. Je prépare la mise à jour ; elle sera appliquée quand vous aurez réglé ces 2 cas à la main. En attendant, le verrou serveur protège.
- Clés étrangères et index utiles ajoutés seulement s'ils ne touchent aucune ancienne ligne.

## Lot 7 — Tests et rapport (points 13, 14)
- Tests automatiques : `test_ot_cannot_be_invoiced_twice`, `test_cancelled_invoice_cannot_be_updated`, `test_updating_client_never_creates_new_client`, `test_showing_work_order_does_not_modify_database`, paiement trop-perçu refusé, avoir non réutilisable, calculs par catégorie (0 FCFA d'écart).
- Tests lancés sur une base de test séparée, jamais sur la production.
- Fichier Excel des anciennes anomalies (doublons, OT sans facture, écarts, statuts) pour vérification humaine.

## Ordre et livraison
Un lot après l'autre ; envoi en production à la fin de chaque lot (sauvegarde avant), puis un rapport court.

## Détails techniques
- Laravel : `App\Support\FactureStatut`, `PaiementRecalculService`, `DocumentTotalsCalculator`, middleware `Idempotency-Key` (cache 10 min) + frontend envoie la clé via `src/lib/api.ts`.
- Verrous `lockForUpdate` dans `DB::transaction` pour paiements/avoirs/annulations.
- Tests PHPUnit `RefreshDatabase` sur SQLite/MySQL de test.
- Limite 300 lignes/fichier respectée (découpage en services).
