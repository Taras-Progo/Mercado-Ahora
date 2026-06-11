<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductFavorite;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $products = $request->user()
            ->favoriteProducts()
            ->where('products.status', 'active')
            ->with([
                'category',
                'producerProfile.user',
                'images' => fn ($query) => $query
                    ->orderByDesc('is_primary')
                    ->orderBy('sort_order')
                    ->orderBy('id'),
            ])
            ->orderByDesc('product_favorites.created_at')
            ->get()
            ->map(fn (Product $product) => $this->withEffectiveLocation($product));

        return response()->json(['data' => $products]);
    }

    public function ids(Request $request): JsonResponse
    {
        $ids = $request->user()
            ->favoriteProducts()
            ->where('products.status', 'active')
            ->pluck('products.id')
            ->values();

        return response()->json(['data' => $ids]);
    }

    public function store(Request $request, Product $product): JsonResponse
    {
        if ($product->status !== 'active') {
            abort(422, 'Solo podés guardar productos publicados.');
        }

        $favorite = ProductFavorite::query()->firstOrCreate([
            'user_id' => $request->user()->id,
            'product_id' => $product->id,
        ]);

        $product->load([
            'category',
            'producerProfile.user',
            'images' => fn ($query) => $query
                ->orderByDesc('is_primary')
                ->orderBy('sort_order')
                ->orderBy('id'),
        ]);

        return response()->json([
            'data' => [
                'favorited' => true,
                'product' => $this->withEffectiveLocation($product),
            ],
        ], $favorite->wasRecentlyCreated ? 201 : 200);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        $request->user()->favoriteProducts()->detach($product->id);

        return response()->json([
            'data' => [
                'favorited' => false,
                'product_id' => $product->id,
            ],
        ]);
    }

    private function withEffectiveLocation(Product $product): Product
    {
        $product->setAttribute('city', $this->effectiveValue($product->city, $product->producerProfile?->city));
        $product->setAttribute('province', $this->effectiveValue($product->province, $product->producerProfile?->province));

        return $product;
    }

    private function effectiveValue(?string $productValue, ?string $producerValue): ?string
    {
        $productValue = $this->normalizeLocation($productValue);

        return $productValue !== null ? $productValue : $this->normalizeLocation($producerValue);
    }

    private function normalizeLocation(?string $value): ?string
    {
        $normalized = (string) preg_replace('/\s+/', ' ', trim((string) $value));

        return $normalized !== '' ? $normalized : null;
    }
}
