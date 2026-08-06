<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\AuthService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(
        private AuthService $authService
    ) {}

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:6',
        ]);

        $result = $this->authService->attempt($request->only('email', 'password'));

        if (!$result) {
            return $this->unauthorized('Credenciales inválidas o cuenta inactiva');
        }

        return $this->success($result, 'Login exitoso');
    }

    public function refresh(Request $request): JsonResponse
    {
        $request->validate([
            'refresh_token' => 'required|string',
        ]);

        $result = $this->authService->refresh($request->refresh_token);

        if (!$result) {
            return $this->unauthorized('Refresh token inválido o expirado');
        }

        return $this->success($result, 'Token renovado');
    }

    public function logout(Request $request): JsonResponse
    {
        $request->validate([
            'refresh_token' => 'required|string',
        ]);

        $this->authService->logout($request->refresh_token);

        return $this->success(null, 'Sesión cerrada');
    }

    public function me(): JsonResponse
    {
        $user = auth()->user()->load('roles.permissions', 'company', 'sucursal');
        return $this->success($user);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = auth()->user();

        $request->validate([
            'first_name' => 'sometimes|string|max:100',
            'last_name' => 'sometimes|string|max:100',
            'phone' => 'sometimes|string|max:50',
            'avatar_url' => 'sometimes|url|max:500',
        ]);

        $user->update($request->only('first_name', 'last_name', 'phone', 'avatar_url'));

        return $this->success($user->fresh(), 'Perfil actualizado');
    }

    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        $user = auth()->user();

        if (!\Illuminate\Support\Facades\Hash::check($request->current_password, $user->password_hash)) {
            return $this->error('Contraseña actual incorrecta', 422);
        }

        $user->update([
            'password_hash' => bcrypt($request->new_password),
            'must_change_password' => false,
        ]);

        return $this->success(null, 'Contraseña actualizada');
    }
}
