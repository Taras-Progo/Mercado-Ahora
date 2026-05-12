<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProducerProfile;
use App\Models\ReturnRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function users(): JsonResponse
    {
        return response()->json(['data' => User::query()->latest()->get()]);
    }

    public function user(int $id): JsonResponse
    {
        return response()->json(['data' => User::query()->with('producerProfile')->findOrFail($id)]);
    }

    public function updateUserStatus(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['status' => ['required', 'string', 'max:30']]);
        $user = User::query()->findOrFail($id);
        $user->update($data);

        return response()->json(['data' => $user]);
    }

    public function producers(): JsonResponse
    {
        return response()->json(['data' => ProducerProfile::query()->with('user', 'socialLinks')->latest()->get()]);
    }

    public function updateProducerStatus(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['status' => ['required', 'string', 'max:30']]);
        $profile = ProducerProfile::query()->findOrFail($id);
        $profile->update($data);

        return response()->json(['data' => $profile]);
    }

    public function approveProducer(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['approval_notes' => ['nullable', 'string']]);
        $profile = ProducerProfile::query()->findOrFail($id);
        $profile->update([
            'status' => 'active',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'approval_notes' => $data['approval_notes'] ?? null,
            'rejection_reason' => null,
        ]);

        return response()->json(['data' => $profile]);
    }

    public function rejectProducer(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['rejection_reason' => ['required', 'string']]);
        $profile = ProducerProfile::query()->findOrFail($id);
        $profile->update([
            'status' => 'rejected',
            'approved_by' => null,
            'approved_at' => null,
            'rejection_reason' => $data['rejection_reason'],
        ]);

        return response()->json(['data' => $profile]);
    }

    public function products(): JsonResponse
    {
        return response()->json(['data' => Product::query()->with('producerProfile', 'category')->latest()->get()]);
    }

    public function updateProductStatus(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['status' => ['required', 'string', 'max:30']]);
        $product = Product::query()->findOrFail($id);
        $product->update($data);

        return response()->json(['data' => $product]);
    }

    public function approveProduct(int $id): JsonResponse
    {
        $product = Product::query()->findOrFail($id);
        $product->update(['status' => 'active']);

        return response()->json(['data' => $product]);
    }

    public function rejectProduct(int $id): JsonResponse
    {
        $product = Product::query()->findOrFail($id);
        $product->update(['status' => 'rejected']);

        return response()->json(['data' => $product]);
    }

    public function validateEcoScore(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'ecoscore_points' => ['required', 'integer', 'min:0', 'max:100'],
            'ecoscore_status' => ['nullable', 'string', 'max:30'],
            'ecoscore_validation_notes' => ['nullable', 'string'],
        ]);

        $product = Product::query()->findOrFail($id);
        $product->update([
            'ecoscore_points' => $data['ecoscore_points'],
            'ecoscore_status' => $data['ecoscore_status'] ?? 'manual_reviewed',
            'ecoscore_validated_by' => $request->user()->id,
            'ecoscore_validated_at' => now(),
            'ecoscore_validation_notes' => $data['ecoscore_validation_notes'] ?? null,
        ]);

        return response()->json(['data' => $product]);
    }

    public function orders(): JsonResponse
    {
        return response()->json(['data' => Order::query()->with('buyer', 'items')->latest()->get()]);
    }

    public function order(int $id): JsonResponse
    {
        return response()->json(['data' => Order::query()->with('buyer', 'items.product', 'statusHistory')->findOrFail($id)]);
    }

    public function updateOrderStatus(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['status' => ['required', 'string', 'max:30'], 'note' => ['nullable', 'string']]);
        $order = Order::query()->findOrFail($id);
        $order->update(['status' => $data['status']]);
        $order->statusHistory()->create([
            'changed_by' => $request->user()->id,
            'status' => $data['status'],
            'note' => $data['note'] ?? null,
        ]);

        return response()->json(['data' => $order->load('statusHistory')]);
    }

    public function returns(): JsonResponse
    {
        return response()->json(['data' => ReturnRequest::query()->latest()->get()]);
    }

    public function updateReturnStatus(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['status' => ['required', 'string', 'max:30']]);
        $return = ReturnRequest::query()->findOrFail($id);
        $return->update($data);

        return response()->json(['data' => $return]);
    }
}
