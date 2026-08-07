<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_intents', function (Blueprint $table) {
            $table->foreignId('buyer_id')->nullable()->after('order_id')->constrained('users')->nullOnDelete();
            $table->uuid('internal_reference')->nullable()->unique()->after('buyer_id');
            $table->uuid('idempotency_key')->nullable()->unique()->after('internal_reference');
            $table->string('mode', 20)->default('sandbox')->after('provider');
            $table->string('preference_id')->nullable()->index()->after('external_id');
            $table->text('checkout_url')->nullable()->after('preference_id');
            $table->text('sandbox_checkout_url')->nullable()->after('checkout_url');
            $table->timestamp('expires_at')->nullable()->index()->after('sandbox_checkout_url');
            $table->timestamp('reserved_at')->nullable()->after('expires_at');
        });

        Schema::create('payment_intent_order', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_intent_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['payment_intent_id', 'order_id']);
        });

        Schema::create('stock_reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_intent_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('quantity');
            $table->string('status', 20)->default('active')->index();
            $table->timestamp('expires_at')->index();
            $table->timestamp('consumed_at')->nullable();
            $table->timestamp('released_at')->nullable();
            $table->timestamps();
            $table->unique(['payment_intent_id', 'order_item_id']);
            $table->index(['product_id', 'status', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_reservations');
        Schema::dropIfExists('payment_intent_order');

        Schema::table('payment_intents', function (Blueprint $table) {
            $table->dropConstrainedForeignId('buyer_id');
            $table->dropColumn([
                'internal_reference',
                'idempotency_key',
                'mode',
                'preference_id',
                'checkout_url',
                'sandbox_checkout_url',
                'expires_at',
                'reserved_at',
            ]);
        });
    }
};
