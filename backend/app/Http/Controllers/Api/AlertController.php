<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AlertNotificationService;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AlertController extends Controller
{
    protected AlertNotificationService $alertService;

    public function __construct(AlertNotificationService $alertService)
    {
        $this->alertService = $alertService;
    }

    /**
     * Récupérer les notifications de l'utilisateur connecté
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        
        $params = [
            'page' => $request->get('page', 1),
            'per_page' => $request->get('per_page', 50),
            'unread_only' => $request->boolean('unread_only'),
            'type' => $request->get('type'),
        ];

        $result = $this->alertService->getForUser($userId, $params);

        return response()->json($result);
    }

    /**
     * Récupérer le nombre de notifications non lues
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        
        $count = Notification::where('user_id', $userId)
            ->where('read', false)
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Marquer une notification comme lue
     */
    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $userId = $request->user()->id;
        
        // Vérifier que la notification appartient à l'utilisateur
        $notification = Notification::where('id', $id)
            ->where('user_id', $userId)
            ->first();

        if (!$notification) {
            return response()->json(['message' => 'Notification non trouvée'], 404);
        }

        $this->alertService->markAsRead($id);

        return response()->json(['message' => 'Notification marquée comme lue']);
    }

    /**
     * Marquer toutes les notifications comme lues
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $this->alertService->markAllAsRead($userId);

        return response()->json(['message' => 'Toutes les notifications marquées comme lues']);
    }

    /**
     * Supprimer une notification
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $userId = $request->user()->id;
        
        // Vérifier que la notification appartient à l'utilisateur
        $notification = Notification::where('id', $id)
            ->where('user_id', $userId)
            ->first();

        if (!$notification) {
            return response()->json(['message' => 'Notification non trouvée'], 404);
        }

        $this->alertService->delete($id);

        return response()->json(['message' => 'Notification supprimée']);
    }

    /**
     * Supprimer toutes les notifications
     */
    public function destroyAll(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $this->alertService->deleteAll($userId);

        return response()->json(['message' => 'Toutes les notifications supprimées']);
    }

    /**
     * Récupérer les alertes système (générées dynamiquement)
     */
    public function alerts(): JsonResponse
    {
        $alerts = $this->alertService->generateAllAlerts();

        return response()->json(['data' => $alerts]);
    }

    /**
     * Récupérer les statistiques des notifications
     */
    public function stats(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $stats = $this->alertService->getStats($userId);

        return response()->json($stats);
    }
}
