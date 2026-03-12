

# Plan: Enrichir le contexte IA avec les données réelles de LogistiGA

## Constat

Le `AiAssistantController` existe déjà avec support multi-provider (Ollama, OpenAI, Anthropic, Google), mémoire persistante (`ai_memory`), et injection de contexte métier. Il n'est **pas nécessaire de créer un nouveau controller** — il faut enrichir le contexte injecté avec les données manquantes.

## Ce qui existe déjà
- Multi-provider avec Ollama configuré sur `http://187.124.38.130:11434`
- Mémoire persistante (`AiMemory` model, 20 derniers messages)
- Contexte : clients, factures, paiements, caisse, top clients

## Ce qui manque
- **Notifications récentes** (table `notifications` existe)
- **Conteneurs / Flotte** (table `conteneurs_traites` existe avec camion_plaque, statut, chauffeur)
- **Anomalies conteneurs** (`ConteneurAnomalie`)
- **Crédits bancaires** en cours
- **Prompt système** plus riche avec infos équipe Omar

## Modifications

### 1. `backend/app/Http/Controllers/Api/AiAssistantController.php`

Enrichir la méthode `getBusinessContext()` avec :

```php
// Notifications récentes (10 dernières)
$context['notifications'] = Notification::orderByDesc('created_at')
    ->limit(10)
    ->get(['type', 'title', 'message', 'created_at'])
    ->toArray();

// Flotte / Conteneurs récents (camions, statuts)
$context['conteneurs'] = ConteneurTraite::orderByDesc('created_at')
    ->limit(15)
    ->get(['numero_conteneur', 'camion_plaque', 'chauffeur_nom', 'statut', 'destination_adresse', 'date_sortie'])
    ->toArray();

// Anomalies en cours
$context['anomalies'] = ConteneurAnomalie::where('resolved', false)
    ->limit(10)
    ->get(['numero_conteneur', 'type_anomalie', 'description', 'created_at'])
    ->toArray();

// Crédits bancaires actifs
$context['credits'] = CreditBancaire::where('statut', 'actif')
    ->get(['banque_id', 'montant_total', 'montant_restant', 'date_echeance'])
    ->toArray();
```

Enrichir `buildSystemPrompt()` pour inclure le contexte spécifique Omar/Logistiga :

```
Tu es l'assistant de Omar, directeur de Logistiga au Gabon.
Flotte de 40 camions. Port d'Owendo.
Équipe: Mustapha, Georgia, Mohamed, Evans.
```

### 2. `backend/app/Models/AiSetting.php`

Mettre à jour le prompt système par défaut dans la migration seed pour inclure les infos Omar.

### 3. Aucun changement frontend nécessaire

L'interface chat, paramètres et historique fonctionnent déjà. Le contexte enrichi sera automatiquement injecté dans les réponses IA.

## Résumé des fichiers modifiés

| Fichier | Action |
|---------|--------|
| `backend/app/Http/Controllers/Api/AiAssistantController.php` | Ajouter notifications, conteneurs, anomalies, crédits au contexte |

