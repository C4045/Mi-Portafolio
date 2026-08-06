import { prisma } from '../../config/database.js';
import { generateReportPdf } from './report.pdf.js';
import { generateReportExcel } from './report.excel.js';

const isoDate = (d) => d ? new Date(d).toISOString() : undefined;
const fmt = (n) => (n != null ? Number(n) : 0);

export class ReportService {
  async getData(type, companyId, filters = {}) {
    const types = { sales: this.sales, purchases: this.purchases, inventory: this.inventory, customers: this.customers, suppliers: this.suppliers, products: this.products, profits: this.profits, movements: this.movements, cash: this.cash, users: this.users, audit: this.audit };
    const fn = types[type];
    if (!fn) throw new Error(`Tipo de reporte inválido: ${type}`);
    return fn.call(this, companyId, filters);
  }

  async trialBalance(companyId, query = {}) {
    const startDate = query.startDate || '2000-01-01';
    const endDate = query.endDate || '2100-12-31';
    const lines = await prisma.journalLine.findMany({
      where: { journalEntry: { companyId, status: 'posted', deletedAt: null, entryDate: { gte: new Date(startDate), lte: new Date(`${endDate}T23:59:59.999Z`) } } },
      include: { account: true },
    });
    const groups = {};
    for (const l of lines) {
      const key = l.accountId;
      if (!groups[key]) { groups[key] = { accountId: l.accountId, code: l.account.code, name: l.account.name, type: l.account.type, nature: l.account.nature, totalDebit: 0, totalCredit: 0 }; }
      groups[key].totalDebit += Number(l.debit);
      groups[key].totalCredit += Number(l.credit);
    }
    const rows = Object.values(groups).sort((a, b) => a.code.localeCompare(b.code));
    let totalDebit = 0, totalCredit = 0;
    for (const r of rows) { r.balance = r.nature === 'debit' ? r.totalDebit - r.totalCredit : r.totalCredit - r.totalDebit; totalDebit += r.totalDebit; totalCredit += r.totalCredit; }
    return { rows, totals: { totalDebit, totalCredit }, dateRange: { startDate, endDate } };
  }

  async incomeStatement(companyId, query = {}) {
    const tb = await this.trialBalance(companyId, query);
    const incomeRows = tb.rows.filter((r) => r.type === 'income');
    const expenseRows = tb.rows.filter((r) => r.type === 'expense');
    const totalIncome = incomeRows.reduce((s, r) => s + r.balance, 0);
    const totalExpenses = expenseRows.reduce((s, r) => s + r.balance, 0);
    return { income: { rows: incomeRows, total: totalIncome }, expenses: { rows: expenseRows, total: totalExpenses }, netIncome: totalIncome - totalExpenses, dateRange: query };
  }

  async balanceSheet(companyId, query = {}) {
    const tb = await this.trialBalance(companyId, query);
    const assetRows = tb.rows.filter((r) => r.type === 'asset');
    const liabilityRows = tb.rows.filter((r) => r.type === 'liability');
    const equityRows = tb.rows.filter((r) => r.type === 'equity');
    const is = await this.incomeStatement(companyId, query);
    const totalAssets = assetRows.reduce((s, r) => s + r.balance, 0);
    const totalLiabilities = liabilityRows.reduce((s, r) => s + r.balance, 0);
    const totalEquity = equityRows.reduce((s, r) => s + r.balance, 0) + is.netIncome;
    return { assets: { rows: assetRows, total: totalAssets }, liabilities: { rows: liabilityRows, total: totalLiabilities }, equity: { rows: equityRows, netIncome: is.netIncome, total: totalEquity }, totalLiabilitiesEquity: totalLiabilities + totalEquity, dateRange: query };
  }

