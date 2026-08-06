import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PERMISSIONS = {
  sales: ['create', 'read', 'update', 'delete', 'export', 'cancel'],
  purchases: ['create', 'read', 'update', 'delete', 'approve', 'receive', 'orders', 'suppliers'],
  inventory: ['read', 'adjust', 'transfer', 'export', 'categories', 'products', 'movements'],
  financial: ['read', 'journal_create', 'journal_approve', 'payment_create', 'export', 'close'],
  reports: ['view', 'export', 'create'],
  admin: ['users', 'roles', 'audit', 'config'],
  crm: ['create', 'read', 'update', 'delete'],
  hr: ['create', 'read', 'update', 'delete'],
};

const ROLE_UUIDS = {
  admin: '00000000-0000-0000-0000-000000000011',
  manager: '00000000-0000-0000-0000-000000000012',
  accountant: '00000000-0000-0000-0000-000000000013',
  seller: '00000000-0000-0000-0000-000000000014',
  buyer: '00000000-0000-0000-0000-000000000015',
  warehouse: '00000000-0000-0000-0000-000000000016',
};

const ROLES = [
  { uuid: ROLE_UUIDS.admin, name: 'admin', displayName: 'Administrador', description: 'Acceso total al sistema', level: 5 },
  { uuid: ROLE_UUIDS.manager, name: 'manager', displayName: 'Gerente', description: 'Acceso a reportes y aprobaciones', level: 4 },
  { uuid: ROLE_UUIDS.accountant, name: 'accountant', displayName: 'Contador', description: 'Gestión financiera y contable', level: 4 },
  { uuid: ROLE_UUIDS.seller, name: 'seller', displayName: 'Vendedor', description: 'CRM y ventas', level: 3 },
  { uuid: ROLE_UUIDS.buyer, name: 'buyer', displayName: 'Compras', description: 'Gestión de compras y proveedores', level: 3 },
  { uuid: ROLE_UUIDS.warehouse, name: 'warehouse', displayName: 'Almacén', description: 'Gestión de inventario', level: 2 },
];

const UNIT_TYPES = [
  { code: 'unit', name: 'Unidad', symbol: 'ud', category: 'unit' },
  { code: 'kg', name: 'Kilogramo', symbol: 'kg', category: 'weight' },
  { code: 'g', name: 'Gramo', symbol: 'g', category: 'weight' },
  { code: 'l', name: 'Litro', symbol: 'L', category: 'volume' },
  { code: 'ml', name: 'Mililitro', symbol: 'ml', category: 'volume' },
  { code: 'm', name: 'Metro', symbol: 'm', category: 'length' },
  { code: 'box', name: 'Caja', symbol: 'cj', category: 'packaging' },
  { code: 'pack', name: 'Paquete', symbol: 'pq', category: 'packaging' },
  { code: 'dozen', name: 'Docena', symbol: 'doc', category: 'unit' },
  { code: 'hour', name: 'Hora', symbol: 'hr', category: 'time' },
];

