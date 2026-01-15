<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreNoteDebutRequest;
use App\Http\Requests\UpdateNoteDebutRequest;
use App\Http\Resources\NoteDebutResource;
use App\Models\NoteDebut;
use App\Models\Audit;
use App\Services\NoteDebutService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NoteDebutController extends Controller
{
    protected NoteDebutService $noteService;

    public function __construct(NoteDebutService $noteService)
    {
        $this->noteService = $noteService;
    }

    /**
     * Liste des notes avec filtres via scopes
     */
    public function index(Request $request): JsonResponse
    {
        $notes = NoteDebut::query()
            ->withRelations()
            ->search($request->get('search'))
            ->ofType($request->get('type'))
            ->forClient($request->get('client_id'))
            ->dateRange($request->get('date_debut'), $request->get('date_fin'))
            ->orderByDesc('created_at')
            ->paginate($request->get('per_page', 15));

        return response()->json(NoteDebutResource::collection($notes)->response()->getData(true));
    }

    /**
     * Créer une nouvelle note
     */
    public function store(StoreNoteDebutRequest $request): JsonResponse
    {
        try {
            $note = $this->noteService->creer($request->validated());

            Audit::log('create', 'note', "Note créée: {$note->numero}", $note->id);

            return response()->json(new NoteDebutResource($note), 201);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la création', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Afficher une note
     */
    public function show(NoteDebut $noteDebut): JsonResponse
    {
        // Charger relations seulement si pas déjà chargées
        if (!$noteDebut->relationLoaded('client')) {
            $noteDebut->load(['client', 'transitaire', 'armateur']);
        }

        return response()->json(new NoteDebutResource($noteDebut));
    }

    /**
     * Modifier une note
     */
    public function update(UpdateNoteDebutRequest $request, NoteDebut $noteDebut): JsonResponse
    {
        try {
            $noteDebut = $this->noteService->modifier($noteDebut, $request->validated());

            Audit::log('update', 'note', "Note modifiée: {$noteDebut->numero}", $noteDebut->id);

            return response()->json(new NoteDebutResource($noteDebut));

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la mise à jour', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Supprimer une note
     */
    public function destroy(NoteDebut $noteDebut): JsonResponse
    {
        Audit::log('delete', 'note', "Note supprimée: {$noteDebut->numero}", $noteDebut->id);

        $noteDebut->delete();
        
        return response()->json(['message' => 'Note supprimée avec succès']);
    }

    /**
     * Dupliquer une note existante
     */
    public function duplicate(NoteDebut $noteDebut): JsonResponse
    {
        try {
            $newNote = $this->noteService->dupliquer($noteDebut);

            Audit::log('duplicate', 'note', "Note dupliquée: {$noteDebut->numero} -> {$newNote->numero}", $newNote->id);

            return response()->json(new NoteDebutResource($newNote), 201);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la duplication', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Statistiques des notes
     */
    public function stats(Request $request): JsonResponse
    {
        $stats = $this->noteService->getStatistiques($request->only([
            'client_id', 'type', 'date_debut', 'date_fin'
        ]));

        return response()->json($stats);
    }
}