  async sales(companyId, f) {
    const where = { companyId, deletedAt: null, documentType: 'invoice' };
    if (f.startDate || f.endDate) { where.issueDate = {}; if (f.startDate) where.issueDate.gte = new Date(f.startDate); if (f.endDate) where.issueDate.lte = new Date(`${f.endDate}T23:59:59.999Z`); }
    if (f.status) where.status = f.status;

    const sales = await prisma.sale.findMany({ where, include: { customer: { select: { businessName: true, documentNumber: true } }, items: { select: { quantity: true, total: true, productId: true } } }, orderBy: { issueDate: 'desc' } });

    const rows = sales.map((s) => [`${s.documentSerie}-${s.documentNumber}`, new Date(s.issueDate).toLocaleDateString('es-PY'), s.customer?.businessName || 'N/A', fmt(s.subtotal), fmt(s.tax), fmt(s.discount), fmt(s.total), s.status]);
    const summary = { 'Total Ventas': fmt(sales.reduce((s2, x) => s2 + Number(x.total), 0)), 'Cantidad': sales.length, 'Promedio por Venta': sales.length ? fmt(sales.reduce((s2, x) => s2 + Number(x.total), 0) / sales.length) : 0, 'IVA Total': fmt(sales.reduce((s2, x) => s2 + Number(x.tax), 0)) };
    const chart = { labels: sales.map((s) => new Date(s.issueDate).toLocaleDateString('es-PY')), values: sales.map((s) => fmt(s.total)), type: 'bar' };

    return { rows, summary, chart, columns: ['Documento', 'Fecha', 'Cliente', 'Subtotal', 'IVA', 'Descuento', 'Total', 'Estado'] };
  }

  async purchases(companyId, f) {
    const where = { companyId, deletedAt: null };
    if (f.startDate || f.endDate) { where.orderDate = {}; if (f.startDate) where.orderDate.gte = new Date(f.startDate); if (f.endDate) where.orderDate.lte = new Date(`${f.endDate}T23:59:59.999Z`); }
    if (f.status) where.status = f.status;
    const purchases = await prisma.purchase.findMany({ where, include: { supplier: { select: { businessName: true } } }, orderBy: { orderDate: 'desc' } });

    const rows = purchases.map((p) => [`${p.documentSerie}-${p.documentNumber}`, new Date(p.orderDate).toLocaleDateString('es-PY'), p.supplier?.businessName || 'N/A', fmt(p.subtotal), fmt(p.tax), fmt(p.total), p.status]);
    const summary = { 'Total Compras': fmt(purchases.reduce((s, x) => s + Number(x.total), 0)), 'Cantidad': purchases.length, 'Promedio': purchases.length ? fmt(purchases.reduce((s, x) => s + Number(x.total), 0) / purchases.length) : 0 };
    const chart = { labels: purchases.map((p) => new Date(p.orderDate).toLocaleDateString('es-PY')), values: purchases.map((p) => fmt(p.total)), type: 'bar' };
    return { rows, summary, chart, columns: ['Documento', 'Fecha', 'Proveedor', 'Subtotal', 'IVA', 'Total', 'Estado'] };
  }

  async inventory(companyId, f) {
    const where = { companyId, deletedAt: null };
    if (f.search) where.OR = [{ name: { contains: f.search } }, { sku: { contains: f.search } }];
    const products = await prisma.product.findMany({ where, include: { category: { select: { name: true } }, unitType: { select: { symbol: true } } }, orderBy: { name: 'asc' } });

    const rows = products.map((p) => [p.sku, p.name, p.category?.name || '-', `${fmt(p.currentStock)} ${p.unitType?.symbol || ''}`, fmt(p.costPrice), fmt(p.salePrice), fmt(fmt(p.salePrice) - fmt(p.costPrice)), fmt(fmt(p.currentStock) * fmt(p.costPrice)), p.isActive ? 'Activo' : 'Inactivo']);
    const totalStock = products.reduce((s, p) => s + Number(p.currentStock), 0);
    const totalValue = products.reduce((s, p) => s + Number(p.currentStock) * Number(p.costPrice), 0);
    const lowStock = products.filter((p) => Number(p.currentStock) <= Number(p.minStock));
    const summary = { 'Total Productos': products.length, 'Stock Total': totalStock, 'Valor Inventario': fmt(totalValue), 'Productos con Stock Bajo': lowStock.length };
    const chart = { labels: products.slice(0, 15).map((p) => p.name.substring(0, 20)), values: products.slice(0, 15).map((p) => fmt(p.currentStock)), type: 'bar' };
    return { rows, summary, chart, columns: ['SKU', 'Producto', 'Categoría', 'Stock', 'Costo', 'Precio', 'Margen', 'Valor Inv.', 'Estado'] };
  }

