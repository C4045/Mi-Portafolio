<?php

namespace App\Http\Middleware;

use App\Traits\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PermissionMiddleware
{
    use ApiResponse;

    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = auth()->user();

        if (!$user) {
            return $this->unauthorized();
        }

        // Admin has all permissions
        if ($user->hasAnyRole(['admin', 'superadmin'])) {
            return $next($request);
        }

        if (!$user->hasPermissionFromString($permission)) {
            return $this->forbidden('No tienes permiso para esta acción');
        }

        return $next($request);
    }
}
