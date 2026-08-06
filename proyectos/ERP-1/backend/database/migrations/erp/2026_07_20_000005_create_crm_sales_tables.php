<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('document_type', 20)->default('CI');
            $table->string('document_number', 50);
            $table->string('business_name', 300)->nullable();
            $table->string('first_name', 100)->nullable();
            $table->string('last_name', 100)->nullable();
            $table->string('email', 255)->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('mobile', 50)->nullable();
            $table->text('address')->nullable();
            $table->string('city', 150)->nullable();
            $table->string('state', 150)->nullable();
            $table->string('country', 100)->default('Paraguay');
            $table->date('birth_date')->nullable();
            $table->decimal('credit_limit', 15, 2)->default(0);
            $table->boolean('is_credit_hold')->default(false);
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();

            $table->unique(['company_id', 'document_type', 'document_number']);
        });

        Schema::create('suppliers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('document_type', 20)->default('RUC');
            $table->string('document_number', 50);
            $table->string('business_name', 300);
            $table->string('contact_name', 200)->nullable();
            $table->string('email', 255)->nullable();
            $table->string('phone', 50)->nullable();
            $table->string('mobile', 50)->nullable();
            $table->text('address')->nullable();
            $table->string('city', 150)->nullable();
            $table->string('state', 150)->nullable();
            $table->string('country', 100)->default('Paraguay');
            $table->string('payment_terms', 100)->nullable();
            $table->integer('credit_days')->default(0);
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->uuid('created_by')->nullable();
            $table->uuid('updated_by')->nullable();
            $table->uuid('deleted_by')->nullable();

            $table->unique(['company_id', 'document_type', 'document_number']);
        });

        Schema::create('sales', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignUuid('sucursal_id')->constrained('sucursales');
            $table->foreignUuid('customer_id')->constrained('customers');
            $table->foreignUuid('user_id')->constrained('users');
            $table->string('document_type', 30)->default('invoice');
            $table->string('document_serie', 20);
            $table->string('document_number', 50);
            $table->date('issue_date')->useCurrent();
            $table->date('due_date')->nullable();
            $table->string('payment_term', 100)->nullable();
            $table->string('currency_code', 3)->default('PYG');
            $table->decimal('exchange_rate', 10, 6)->default(1);
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('tax', 15, 2)->default(0);
            $table->decimal('discount', 15, 2)->default(0);
            $table->string('discount_type', 20)->default('percentage');
            $table->decimal('discount_rate', 5, 2)->default(0);
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
            $table->index('customer_id');
            $table->index('issue_date');
            $table->index('status');
        });

        Schema::create('sale_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('sale_id')->constrained('sales')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products');
            $table->integer('line_number');
            $table->text('description')->nullable();
            $table->decimal('quantity', 15, 4);
            $table->foreignUuid('unit_type_id')->nullable()->constrained('unit_types');
            $table->decimal('unit_price', 15, 4);
            $table->decimal('discount', 15, 2)->default(0);
            $table->string('discount_type', 20)->default('percentage');
            $table->decimal('discount_rate', 5, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(10.00);
            $table->decimal('subtotal', 15, 2);
            $table->decimal('tax', 15, 2)->default(0);
            $table->decimal('total', 15, 2);
            $table->timestamp('created_at')->useCurrent();

            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('customers');
    }
};
