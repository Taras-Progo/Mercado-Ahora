<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductImageController extends Controller
{
    public function store(Request $request, int $productId): JsonResponse
    {
        $profile = $request->user()->producerProfile()->first()
            ?? abort(422, 'Primero debe crear el perfil de productor.');

        $product = $profile->products()->findOrFail($productId);

        $request->validate([
            'image' => ['required', 'image', 'max:5120'],
            'alt_text' => ['nullable', 'string', 'max:255'],
            'is_primary' => ['nullable', 'boolean'],
        ]);

        $path = $request->file('image')->store('products', 'public');

        if ($request->boolean('is_primary')) {
            $product->images()->where('is_primary', true)->update(['is_primary' => false]);
        }

        $isPrimary = $request->boolean('is_primary') || $product->images()->count() === 0;

        $image = $product->images()->create([
            'path' => $path,
            'alt_text' => $request->input('alt_text'),
            'is_primary' => $isPrimary,
            'sort_order' => $product->images()->max('sort_order') + 1,
        ]);

        return response()->json(['data' => $image], 201);
    }

    public function update(Request $request, int $productId, int $imageId): JsonResponse
    {
        $profile = $request->user()->producerProfile()->first()
            ?? abort(422, 'Primero debe crear el perfil de productor.');

        $product = $profile->products()->findOrFail($productId);
        $image = $product->images()->findOrFail($imageId);

        $data = $request->validate([
            'alt_text' => ['nullable', 'string', 'max:255'],
            'is_primary' => ['nullable', 'boolean'],
        ]);

        if ($request->boolean('is_primary')) {
            $product->images()->where('id', '!=', $image->id)->update(['is_primary' => false]);
        }

        $image->update($data);

        return response()->json(['data' => $image]);
    }

    public function destroy(Request $request, int $productId, int $imageId): JsonResponse
    {
        $profile = $request->user()->producerProfile()->first()
            ?? abort(422, 'Primero debe crear el perfil de productor.');

        $product = $profile->products()->findOrFail($productId);
        $image = $product->images()->findOrFail($imageId);

        Storage::disk('public')->delete($image->path);

        $wasPrimary = $image->is_primary;
        $image->delete();

        if ($wasPrimary) {
            $next = $product->images()->first();
            if ($next) {
                $next->update(['is_primary' => true]);
            }
        }

        return response()->json(['data' => ['message' => 'Imagen eliminada.']]);
    }
}