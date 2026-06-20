
# Procédure rapide — Refonte LogistiGA v2 en 8 semaines

Voici la marche à suivre, étape par étape, pour aller le plus vite possible **sans casser ta prod**.

---

## ⚡ Étape 0 — Aujourd'hui (30 min, à faire par TOI)

**1. Créer le nouveau projet Lovable**
- Va sur lovable.dev → "New Project"
- Nom : `logistiga-v2` (ou `facturation-v2`)
- Template : React + Vite (vide)

**2. Configurer les secrets dans le nouveau projet**
- `VITE_API_URL` = `https://facturation.logistiga.pro/api`
- (Plus tard) tout autre secret nécessaire

**3. Préparer l'accès cross-project**
- Dans ce projet-ci (l'actuel), vérifie que le sharing workspace est activé.
- Comme ça, depuis le nouveau projet, je pourrai lire les fichiers d'ici avec `@mention`.

**4. Ouvre le nouveau projet et écris-moi simplement** :
> "Salut, lis @logistiga-facturation (le projet actuel) et commence le Bloc 1 de la v2 selon le plan."

---

## 🚀 Étape 1 — Bloc 1 : Fondations (Jour 1-2, par MOI dans le nouveau projet)

Ce que je ferai dans le nouveau projet :

```text
✅ Setup Vite + Tailwind + shadcn (déjà inclus dans le template)
✅ Installation : react-router v6, @tanstack/react-query, axios, react-hook-form, zod
✅ Structure de dossiers feature-first (app/ + shared/ + features/)
✅ Design tokens dans index.css (couleurs LogistiGA reprises de l'actuel)
✅ Axios client configuré avec Sanctum cookies vers backend de prod
✅ AuthContext + page Login + ProtectedRoute
✅ MainLayout desktop (sidebar) + MobileLayout (bottom nav)
✅ Page Dashboard vide qui charge les stats du backend de prod
```

**Livrable** : tu peux te connecter et voir le dashboard avec tes vraies données de prod.

---

## 🏗️ Étape 2 — Bloc 2 : Migration features (Semaines 2-7)

**Pour aller vite, on suit cette règle** : **1 feature complète par session de chat**.

Ordre exact (du moins risqué au plus risqué) :

| Semaine | Feature | Ce qui est livré |
|---------|---------|------------------|
| S2 | Auth + Dashboard | Login, dashboard 5 périodes, stats |
| S2 | Clients + Partenaires | CRUD complet, détails, exports |
| S3 | Notes (unifiées) | 1 seule page pour les 5 types de notes |
| S3 | Caisse + Mouvements | 1 modal unifié au lieu de 5 |
| S4 | Factures | Liste, détail, création, édition, PDF |
| S4 | Devis | Idem |
| S5 | Ordres de Travail | Idem |
| S5 | Paiements | 1 modal unifié au lieu de 4 |
| S6 | Reporting + Exports | Tous les exports PDF/CSV |
| S6 | OPS Hub + Conteneurs | Synchros existantes |
| S7 | AI + Notifications | Assistant + temps réel |
| S7 | Admin | Users, roles, audit, sécurité |

**À chaque feature** je respecte :
- ✅ Max 200 lignes/composant
- ✅ Calculs métier appelés au backend, pas dupliqués
- ✅ Modals fusionnés (pas 3 versions du même)
- ✅ Tout dans `features/X/`

---

## ✅ Étape 3 — Bloc 3 : Bascule (Semaine 8)

**Jour 1-2** : Déploiement v2 sur `v2.facturation.logistiga.pro`
**Jour 3-5** : Tests parallèles avec toi + Omar
**Jour 6** : Switch DNS → v2 devient `facturation.logistiga.pro`
**Jour 7** : v1 archivée sur `legacy.facturation.logistiga.pro`

Si problème : rollback DNS en 5 minutes.

---

## 💨 Les 5 accélérateurs qui font gagner du temps

### 1. **Reprendre l'UI existante comme référence visuelle**
Je lis tes pages actuelles (`@logistiga-facturation`) et je copie la structure visuelle. Pas de redesign from scratch → gain : **2 semaines**.

### 2. **Réutiliser tes assets**
Logo, couleurs, images : copiés depuis l'ancien projet via cross-project. Gain : **1 jour**.

### 3. **Backend inchangé = zéro migration de données**
On consomme l'API existante telle quelle. Gain : **3-4 semaines**.

### 4. **Mémoires projet reportées**
Toutes les règles métier (`mem://index.md`) sont déjà documentées. Je les recopie dans le nouveau projet dès le Bloc 1. Gain : **1 semaine** de discussions évitées.

### 5. **Fusionner les doublons à la volée**
Au lieu de migrer 3 EmailModal, j'en crée 1 directement. Au lieu de 5 pages Notes, j'en crée 1. Gain : **1 semaine** + meilleure qualité finale.

**Total accéléré : ~8 semaines au lieu de 15-20 semaines en refactor in-place.**

---

## 🎯 Règle d'or pour aller vite

**Une session de chat = une feature complète et testable.**

Pas de "on commence X et on finit demain". Quand tu m'ouvres une session pour `Factures`, je sors :
- La page liste
- La page détail
- La création
- L'édition
- Le PDF
- Les hooks
- Les types
- Le tout testé manuellement

Tu valides → on passe à la feature suivante. Pas de retour en arrière.

---

## 📋 Checklist avant que tu démarres

Avant de créer le nouveau projet, vérifie :

- [ ] Le backend de prod (`facturation.logistiga.pro`) accepte les requêtes CORS depuis `*.lovable.app` (déjà le cas selon ta mémoire `Lovable CORS`)
- [ ] Tu as un compte de test sur la prod pour te connecter depuis le nouveau projet
- [ ] Tu acceptes que pendant 8 semaines, tu continues à utiliser la v1 en prod normalement
- [ ] Tu es OK pour me donner du feedback chaque semaine (1 session = 1 feature validée)

---

## 🟢 Action immédiate

**Maintenant, tu fais ça** :

1. **Crée le nouveau projet** `logistiga-v2` dans Lovable
2. **Ajoute le secret** `VITE_API_URL=https://facturation.logistiga.pro/api`
3. **Ouvre une session de chat dans le nouveau projet**
4. **Écris-moi exactement ceci** :

> "Lis @logistiga-facturation pour comprendre l'app actuelle. Commence le Bloc 1 du plan de refonte v2 : setup complet (Vite, Tailwind, shadcn, React Query, Router, axios), structure feature-first, design tokens repris de l'actuel, AuthContext + Login + MainLayout desktop + MobileLayout, Dashboard vide qui se connecte au backend de prod. Reporte les règles de mem://index.md."

Et c'est parti. **Bloc 1 livré en 1-2 sessions max.**

---

## ❓ Question pour finaliser

Avant que tu démarres, j'ai besoin de **2 confirmations rapides** :

1. **Tu valides cette procédure telle quelle** ou tu veux qu'on ajuste l'ordre des features ?
2. **Design** : on reprend l'identité visuelle actuelle (mêmes couleurs LogistiGA) ou tu veux qu'on profite de la v2 pour rafraîchir le design (nouvelle palette, typo plus moderne) ?

Réponds à ces 2 points et tu peux lancer le nouveau projet tout de suite après.
