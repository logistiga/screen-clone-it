

# Ajouter les primes CNV (conventionnel) sur la page Caisse en attente

## Contexte

La base `logiwkuh_cnv` contient une table `primes` avec des primes conventionnelles. Les primes avec `statut = 'payee'` doivent apparaitre sur la meme page "Caisse en attente" que les primes OPS, avec la meme logique de decaissement.

### Structure table CNV `primes`
| Colonne | Type |
|---------|------|
| id | UUID |
| type | ENUM (camion, responsable) |
| beneficiaire | STRING |
| montant | DECIMAL(12,2) |
| operation_id | UUID |
| conventionne_numero | STRING |
| statut | ENUM (en_attente, payee) |
| numero_paiement | STRING nullable |
| date_paiement | TIMESTAMP nullable |

## Modifications

### 1. Backend - Ajouter connexion `cnv` dans `config/database.php`

Ajouter un bloc `cnv` (meme pattern que `ops`) utilisant les variables `CNV_DB_HOST`, `CNV_DB_DATABASE`, `CNV_DB_USERNAME`, `CNV_DB_PASSWORD`, `CNV_DB_PORT`, `CNV_DB_SOCKET`.

### 2. Backend - Modifier `CaisseEnAttenteController.php`

**Methode `index`** :
- Ajouter `checkCnvConnection()` (meme pattern que `checkOpsConnection`)
- Lire les primes CNV avec `statut = 'payee'` depuis la connexion `cnv`
- Colonnes selectionnees : id, type, beneficiaire, montant, conventionne_numero, statut, numero_paiement, date_paiement, created_at
- Mapper les colonnes CNV vers le meme format que OPS (ex: `numero_parc` = `conventionne_numero`)
- Ajouter un champ `source` = `'OPS'` ou `'CNV'` sur chaque prime
- Verifier le decaissement via reference `CNV-PRIME-{id}` (au lieu de `OPS-PRIME-{id}`)
- Categorie mouvement : `Prime conventionnel` pour CNV
- Merger les deux collections, filtrer, trier par date_paiement desc, puis paginer
- Supporter un filtre `source` optionnel (query param)

**Methode `stats`** :
- Ajouter les totaux CNV aux stats existantes (cumul des deux sources)

**Methode `decaisser`** :
- Accepter un parametre `source` dans la requete (defaut: `OPS`)
- Si `source = CNV` : lire depuis connexion `cnv`, reference = `CNV-PRIME-{id}`, categorie = `Prime conventionnel`
- Si `source = OPS` : comportement actuel inchange

### 3. Frontend - Modifier `CaisseEnAttente.tsx`

- Ajouter `source: string` a l'interface `PrimeEnAttente`
- Ajouter `conventionne_numero: string | null`
- Afficher une colonne "Source" avec badge colore (bleu "OPS", vert "CNV")
- Afficher le `conventionne_numero` pour les primes CNV dans la colonne "N Parc"
- Ajouter un filtre source dans les options de filtre (Toutes / OPS / CNV)
- Envoyer `source` dans le POST de decaissement
- Mettre a jour le sous-titre : "Primes payees depuis TC et CNV en attente de decaissement"

## Fichiers modifies

- `backend/config/database.php` (ajout connexion cnv)
- `backend/app/Http/Controllers/Api/CaisseEnAttenteController.php` (lecture 2 bases + merge)
- `src/pages/CaisseEnAttente.tsx` (colonne source + filtre + envoi source)

