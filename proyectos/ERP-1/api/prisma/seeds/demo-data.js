import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const COMPANY_ID = '00000000-0000-0000-0000-000000000001';
const SUCURSAL_ID = '00000000-0000-0000-0000-000000000002';

const CATEGORIES = [
  'Electrónicos', 'Hogar', 'Oficina', 'Alimentos', 'Bebidas',
  'Limpieza', 'Higiene', 'Automotor', 'Juguetes', 'Deportes',
];

const PRODUCT_DATA = [
  { name: 'Laptop Pro 15"', sku: 'LAP-001', category: 'Electrónicos', cost: 4500000, price: 6500000, stock: 15, min: 5 },
  { name: 'Monitor 27" 4K', sku: 'MON-001', category: 'Electrónicos', cost: 1800000, price: 2800000, stock: 22, min: 5 },
  { name: 'Teclado Mecánico RGB', sku: 'TEC-001', category: 'Electrónicos', cost: 350000, price: 550000, stock: 45, min: 10 },
  { name: 'Mouse Inalámbrico', sku: 'MOU-001', category: 'Electrónicos', cost: 120000, price: 220000, stock: 60, min: 20 },
  { name: 'Auriculares Bluetooth', sku: 'AUR-001', category: 'Electrónicos', cost: 280000, price: 450000, stock: 35, min: 10 },
  { name: 'Silla Ergonómica', sku: 'SIL-001', category: 'Oficina', cost: 850000, price: 1350000, stock: 8, min: 5 },
  { name: 'Escritorio Eléctrico', sku: 'ESC-001', category: 'Oficina', cost: 1200000, price: 1950000, stock: 3, min: 3 },
  { name: 'Lámpara LED Escritorio', sku: 'LAM-001', category: 'Oficina', cost: 95000, price: 165000, stock: 30, min: 10 },
  { name: 'Mesa de Centro', sku: 'MES-001', category: 'Hogar', cost: 450000, price: 750000, stock: 12, min: 5 },
  { name: 'Sofá 3 Cuerpos', sku: 'SOF-001', category: 'Hogar', cost: 2200000, price: 3500000, stock: 4, min: 3 },
  { name: 'Cama King Size', sku: 'CAM-001', category: 'Hogar', cost: 2800000, price: 4200000, stock: 2, min: 3 },
  { name: 'Juego de Sábanas Premium', sku: 'SAB-001', category: 'Hogar', cost: 180000, price: 320000, stock: 25, min: 10 },
  { name: 'Arroz 5kg', sku: 'ALI-001', category: 'Alimentos', cost: 25000, price: 38000, stock: 200, min: 50 },
  { name: 'Fideos Tallarín 500g', sku: 'ALI-002', category: 'Alimentos', cost: 8000, price: 12000, stock: 350, min: 100 },
  { name: 'Aceite de Cocina 1L', sku: 'ALI-003', category: 'Alimentos', cost: 15000, price: 25000, stock: 180, min: 50 },
  { name: 'Agua Mineral 2L', sku: 'BEB-001', category: 'Bebidas', cost: 5000, price: 8000, stock: 500, min: 100 },
  { name: 'Refresco Cola 2L', sku: 'BEB-002', category: 'Bebidas', cost: 7000, price: 12000, stock: 400, min: 100 },
  { name: 'Cerveza Premium 6pk', sku: 'BEB-003', category: 'Bebidas', cost: 35000, price: 55000, stock: 90, min: 30 },
  { name: 'Detergente Líquido 1L', sku: 'LIM-001', category: 'Limpieza', cost: 12000, price: 22000, stock: 150, min: 40 },
  { name: 'Lavandina 1L', sku: 'LIM-002', category: 'Limpieza', cost: 5000, price: 9000, stock: 200, min: 50 },
  { name: 'Jabón Antibacterial', sku: 'HIG-001', category: 'Higiene', cost: 6000, price: 11000, stock: 300, min: 80 },
  { name: 'Shampoo Profesional', sku: 'HIG-002', category: 'Higiene', cost: 25000, price: 45000, stock: 65, min: 20 },
  { name: 'Pelota Fútbol Profesional', sku: 'DEP-001', category: 'Deportes', cost: 120000, price: 220000, stock: 18, min: 10 },
  { name: 'Bicicleta Montaña 21v', sku: 'DEP-002', category: 'Deportes', cost: 1500000, price: 2500000, stock: 0, min: 3 },
  { name: 'Aceite Motor 5W30', sku: 'AUT-001', category: 'Automotor', cost: 55000, price: 95000, stock: 40, min: 15 },
  { name: 'Batería Auto 12V', sku: 'AUT-002', category: 'Automotor', cost: 350000, price: 550000, stock: 1, min: 5 },
  { name: 'Juguete Bloques Construcción', sku: 'JUG-001', category: 'Juguetes', cost: 85000, price: 145000, stock: 28, min: 10 },
  { name: 'Muñeca Educativa', sku: 'JUG-002', category: 'Juguetes', cost: 65000, price: 110000, stock: 2, min: 10 },
  { name: 'Cuaderno Espiral A4', sku: 'OFI-001', category: 'Oficina', cost: 8000, price: 15000, stock: 500, min: 100 },
  { name: 'Bolígrafo Premium (caja 12)', sku: 'OFI-002', category: 'Oficina', cost: 25000, price: 45000, stock: 120, min: 40 },
];

