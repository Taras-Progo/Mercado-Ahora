<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProducerProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

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

        $productsQuery = Product::query()
            ->with([
                'category',
                'producerProfile',
                'images' => fn ($query) => $query
                    ->orderByDesc('is_primary')
                    ->orderBy('sort_order')
                    ->orderBy('id'),
            ])
            ->orderByDesc('created_at');

        $this->applyPublicProductFilters($productsQuery, $request, $categorySlug);

        $products = $productsQuery->paginate(min((int) $request->query('per_page', 12), 50));

        return response()->json($products);
    }

    public function filters(Request $request): JsonResponse
    {
        $categorySlug = $request->query('category');
        $query = Product::query()->select('province');

        $this->applyPublicProductFilters($query, $request, $categorySlug, includeProvince: false);

        $provinces = $this->provinceCounts($query->pluck('province'));

        return response()->json([
            'data' => [
                'provinces' => $provinces,
            ],
        ]);
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
                ->with([
                    'category',
                    'producerProfile',
                    'images' => fn ($query) => $query
                        ->orderByDesc('is_primary')
                        ->orderBy('sort_order')
                        ->orderBy('id'),
                ])
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

    private function applyPublicProductFilters($query, Request $request, ?string $categorySlug, bool $includeProvince = true): void
    {
        $searchTerm = trim((string) $request->query('q', ''));
        $searchLike = '%'.strtolower($searchTerm).'%';

        $query
            ->where('status', 'active')
            ->when($searchTerm !== '', function ($query) use ($searchLike) {
                $query->where(function ($inner) use ($searchLike) {
                    $inner
                        ->whereRaw('LOWER(name) LIKE ?', [$searchLike])
                        ->orWhereRaw('LOWER(description) LIKE ?', [$searchLike])
                        ->orWhereHas('category', fn ($category) => $category->whereRaw('LOWER(name) LIKE ?', [$searchLike]))
                        ->orWhereHas('producerProfile', fn ($profile) => $profile->whereRaw('LOWER(business_name) LIKE ?', [$searchLike]));
                });
            })
            ->when($categorySlug, function ($query, $slug) {
                $query->whereHas('category', fn ($category) => $category->where('slug', $slug));
            })
            ->when($includeProvince && $request->query('province'), function ($query, $province) {
                $normalizedProvince = $this->normalizeProvince((string) $province);

                if ($normalizedProvince !== '') {
                    $query->whereRaw('TRIM(province) = ?', [$normalizedProvince]);
                }
            })
            ->when($request->query('production_type'), fn ($query, $type) => $query->where('production_type', $type));
    }

    private function provinceCounts(Collection $rawProvinces): array
    {
        return $rawProvinces
            ->map(fn ($province) => $this->normalizeProvince((string) $province))
            ->filter()
            ->countBy()
            ->map(fn (int $count, string $province) => [
                'value' => $province,
                'label' => $province,
                'count' => $count,
            ])
            ->sortBy('label', SORT_NATURAL | SORT_FLAG_CASE)
            ->values()
            ->all();
    }

    private function normalizeProvince(string $province): string
    {
        return (string) preg_replace('/\s+/', ' ', trim($province));
    }
}
