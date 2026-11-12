<?php

namespace App\Http\Controllers\Api\Mcp;

use App\Http\Controllers\Controller;
use App\Models\McpAccessKey;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

/**
 * Appelé uniquement par le serveur MCP (token ChatGPT/MCP) pour valider une clé créée dans l'application.
 * Ne renvoie jamais la clé ; met à jour last_used_at au plus toutes les 5 minutes.
 */
class McpKeyVerifyController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $plain = (string) $request->input('key', '');
        if ($plain === '' || strlen($plain) > 256 || !str_starts_with($plain, McpAccessKey::PREFIX) || !Schema::hasTable('mcp_access_keys')) {
            return response()->json(['success' => true, 'data' => ['valid' => false], 'meta' => []]);
        }

        $key = McpAccessKey::where('key_hash', McpAccessKey::hashKey($plain))->first();
        if (!$key || !$key->isActive()) {
            return response()->json(['success' => true, 'data' => ['valid' => false], 'meta' => []]);
        }

        if ($key->last_used_at === null || $key->last_used_at->lt(now()->subMinutes(5))) {
            $key->forceFill(['last_used_at' => now()])->saveQuietly();
        }

        return response()->json(['success' => true, 'data' => ['valid' => true, 'id' => 'key-' . $key->id, 'name' => $key->name], 'meta' => []]);
    }
}