const SUPPLIER_DATA = [
  { businessName: 'Distribuidora Electrónica S.A.', documentNumber: '80000001-1', city: 'Asunción' },
  { businessName: 'Importadora del Sur', documentNumber: '80000002-2', city: 'Encarnación' },
  { businessName: 'Alimentos Paraguay S.A.', documentNumber: '80000003-3', city: 'Asunción' },
  { businessName: 'Bebidas del Norte', documentNumber: '80000004-4', city: 'Ciudad del Este' },
  { businessName: 'Muebles & Hogar S.A.', documentNumber: '80000005-5', city: 'Asunción' },
  { businessName: 'Limpieza Total EIRL', documentNumber: '80000006-6', city: 'San Lorenzo' },
];

const CUSTOMER_NAMES = [
  'Juan Pérez', 'María González', 'Carlos Martínez', 'Ana López',
  'Pedro Rodríguez', 'Laura Sánchez', 'Diego Ramírez', 'Sofia Mendoza',
  'Andrés Torres', 'Valentina Ruiz', 'Gabriel Díaz', 'Isabella Castro',
  'Mateo Vargas', 'Camila Ortega', 'Santiago Herrera', 'Luna Delgado',
  'Sebastián Ríos', 'Emilia Paredes', 'Benjamin Acosta', 'Zoe Benítez',
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDecimal(min, max, decimals = 0) {
  const val = min + Math.random() * (max - min);
  return Number(val.toFixed(decimals));
}

function randomDate(daysAgoMax) {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(0, daysAgoMax));
  d.setHours(randomInt(8, 20), randomInt(0, 59), randomInt(0, 59));
  return d;
}

