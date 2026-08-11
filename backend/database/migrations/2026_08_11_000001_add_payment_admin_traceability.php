<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_webhook_events', function (Blueprint $table) {
            $table->foreignId('payment_intent_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->index(['payment_intent_id', 'created_at']);
        });

        Schema::create('payment_review_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_intent_id')->constrained()->cascadeOnDelete();
            $table->foreignId('admin_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('note');
            $table->timestamps();
            $table->index(['payment_intent_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_review_notes');
        Schema::table('payment_webhook_events', function (Blueprint $table) {
            $table->dropIndex(['payment_intent_id', 'created_at']);
            $table->dropConstrainedForeignId('payment_intent_id');
        });
    }
};
