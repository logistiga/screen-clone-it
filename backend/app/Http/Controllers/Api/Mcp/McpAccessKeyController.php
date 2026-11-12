<?php

namespace App\Http\Controllers\Api\Mcp;

use App\Http\Controllers\Controller;
use App\Models\McpAccessKey;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

/** Gestion des clés MCP par les administrateurs (Assistant IA → Clés MCP). */
class McpAccessKeyController extends Controller
{
    public function index(): JsonResponse
    {
        if (!Schema::hasTable('mcp_access_keys')) {
            return response()->json(['data' => [], 'meta' => $this->meta()]);
        }
        $keys = McpAccessKey::query()->orderByDesc('id')->get()->map(fn (McpAccessKey $k) => $this->present($k));

        return response()->json(['data' => $keys, 'meta' => $this->meta()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|min:2|max:100',
            'description' => 'nullable|string|max:255',
            'expires_in_days' => 'nullable|integer|in:30,90,180,365',
        ]);

        $plain = McpAccessKey::generatePlain();
        $key = McpAccessKey::create([
            'name' => trim($data['name']),
            'description' => $data['description'] ?? null,
            'key_prefix' => substr($plain, 0, 12),
            'key_hash' => McpAccessKey::hashKey($plain),
            'created_by' => $request->user()?->id,
            'expires_at' => isset($data['expires_in_days']) ? now()->addDays((int) $data['expires_in_days']) : null,
        ]);

        // La clé en clair n'est renvoyée qu'ici, une seule fois.
        return response()->json(['data' => $this->present($key), 'plain_key' => $plain, 'meta' => $this->meta()], 201);
    }

    public function revoke(int $id): JsonResponse
    {
        $key = McpAccessKey::findOrFail($id);
        if ($key->revoked_at === null) {
            $key->forceFill(['revoked_at' => now()])->save();
        }

        return response()->json(['data' => $this->present($key)]);
    }

    private function present(McpAccessKey $k): array
    {
        return [
            'id' => $k->id,
            'name' => $k->name,
            'description' => $k->description,
            'key_prefix' => $k->key_prefix,
            'statut' => $k->statut(),
            'created_at' => $k->created_at?->toIso8601String(),
            'expires_at' => $k->expires_at?->toIso8601String(),
            'last_used_at' => $k->last_used_at?->toIso8601String(),
            'revoked_at' => $k->revoked_at?->toIso8601String(),
        ];
    }

    private function meta(): array
    {
        $base = rtrim((string) config('chatgpt.mcp_public_url', 'https://facturation.logistiga.pro/mcp-logistiga'), '/');

        return ['server_url' => $base . '/mcp', 'health_url' => $base . '/health', 'chatgpt_url_template' => $base . '/k/{CLE}/mcp'];
    }
}