  async customers(companyId, f) {
    const where = { companyId, deletedAt: null };
    if (f.search) where.OR = [{ businessName: { contains: f.search } }, { documentNumber: { contains: f.search } }];
    const customers = await prisma.customer.findMany({ where, include: { _count: { select: { sales: true } } }, orderBy: { createdAt: 'desc' } });

    const sales = await prisma.sale.findMany({ where: { companyId, customerId: { in: customers.map((c) => c.id) }, deletedAt: null, documentType: 'invoice' }, select: { customerId: true, total: true } });
    const spentMap = {};
    sales.forEach((s) => { spentMap[s.customerId] = (spentMap[s.customerId] || 0) + Number(s.total); });
    const rows = customers.map((c) => [c.documentNumber, c.businessName || `${c.firstName || ''} ${c.lastName || ''}`, c.phone || '-', c.email || '-', c._count.sales, fmt(spentMap[c.id] || 0), c.isCreditHold ? 'Sí' : 'No']);
    const summary = { 'Total Clientes': customers.length, 'Clientes con Compras': Object.keys(spentMap).length, 'Total Facturado': fmt(Object.values(spentMap).reduce((s, v) => s + v, 0)) };
    const chart = { labels: rows.slice(0, 10).map((r) => r[1].substring(0, 15)), values: rows.slice(0, 10).map((r) => fmt(r[5])), type: 'bar' };
    return { rows, summary, chart, columns: ['Documento', 'Nombre', 'Teléfono', 'Email', 'Compras', 'Total Gastado', 'Crédito'] };
  }

  async suppliers(companyId, f) {
    const where = { companyId, deletedAt: null };
    if (f.search) where.OR = [{ businessName: { contains: f.search } }, { documentNumber: { contains: f.search } }];
    const suppliers = await prisma.supplier.findMany({ where, include: { _count: { select: { purchases: true } } }, orderBy: { createdAt: 'desc' } });
    const purchases = await prisma.purchase.findMany({ where: { companyId, supplierId: { in: suppliers.map((s) => s.id) }, deletedAt: null }, select: { supplierId: true, total: true } });
    const spentMap = {};
    purchases.forEach((p) => { spentMap[p.supplierId] = (spentMap[p.supplierId] || 0) + Number(p.total); });
    const rows = suppliers.map((s) => [s.documentNumber, s.businessName, s.contactName || '-', s.phone || '-', s.email || '-', s._count.purchases, fmt(spentMap[s.id] || 0)]);
    const summary = { 'Total Proveedores': suppliers.length, 'Total Comprado': fmt(Object.values(spentMap).reduce((s, v) => s + v, 0)) };
    const chart = { labels: rows.slice(0, 10).map((r) => r[1].substring(0, 15)), values: rows.slice(0, 10).map((r) => fmt(r[6])), type: 'bar' };
    return { rows, summary, chart, columns: ['Documento', 'Nombre', 'Contacto', 'Teléfono', 'Email', 'Órdenes', 'Total'] };
  }

  async products(companyId, f) {
    return this.inventory(companyId, f);
  }

