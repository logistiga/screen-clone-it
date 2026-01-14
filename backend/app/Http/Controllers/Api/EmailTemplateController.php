<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class EmailTemplateController extends Controller
{
    /**
     * Liste des templates d'email
     */
    public function index(Request $request): JsonResponse
    {
        $query = EmailTemplate::query();

        // Filtres
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('objet', 'like', "%{$search}%");
            });
        }

        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->has('actif')) {
            $query->where('actif', $request->actif === 'true' || $request->actif === '1');
        }

        // Tri
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 50);
        $templates = $query->paginate($perPage);

        return response()->json($templates);
    }

    /**
     * Créer un nouveau template
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'type' => ['required', Rule::in(array_keys(EmailTemplate::TYPES))],
            'objet' => 'required|string|max:500',
            'contenu' => 'required|string|max:10000',
            'actif' => 'boolean',
        ]);

        // Extraire les variables automatiquement
        $template = new EmailTemplate($validated);
        $template->variables = $template->extractVariables();
        $template->created_by = auth()->id();
        $template->save();

        return response()->json([
            'message' => 'Modèle créé avec succès',
            'template' => $template,
        ], 201);
    }

    /**
     * Afficher un template
     */
    public function show(EmailTemplate $template): JsonResponse
    {
        return response()->json($template->load('automations'));
    }

    /**
     * Mettre à jour un template
     */
    public function update(Request $request, EmailTemplate $template): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:255',
            'type' => ['sometimes', 'required', Rule::in(array_keys(EmailTemplate::TYPES))],
            'objet' => 'sometimes|required|string|max:500',
            'contenu' => 'sometimes|required|string|max:10000',
            'actif' => 'boolean',
        ]);

        $template->fill($validated);
        
        // Recalculer les variables si objet ou contenu modifié
        if ($request->has('objet') || $request->has('contenu')) {
            $template->variables = $template->extractVariables();
        }
        
        $template->save();

        return response()->json([
            'message' => 'Modèle mis à jour avec succès',
            'template' => $template,
        ]);
    }

    /**
     * Supprimer un template
     */
    public function destroy(EmailTemplate $template): JsonResponse
    {
        // Vérifier si le template est utilisé par des automatisations
        if ($template->automations()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer ce modèle car il est utilisé par des automatisations',
            ], 422);
        }

        $template->delete();

        return response()->json([
            'message' => 'Modèle supprimé avec succès',
        ]);
    }

    /**
     * Dupliquer un template
     */
    public function duplicate(EmailTemplate $template): JsonResponse
    {
        $newTemplate = $template->replicate();
        $newTemplate->nom = $template->nom . ' (copie)';
        $newTemplate->actif = false;
        $newTemplate->created_by = auth()->id();
        $newTemplate->save();

        return response()->json([
            'message' => 'Modèle dupliqué avec succès',
            'template' => $newTemplate,
        ], 201);
    }

    /**
     * Basculer l'état actif d'un template
     */
    public function toggleActif(EmailTemplate $template): JsonResponse
    {
        $template->actif = !$template->actif;
        $template->save();

        return response()->json([
            'message' => $template->actif ? 'Modèle activé' : 'Modèle désactivé',
            'template' => $template,
        ]);
    }

    /**
     * Prévisualiser un template avec des données de test
     */
    public function preview(Request $request, EmailTemplate $template): JsonResponse
    {
        $testData = [
            'nom_client' => 'Client Test',
            'numero_devis' => 'DEV-2024-001',
            'numero_facture' => 'FAC-2024-001',
            'numero_ordre' => 'OT-2024-001',
            'montant_ttc' => '1 500 000 FCFA',
            'montant_ht' => '1 300 000 FCFA',
            'date_validite' => date('d/m/Y', strtotime('+30 days')),
            'date_echeance' => date('d/m/Y', strtotime('+30 days')),
            'date_paiement' => date('d/m/Y'),
            'montant_paye' => '500 000 FCFA',
            'mode_paiement' => 'Virement bancaire',
            'numero_conteneur' => 'CONT-12345',
            'type_travail' => 'Réparation',
            'date_prevue' => date('d/m/Y', strtotime('+7 days')),
            'date_fin' => date('d/m/Y'),
            'jours_retard' => '15',
            'nom_entreprise' => 'LOJISTIGA',
            'signature' => "L'équipe LOJISTIGA\nTél: +221 XX XXX XX XX\nEmail: contact@lojistiga.com",
        ];

        $rendered = $template->render($testData);

        return response()->json([
            'template' => $template,
            'preview' => $rendered,
            'variables' => $template->variables,
        ]);
    }

    /**
     * Liste des types de templates
     */
    public function types(): JsonResponse
    {
        return response()->json(EmailTemplate::TYPES);
    }
}
