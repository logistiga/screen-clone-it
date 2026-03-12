

# Plan: Page IA Assistant pour Logistiga

## Vue d'ensemble

Créer une page dédiée **"Assistant IA"** accessible depuis la sidebar, avec un chatbot intelligent qui analyse vos données métier (clients, factures, paiements, créances, trésorerie) et fournit des recommandations, prédictions et résumés.

## Architecture

L'IA fonctionnera via un **endpoint Laravel backend** qui :
1. Reçoit le message de l'utilisateur + l'historique de conversation
2. Collecte les données pertinentes depuis la base (dashboard stats, alertes, créances, top clients...)
3. Envoie le tout à un modèle IA (OpenAI ou autre) avec un prompt système spécialisé en gestion/facturation
4. Retourne la réponse à afficher dans le chat

```text
┌─────────────┐     ┌──────────────────┐     ┌────────────┐
│  React Chat │────▶│ Laravel Backend  │────▶│  API IA    │
│  Page       │◀────│ /api/ai/chat     │◀────│ (OpenAI…)  │
│             │     │ + données métier │     │            │
└─────────────┘     └──────────────────┘     └────────────┘
```

## Fichiers à créer / modifier

### Backend (Laravel)

1. **`backend/app/Http/Controllers/Api/AiAssistantController.php`**
   - Méthode `chat(Request $request)` : reçoit `messages[]`, collecte le contexte métier (stats dashboard, alertes, créances en cours), appelle l'API IA externe, retourne la réponse
   - Méthode `context()` : retourne un résumé des données clés pour pré-alimenter l'assistant
   - Le prompt système inclut le contexte métier : stats actuelles, alertes, top clients, créances impayées

2. **`backend/routes/api_ai.php`** — Routes IA isolées
   - `POST /ai/chat` — Envoi de message
   - `GET /ai/context` — Contexte métier pour l'IA

3. **`backend/routes/api.php`** — Ajouter `require __DIR__.'/api_ai.php';`

4. **`backend/config/services.php`** — Clé API IA (OPENAI_API_KEY dans .env backend)

### Frontend (React)

5. **`src/pages/AiAssistant.tsx`** — Page dédiée avec :
   - Interface de chat (messages utilisateur/assistant)
   - Rendu markdown des réponses IA (`react-markdown` à ajouter)
   - Suggestions rapides pré-définies : "Résumé du mois", "Clients à risque", "État de la trésorerie", "Factures impayées", "Prédictions CA"
   - Indicateur de chargement pendant la réponse

6. **`src/services/aiService.ts`** — Service API pour communiquer avec le backend

7. **`src/components/layout/AppSidebar.tsx`** — Ajouter l'entrée "Assistant IA" avec icône `Bot` dans la sidebar

8. **`src/App.tsx`** — Ajouter la route `/assistant-ia`

## Fonctionnalités de l'assistant

L'assistant pourra répondre à des questions comme :
- **Analyse** : "Quel est l'état de ma trésorerie ?" / "Quels clients ont des impayés ?"
- **Prédictions** : "Quelles sont les tendances du CA ?" / "Quels paiements risquent d'être en retard ?"
- **Recommandations** : "Quels clients dois-je relancer ?" / "Comment optimiser ma trésorerie ?"
- **Résumés** : "Résumé du mois" / "Synthèse des opérations de la semaine"

## Prérequis

Une clé API pour un modèle IA (OpenAI GPT, etc.) devra être configurée dans le `.env` du backend Laravel (`OPENAI_API_KEY`). L'appel IA se fait côté serveur uniquement.

## Dépendance à ajouter
- `react-markdown` (rendu markdown des réponses IA dans le chat)

