<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProducerProfile;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:50'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $user = User::query()->create([
            ...$data,
            'password' => Hash::make($data['password']),
            'role' => 'buyer',
            'status' => 'active',
        ]);

        $user->cart()->firstOrCreate();

        return response()->json([
            'data' => [
                'user' => $user,
                'token' => $user->createToken('web')->plainTextToken,
            ],
        ], 201);
    }

    public function registerSeller(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:50'],
            'password' => ['required', 'string', 'min:8'],
            'business_name' => ['required', 'string', 'max:255'],
            'province' => ['nullable', 'string', 'max:120'],
            'city' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'production_origin' => ['nullable', 'string', 'max:120'],
            'product_types' => ['nullable', 'string'],
            'production_method' => ['nullable', 'string', 'max:120'],
            'production_since' => ['nullable', 'string', 'max:120'],
            'story' => ['nullable', 'string'],
            'digital_presence_notes' => ['nullable', 'string'],
        ]);

        $user = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => Hash::make($data['password']),
            'role' => 'seller',
            'status' => 'active',
        ]);

        $user->cart()->firstOrCreate();

        ProducerProfile::query()->create([
            'user_id' => $user->id,
            'business_name' => $data['business_name'],
            'slug' => $this->uniqueSlug($data['business_name'], ProducerProfile::class),
            'province' => $data['province'] ?? null,
            'city' => $data['city'] ?? null,
            'description' => $data['description'] ?? null,
            'production_origin' => $data['production_origin'] ?? null,
            'product_types' => $data['product_types'] ?? null,
            'production_method' => $data['production_method'] ?? null,
            'production_since' => $data['production_since'] ?? null,
            'story' => $data['story'] ?? null,
            'digital_presence_notes' => $data['digital_presence_notes'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json([
            'data' => [
                'user' => $user->load('producerProfile'),
                'token' => $user->createToken('web')->plainTextToken,
            ],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()->where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales no son válidas.'],
            ]);
        }

        if ($user->status !== 'active') {
            abort(403, 'La cuenta no está activa.');
        }

        return response()->json([
            'data' => [
                'user' => $user->load('producerProfile'),
                'token' => $user->createToken('web')->plainTextToken,
            ],
        ]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::query()->where('email', $data['email'])->first();

        if ($user) {
            $token = Password::broker()->createToken($user);
            $user->sendPasswordResetNotification($token);
        }

        return response()->json([
            'data' => [
                'message' => 'Si el email existe, te enviamos instrucciones para restablecer la contrasena.',
            ],
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $status = Password::reset(
            $data,
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                $user->tokens()->delete();

                event(new PasswordReset($user));
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => ['El enlace de recuperacion no es valido o ya vencio.'],
            ]);
        }

        return response()->json([
            'data' => [
                'message' => 'Contrasena actualizada. Ya podes iniciar sesion.',
            ],
        ]);
    }

    public function sendEmailVerification(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'data' => ['message' => 'Tu email ya esta verificado.'],
            ]);
        }

        $user->sendEmailVerificationNotification();

        return response()->json([
            'data' => ['message' => 'Te enviamos un email de verificacion.'],
        ]);
    }

    public function verifyEmail(Request $request, int $id, string $hash)
    {
        $user = User::query()->findOrFail($id);

        if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            abort(403, 'El enlace de verificacion no es valido.');
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            event(new Verified($user));
        }

        return redirect()->away($this->frontendUrl('/verificar-email?status=verified'));
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $request->user()->load('producerProfile'),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['data' => ['message' => 'Sesión cerrada.']]);
    }

    private function frontendUrl(string $path = ''): string
    {
        return rtrim((string) config('app.frontend_url', config('app.url')), '/').$path;
    }

    private function uniqueSlug(string $value, string $modelClass): string
    {
        $base = Str::slug($value);
        $slug = $base;
        $counter = 2;

        while ($modelClass::query()->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
