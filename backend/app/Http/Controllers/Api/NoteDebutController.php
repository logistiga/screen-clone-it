<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreNoteDebutRequest;
use App\Http\Requests\UpdateNoteDebutRequest;
use App\Http\Resources\NoteDebutResource;
use App\Models\NoteDebut;
use App\Models\Configuration;
use App\Models\Audit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class NoteDebutController extends Controller
{
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
        $numero = $this->generateNumero($request->type);

        $nombreJours = $request->nombre_jours;
        $montantHt = $request->montant_ht;

        if ($request->date_debut && $request->date_fin && !$nombreJours) {
            $debut = new \DateTime($request->date_debut);
            $fin = new \DateTime($request->date_fin);
            $nombreJours = $fin->diff($debut)->days;
        }

        if ($nombreJours && $request->tarif_journalier && !$montantHt) {
            $montantHt = $nombreJours * $request->tarif_journalier;
        }

        $tauxTva = Configuration::where('cle', 'taux_tva')->value('valeur') ?? 18;
        $tauxCss = Configuration::where('cle', 'taux_css')->value('valeur') ?? 1;

        $montantTva = $montantHt * ($tauxTva / 100);
        $montantCss = $montantHt * ($tauxCss / 100);
        $montantTtc = $montantHt + $montantTva + $montantCss;

        $note = NoteDebut::create([
            'numero' => $numero,
            'type' => $request->type,
            'client_id' => $request->client_id,
            'transitaire_id' => $request->transitaire_id,
            'armateur_id' => $request->armateur_id,
            'date' => now(),
            'bl_numero' => $request->bl_numero,
            'conteneur_numero' => $request->conteneur_numero,
            'conteneur_type' => $request->conteneur_type,
            'conteneur_taille' => $request->conteneur_taille,
            'navire' => $request->navire,
            'date_arrivee' => $request->date_arrivee,
            'date_debut' => $request->date_debut,
            'date_fin' => $request->date_fin,
            'nombre_jours' => $nombreJours,
            'tarif_journalier' => $request->tarif_journalier,
            'montant_ht' => $montantHt,
            'montant_tva' => $montantTva,
            'montant_css' => $montantCss,
            'montant_ttc' => $montantTtc,
            'taux_tva' => $tauxTva,
            'taux_css' => $tauxCss,
            'description' => $request->description,
            'notes' => $request->notes,
        ]);

        Audit::log('create', 'note', "Note créée: {$note->numero}", $note->id);

        return response()->json(new NoteDebutResource($note->load(['client', 'transitaire', 'armateur'])), 201);
    }

    public function show(NoteDebut $noteDebut): JsonResponse
    {
        $noteDebut->load(['client', 'transitaire', 'armateur']);
        return response()->json(new NoteDebutResource($noteDebut));
    }

    public function update(UpdateNoteDebutRequest $request, NoteDebut $noteDebut): JsonResponse
    {
        $data = $request->validated();

        if (isset($data['date_debut']) && isset($data['date_fin'])) {
            $debut = new \DateTime($data['date_debut']);
            $fin = new \DateTime($data['date_fin']);
            $data['nombre_jours'] = $fin->diff($debut)->days;
        }

        if (isset($data['nombre_jours']) && isset($data['tarif_journalier'])) {
            $data['montant_ht'] = $data['nombre_jours'] * $data['tarif_journalier'];
        }

        if (isset($data['montant_ht'])) {
            $data['montant_tva'] = $data['montant_ht'] * ($noteDebut->taux_tva / 100);
            $data['montant_css'] = $data['montant_ht'] * ($noteDebut->taux_css / 100);
            $data['montant_ttc'] = $data['montant_ht'] + $data['montant_tva'] + $data['montant_css'];
        }

        $noteDebut->update($data);

        Audit::log('update', 'note', "Note modifiée: {$noteDebut->numero}", $noteDebut->id);

        return response()->json(new NoteDebutResource($noteDebut->load(['client', 'transitaire', 'armateur'])));
    }

    public function destroy(NoteDebut $noteDebut): JsonResponse
    {
        Audit::log('delete', 'note', "Note supprimée: {$noteDebut->numero}", $noteDebut->id);

        $noteDebut->delete();
        
        return response()->json(['message' => 'Note supprimée avec succès']);
    }

    private function generateNumero(string $type): string
    {
        $prefixes = [
            'Detention' => 'ND',
            'Ouverture Port' => 'NOP',
            'Reparation' => 'NR',
        ];
        
        $prefix = $prefixes[$type] ?? 'N';
        $year = date('Y');
        $lastNote = NoteDebut::where('type', $type)
            ->whereYear('created_at', $year)
            ->orderBy('id', 'desc')
            ->first();
        $nextNumber = $lastNote ? (intval(substr($lastNote->numero, -4)) + 1) : 1;
        return sprintf('%s-%s-%04d', $prefix, $year, $nextNumber);
    }
}
