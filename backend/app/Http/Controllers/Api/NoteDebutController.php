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

    public function index(Request $request): JsonResponse
    {
        $query = NoteDebut::with(['client', 'transitaire', 'armateur']);

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('numero', 'like', "%{$search}%")
                  ->orWhere('bl_numero', 'like', "%{$search}%")
                  ->orWhere('conteneur_numero', 'like', "%{$search}%")
                  ->orWhereHas('client', fn($q) => $q->where('nom', 'like', "%{$search}%"));
            });
        }

        if ($request->has('type')) {
            $query->where('type', $request->get('type'));
        }

        if ($request->has('client_id')) {
            $query->where('client_id', $request->get('client_id'));
        }

        if ($request->has('date_debut') && $request->has('date_fin')) {
            $query->whereBetween('date', [$request->get('date_debut'), $request->get('date_fin')]);
        }

        $notes = $query->orderBy('created_at', 'desc')->paginate($request->get('per_page', 15));

        return response()->json(NoteDebutResource::collection($notes)->response()->getData(true));
    }

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

    public function show(NoteDebut $noteDebut): JsonResponse
    {
        $noteDebut->load(['client', 'transitaire', 'armateur']);
        return response()->json(new NoteDebutResource($noteDebut));
    }

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

    public function destroy(NoteDebut $noteDebut): JsonResponse
    {
        Audit::log('delete', 'note', "Note supprimée: {$noteDebut->numero}", $noteDebut->id);

        $noteDebut->delete();
        
        return response()->json(['message' => 'Note supprimée avec succès']);
    }

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

    public function stats(Request $request): JsonResponse
    {
        $stats = $this->noteService->getStatistiques([
            'client_id' => $request->get('client_id'),
            'type' => $request->get('type'),
            'date_debut' => $request->get('date_debut'),
            'date_fin' => $request->get('date_fin'),
        ]);

        return response()->json($stats);
    }
}
