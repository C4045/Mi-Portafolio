<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('sucursal_id')->constrained('sucursales');
            $table->foreignUuid('supplier_id')->constrained('suppliers');
            $table->foreignUuid('user_id')->constrained('users');
            $table->string('document_type', 30)->default('purchase_order');
            $table->string('document_serie', 20);
            $table->string('document_number', 50);
            $table->date('order_date')->useCurrent();
            $table->date('expected_date')->nullable();
            $table->string('currency_code', 3)->default('PYG');
            $table->decimal('exchange_rate', 10, 6)->default(1);
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('tax', 15, 2)->default(0);
            $table->decimal('discount', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0);
            $table->string('status', 30)->default('draft');
            $table->text('notes')->nullable();
            $table->text('internal_notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();

            $table->unique(['company_id', 'document_serie', 'document_number']);
            $table->index('supplier_id');
            $table->index('order_date');
            $table->index('status');
        });

        Schema::create('purchase_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('purchase_id')->constrained('purchases')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products');
            $table->integer('line_number');
            $table->text('description')->nullable();
            $table->decimal('quantity', 15, 4);
            $table->decimal('received_qty', 15, 4)->default(0);
            $table->foreignUuid('unit_type_id')->nullable()->constrained('unit_types');
            $table->decimal('unit_cost', 15, 4);
            $table->decimal('discount', 15, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(10.00);
            $table->decimal('subtotal', 15, 2);
            $table->decimal('tax', 15, 2)->default(0);
            $table->decimal('total', 15, 2);
            $table->timestamp('created_at')->useCurrent();

            $table->index('product_id');
        });

        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('company_id')->constrained('companies');
            $table->foreignUuid('product_id')->constrained('products');
            $table->foreignUuid('warehouse_id')->nullable()->constrained('warehouses');
            $table->string('movement_type', 30);
            $table->string('reference_type', 50)->nullable();
            $table->uuid('reference_id')->nullable();
            $table->decimal('quantity', 15, 4);
            $table->decimal('unit_cost', 15, 4)->nullable();
            $table->decimal('total_cost', 15, 2)->nullable();
            $table->decimal('stock_before', 15, 4)->nullable();
            $table->decimal('stock_after', 15, 4)->nullable();
            $table->text('notes')->nullable();
            $table->foreignUuid('user_id')->constrained('users');
            $table->timestamp('created_at')->useCurrent();

            $table->index('product_id');
            $table->index('movement_type');
            $table->index(['reference_type', 'reference_id']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_movements');
        Schema::dropIfExists('purchase_items');
        Schema::dropIfExists('purchases');
    }
};
