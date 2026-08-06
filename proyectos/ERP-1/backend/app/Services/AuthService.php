<?php

namespace App\Services;

use App\Models\RefreshToken;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthService
{
    public function attempt(array $credentials): ?array
    {
        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password_hash)) {
            return null;
        }

        if (!$user->is_active) {
            return null;
        }

        $token = JWTAuth::fromUser($user);
        $refreshToken = $this->createRefreshToken($user);

        $user->update(['last_login_at' => now()]);

        return [
            'access_token' => $token,
            'refresh_token' => $refreshToken,
            'token_type' => 'bearer',
            'expires_in' => auth()->factory()->getTTL() * 60,
            'user' => $user->load('roles'),
        ];
    }

    public function refresh(string $refreshToken): ?array
    {
        $hashed = hash('sha256', $refreshToken);
        $record = RefreshToken::where('token_hash', $hashed)
            ->where('revoked', false)
            ->where('expires_at', '>', now())
            ->first();

        if (!$record) {
            return null;
        }

        $user = $record->user;

        $record->update(['revoked' => true]);

        $newToken = JWTAuth::fromUser($user);
        $newRefresh = $this->createRefreshToken($user);

        return [
            'access_token' => $newToken,
            'refresh_token' => $newRefresh,
            'token_type' => 'bearer',
            'expires_in' => auth()->factory()->getTTL() * 60,
        ];
    }

    public function logout(string $refreshToken): void
    {
        $hashed = hash('sha256', $refreshToken);
        RefreshToken::where('token_hash', $hashed)->update(['revoked' => true]);

        try {
            JWTAuth::invalidate(JWTAuth::getToken());
        } catch (\Exception $e) {
            // Token already invalid
        }
    }

    private function createRefreshToken(User $user): string
    {
        $token = Str::random(80);
        RefreshToken::create([
            'user_id' => $user->id,
            'token_hash' => hash('sha256', $token),
            'expires_at' => now()->addDays(7),
        ]);

        return $token;
    }
}
