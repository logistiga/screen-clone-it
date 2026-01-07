<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NoteDebut;
use App\Models\Configuration;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

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

        return response()->json($notes);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:Detention,Ouverture Port,Reparation',
            'client_id' => 'required|exists:clients,id',
            'transitaire_id' => 'nullable|exists:transitaires,id',
            'armateur_id' => 'nullable|exists:armateurs,id',
            'bl_numero' => 'nullable|string|max:100',
            'conteneur_numero' => 'nullable|string|max:50',
            'conteneur_type' => 'nullable|string|max:50',
            'conteneur_taille' => 'nullable|string|max:20',
            'navire' => 'nullable|string|max:255',
            'date_arrivee' => 'nullable|date',
            'date_debut' => 'nullable|date',
            'date_fin' => 'nullable|date',
            'nombre_jours' => 'nullable|integer|min:0',
            'tarif_journalier' => 'nullable|numeric|min:0',
            'montant_ht' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $numero = $this->generateNumero($request->type);

        // Calculer le montant si dates fournies
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

        return response()->json($note->load(['client', 'transitaire', 'armateur']), 201);
    }

    public function show(NoteDebut $noteDebut): JsonResponse
    {
        $noteDebut->load(['client', 'transitaire', 'armateur']);
        return response()->json($noteDebut);
    }

    public function update(Request $request, NoteDebut $noteDebut): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'client_id' => 'sometimes|required|exists:clients,id',
            'transitaire_id' => 'nullable|exists:transitaires,id',
            'armateur_id' => 'nullable|exists:armateurs,id',
            'bl_numero' => 'nullable|string|max:100',
            'conteneur_numero' => 'nullable|string|max:50',
            'conteneur_type' => 'nullable|string|max:50',
            'conteneur_taille' => 'nullable|string|max:20',
            'navire' => 'nullable|string|max:255',
            'date_arrivee' => 'nullable|date',
            'date_debut' => 'nullable|date',
            'date_fin' => 'nullable|date',
            'nombre_jours' => 'nullable|integer|min:0',
            'tarif_journalier' => 'nullable|numeric|min:0',
            'montant_ht' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();

        // Recalculer si nécessaire
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

        return response()->json($noteDebut->load(['client', 'transitaire', 'armateur']));
    }

    public function destroy(NoteDebut $noteDebut): JsonResponse
    {
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
