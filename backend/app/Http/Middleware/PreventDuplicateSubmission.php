<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Anti double soumission côté serveur : une même opération d'écriture
 * (même utilisateur, même méthode, même URL, même contenu) est refusée
 * si elle est renvoyée pendant que la première est encore récente.
 * Complète la protection du navigateur (deux onglets, réseau lent, rejeu).
 */
class PreventDuplicateSubmission
{
    private const FENETRE_SECONDES = 8;

    /** Routes exclues (authentification, synchronisations techniques). */
    private const EXCLUSIONS = ['api/login', 'api/logout', 'api/auth/*', 'api/sanctum/*', 'api/*sync*', 'api/gpt/*', 'api/ai/*'];

    public function handle(Request $request, Closure $next): Response
    {
        if (!in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true) || $request->is(...self::EXCLUSIONS)) {
            return $next($request);
        }

        $user = $request->user('sanctum')?->id ?? $request->ip();
        $empreinte = sha1($user . '|' . $request->method() . '|' . $request->path() . '|' . $request->getContent());
        $cle = 'dup_submit:' . $empreinte;

        if (!Cache::add($cle, 1, self::FENETRE_SECONDES)) {
            return response()->json([
                'message' => 'Cette opération vient déjà d\'être envoyée. Patientez quelques secondes puis actualisez.',
                'code' => 'double_soumission',
            ], 409);
        }

        $response = $next($request);

        // En cas d'échec de validation/erreur, on libère pour permettre une correction immédiate
        if ($response->getStatusCode() >= 400) {
            Cache::forget($cle);
        }

        return $response;
    }
}
