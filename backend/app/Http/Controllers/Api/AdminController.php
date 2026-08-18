<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminAuditLog;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductModerationNote;
use App\Models\ProducerProfile;
use App\Models\ReturnRequest;
use App\Models\User;
use App\Notifications\MarketplaceInAppNotification;
use App\Notifications\ProductModerationNoteNotification;
use App\Services\Payments\PaymentSummaryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class AdminController extends Controller
{
    public function users(): JsonResponse
    {
        return response()->json(['data' => User::query()->with('producerProfile')->latest()->get()]);
    }

    public function user(int $id): JsonResponse
    {
        return response()->json(['data' => User::query()->with('producerProfile')->findOrFail($id)]);
    }

    public function updateUserStatus(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['status' => ['required', 'string', Rule::in(['active', 'pending', 'suspended'])]]);
        $user = User::query()->findOrFail($id);
        $user->update($data);
        $this->audit($request, 'admin.user.status_updated', $user, ['status' => $data['status']]);

        return response()->json(['data' => $user]);
    }

    public function resetUserPassword(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::query()->findOrFail($id);

        if ($user->status !== 'active') {
            abort(422, 'Solo se puede restablecer la contraseña de usuarios activos.');
        }

        $user->forceFill([
            'password' => Hash::make($data['password']),
        ])->save();

        $user->tokens()->delete();
        $this->audit($request, 'admin.user.password_reset', $user);

        return response()->json([
            'data' => [
                'user' => $user->fresh(),
                'message' => 'Contraseña restablecida. El usuario deberá ingresar con la nueva contraseña temporal.',
            ],
        ]);
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
        $this->audit($request, 'admin.producer.status_updated', $profile, ['status' => $data['status']]);

        return response()->json(['data' => $profile->load('user', 'socialLinks')]);
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
        $this->audit($request, 'admin.producer.approved', $profile, ['approval_notes' => $data['approval_notes'] ?? null]);

        return response()->json(['data' => $profile->load('user', 'socialLinks')]);
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
        $this->audit($request, 'admin.producer.rejected', $profile, ['rejection_reason' => $data['rejection_reason']]);

        return response()->json(['data' => $profile->load('user', 'socialLinks')]);
    }

    public function products(Request $request): JsonResponse
    {
        $query = Product::query()
            ->with(['producerProfile.user', 'category', 'images', 'moderationNotes.admin'])
            ->latest();

        if ($request->filled('status') && $request->query('status') !== 'all') {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('producer_id')) {
            $query->where('producer_profile_id', $request->integer('producer_id'));
        }

        if ($request->filled('search')) {
            $term = mb_strtolower(trim((string) $request->query('search')));
            $query->where(function ($products) use ($term) {
                $products
                    ->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"])
                    ->orWhereRaw('LOWER(description) LIKE ?', ["%{$term}%"])
                    ->orWhereHas('producerProfile', function ($producer) use ($term) {
                        $producer
                            ->whereRaw('LOWER(business_name) LIKE ?', ["%{$term}%"])
                            ->orWhereHas('user', function ($user) use ($term) {
                                $user
                                    ->whereRaw('LOWER(name) LIKE ?', ["%{$term}%"])
                                    ->orWhereRaw('LOWER(email) LIKE ?', ["%{$term}%"]);
                            });
                    });
            });
        }

        return response()->json(['data' => $query->get()]);
    }

    public function producerProducts(Request $request, int $id): JsonResponse
    {
        $profile = ProducerProfile::query()->with('user')->findOrFail($id);
        $this->audit($request, 'admin.producer.products_viewed', $profile);

        return response()->json([
            'data' => $profile->products()
                ->with(['producerProfile.user', 'category', 'images', 'moderationNotes.admin'])
                ->latest()
                ->get(),
        ]);
    }

    public function supportProducer(Request $request, int $id): JsonResponse
    {
        $profile = ProducerProfile::query()
            ->with([
                'user',
                'socialLinks',
                'products.category',
                'products.images',
                'products.moderationNotes.admin',
            ])
            ->findOrFail($id);

        $orders = Order::query()
            ->with(['buyer', 'items.product', 'statusHistory'])
            ->whereHas('items', fn ($query) => $query->where('producer_profile_id', $profile->id))
            ->latest()
            ->limit(20)
            ->get();

        $this->audit($request, 'admin.support.producer_viewed', $profile);

        return response()->json(['data' => [
            'profile' => $profile,
            'orders' => $orders,
        ]]);
    }

    public function updateProduct(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'category_id' => ['sometimes', 'integer', 'exists:categories,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price_cents' => ['sometimes', 'integer', 'min:0'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'unit' => ['nullable', 'string', 'max:60'],
            'province' => ['nullable', 'string', 'max:120'],
            'city' => ['nullable', 'string', 'max:120'],
            'production_type' => ['nullable', 'string', 'max:120'],
            'delivery_type' => ['nullable', 'string', 'max:120'],
            'status' => ['nullable', 'string', Rule::in(['draft', 'pending', 'active', 'paused', 'rejected'])],
        ]);

        $product = Product::query()->findOrFail($id);
        $before = $product->only(array_keys($data));
        $product->update($data);
        $this->audit($request, 'admin.product.updated', $product, ['before' => $before, 'after' => $data]);

        return response()->json(['data' => $this->loadAdminProduct($product)]);
    }

    public function updateProductStatus(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['status' => ['required', 'string', Rule::in(['draft', 'pending', 'active', 'paused', 'rejected'])]]);
        $product = Product::query()->findOrFail($id);
        $product->update($data);
        $this->audit($request, 'admin.product.status_updated', $product, ['status' => $data['status']]);

        return response()->json(['data' => $this->loadAdminProduct($product)]);
    }

    public function approveProduct(Request $request, int $id): JsonResponse
    {
        $product = Product::query()->findOrFail($id);
        $product->update(['status' => 'active']);
        $this->audit($request, 'admin.product.approved', $product);

        return response()->json(['data' => $this->loadAdminProduct($product)]);
    }

    public function rejectProduct(Request $request, int $id): JsonResponse
    {
        $product = Product::query()->findOrFail($id);
        $product->update(['status' => 'rejected']);
        $this->audit($request, 'admin.product.rejected', $product);

        return response()->json(['data' => $this->loadAdminProduct($product)]);
    }

    public function deleteProduct(Request $request, int $id): JsonResponse
    {
        $product = Product::query()->with('images')->findOrFail($id);

        if ($product->orderItems()->exists()) {
            $product->update(['status' => 'paused']);
            $this->audit($request, 'admin.product.delete_blocked_paused', $product);

            return response()->json([
                'data' => [
                    'action' => 'paused',
                    'message' => 'El producto tiene pedidos asociados. Se pausó para conservar el historial.',
                    'product' => $this->loadAdminProduct($product),
                ],
            ]);
        }

        $productId = $product->id;
        $productName = $product->name;

        foreach ($product->images as $image) {
            if (! str_starts_with($image->path, 'http://') && ! str_starts_with($image->path, 'https://')) {
                Storage::disk('public')->delete($image->path);
            }
        }

        $product->delete();
        $this->audit($request, 'admin.product.deleted', null, ['product_id' => $productId, 'name' => $productName]);

        return response()->json([
            'data' => [
                'action' => 'deleted',
                'message' => 'Producto eliminado.',
            ],
        ]);
    }

    public function addProductModerationNote(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'note' => ['required', 'string'],
            'status' => ['nullable', 'string', Rule::in(['needs_changes', 'approved', 'rejected', 'internal'])],
            'notify_seller' => ['nullable', 'boolean'],
        ]);

        $product = Product::query()->with('producerProfile.user')->findOrFail($id);
        $note = ProductModerationNote::query()->create([
            'product_id' => $product->id,
            'admin_id' => $request->user()->id,
            'status' => $data['status'] ?? 'needs_changes',
            'note' => $data['note'],
            'visible_to_seller' => (bool) ($data['notify_seller'] ?? true),
        ]);

        if (($data['notify_seller'] ?? true) && $product->producerProfile?->user) {
            Notification::send($product->producerProfile->user, new ProductModerationNoteNotification($note->load('product')));
            $note->update(['notified_at' => now()]);
        }

        $this->audit($request, 'admin.product.moderation_note_created', $product, [
            'note_id' => $note->id,
            'status' => $note->status,
            'notify_seller' => (bool) ($data['notify_seller'] ?? true),
        ]);

        return response()->json(['data' => $note->load('admin', 'product')], 201);
    }

    public function auditLogs(): JsonResponse
    {
        return response()->json([
            'data' => AdminAuditLog::query()->with('admin')->latest()->limit(100)->get(),
        ]);
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
        $this->audit($request, 'admin.product.ecoscore_validated', $product, [
            'ecoscore_points' => $data['ecoscore_points'],
            'ecoscore_status' => $data['ecoscore_status'] ?? 'manual_reviewed',
        ]);

        return response()->json(['data' => $this->loadAdminProduct($product)]);
    }

    public function orders(PaymentSummaryService $payments): JsonResponse
    {
        $orders = Order::query()
            ->with('buyer', 'items.product', 'statusHistory', 'returnRequests', 'paymentIntents')
            ->latest()
            ->get();

        return response()->json(['data' => $payments->attachToOrders($orders)]);
    }

    public function order(int $id, PaymentSummaryService $payments): JsonResponse
    {
        $order = Order::query()
            ->with('buyer', 'items.product', 'statusHistory', 'returnRequests', 'paymentIntents')
            ->findOrFail($id);
        $order->setAttribute('payment_summary', $payments->forOrder($order));

        return response()->json(['data' => $order]);
    }

    public function updateOrderStatus(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'string', Rule::in(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'])],
            'note' => ['nullable', 'string'],
        ]);
        $order = Order::query()->findOrFail($id);
        $order->update(['status' => $data['status']]);
        $order->statusHistory()->create([
            'changed_by' => $request->user()->id,
            'status' => $data['status'],
            'note' => $data['note'] ?? null,
        ]);
        $this->audit($request, 'admin.order.status_updated', $order, ['status' => $data['status']]);

        return response()->json(['data' => $order->load('buyer', 'items.product', 'statusHistory', 'returnRequests')]);
    }

    public function returns(): JsonResponse
    {
        return response()->json([
            'data' => ReturnRequest::query()
                ->with('buyer', 'order.items.product.producerProfile.user', 'order.statusHistory', 'statusHistory.changedBy')
                ->latest()
                ->get(),
        ]);
    }

    public function updateReturnStatus(Request $request, int $id): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'string', Rule::in(['approved', 'rejected', 'completed'])],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $return = DB::transaction(function () use ($request, $id, $data) {
            $return = ReturnRequest::query()
                ->with(['buyer', 'order.items.producerProfile.user'])
                ->lockForUpdate()
                ->findOrFail($id);

            $allowed = match ($return->status) {
                'open' => ['approved', 'rejected'],
                'approved' => ['completed'],
                default => [],
            };

            if (! in_array($data['status'], $allowed, true)) {
                abort(422, 'La transición solicitada no es válida para el estado actual de la devolución.');
            }

            $previous = $return->status;
            $return->update(['status' => $data['status']]);
            $return->statusHistory()->create([
                'changed_by' => $request->user()->id,
                'status' => $data['status'],
                'note' => $data['note'] ?? null,
            ]);

            if ($data['status'] === 'completed' && $return->order && $return->order->status !== 'returned') {
                $return->order->update(['status' => 'returned']);
                $return->order->statusHistory()->create([
                    'changed_by' => $request->user()->id,
                    'status' => 'returned',
                    'note' => 'Devolución completada por administración.',
                ]);
            }

            $this->audit($request, 'admin.return.status_updated', $return, [
                'from' => $previous,
                'to' => $data['status'],
                'note' => $data['note'] ?? null,
            ]);

            DB::afterCommit(function () use ($return, $data) {
                $copy = match ($data['status']) {
                    'approved' => ['Tu devolución fue aceptada', 'La solicitud fue aceptada y queda pendiente de cierre administrativo.'],
                    'rejected' => ['Tu devolución fue rechazada', 'La solicitud fue rechazada. Revisá el detalle para conocer la decisión.'],
                    default => ['Tu devolución fue completada', 'Administración completó la devolución y el pedido figura como devuelto.'],
                };

                $return->buyer?->notify(new MarketplaceInAppNotification(
                    'return_'.$data['status'],
                    $copy[0],
                    $copy[1],
                    '/returns?return='.$return->id,
                    ['return_id' => $return->id, 'order_id' => $return->order_id],
                ));

                if ($data['status'] === 'completed') {
                    $producerUsers = $return->order->items
                        ->map(fn ($item) => $item->producerProfile?->user)
                        ->filter()
                        ->unique('id');
                    foreach ($producerUsers as $producer) {
                        $producer->notify(new MarketplaceInAppNotification(
                            'return_completed',
                            'Devolución completada',
                            'Administración completó la devolución del pedido '.$return->order->order_number.'.',
                            '/seller/returns?return='.$return->id,
                            ['return_id' => $return->id, 'order_id' => $return->order_id],
                        ));
                    }
                }
            });

            return $return;
        });

        return response()->json([
            'data' => $return->load(
                'buyer',
                'order.items.product.producerProfile.user',
                'order.statusHistory',
                'statusHistory.changedBy',
            ),
        ]);
    }
    private function loadAdminProduct(Product $product): Product
    {
        return $product->load(['producerProfile.user', 'category', 'images', 'moderationNotes.admin']);
    }

    private function audit(Request $request, string $action, mixed $subject = null, array $metadata = []): void
    {
        AdminAuditLog::query()->create([
            'admin_id' => $request->user()?->id,
            'action' => $action,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id' => $subject?->id,
            'metadata' => $metadata ?: null,
        ]);
    }
}