async function main() {
  console.log('Seeding ERP-1 database...');

  const company = await prisma.company.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Mi Empresa',
      legalName: 'Mi Empresa S.A.',
      taxId: '88888888-8',
      taxIdType: 'RUC',
      country: 'Paraguay',
      currencyCode: 'PYG',
      timezone: 'America/Asuncion',
      config: JSON.stringify({ iva_10: 10, iva_5: 5, invoice_serie: '001-001' }),
    },
  });
  console.log(`Company: ${company.name}`);

  await prisma.sucursal.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      companyId: company.id,
      code: 'SUC-001',
      name: 'Casa Matriz',
      isHeadquarters: true,
    },
  });
  console.log('Sucursal: Casa Matriz');

  const permissionRecords = [];
  for (const [module, actions] of Object.entries(PERMISSIONS)) {
    for (const action of actions) {
      const perm = await prisma.permission.upsert({
        where: { name: `${module}.${action}` },
        update: {},
        create: {
          module,
          action,
          name: `${module}.${action}`,
          description: `${action} en ${module}`,
        },
      });
      permissionRecords.push(perm);
    }
  }
  console.log(`Permissions: ${permissionRecords.length}`);

  for (const roleData of ROLES) {
    const role = await prisma.role.upsert({
      where: { id: roleData.uuid },
      update: {},
      create: {
        id: roleData.uuid,
        companyId: company.id,
        name: roleData.name,
        displayName: roleData.displayName,
        description: roleData.description,
        level: roleData.level,
        isSystem: true,
      },
    });

    if (roleData.name === 'admin') {
      for (const p of permissionRecords) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: p.id } },
          update: {},
          create: { roleId: role.id, permissionId: p.id },
        });
      }
    } else {
      const defaultModules = roleData.name === 'seller' ? ['crm', 'sales'] :
        roleData.name === 'buyer' ? ['purchases', 'inventory'] :
        roleData.name === 'warehouse' ? ['inventory'] :
        roleData.name === 'accountant' ? ['financial', 'reports', 'inventory'] :
        roleData.name === 'manager' ? ['reports', 'sales', 'purchases', 'financial'] : [];

      for (const mod of defaultModules) {
        const modPerms = permissionRecords.filter((p) => p.module === mod);
        for (const p of modPerms) {
          await prisma.rolePermission.upsert({
            where: { roleId_permissionId: { roleId: role.id, permissionId: p.id } },
            update: {},
            create: { roleId: role.id, permissionId: p.id },
          });
        }
      }
    }

    console.log(`Role: ${role.displayName} (${role.name})`);
  }

  const PAYMENT_METHODS = [
    { code: 'cash', name: 'Efectivo', description: 'Pago en efectivo' },
    { code: 'credit_card', name: 'Tarjeta de Crédito', description: 'Pago con tarjeta de crédito' },
    { code: 'debit_card', name: 'Tarjeta de Débito', description: 'Pago con tarjeta de débito' },
    { code: 'transfer', name: 'Transferencia Bancaria', description: 'Transferencia bancaria' },
    { code: 'check', name: 'Cheque', description: 'Pago con cheque' },
    { code: 'credit', name: 'Crédito', description: 'Crédito directo' },
  ];

  for (const pm of PAYMENT_METHODS) {
    await prisma.paymentMethod.upsert({
      where: { companyId_code: { companyId: company.id, code: pm.code } },
      update: {},
      create: { companyId: company.id, ...pm },
    });
  }
  console.log('Payment methods: 6');

  for (const ut of UNIT_TYPES) {
    await prisma.unitType.upsert({
      where: { code: ut.code },
      update: {},
      create: {
        code: ut.code,
        name: ut.name,
        symbol: ut.symbol,
        category: ut.category,
        companyId: company.id,
      },
    });
  }
  console.log('Unit types: 10');

  const ACCOUNTS = [
    { code: '1', name: 'ACTIVO', type: 'asset', nature: 'debit', level: 1, parentCode: null },
    { code: '2', name: 'PASIVO', type: 'liability', nature: 'credit', level: 1, parentCode: null },
    { code: '3', name: 'PATRIMONIO', type: 'equity', nature: 'credit', level: 1, parentCode: null },
    { code: '4', name: 'INGRESOS', type: 'income', nature: 'credit', level: 1, parentCode: null },
    { code: '5', name: 'COSTOS', type: 'expense', nature: 'debit', level: 1, parentCode: null },
    { code: '6', name: 'GASTOS', type: 'expense', nature: 'debit', level: 1, parentCode: null },
    { code: '1.1', name: 'Activo Corriente', type: 'asset', nature: 'debit', level: 2, parentCode: '1' },
    { code: '1.2', name: 'Activo No Corriente', type: 'asset', nature: 'debit', level: 2, parentCode: '1' },
    { code: '1.1.01', name: 'Caja', type: 'asset', nature: 'debit', level: 3, parentCode: '1.1' },
    { code: '1.1.02', name: 'Bancos', type: 'asset', nature: 'debit', level: 3, parentCode: '1.1' },
    { code: '1.1.03', name: 'Clientes', type: 'asset', nature: 'debit', level: 3, parentCode: '1.1' },
    { code: '1.1.04', name: 'Cuentas por Cobrar', type: 'asset', nature: 'debit', level: 3, parentCode: '1.1' },
    { code: '1.1.05', name: 'Inventarios', type: 'asset', nature: 'debit', level: 3, parentCode: '1.1' },
    { code: '1.1.06', name: 'IVA Crédito Fiscal', type: 'asset', nature: 'debit', level: 3, parentCode: '1.1' },
    { code: '1.2.01', name: 'Inmuebles', type: 'asset', nature: 'debit', level: 3, parentCode: '1.2' },
    { code: '1.2.02', name: 'Mobiliarios y Equipos', type: 'asset', nature: 'debit', level: 3, parentCode: '1.2' },
    { code: '1.2.03', name: 'Depreciación Acumulada', type: 'asset', nature: 'credit', level: 3, parentCode: '1.2' },
    { code: '2.1', name: 'Pasivo Corriente', type: 'liability', nature: 'credit', level: 2, parentCode: '2' },
    { code: '2.2', name: 'Pasivo No Corriente', type: 'liability', nature: 'credit', level: 2, parentCode: '2' },
    { code: '2.1.01', name: 'Proveedores', type: 'liability', nature: 'credit', level: 3, parentCode: '2.1' },
    { code: '2.1.02', name: 'Cuentas por Pagar', type: 'liability', nature: 'credit', level: 3, parentCode: '2.1' },
    { code: '2.1.03', name: 'IVA Débito Fiscal', type: 'liability', nature: 'credit', level: 3, parentCode: '2.1' },
    { code: '2.1.04', name: 'Impuestos por Pagar', type: 'liability', nature: 'credit', level: 3, parentCode: '2.1' },
    { code: '2.2.01', name: 'Préstamos Bancarios LP', type: 'liability', nature: 'credit', level: 3, parentCode: '2.2' },
    { code: '3.1', name: 'Capital', type: 'equity', nature: 'credit', level: 2, parentCode: '3' },
    { code: '3.2', name: 'Reservas', type: 'equity', nature: 'credit', level: 2, parentCode: '3' },
    { code: '3.3', name: 'Resultados Acumulados', type: 'equity', nature: 'credit', level: 2, parentCode: '3' },
    { code: '4.1', name: 'Ingresos Operacionales', type: 'income', nature: 'credit', level: 2, parentCode: '4' },
    { code: '4.2', name: 'Ingresos No Operacionales', type: 'income', nature: 'credit', level: 2, parentCode: '4' },
    { code: '4.1.01', name: 'Ventas de Mercaderías', type: 'income', nature: 'credit', level: 3, parentCode: '4.1' },
    { code: '4.1.02', name: 'Ventas de Servicios', type: 'income', nature: 'credit', level: 3, parentCode: '4.1' },
    { code: '5.1', name: 'Costo de Ventas', type: 'expense', nature: 'debit', level: 2, parentCode: '5' },
    { code: '5.1.01', name: 'Costo de Mercaderías Vendidas', type: 'expense', nature: 'debit', level: 3, parentCode: '5.1' },
    { code: '6.1', name: 'Gastos Administrativos', type: 'expense', nature: 'debit', level: 2, parentCode: '6' },
    { code: '6.2', name: 'Gastos de Ventas', type: 'expense', nature: 'debit', level: 2, parentCode: '6' },
    { code: '6.3', name: 'Gastos Financieros', type: 'expense', nature: 'debit', level: 2, parentCode: '6' },
    { code: '6.1.01', name: 'Sueldos y Salarios', type: 'expense', nature: 'debit', level: 3, parentCode: '6.1' },
    { code: '6.1.02', name: 'Alquileres', type: 'expense', nature: 'debit', level: 3, parentCode: '6.1' },
    { code: '6.1.03', name: 'Servicios Públicos', type: 'expense', nature: 'debit', level: 3, parentCode: '6.1' },
    { code: '6.2.01', name: 'Publicidad', type: 'expense', nature: 'debit', level: 3, parentCode: '6.2' },
    { code: '6.3.01', name: 'Intereses Bancarios', type: 'expense', nature: 'debit', level: 3, parentCode: '6.3' },
  ];

  const accountMap = {};
  for (const acct of ACCOUNTS) {
    const created = await prisma.accountChart.upsert({
      where: { companyId_code: { companyId: company.id, code: acct.code } },
      update: {},
      create: {
        companyId: company.id,
        parentId: acct.parentCode ? accountMap[acct.parentCode] : null,
        code: acct.code,
        name: acct.name,
        type: acct.type,
        nature: acct.nature,
        level: acct.level,
      },
    });
    accountMap[acct.code] = created.id;
  }
  console.log(`Accounts chart: ${ACCOUNTS.length}`);

  const adminPassword = await bcrypt.hash('admin123', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@miempresa.com' },
    update: {},
    create: {
      companyId: company.id,
      sucursalId: '00000000-0000-0000-0000-000000000002',
      username: 'admin',
      email: 'admin@miempresa.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'Sistema',
      isActive: true,
    },
  });

  const adminRole = await prisma.role.findFirst({ where: { name: 'admin', companyId: company.id } });
  if (adminRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
      update: {},
      create: { userId: adminUser.id, roleId: adminRole.id },
    });
  }

  console.log(`\nAdmin user: admin@miempresa.com / admin123`);
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
