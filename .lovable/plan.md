# Plan : Documentation MD pour Agent IA avec accès BDD complet

## Objectif

Créer un fichier de référence Markdown qui sert de **manuel complet** pour que l'agent IA puisse répondre avec des **données réelles issues de la base** à toutes les questions possibles (KPIs, clients, OT, factures, statistiques, classements, anomalies, etc.) via une approche **SQL dynamique sécurisé**.

Pas de filtrage RBAC : l'agent a accès complet à toutes les données (réservé admin/directeur).

## Livrable

**Fichier unique** : `/mnt/documents/agent_ia_bdd_complet.md`

## Structure du fichier MD

### 1. Introduction & règles d'or
- Rôle de l'agent (assistant financier/opérationnel LogistiGA)
- Règle absolue : **toujours interroger la BDD**, jamais inventer
- Format des réponses (chiffres FCFA, dates JJ/MM/AAAA, sources mentionnées)
- Si une donnée est absente → dire "aucun résultat" et non zéro inventé

### 2. Architecture d'accès aux données (SQL dynamique sécurisé)
- L'agent reçoit la question utilisateur
- Génère une requête SQL en **lecture seule** (`SELECT` uniquement)
- Whitelist des tables autorisées
- Interdictions strictes : `INSERT`, `UPDATE`, `DELETE`, `DROP`, `TRUNCATE`, `ALTER`
- Toujours filtrer `deleted_at IS NULL` (soft deletes Laravel)
- Limite par défaut `LIMIT 100` sauf agrégats

### 3. Cartographie complète des tables (avec colonnes clés)
Pour chaque table : nom, rôle, colonnes principales, relations.

Tables couvertes :
- **Financières** : `factures`, `ordres_travail`, `devis`, `notes_debit`, `paiements`, `paiements_fournisseurs`
- **Caisse / Banque** : `caisse_mouvements`, `credits_bancaires`, `caisse_en_attente`
- **Clients & partenaires** : `clients`, `armateurs`, `transitaires`, `representants`, `fournisseurs`
- **Opérationnelles** : `conteneurs_traites`, `sorties_conteneurs`, `notes_relache`, `primes_locales`
- **Sécurité** : `users`, `roles`, `permissions`, `audit_logs`, `suspicious_logins`
- **Système** : `notifications`, `email_logs`, `previsions`

### 4. Catalogue exhaustif Questions → Requêtes SQL

Organisé par **thème** avec ~80-120 paires Q/R type :

**A. KPIs financiers globaux**
- Total OT non payés (montant restant)
- Total OT payés ce mois
- Factures du mois (nombre + total)
- Solde caisse / banque
- Encaissements jour/semaine/mois/année
- Top 10 clients débiteurs

**B. Recherche par entité**
- Statut d'un OT précis (`WHERE numero = ?`)
- Solde d'un client
- Dernières factures d'un client
- Conteneurs en cours pour client X

**C. Statistiques & classements**
- Top clients par CA
- Top armateurs par volume conteneurs
- Performance commerciale par utilisateur
- Évolution mensuelle CA

**D. Opérationnel**
- Conteneurs en attente / anomalies
- OT en retard de paiement (>30j, >60j, >90j)
- Détentions impayées
- Primes en attente

**E. Audit & sécurité**
- Dernières connexions suspectes
- Actions critiques (annulations, suppressions)
- Activité utilisateur

Pour chaque entrée :
```
Q : "Quel est le total des OT non payés ?"
SQL : SELECT SUM(montant_ttc - COALESCE(montant_paye,0)) AS restant
      FROM ordres_travail
      WHERE statut_paiement IN ('non_paye','partiel')
        AND statut != 'annule'
        AND deleted_at IS NULL;
Format réponse : "Total OT non payés : {restant} FCFA ({count} dossiers)"
Tables : ordres_travail
```

### 5. Formules métier critiques
- Montant restant facture = `montant_ttc - COALESCE(montant_paye, 0)`
- OT considéré "payé" = `statut_paiement = 'paye'`
- OT actif = `statut != 'annule' AND deleted_at IS NULL`
- Période "ce mois" = `MONTH(date_xxx) = MONTH(CURDATE()) AND YEAR(...) = YEAR(CURDATE())`
- Conversions XAF/FCFA : entiers arrondis (pas de décimales)

### 6. Gestion des cas particuliers
- Plusieurs clients avec nom similaire → demander précision
- Période non spécifiée → défaut "ce mois"
- Donnée à 0 → dire "aucun" et non "zéro FCFA"
- Question hors périmètre → orienter vers la bonne page de l'app

### 7. Annexes
- Glossaire (OT, BL, TC, CSS, TVA, détention, prime…)
- Mapping entre vocabulaire utilisateur et colonnes BDD ("impayé" = `statut_paiement IN ('non_paye','partiel')`)
- Liste des statuts possibles par table
- Exemples complets de conversations

## Sources utilisées pour générer le contenu

- `/mnt/documents/structure_bdd.md` (1060 lignes — schéma complet)
- `/mnt/documents/agent_ia_logistiga.md` (existant — page par page)
- `/mnt/documents/LogistiGA_System_Prompt_Complet.md` (prompt système)
- `backend/app/Http/Controllers/Api/AiAssistantController.php` (logique actuelle)

## Note importante

Ce plan crée **uniquement le fichier MD de référence** (livrable demandé).
Il n'implémente pas encore l'exécution SQL côté backend. Si tu veux ensuite que l'agent **exécute réellement** ces requêtes (endpoint Laravel sécurisé en lecture seule + injection des résultats dans le prompt), ce sera une étape suivante à demander séparément.
