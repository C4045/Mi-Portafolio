<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Permission;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $roles = Role::where('company_id', auth()->user()->company_id)
            ->with('permissions')
            ->when($request->search, fn($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->paginate($request->per_page ?? 20);

        return $this->success($roles);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:100',
            'display_name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'level' => 'integer|min:0|max:5',
        ]);

        $role = Role::create([
            'company_id' => auth()->user()->company_id,
            'name' => $request->name,
            'display_name' => $request->display_name,
            'description' => $request->description,
            'level' => $request->level ?? 1,
            'created_by' => auth()->id(),
        ]);

        if ($request->permission_ids) {
            $role->permissions()->sync($request->permission_ids);
        }

        return $this->created($role->load('permissions'), 'Rol creado');
    }

    public function show(string $id): JsonResponse
    {
        $role = Role::where('company_id', auth()->user()->company_id)
            ->with('permissions')
            ->findOrFail($id);

        return $this->success($role);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $role = Role::where('company_id', auth()->user()->company_id)->findOrFail($id);

        if ($role->is_system) {
            return $this->error('No puedes modificar un rol del sistema', 422);
        }

        $role->update($request->only('display_name', 'description', 'level'));

        if ($request->has('permission_ids')) {
            $role->permissions()->sync($request->permission_ids);
        }

        $role->updated_by = auth()->id();
        $role->save();

        return $this->success($role->fresh()->load('permissions'), 'Rol actualizado');
    }

    public function destroy(string $id): JsonResponse
    {
        $role = Role::where('company_id', auth()->user()->company_id)->findOrFail($id);

        if ($role->is_system) {
            return $this->error('No puedes eliminar un rol del sistema', 422);
        }

        $role->delete();
        return $this->success(null, 'Rol eliminado');
    }

    public function assignPermissions(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'permission_ids' => 'required|array',
            'permission_ids.*' => 'exists:permissions,id',
        ]);

        $role = Role::where('company_id', auth()->user()->company_id)->findOrFail($id);
        $role->permissions()->sync($request->permission_ids);

        return $this->success($role->fresh()->load('permissions'), 'Permisos asignados');
    }

    public function listPermissions(): JsonResponse
    {
        $permissions = Permission::all()->groupBy('module');
        return $this->success($permissions);
    }
}
