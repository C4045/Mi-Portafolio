<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CompanyController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // ── Auth (públicas) ──
    Route::post('auth/login', [AuthController::class, 'login']);
    Route::post('auth/refresh', [AuthController::class, 'refresh']);

    // ── Auth (protegidas) ──
    Route::middleware('auth:api')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::put('auth/profile', [AuthController::class, 'updateProfile']);
        Route::put('auth/change-password', [AuthController::class, 'changePassword']);

        // ── Company ──
        Route::get('company', [CompanyController::class, 'show']);
        Route::put('company', [CompanyController::class, 'update'])->middleware('permission:admin.config');

        // ── Users ──
        Route::apiResource('users', UserController::class)->middleware('permission:admin.users');
        Route::put('users/{user}/roles', [UserController::class, 'assignRoles'])->middleware('permission:admin.users');

        // ── Roles & Permissions ──
        Route::apiResource('roles', RoleController::class)->middleware('permission:admin.roles');
        Route::put('roles/{role}/permissions', [RoleController::class, 'assignPermissions'])->middleware('permission:admin.roles');
        Route::get('permissions', [RoleController::class, 'listPermissions'])->middleware('permission:admin.roles');
    });
});
