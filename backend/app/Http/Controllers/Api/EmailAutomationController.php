<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailAutomation;
use App\Models\EmailTemplate;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class EmailAutomationController extends Controller
{
    /**
     * Liste des automatisations
     */
    public function index(Request $request): JsonResponse
    {
        $query = EmailAutomation::with('template');

        // Filtres
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('conditions', 'like', "%{$search}%");
            });
        }

        if ($request->has('declencheur') && $request->declencheur !== 'all') {
            $query->where('declencheur', $request->declencheur);
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
        $automations = $query->paginate($perPage);

        return response()->json($automations);
    }

    /**
     * Créer une nouvelle automatisation
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'declencheur' => ['required', Rule::in(array_keys(EmailAutomation::DECLENCHEURS))],
            'template_id' => 'required|exists:email_templates,id',
            'delai' => 'required|integer|min:0',
            'delai_unite' => ['required', Rule::in(array_keys(EmailAutomation::DELAI_UNITES))],
            'actif' => 'boolean',
            'conditions' => 'nullable|string|max:500',
        ]);

        // Vérifier que le template existe et est actif
        $template = EmailTemplate::findOrFail($validated['template_id']);
        if (!$template->actif) {
            return response()->json([
                'message' => 'Le modèle sélectionné n\'est pas actif',
            ], 422);
        }

        $automation = new EmailAutomation($validated);
        $automation->created_by = auth()->id();
        $automation->save();

        return response()->json([
            'message' => 'Automatisation créée avec succès',
            'automation' => $automation->load('template'),
        ], 201);
    }

    /**
     * Afficher une automatisation
     */
    public function show(EmailAutomation $automation): JsonResponse
    {
        return response()->json($automation->load('template'));
    }

    /**
     * Mettre à jour une automatisation
     */
    public function update(Request $request, EmailAutomation $automation): JsonResponse
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:255',
            'declencheur' => ['sometimes', 'required', Rule::in(array_keys(EmailAutomation::DECLENCHEURS))],
            'template_id' => 'sometimes|required|exists:email_templates,id',
            'delai' => 'sometimes|required|integer|min:0',
            'delai_unite' => ['sometimes', 'required', Rule::in(array_keys(EmailAutomation::DELAI_UNITES))],
            'actif' => 'boolean',
            'conditions' => 'nullable|string|max:500',
        ]);

        $automation->update($validated);

        return response()->json([
            'message' => 'Automatisation mise à jour avec succès',
            'automation' => $automation->load('template'),
        ]);
    }

    /**
     * Supprimer une automatisation
     */
    public function destroy(EmailAutomation $automation): JsonResponse
    {
        $automation->delete();

        return response()->json([
            'message' => 'Automatisation supprimée avec succès',
        ]);
    }

    /**
     * Basculer l'état actif d'une automatisation
     */
    public function toggleActif(EmailAutomation $automation): JsonResponse
    {
        // Vérifier que le template associé est actif
        if (!$automation->actif && !$automation->template->actif) {
            return response()->json([
                'message' => 'Impossible d\'activer cette automatisation car le modèle associé est inactif',
            ], 422);
        }

        $automation->actif = !$automation->actif;
        $automation->save();

        return response()->json([
            'message' => $automation->actif ? 'Automatisation activée' : 'Automatisation désactivée',
            'automation' => $automation->load('template'),
        ]);
    }

    /**
     * Liste des déclencheurs disponibles
     */
    public function declencheurs(): JsonResponse
    {
        return response()->json(EmailAutomation::DECLENCHEURS);
    }

    /**
     * Liste des unités de délai
     */
    public function delaiUnites(): JsonResponse
    {
        return response()->json(EmailAutomation::DELAI_UNITES);
    }

    /**
     * Obtenir les automatisations pour un déclencheur spécifique
     */
    public function forDeclencheur(string $declencheur): JsonResponse
    {
        $automations = EmailAutomation::with('template')
            ->actif()
            ->forDeclencheur($declencheur)
            ->orderBy('delai')
            ->get();

        return response()->json($automations);
    }
}
