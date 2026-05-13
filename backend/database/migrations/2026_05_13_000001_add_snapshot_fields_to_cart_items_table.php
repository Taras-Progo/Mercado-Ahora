<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->string('product_name_snapshot')->nullable()->after('product_id');
            $table->unsignedInteger('unit_price_cents_snapshot')->nullable()->after('product_name_snapshot');
            $table->string('currency_snapshot', 3)->default('ARS')->after('unit_price_cents_snapshot');
        });
    }

    public function down(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            $table->dropColumn([
                'product_name_snapshot',
                'unit_price_cents_snapshot',
                'currency_snapshot',
            ]);
        });
    }
};
