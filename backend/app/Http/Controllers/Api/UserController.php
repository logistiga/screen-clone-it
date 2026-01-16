<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Traits\SecureQueryParameters;
use App\Models\User;
use App\Models\Audit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    use SecureQueryParameters;

    /**
     * Colonnes autorisées pour le tri
     */
    protected array $allowedSortColumns = [
        'id', 'nom', 'email', 'actif', 'created_at', 'updated_at'
    ];

    public function index(Request $request): JsonResponse
    {
        $query = User::with('roles');

        // Recherche sécurisée
        $search = $this->validateSearchParameter($request);
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filtre par rôle validé
        if ($request->filled('role')) {
            $roleName = $this->sanitizeString($request->get('role'));
            if ($roleName) {
                $query->role($roleName);
            }
        }

        if ($request->has('actif')) {
            $query->where('actif', $request->boolean('actif'));
        }

        // Tri et pagination sécurisés
        $sort = $this->validateSortParameters($request, $this->allowedSortColumns, 'nom', 'asc');
        $pagination = $this->validatePaginationParameters($request);

        $users = $query->orderBy($sort['column'], $sort['direction'])
            ->paginate($pagination['per_page']);

        return response()->json($users);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'nom' => $validated['nom'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'actif' => $validated['actif'] ?? true,
        ]);

        $user->assignRole($validated['role']);

        return response()->json($user->load('roles'), 201);
    }

    public function show(User $user): JsonResponse
    {
        $user->load(['roles', 'permissions']);
        return response()->json($user);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $validated = $request->validated();

        $data = array_intersect_key($validated, array_flip(['nom', 'email', 'actif']));

        if (!empty($validated['password'])) {
            $data['password'] = Hash::make($validated['password']);
        }

        $user->update($data);

        if (isset($validated['role'])) {
            $user->syncRoles([$validated['role']]);
        }

        return response()->json($user->load('roles'));
    }

    public function destroy(User $user): JsonResponse
    {
        // Ne pas supprimer l'admin principal
        if ($user->email === 'admin@logistiga.com') {
            return response()->json([
                'message' => 'Impossible de supprimer le compte administrateur principal'
            ], 422);
        }

        // Ne pas se supprimer soi-même
        if ($user->id === auth()->id()) {
            return response()->json([
                'message' => 'Impossible de supprimer votre propre compte'
            ], 422);
        }

        $user->delete();

        return response()->json(['message' => 'Utilisateur supprimé avec succès']);
    }

    public function toggleActif(User $user): JsonResponse
    {
        if ($user->email === 'admin@logistiga.com') {
            return response()->json([
                'message' => 'Impossible de désactiver le compte administrateur principal'
            ], 422);
        }

        $user->update(['actif' => !$user->actif]);

        return response()->json([
            'message' => $user->actif ? 'Utilisateur activé' : 'Utilisateur désactivé',
            'user' => $user
        ]);
    }

    public function roles(): JsonResponse
    {
        $roles = Role::with('permissions')->get();
        return response()->json($roles);
    }

    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = auth()->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'message' => 'Le mot de passe actuel est incorrect'
            ], 422);
        }

        $user->update([
            'password' => Hash::make($validated['password'])
        ]);

        return response()->json(['message' => 'Mot de passe mis à jour avec succès']);
    }

    public function profile(): JsonResponse
    {
        $user = auth()->user()->load(['roles', 'permissions']);
        return response()->json($user);
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = auth()->user();

        $user->update($validated);

        return response()->json($user);
    }
}
