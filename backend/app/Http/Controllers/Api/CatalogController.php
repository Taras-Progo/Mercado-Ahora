<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProducerProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public function categories(): JsonResponse
    {
        return response()->json([
            'data' => Category::query()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get(),
        ]);
    }

    public function category(string $slug): JsonResponse
    {
        return response()->json([
            'data' => Category::query()->where('slug', $slug)->firstOrFail(),
        ]);
    }

    public function products(Request $request, ?string $slug = null): JsonResponse
    {
        // When reached via /categories/{slug}/products the category comes from the
        // path; otherwise fall back to the ?category= query parameter.
        $categorySlug = $slug ?? $request->query('category');

        $products = Product::query()
            ->with(['category', 'producerProfile', 'images'])
            ->where('status', 'active')
            ->when($request->query('q'), fn ($query, $q) => $query->where('name', 'like', "%{$q}%"))
            ->when($categorySlug, function ($query, $slug) {
                $query->whereHas('category', fn ($category) => $category->where('slug', $slug));
            })
            ->when($request->query('province'), fn ($query, $province) => $query->where('province', $province))
            ->when($request->query('production_type'), fn ($query, $type) => $query->where('production_type', $type))
            ->orderByDesc('created_at')
            ->paginate(min((int) $request->query('per_page', 12), 50));

        return response()->json($products);
    }

    public function product(string $slug): JsonResponse
    {
        return response()->json([
            'data' => Product::query()
                ->with(['category', 'producerProfile.user', 'producerProfile.socialLinks', 'images'])
                ->where('slug', $slug)
                ->where('status', 'active')
                ->firstOrFail(),
        ]);
    }

    public function related(string $slug): JsonResponse
    {
        $product = Product::query()->where('slug', $slug)->firstOrFail();

        return response()->json([
            'data' => Product::query()
                ->with(['category', 'producerProfile'])
                ->where('status', 'active')
                ->where('id', '!=', $product->id)
                ->where('category_id', $product->category_id)
                ->limit(4)
                ->get(),
        ]);
    }

    public function reviews(): JsonResponse
    {
        return response()->json([
            'data' => [],
            'meta' => ['phase' => 2, 'message' => 'Las reseñas se implementan en Fase 2.'],
        ]);
    }

    public function producers(Request $request): JsonResponse
    {
        return response()->json([
            'data' => ProducerProfile::query()
                ->with('socialLinks')
                ->withCount('products')
                ->where('status', 'active')
                ->when($request->query('q'), function ($query, $q) {
                    $query->where(function ($inner) use ($q) {
                        $inner->where('business_name', 'like', "%{$q}%")
                            ->orWhere('city', 'like', "%{$q}%")
                            ->orWhere('province', 'like', "%{$q}%");
                    });
                })
                ->orderBy('business_name')
                ->get(),
        ]);
    }

    public function producer(int $id): JsonResponse
    {
        return response()->json([
            'data' => ProducerProfile::query()
                ->with([
                    'socialLinks' => fn ($query) => $query->where('is_visible', true),
                    'products' => fn ($query) => $query->where('status', 'active'),
                ])
                ->findOrFail($id),
        ]);
    }
}
