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
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

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

    /**
     * Envoyer la note par email avec PDF en pièce jointe
     */
    public function sendEmail(Request $request, $id): JsonResponse
    {
        $request->validate([
            'destinataire' => 'required|email',
            'sujet' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        try {
            $noteDebut = NoteDebut::findOrFail($id);
            // Charger les relations nécessaires
            $noteDebut->load(['client', 'transitaire', 'armateur', 'lignes']);
            $client = $noteDebut->client;

            if (!$client) {
                return response()->json(['message' => 'Client non trouvé pour cette note'], 400);
            }

            $typeConfig = $this->getTypeConfig($noteDebut->type);

            // Générer le PDF
            $pdf = Pdf::loadView('pdf.note-debut', [
                'note' => $noteDebut,
                'client' => $client,
                'titre' => $typeConfig['titre'],
                'type_label' => $typeConfig['label'],
                'couleur' => $typeConfig['couleur'],
                'badge_bg' => $typeConfig['badge_bg'],
            ]);

            $pdfContent = $pdf->output();
            $pdfFilename = "Note_{$noteDebut->numero}.pdf";

            // Envoyer l'email avec pièce jointe
            Mail::send('emails.note-debut', [
                'note' => $noteDebut,
                'client' => $client,
                'message_personnalise' => $request->message,
            ], function ($mail) use ($request, $noteDebut, $pdfContent, $pdfFilename) {
                $mail->to($request->destinataire)
                    ->subject($request->sujet)
                    ->from(config('mail.from.address'), config('mail.from.name'))
                    ->attachData($pdfContent, $pdfFilename, [
                        'mime' => 'application/pdf',
                    ]);
            });

            // Log l'envoi
            Audit::log('email', 'note', "Email envoyé pour note {$noteDebut->numero} à {$request->destinataire}", $noteDebut->id);

            Log::info("Email envoyé pour note de début", [
                'note_id' => $noteDebut->id,
                'numero' => $noteDebut->numero,
                'destinataire' => $request->destinataire,
            ]);

            return response()->json([
                'message' => 'Email envoyé avec succès',
                'destinataire' => $request->destinataire,
            ]);

        } catch (\Exception $e) {
            Log::error("Erreur envoi email note de début", [
                'note_id' => $noteDebut->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Erreur lors de l\'envoi de l\'email',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Générer et télécharger le PDF
     */
    public function downloadPdf($id)
    {
        try {
            // Résolution manuelle pour éviter les problèmes de Route Model Binding
            $noteDebut = NoteDebut::findOrFail($id);
            $noteDebut->load(['client', 'transitaire', 'armateur', 'lignes']);
            $client = $noteDebut->client;

            // Fallback si client null
            if (!$client) {
                $client = (object) [
                    'raison_sociale' => $noteDebut->client_nom ?? 'Client inconnu',
                    'nom' => $noteDebut->client_nom ?? 'Client inconnu',
                    'nom_complet' => $noteDebut->client_nom ?? 'Client inconnu',
                    'adresse' => null,
                    'telephone' => null,
                    'email' => null,
                ];
            }

            $typeConfig = $this->getTypeConfig($noteDebut->type ?? 'detention');

            Log::info("Génération PDF note de début", [
                'note_id' => $noteDebut->id,
                'numero' => $noteDebut->numero,
                'type' => $noteDebut->type,
                'client' => $client->raison_sociale ?? $client->nom ?? '-',
            ]);

            $pdf = Pdf::loadView('pdf.note-debut', [
                'note' => $noteDebut,
                'client' => $client,
                'titre' => $typeConfig['titre'],
                'type_label' => $typeConfig['label'],
                'couleur' => $typeConfig['couleur'],
                'badge_bg' => $typeConfig['badge_bg'],
            ])->setPaper('a4', 'portrait')->setOptions(['defaultFont' => 'DejaVu Sans']);

            return $pdf->download("Note_{$noteDebut->numero}.pdf");

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error("Note de début non trouvée pour PDF", ['id' => $id]);
            return response()->json([
                'message' => 'Note non trouvée',
                'error' => "Aucune note avec l'ID {$id}",
            ], 404);
        } catch (\Exception $e) {
            Log::error("Erreur PDF note de début", [
                'id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Erreur lors de la génération du PDF',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Valider une note (changer statut)
     */
    public function valider(NoteDebut $noteDebut): JsonResponse
    {
        try {
            $noteDebut->update(['statut' => 'en_attente']);
            
            Audit::log('validate', 'note', "Note validée: {$noteDebut->numero}", $noteDebut->id);

            return response()->json(new NoteDebutResource($noteDebut->fresh(['client', 'transitaire', 'armateur'])));
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la validation', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Configuration par type de note
     */
    protected function getTypeConfig(string $type): array
    {
        $configs = [
            'detention' => [
                'titre' => 'Note de Détention',
                'label' => 'Détention',
                'couleur' => '#dc2626',
                'badge_bg' => '#fee2e2',
            ],
            'Detention' => [
                'titre' => 'Note de Détention',
                'label' => 'Détention',
                'couleur' => '#dc2626',
                'badge_bg' => '#fee2e2',
            ],
            'ouverture_port' => [
                'titre' => 'Note d\'Ouverture de Port',
                'label' => 'Ouverture de Port',
                'couleur' => '#2563eb',
                'badge_bg' => '#dbeafe',
            ],
            'Ouverture Port' => [
                'titre' => 'Note d\'Ouverture de Port',
                'label' => 'Ouverture de Port',
                'couleur' => '#2563eb',
                'badge_bg' => '#dbeafe',
            ],
            'reparation' => [
                'titre' => 'Note de Réparation',
                'label' => 'Réparation',
                'couleur' => '#d97706',
                'badge_bg' => '#fef3c7',
            ],
            'Reparation' => [
                'titre' => 'Note de Réparation',
                'label' => 'Réparation',
                'couleur' => '#d97706',
                'badge_bg' => '#fef3c7',
            ],
            'relache' => [
                'titre' => 'Note de Relâche',
                'label' => 'Relâche',
                'couleur' => '#059669',
                'badge_bg' => '#d1fae5',
            ],
            'Relache' => [
                'titre' => 'Note de Relâche',
                'label' => 'Relâche',
                'couleur' => '#059669',
                'badge_bg' => '#d1fae5',
            ],
        ];

        return $configs[$type] ?? [
            'titre' => 'Note de Début',
            'label' => ucfirst($type),
            'couleur' => '#dc2626',
            'badge_bg' => '#fee2e2',
        ];
    }
}
