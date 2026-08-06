<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Models\Sucursal;
use App\Models\UnitType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->createPermissions();
        $this->createDefaultCompany();
    }

    private function createPermissions(): void
    {
        $modules = [
            'sales' => ['create', 'read', 'update', 'delete', 'export', 'cancel'],
            'purchases' => ['create', 'read', 'update', 'delete', 'approve', 'receive'],
            'inventory' => ['read', 'adjust', 'transfer', 'export'],
            'financial' => ['read', 'journal_create', 'journal_approve', 'payment_create', 'export', 'close'],
            'reports' => ['view', 'export', 'create'],
            'admin' => ['users', 'roles', 'audit', 'config'],
            'crm' => ['create', 'read', 'update', 'delete'],
            'hr' => ['create', 'read', 'update', 'delete'],
        ];

        foreach ($modules as $module => $actions) {
            foreach ($actions as $action) {
                Permission::create([
                    'module' => $module,
                    'action' => $action,
                    'name' => "{$module}.{$action}",
                    'description' => "{$action} en {$module}",
                ]);
            }
        }

        $this->command->info('Permissions seeded: ' . Permission::count());
    }

    private function createDefaultCompany(): void
    {
        $company = Company::create([
            'name' => 'Mi Empresa',
            'legal_name' => 'Mi Empresa S.A.',
            'tax_id' => '88888888-8',
            'email' => 'admin@miempresa.com',
            'currency_code' => 'PYG',
            'timezone' => 'America/Asuncion',
            'is_active' => true,
            'config' => [
                'iva_10' => 10,
                'iva_5' => 5,
                'invoice_serie' => '001-001',
            ],
        ]);

        $sucursal = Sucursal::create([
            'company_id' => $company->id,
            'code' => 'SUC-001',
            'name' => 'Casa Matriz',
            'is_headquarters' => true,
            'is_active' => true,
        ]);

        $adminRole = Role::create([
            'company_id' => $company->id,
            'name' => 'admin',
            'display_name' => 'Administrador',
            'description' => 'Acceso total al sistema',
            'level' => 5,
            'is_system' => true,
        ]);

        $adminRole->permissions()->sync(Permission::all()->pluck('id'));

        $managerRole = Role::create([
            'company_id' => $company->id,
            'name' => 'manager',
            'display_name' => 'Gerente',
            'description' => 'Acceso a reportes y aprobaciones',
            'level' => 4,
            'is_system' => true,
        ]);

        $managerPerms = Permission::whereIn('action', ['read', 'export', 'view'])
            ->orWhereIn('module', ['reports', 'admin'])
            ->pluck('id');
        $managerRole->permissions()->sync($managerPerms);

        $sellerRole = Role::create([
            'company_id' => $company->id,
            'name' => 'seller',
            'display_name' => 'Vendedor',
            'description' => 'CRM y ventas',
            'level' => 3,
            'is_system' => true,
        ]);

        $sellerPerms = Permission::whereIn('module', ['sales', 'crm'])
            ->orWhere('name', 'inventory.read')
            ->pluck('id');
        $sellerRole->permissions()->sync($sellerPerms);

        $buyerRole = Role::create([
            'company_id' => $company->id,
            'name' => 'buyer',
            'display_name' => 'Compras',
            'description' => 'Gestión de compras y proveedores',
            'level' => 3,
            'is_system' => true,
        ]);

        $buyerPerms = Permission::whereIn('module', ['purchases'])
            ->orWhere('name', 'inventory.read')
            ->pluck('id');
        $buyerRole->permissions()->sync($buyerPerms);

        $warehouseRole = Role::create([
            'company_id' => $company->id,
            'name' => 'warehouse',
            'display_name' => 'Almacén',
            'description' => 'Gestión de inventario',
            'level' => 2,
            'is_system' => true,
        ]);

        $warehousePerms = Permission::whereIn('module', ['inventory'])
            ->orWhere('name', 'purchases.receive')
            ->pluck('id');
        $warehouseRole->permissions()->sync($warehousePerms);

        $accountantRole = Role::create([
            'company_id' => $company->id,
            'name' => 'accountant',
            'display_name' => 'Contador',
            'description' => 'Gestión financiera y contable',
            'level' => 4,
            'is_system' => true,
        ]);

        $accountantPerms = Permission::whereIn('module', ['financial', 'reports'])
            ->orWhereIn('name', ['sales.read', 'purchases.read'])
            ->pluck('id');
        $accountantRole->permissions()->sync($accountantPerms);

        $admin = User::create([
            'company_id' => $company->id,
            'sucursal_id' => $sucursal->id,
            'username' => 'admin',
            'email' => 'admin@miempresa.com',
            'password_hash' => Hash::make('admin123'),
            'first_name' => 'Admin',
            'last_name' => 'Sistema',
            'is_active' => true,
        ]);

        $admin->roles()->sync([$adminRole->id]);

        $this->createUnitTypes();

        $this->command->info('Company seeded: ' . $company->name);
        $this->command->info('Admin user: admin@miempresa.com / admin123');
    }

    private function createUnitTypes(): void
    {
        $types = [
            ['code' => 'unit', 'name' => 'Unidad', 'symbol' => 'ud', 'category' => 'unit'],
            ['code' => 'kg', 'name' => 'Kilogramo', 'symbol' => 'kg', 'category' => 'weight'],
            ['code' => 'g', 'name' => 'Gramo', 'symbol' => 'g', 'category' => 'weight'],
            ['code' => 'l', 'name' => 'Litro', 'symbol' => 'l', 'category' => 'volume'],
            ['code' => 'ml', 'name' => 'Mililitro', 'symbol' => 'ml', 'category' => 'volume'],
            ['code' => 'm', 'name' => 'Metro', 'symbol' => 'm', 'category' => 'length'],
            ['code' => 'box', 'name' => 'Caja', 'symbol' => 'cja', 'category' => 'unit'],
            ['code' => 'pack', 'name' => 'Paquete', 'symbol' => 'pq', 'category' => 'unit'],
            ['code' => 'hour', 'name' => 'Hora', 'symbol' => 'h', 'category' => 'time'],
            ['code' => 'service', 'name' => 'Servicio', 'symbol' => 'sv', 'category' => 'unit'],
        ];

        foreach ($types as $type) {
            UnitType::create($type);
        }
    }
}