  async profits(companyId, f) {
    const where = { companyId, deletedAt: null, documentType: 'invoice' };
    if (f.startDate || f.endDate) { where.issueDate = {}; if (f.startDate) where.issueDate.gte = new Date(f.startDate); if (f.endDate) where.issueDate.lte = new Date(`${f.endDate}T23:59:59.999Z`); }
    const sales = await prisma.sale.findMany({ where, include: { items: { include: { product: { select: { costPrice: true } } } } }, orderBy: { issueDate: 'desc' } });

    const rows = sales.map((s) => {
      const totalCost = s.items.reduce((sum, it) => sum + Number(it.quantity) * Number(it.product?.costPrice || 0), 0);
      const revenue = Number(s.total);
      const profit = revenue - totalCost;
      return [`${s.documentSerie}-${s.documentNumber}`, new Date(s.issueDate).toLocaleDateString('es-PY'), revenue, totalCost, profit, revenue ? `${((profit / revenue) * 100).toFixed(1)}%` : '0%'];
    });
    const totalRevenue = rows.reduce((s, r) => s + r[2], 0);
    const totalCost = rows.reduce((s, r) => s + r[3], 0);
    const totalProfit = totalRevenue - totalCost;
    const summary = { 'Ingresos Totales': fmt(totalRevenue), 'Costo Total': fmt(totalCost), 'Utilidad Bruta': fmt(totalProfit), 'Margen': totalRevenue ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}%` : '0%', 'Transacciones': sales.length };
    const chart = { labels: rows.map((r) => r[1]), values: rows.map((r) => r[4]), type: 'bar' };
    return { rows, summary, chart, columns: ['Documento', 'Fecha', 'Ingresos', 'Costo', 'Utilidad', 'Margen'] };
  }

  async movements(companyId, f) {
    const where = { companyId };
    if (f.startDate || f.endDate) { where.createdAt = {}; if (f.startDate) where.createdAt.gte = new Date(f.startDate); if (f.endDate) where.createdAt.lte = new Date(`${f.endDate}T23:59:59.999Z`); }
    if (f.type) where.movementType = f.type;
    const movs = await prisma.inventoryMovement.findMany({ where, include: { product: { select: { sku: true, name: true } }, user: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' }, take: 1000 });

    const rows = movs.map((m) => [new Date(m.createdAt).toLocaleDateString('es-PY'), m.product?.sku || '-', m.product?.name || '-', m.movementType, `${Number(m.quantity)}`, fmt(m.unitCost), fmt(m.totalCost), `${m.user?.firstName || ''} ${m.user?.lastName || ''}`.trim()]);
    const inMovs = movs.filter((m) => Number(m.quantity) > 0);
    const outMovs = movs.filter((m) => Number(m.quantity) < 0);
    const summary = { 'Total Movimientos': movs.length, 'Entradas': inMovs.reduce((s, m) => s + Math.abs(Number(m.quantity)), 0), 'Salidas': outMovs.reduce((s, m) => s + Math.abs(Number(m.quantity)), 0), 'Tipos': [...new Set(movs.map((m) => m.movementType))].join(', ') };
    const chart = { labels: movs.slice(0, 20).map((m) => new Date(m.createdAt).toLocaleDateString('es-PY')), values: movs.slice(0, 20).map((m) => fmt(m.quantity)), type: 'bar' };
    return { rows, summary, chart, columns: ['Fecha', 'SKU', 'Producto', 'Tipo', 'Cant.', 'Costo Un.', 'Costo Total', 'Usuario'] };
  }

  async cash(companyId, f) {
    const where = { companyId };
    if (f.startDate || f.endDate) { where.paymentDate = {}; if (f.startDate) where.paymentDate.gte = new Date(f.startDate); if (f.endDate) where.paymentDate.lte = new Date(`${f.endDate}T23:59:59.999Z`); }
    const payments = await prisma.payment.findMany({ where, include: { paymentMethod: { select: { name: true } }, sale: { select: { documentSerie: true, documentNumber: true } } }, orderBy: { paymentDate: 'desc' } });

    const rows = payments.map((p) => [new Date(p.paymentDate).toLocaleDateString('es-PY'), p.paymentMethod?.name || '-', `${p.sale?.documentSerie || ''}-${p.sale?.documentNumber || ''}`, fmt(p.amount), p.reference || '-']);
    const byMethod = {};
    payments.forEach((p) => { const m = p.paymentMethod?.name || 'Otros'; byMethod[m] = (byMethod[m] || 0) + Number(p.amount); });
    const totalCollected = payments.reduce((s, p) => s + Number(p.amount), 0);
    const summary = { 'Total Cobrado': fmt(totalCollected), 'Transacciones': payments.length, 'Métodos': Object.entries(byMethod).map(([k, v]) => `${k}: ${fmt(v)}`).join(' | ') };
    const chart = { labels: Object.keys(byMethod), values: Object.values(byMethod), type: 'pie' };
    return { rows, summary, chart, columns: ['Fecha', 'Método', 'Venta', 'Monto', 'Referencia'] };
  }

  async users(companyId, f) {
    const where = { companyId, deletedAt: null };
    if (f.search) where.OR = [{ username: { contains: f.search } }, { email: { contains: f.search } }];
    const users = await prisma.user.findMany({ where, include: { roles: { include: { role: { select: { name: true, displayName: true } } } } }, orderBy: { createdAt: 'desc' } });
    const rows = users.map((u) => [u.username, u.email, `${u.firstName || ''} ${u.lastName || ''}`.trim(), u.roles.map((r) => r.role.displayName).join(', '), u.phone || '-', u.isActive ? 'Activo' : 'Inactivo', u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('es-PY') : 'Nunca']);
    const activeUsers = users.filter((u) => u.isActive).length;
    const summary = { 'Total Usuarios': users.length, 'Activos': activeUsers, 'Inactivos': users.length - activeUsers };
    const chart = { labels: ['Activos', 'Inactivos'], values: [activeUsers, users.length - activeUsers], type: 'pie' };
    return { rows, summary, chart, columns: ['Usuario', 'Email', 'Nombre', 'Roles', 'Teléfono', 'Estado', 'Último Acceso'] };
  }

  async audit(companyId, f) {
    const where = { companyId };
    if (f.startDate || f.endDate) { where.createdAt = {}; if (f.startDate) where.createdAt.gte = new Date(f.startDate); if (f.endDate) where.createdAt.lte = new Date(`${f.endDate}T23:59:59.999Z`); }
    if (f.entity) where.entity = f.entity;
    const logs = await prisma.auditLog.findMany({ where, include: { user: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' }, take: 500 });

    const rows = logs.map((l) => [new Date(l.createdAt).toLocaleString('es-PY'), l.action, l.entity, l.entityId?.substring(0, 8) || '-', `${l.user?.firstName || ''} ${l.user?.lastName || ''}`.trim() || '-' ]);
    const byAction = {};
    logs.forEach((l) => { byAction[l.action] = (byAction[l.action] || 0) + 1; });
    const summary = { 'Total Eventos': logs.length, 'Entidades': [...new Set(logs.map((l) => l.entity))].join(', '), 'Acciones': Object.entries(byAction).map(([k, v]) => `${k}: ${v}`).join(' | ') };
    const chart = { labels: Object.keys(byAction), values: Object.values(byAction), type: 'pie' };
    return { rows, summary, chart, columns: ['Fecha/Hora', 'Acción', 'Entidad', 'ID', 'Usuario'] };
  }

  async generatePdf(type, companyId, filters) {
    const data = await this.getData(type, companyId, filters);
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    const labels = { sales: 'Reporte de Ventas', purchases: 'Reporte de Compras', inventory: 'Reporte de Inventario', customers: 'Reporte de Clientes', suppliers: 'Reporte de Proveedores', products: 'Reporte de Productos', profits: 'Reporte de Utilidades', movements: 'Reporte de Movimientos', cash: 'Reporte de Caja', users: 'Reporte de Usuarios', audit: 'Reporte de Auditoría' };
    const dateRange = filters.startDate || filters.endDate ? `${filters.startDate || 'inicio'} - ${filters.endDate || 'hoy'}` : null;
    return generateReportPdf({
      title: labels[type] || type,
      subtitle: `${data.rows.length} registros`,
      dateRange,
      columns: data.columns,
      rows: data.rows,
      summary: data.summary,
      companyName: company?.name,
    });
  }

  async generateExcel(type, companyId, filters) {
    const data = await this.getData(type, companyId, filters);
    const labels = { sales: 'Ventas', purchases: 'Compras', inventory: 'Inventario', customers: 'Clientes', suppliers: 'Proveedores', products: 'Productos', profits: 'Utilidades', movements: 'Movimientos', cash: 'Caja', users: 'Usuarios', audit: 'Auditoría' };
    return generateReportExcel({ title: labels[type], columns: data.columns.map((c, i) => ({ header: c, key: `col${i}` })), rows: data.rows, summary: data.summary, sheetName: labels[type] });
  }
}
