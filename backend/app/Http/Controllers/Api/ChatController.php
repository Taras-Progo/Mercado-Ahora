<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\ProducerProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $conversations = Conversation::query()
            ->with(['buyer', 'producerProfile.user', 'product', 'messages' => fn ($query) => $query->latest()->limit(1)])
            ->where('buyer_id', $user->id)
            ->orWhereHas('producerProfile', fn ($query) => $query->where('user_id', $user->id))
            ->latest('last_message_at')
            ->get();

        return response()->json(['data' => $conversations]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'producer_profile_id' => ['required', 'integer', 'exists:producer_profiles,id'],
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
            'message' => ['nullable', 'string'],
        ]);

        $profile = ProducerProfile::query()->findOrFail($data['producer_profile_id']);

        if ($profile->user_id === $request->user()->id) {
            abort(422, 'No puede crear una conversación consigo mismo.');
        }

        $conversation = Conversation::query()->firstOrCreate(
            [
                'buyer_id' => $request->user()->id,
                'producer_profile_id' => $profile->id,
                'product_id' => $data['product_id'] ?? null,
            ],
            ['status' => 'open', 'last_message_at' => now()],
        );

        if (! empty($data['message'])) {
            $conversation->messages()->create([
                'sender_id' => $request->user()->id,
                'body' => $data['message'],
            ]);
            $conversation->update(['last_message_at' => now()]);
        }

        return response()->json(['data' => $conversation->load('messages', 'producerProfile')], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $conversation = $this->conversationForUser($request, $id);

        return response()->json(['data' => $conversation->load('buyer', 'producerProfile.user', 'product', 'messages.sender')]);
    }

    public function messages(Request $request, int $id): JsonResponse
    {
        $conversation = $this->conversationForUser($request, $id);

        return response()->json(['data' => $conversation->messages()->with('sender')->oldest()->get()]);
    }

    public function send(Request $request, int $id): JsonResponse
    {
        $conversation = $this->conversationForUser($request, $id);
        $data = $request->validate(['body' => ['required', 'string']]);

        $message = $conversation->messages()->create([
            'sender_id' => $request->user()->id,
            'body' => $data['body'],
        ]);

        $conversation->update(['last_message_at' => now()]);

        return response()->json(['data' => $message->load('sender')], 201);
    }

    public function stockQuestion(Request $request, int $id): JsonResponse
    {
        $conversation = $this->conversationForUser($request, $id);
        $message = $conversation->messages()->create([
            'sender_id' => $request->user()->id,
            'body' => 'Hola, quisiera consultar disponibilidad y entrega de este producto.',
        ]);
        $conversation->update(['last_message_at' => now()]);

        return response()->json(['data' => $message->load('sender')], 201);
    }

    private function conversationForUser(Request $request, int $id): Conversation
    {
        $conversation = Conversation::query()->with('producerProfile')->findOrFail($id);

        if ($conversation->buyer_id !== $request->user()->id && $conversation->producerProfile->user_id !== $request->user()->id) {
            abort(403);
        }

        return $conversation;
    }
}
