<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_intents', function (Blueprint $table) {
            $table->string('provider_payment_id')->nullable()->index()->after('preference_id');
            $table->string('provider_status', 50)->nullable()->after('status');
            $table->string('provider_status_detail')->nullable()->after('provider_status');
            $table->timestamp('paid_at')->nullable()->after('reserved_at');
            $table->timestamp('last_synced_at')->nullable()->after('paid_at');
            $table->boolean('requires_review')->default(false)->after('last_synced_at');
            $table->text('processing_error')->nullable()->after('requires_review');
        });

        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->string('currency', 3)->default('ARS')->after('amount_cents');
            $table->string('status_detail')->nullable()->after('status');
            $table->string('payment_method_id')->nullable()->after('status_detail');
            $table->string('payment_type_id')->nullable()->after('payment_method_id');
            $table->boolean('live_mode')->nullable()->after('payment_type_id');
            $table->timestamp('provider_created_at')->nullable()->after('live_mode');
            $table->timestamp('provider_approved_at')->nullable()->after('provider_created_at');
        });

        DB::table('payment_transactions')->whereNotNull('external_id')->orderBy('id')->get()
            ->groupBy(fn ($row) => $row->provider.'|'.$row->external_id)
            ->each(fn ($rows) => $rows->slice(1)->each(
                fn ($row) => DB::table('payment_transactions')->where('id', $row->id)->update(['external_id' => null])
            ));

        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->unique(['provider', 'external_id'], 'payment_transactions_provider_external_unique');
        });

        Schema::table('payment_webhook_events', function (Blueprint $table) {
            $table->string('request_id')->nullable()->after('external_id');
            $table->string('resource_id')->nullable()->index()->after('request_id');
            $table->boolean('signature_valid')->default(false)->after('resource_id');
            $table->unsignedSmallInteger('attempts')->default(0)->after('status');
            $table->timestamp('processed_at')->nullable()->after('attempts');
            $table->text('processing_error')->nullable()->after('processed_at');
        });

        DB::table('payment_webhook_events')->whereNotNull('external_id')->orderBy('id')->get()
            ->groupBy(fn ($row) => $row->provider.'|'.$row->external_id)
            ->each(fn ($rows) => $rows->slice(1)->each(
                fn ($row) => DB::table('payment_webhook_events')->where('id', $row->id)->update(['external_id' => null])
            ));

        Schema::table('payment_webhook_events', function (Blueprint $table) {
            $table->unique(['provider', 'external_id'], 'payment_webhooks_provider_external_unique');
        });

        Schema::create('payment_status_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_intent_id')->constrained()->cascadeOnDelete();
            $table->string('from_status', 50)->nullable();
            $table->string('to_status', 50);
            $table->string('source', 40);
            $table->string('provider_payment_id')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->unique(['payment_intent_id', 'to_status'], 'payment_status_history_transition_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_status_histories');
        Schema::table('payment_webhook_events', function (Blueprint $table) {
            $table->dropUnique('payment_webhooks_provider_external_unique');
            $table->dropColumn(['request_id', 'resource_id', 'signature_valid', 'attempts', 'processed_at', 'processing_error']);
        });
        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->dropUnique('payment_transactions_provider_external_unique');
            $table->dropColumn(['currency', 'status_detail', 'payment_method_id', 'payment_type_id', 'live_mode', 'provider_created_at', 'provider_approved_at']);
        });
        Schema::table('payment_intents', function (Blueprint $table) {
            $table->dropColumn(['provider_payment_id', 'provider_status', 'provider_status_detail', 'paid_at', 'last_synced_at', 'requires_review', 'processing_error']);
        });
    }
};