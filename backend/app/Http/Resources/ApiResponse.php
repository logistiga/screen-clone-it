<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApiResponse extends JsonResource
{
    protected bool $success;
    protected string $message;
    protected ?int $statusCode;

    public function __construct($resource, bool $success = true, string $message = '', ?int $statusCode = null)
    {
        parent::__construct($resource);
        $this->success = $success;
        $this->message = $message;
        $this->statusCode = $statusCode;
    }

    public function toArray(Request $request): array
    {
        return [
            'success' => $this->success,
            'message' => $this->message,
            'data' => $this->resource,
            'timestamp' => now()->toISOString(),
        ];
    }

    public function withResponse($request, $response): void
    {
        if ($this->statusCode) {
            $response->setStatusCode($this->statusCode);
        }
    }

    /**
     * Créer une réponse de succès
     */
    public static function success($data = null, string $message = 'Opération réussie', int $statusCode = 200): self
    {
        return (new self($data, true, $message, $statusCode));
    }

    /**
     * Créer une réponse d'erreur
     */
    public static function error(string $message = 'Une erreur est survenue', $errors = null, int $statusCode = 400): self
    {
        return (new self(['errors' => $errors], false, $message, $statusCode));
    }

    /**
     * Créer une réponse de création
     */
    public static function created($data, string $message = 'Ressource créée avec succès'): self
    {
        return self::success($data, $message, 201);
    }

    /**
     * Créer une réponse de suppression
     */
    public static function deleted(string $message = 'Ressource supprimée avec succès'): self
    {
        return self::success(null, $message, 200);
    }

    /**
     * Créer une réponse non trouvée
     */
    public static function notFound(string $message = 'Ressource non trouvée'): self
    {
        return self::error($message, null, 404);
    }

    /**
     * Créer une réponse non autorisée
     */
    public static function unauthorized(string $message = 'Non autorisé'): self
    {
        return self::error($message, null, 401);
    }

    /**
     * Créer une réponse de validation échouée
     */
    public static function validationFailed(array $errors, string $message = 'Erreur de validation'): self
    {
        return self::error($message, $errors, 422);
    }
}
