<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\Role;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $users = User::where('company_id', auth()->user()->company_id)
            ->with('roles')
            ->when($request->search, fn($q, $s) => $q->where(function($q) use ($s) {
                $q->where('first_name', 'like', "%{$s}%")
                  ->orWhere('last_name', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%");
            }))
            ->when($request->role, fn($q, $r) => $q->whereHas('roles', fn($q) => $q->where('name', $r)))
            ->paginate($request->per_page ?? 15);

        return $this->success($users);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|unique:users,email',
            'username' => 'required|string|max:100|unique:users,username',
            'first_name' => 'required|string|max:100',
            'last_name' => 'required|string|max:100',
            'password' => 'required|string|min:8',
            'role_ids' => 'sometimes|array',
            'role_ids.*' => 'exists:roles,id',
        ]);

        $user = User::create([
            'company_id' => auth()->user()->company_id,
            'email' => $request->email,
            'username' => $request->username,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'password_hash' => Hash::make($request->password),
            'must_change_password' => true,
            'created_by' => auth()->id(),
        ]);

        if ($request->role_ids) {
            $user->roles()->sync($request->role_ids);
        }

        return $this->created($user->load('roles'), 'Usuario creado');
    }

    public function show(string $id): JsonResponse
    {
        $user = User::where('company_id', auth()->user()->company_id)
            ->with('roles.permissions', 'company', 'sucursal')
            ->findOrFail($id);

        return $this->success($user);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $user = User::where('company_id', auth()->user()->company_id)->findOrFail($id);

        $request->validate([
            'email' => "sometimes|email|unique:users,email,{$id}",
            'first_name' => 'sometimes|string|max:100',
            'last_name' => 'sometimes|string|max:100',
            'is_active' => 'sometimes|boolean',
            'role_ids' => 'sometimes|array',
            'role_ids.*' => 'exists:roles,id',
        ]);

        $user->update($request->only([
            'email', 'first_name', 'last_name', 'phone', 'is_active', 'sucursal_id'
        ]));

        if ($request->has('role_ids') && auth()->id() !== $user->id) {
            $user->roles()->sync($request->role_ids);
        }

        $user->updated_by = auth()->id();
        $user->save();

        return $this->success($user->fresh()->load('roles'), 'Usuario actualizado');
    }

    public function destroy(string $id): JsonResponse
    {
        if ($id === auth()->id()) {
            return $this->error('No puedes eliminarte a ti mismo', 422);
        }

        $user = User::where('company_id', auth()->user()->company_id)->findOrFail($id);
        $user->delete();

        return $this->success(null, 'Usuario eliminado');
    }

    public function assignRoles(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'role_ids' => 'required|array',
            'role_ids.*' => 'exists:roles,id',
        ]);

        $user = User::where('company_id', auth()->user()->company_id)->findOrFail($id);
        $user->roles()->sync($request->role_ids);

        return $this->success($user->fresh()->load('roles'), 'Roles asignados');
    }
}