async function main() {
  console.log('Seeding demo data...');
  const categoryMap = {};
  for (const name of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { companyId_code: { companyId: COMPANY_ID, code: name.substring(0, 10).toUpperCase() } },
      update: {},
      create: {
        companyId: COMPANY_ID,
        code: name.substring(0, 10).toUpperCase(),
        name,
        isActive: true,
      },
    });
    categoryMap[name] = cat;
  }
  console.log(`Categories: ${Object.keys(categoryMap).length}`);
  const productMap = {};
  const defaultUnitType = await prisma.unitType.findFirst({ where: { code: 'unit' } });

  for (const p of PRODUCT_DATA) {
    const product = await prisma.product.upsert({
      where: { companyId_sku: { companyId: COMPANY_ID, sku: p.sku } },
      update: {
        currentStock: p.stock,
        salePrice: p.price,
        costPrice: p.cost,
      },
      create: {
        companyId: COMPANY_ID,
        categoryId: categoryMap[p.category]?.id || null,
        unitTypeId: defaultUnitType.id,
        sku: p.sku,
        name: p.name,
        costPrice: p.cost,
        salePrice: p.price,
        currentStock: p.stock,
        minStock: p.min,
        maxStock: p.min * 10,
        isTracked: true,
        productType: 'product',
      },
    });
    productMap[p.sku] = product;
  }
  console.log(`Products: ${Object.keys(productMap).length}`);
  const supplierIds = [];
  for (const s of SUPPLIER_DATA) {
    const supplier = await prisma.supplier.upsert({
      where: { companyId_documentType_documentNumber: { companyId: COMPANY_ID, documentType: 'RUC', documentNumber: s.documentNumber } },
      update: {},
      create: {
        companyId: COMPANY_ID,
        documentType: 'RUC',
        documentNumber: s.documentNumber,
        businessName: s.businessName,
        city: s.city,
        isActive: true,
      },
    });
    supplierIds.push(supplier.id);
  }
  console.log(`Suppliers: ${supplierIds.length}`);
  const customerIds = [];
  for (let i = 0; i < 30; i++) {
    const name = i < CUSTOMER_NAMES.length ? CUSTOMER_NAMES[i] : `Cliente ${i + 1}`;
    const [first, ...rest] = name.split(' ');
    const last = rest.join(' ') || 'Apellido';
    const ci = `${randomInt(1000000, 9999999)}-${randomInt(0, 9)}`;
    const customer = await prisma.customer.upsert({
      where: { companyId_documentType_documentNumber: { companyId: COMPANY_ID, documentType: 'CI', documentNumber: ci } },
      update: {},
      create: {
        companyId: COMPANY_ID,
        documentType: 'CI',
        documentNumber: ci,
        firstName: first,
        lastName: last,
        email: `cliente${i + 1}@email.com`,
        phone: `0981${randomInt(100000, 999999)}`,
        city: ['Asunción', 'Encarnación', 'Ciudad del Este', 'Luque', 'San Lorenzo'][randomInt(0, 4)],
        createdAt: randomDate(180),
        isActive: true,
      },
    });
    customerIds.push(customer.id);
  }
  console.log(`Customers: ${customerIds.length}`);
  const adminUser = await prisma.user.findFirst({ where: { companyId: COMPANY_ID } });
  const existingSales = await prisma.sale.count({ where: { companyId: COMPANY_ID } });

  if (existingSales === 0) {
    const productList = Object.values(productMap);
    let serie = 1;

    for (let day = 90; day >= 0; day -= randomInt(1, 2)) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      date.setHours(randomInt(8, 18), randomInt(0, 59));

      const numItems = randomInt(1, 6);
      const items = [];
      let subtotal = 0;

      const usedProducts = new Set();
      for (let i = 0; i < numItems; i++) {
        let product;
        let attempts = 0;
        do {
          product = productList[randomInt(0, productList.length - 1)];
          attempts++;
        } while (usedProducts.has(product.id) && attempts < 20);
        usedProducts.add(product.id);

        const qty = randomInt(1, 5);
        const unitPrice = Number(product.salePrice);
        const total = qty * unitPrice;
        subtotal += total;

        items.push({
          productId: product.id,
          lineNumber: i + 1,
          quantity: qty,
          unitPrice,
          unitTypeId: defaultUnitType.id,
          taxRate: 10,
          subtotal: total,
          tax: total * 0.1,
          total,
          createdAt: date,
        });
      }

      const tax = subtotal * 0.1;
      const total = subtotal + tax;
      const docNum = `001-001-${String(serie).padStart(7, '0')}`;
      const statuses = ['confirmed', 'confirmed', 'confirmed', 'paid', 'paid', 'paid', 'paid', 'draft', 'cancelled'];
      const status = statuses[randomInt(0, statuses.length - 1)];
      if (day > 60 && status === 'cancelled') continue;

      const customerId = customerIds[randomInt(0, customerIds.length - 1)];

      await prisma.sale.create({
        data: {
          companyId: COMPANY_ID,
          sucursalId: SUCURSAL_ID,
          customerId,
          userId: adminUser.id,
          documentType: 'invoice',
          documentSerie: '001-001',
          documentNumber: docNum,
          issueDate: date,
          subtotal,
          tax,
          total,
          status,
          createdAt: date,
          updatedAt: date,
          items: { create: items },
        },
      });
      serie++;
    }
  }

  const saleCount = await prisma.sale.count({ where: { companyId: COMPANY_ID } });
  console.log(`Sales: ${saleCount}`);
  const existingPurchases = await prisma.purchase.count({ where: { companyId: COMPANY_ID } });

  if (existingPurchases === 0) {
    let pSerie = 1;
    const productList = Object.values(productMap);

    for (let day = 60; day >= 0; day -= randomInt(3, 5)) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      date.setHours(randomInt(7, 16), randomInt(0, 59));

      const numItems = randomInt(2, 8);
      const items = [];
      let subtotal = 0;

      const usedProducts = new Set();
      for (let i = 0; i < numItems; i++) {
        let product;
        let attempts = 0;
        do {
          product = productList[randomInt(0, productList.length - 1)];
          attempts++;
        } while (usedProducts.has(product.id) && attempts < 20);
        usedProducts.add(product.id);

        const qty = randomInt(5, 50);
        const unitCost = Number(product.costPrice);
        const total = qty * unitCost;
        subtotal += total;

        items.push({
          productId: product.id,
          lineNumber: i + 1,
          quantity: qty,
          unitCost,
          unitTypeId: defaultUnitType.id,
          taxRate: 10,
          subtotal: total,
          tax: total * 0.1,
          total: total * 1.1,
          createdAt: date,
        });
      }

      const tax = subtotal * 0.1;
      const total = subtotal + tax;
      const supplierId = supplierIds[randomInt(0, supplierIds.length - 1)];
      const statuses = ['received', 'received', 'received', 'ordered', 'ordered', 'partially_received'];
      const status = statuses[randomInt(0, statuses.length - 1)];

      await prisma.purchase.create({
        data: {
          companyId: COMPANY_ID,
          sucursalId: SUCURSAL_ID,
          supplierId,
          userId: adminUser.id,
          documentType: 'purchase_order',
          documentSerie: 'OC-001',
          documentNumber: `OC-${String(pSerie).padStart(7, '0')}`,
          orderDate: date,
          subtotal,
          tax,
          total,
          status,
          createdAt: date,
          updatedAt: date,
          items: { create: items },
        },
      });
      pSerie++;
    }
  }

  const purchaseCount = await prisma.purchase.count({ where: { companyId: COMPANY_ID } });
  console.log(`Purchases: ${purchaseCount}`);

  console.log('\nDemo data seeded successfully!');
  console.log(`→ ${saleCount} ventas`);
  console.log(`→ ${purchaseCount} compras`);
  console.log(`→ ${customerIds.length} clientes`);
  console.log(`→ ${supplierIds.length} proveedores`);
  console.log(`→ ${Object.keys(productMap).length} productos`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
