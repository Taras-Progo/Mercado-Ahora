<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProducerProfile;
use App\Models\ProducerSocialLink;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SellerController extends Controller
{
    public function profile(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $request->user()->producerProfile()->first(),
        ]);
    }

    /**
     * Let an existing (logged-in) buyer become a producer without creating a
     * second account. Creates a pending producer profile and upgrades the
     * account to the seller role. The seller role keeps every buyer ability
     * (the cart/orders/chat routes allow both buyer and seller), so the same
     * account can buy and sell at once.
     */
    public function apply(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'admin') {
            abort(403, 'Una cuenta de administrador no puede postularse como productor.');
        }

        $existing = $user->producerProfile()->first();

        // Already approved: nothing to do, just point them to their panel.
        if ($existing && $existing->status === 'active') {
            return response()->json([
                'data' => [
                    'message' => 'Tu cuenta ya está habilitada como productor.',
                    'status' => 'active',
                    'user' => $user->load('producerProfile'),
                ],
            ]);
        }

        // A postulation is already under review.
        if ($existing && $existing->status === 'pending') {
            return response()->json([
                'data' => [
                    'message' => 'Ya tenés una postulación en revisión. Un administrador la evaluará pronto.',
                    'status' => 'pending',
                    'user' => $user->load('producerProfile'),
                ],
            ]);
        }

        $data = $request->validate([
            'business_name' => ['required', 'string', 'max:255'],
            'province' => ['nullable', 'string', 'max:120'],
            'city' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'production_practices' => ['nullable', 'string'],
            'production_origin' => ['nullable', 'string', 'max:120'],
            'product_types' => ['nullable', 'string'],
            'production_method' => ['nullable', 'string', 'max:120'],
            'production_since' => ['nullable', 'string', 'max:120'],
            'story' => ['nullable', 'string'],
            'digital_presence_notes' => ['nullable', 'string'],
        ]);

        // Create a fresh profile, or re-open a previously rejected one.
        $profile = $user->producerProfile()->updateOrCreate(
            ['user_id' => $user->id],
            [
                ...$data,
                'slug' => $existing?->slug ?? $this->uniqueProfileSlug($data['business_name']),
                'status' => 'pending',
                'approved_by' => null,
                'approved_at' => null,
                'approval_notes' => null,
                'rejection_reason' => null,
            ],
        );

        if ($user->role === 'buyer') {
            $user->update(['role' => 'seller']);
        }

        return response()->json([
            'data' => [
                'message' => 'Postulación enviada. Un administrador la revisará pronto.',
                'status' => $profile->status,
                'user' => $user->fresh()->load('producerProfile'),
                'profile' => $profile,
            ],
        ], 201);
    }

    public function saveProfile(Request $request): JsonResponse
    {
        $data = $request->validate([
            'business_name' => ['required', 'string', 'max:255'],
            'province' => ['nullable', 'string', 'max:120'],
            'city' => ['nullable', 'string', 'max:120'],
            'description' => ['nullable', 'string'],
            'production_practices' => ['nullable', 'string'],
            'production_origin' => ['nullable', 'string', 'max:120'],
            'product_types' => ['nullable', 'string'],
            'production_method' => ['nullable', 'string', 'max:120'],
            'production_since' => ['nullable', 'string', 'max:120'],
            'story' => ['nullable', 'string'],
            'digital_presence_notes' => ['nullable', 'string'],
        ]);

        $profile = $request->user()->producerProfile()->updateOrCreate(
            ['user_id' => $request->user()->id],
            [
                ...$data,
                'slug' => $request->user()->producerProfile?->slug ?? Str::slug($data['business_name']),
                'status' => $request->user()->producerProfile?->status ?? 'pending',
            ],
        );

        return response()->json(['data' => $profile]);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $profile = $request->user()->producerProfile()->first();

        return response()->json([
            'data' => [
                'profile_status' => $profile?->status,
                'can_publish_products' => $profile?->status === 'active',
                'approval_message' => $profile?->status === 'active'
                    ? 'Perfil aprobado para vender.'
                    : 'El perfil debe ser aprobado por administración antes de publicar productos activos.',
                'products_count' => $profile ? $profile->products()->count() : 0,
                'active_products_count' => $profile ? $profile->products()->where('status', 'active')->count() : 0,
                'profile_completion_percent' => $this->profileCompletionPercent($profile),
                'pending_orders_count' => $profile ? $profile->products()
                    ->join('order_items', 'products.id', '=', 'order_items.product_id')
                    ->join('orders', 'orders.id', '=', 'order_items.order_id')
                    ->whereIn('orders.status', ['pending', 'confirmed', 'processing'])
                    ->count() : 0,
            ],
        ]);
    }

    public function products(Request $request): JsonResponse
    {
        $profile = $this->profileOrFail($request);

        return response()->json([
            'data' => $profile->products()->with(['category', 'images'])->latest()->get(),
        ]);
    }

    public function storeProduct(Request $request): JsonResponse
    {
        $profile = $this->profileOrFail($request);
        $data = $this->validateProduct($request);
        $this->ensureCanUseProductStatus($profile, $data['status'] ?? 'draft');

        $product = $profile->products()->create([
            ...$data,
            'slug' => $this->uniqueProductSlug($data['name']),
            'currency' => 'ARS',
            'status' => $data['status'] ?? 'draft',
        ]);

        return response()->json(['data' => $product->load(['category', 'images'])], 201);
    }

    public function showProduct(Request $request, int $id): JsonResponse
    {
        $profile = $this->profileOrFail($request);

        return response()->json([
            'data' => $profile->products()->with(['category', 'images'])->findOrFail($id),
        ]);
    }

    public function updateProduct(Request $request, int $id): JsonResponse
    {
        $profile = $this->profileOrFail($request);
        $product = $profile->products()->findOrFail($id);
        $data = $this->validateProduct($request, true);
        $this->ensureCanUseProductStatus($profile, $data['status'] ?? $product->status);

        $product->update($data);

        return response()->json(['data' => $product->load(['category', 'images'])]);
    }

    public function destroyProduct(Request $request, int $id): JsonResponse
    {
        $profile = $this->profileOrFail($request);
        $profile->products()->findOrFail($id)->update(['status' => 'paused']);

        return response()->json(['data' => ['message' => 'Producto pausado.']]);
    }

    public function publishProduct(Request $request, int $id): JsonResponse
    {
        $profile = $this->profileOrFail($request);
        $this->ensureCanUseProductStatus($profile, 'active');
        $product = $profile->products()->findOrFail($id);
        $product->update(['status' => 'active']);

        return response()->json(['data' => $product]);
    }

    public function socialLinks(Request $request): JsonResponse
    {
        $profile = $this->profileOrFail($request);

        return response()->json(['data' => $profile->socialLinks()->latest()->get()]);
    }

    public function saveSocialLink(Request $request): JsonResponse
    {
        $profile = $this->profileOrFail($request);
        $data = $request->validate([
            'platform' => ['required', 'string', 'max:80'],
            'url' => ['required', 'url', 'max:255'],
            'is_visible' => ['nullable', 'boolean'],
        ]);

        $link = ProducerSocialLink::query()->updateOrCreate(
            ['producer_profile_id' => $profile->id, 'platform' => $data['platform']],
            ['url' => $data['url'], 'is_visible' => $data['is_visible'] ?? true],
        );

        return response()->json(['data' => $link], 201);
    }

    public function pauseProduct(Request $request, int $id): JsonResponse
    {
        $profile = $this->profileOrFail($request);
        $product = $profile->products()->findOrFail($id);
        $product->update(['status' => 'paused']);

        return response()->json(['data' => $product]);
    }

    private function profileOrFail(Request $request)
    {
        return $request->user()->producerProfile()->first() ?? abort(422, 'Primero debe crear el perfil de productor.');
    }

    private function ensureCanUseProductStatus($profile, string $status): void
    {
        if ($status === 'active' && $profile->status !== 'active') {
            abort(403, 'El productor debe estar aprobado antes de publicar productos activos.');
        }
    }

    private function profileCompletionPercent(?ProducerProfile $profile): int
    {
        if (! $profile) {
            return 0;
        }

        $fields = [
            'business_name',
            'province',
            'city',
            'description',
            'production_origin',
            'product_types',
            'production_method',
            'production_since',
            'story',
            'digital_presence_notes',
        ];

        $completed = collect($fields)
            ->filter(fn (string $field) => filled($profile->{$field}))
            ->count();

        return (int) round(($completed / count($fields)) * 100);
    }

    private function validateProduct(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'category_id' => [$required, 'integer', 'exists:categories,id'],
            'name' => [$required, 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price_cents' => [$required, 'integer', 'min:0'],
            'stock' => [$required, 'integer', 'min:0'],
            'unit' => ['nullable', 'string', 'max:60'],
            'province' => ['nullable', 'string', 'max:120'],
            'city' => ['nullable', 'string', 'max:120'],
            'production_type' => ['nullable', 'string', 'max:120'],
            'delivery_type' => ['nullable', 'string', 'max:120'],
            'ecoscore_points' => ['nullable', 'integer', 'min:0', 'max:100'],
            'ecoscore_notes' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'max:30'],
        ]);
    }

    private function uniqueProfileSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'productor';
        $slug = $base;
        $counter = 2;

        while (ProducerProfile::query()->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    private function uniqueProductSlug(string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $counter = 2;

        while (Product::query()->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
