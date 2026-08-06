import { prisma } from '../../config/database.js';
import { logger } from '../../config/logger.js';

export class DashboardService {
  async getExecutiveDashboard(companyId) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      salesToday,
      salesMonth,
      salesPrevMonth,
      purchasesMonth,
      purchasesPrevMonth,
      topProducts,
      lowStockProducts,
      newCustomers,
      newCustomersPrev,
      salesByMonthRaw,
      salesByCategoryRaw,
      purchasesByMonthRaw,
      inventoryTotals,
      pendingInvoices,
      pendingCount,
    ] = await Promise.all([
      prisma.sale.aggregate({
        where: { companyId, createdAt: { gte: startOfDay }, deletedAt: null, status: { not: 'cancelled' } },
        _sum: { total: true },
        _count: true,
      }),

      prisma.sale.aggregate({
        where: { companyId, createdAt: { gte: startOfMonth }, deletedAt: null, status: { not: 'cancelled' } },
        _sum: { total: true },
        _count: true,
      }),

      prisma.sale.aggregate({
        where: { companyId, createdAt: { gte: startOfPrevMonth, lt: endOfPrevMonth }, deletedAt: null, status: { not: 'cancelled' } },
        _sum: { total: true },
      }),

      prisma.purchase.aggregate({
        where: { companyId, createdAt: { gte: startOfMonth }, deletedAt: null, status: { not: 'cancelled' } },
        _sum: { total: true },
        _count: true,
      }),

      prisma.purchase.aggregate({
        where: { companyId, createdAt: { gte: startOfPrevMonth, lt: endOfPrevMonth }, deletedAt: null, status: { not: 'cancelled' } },
        _sum: { total: true },
      }),

      prisma.saleItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 10,
        where: {
          sale: { companyId, deletedAt: null, status: { not: 'cancelled' } },
        },
      }),

      prisma.product.findMany({
        where: {
          companyId,
          deletedAt: null,
          isActive: true,
          isTracked: true,
          currentStock: { lte: prisma.product.fields.minStock },
        },
        orderBy: { currentStock: 'asc' },
        take: 10,
        select: {
          id: true, name: true, sku: true, currentStock: true, minStock: true, salePrice: true,
        },
      }),

      prisma.customer.count({
        where: { companyId, createdAt: { gte: startOfMonth }, deletedAt: null },
      }),

      prisma.customer.count({
        where: { companyId, createdAt: { gte: startOfPrevMonth, lt: endOfPrevMonth }, deletedAt: null },
      }),

      prisma.$queryRaw`
        SELECT strftime('%Y-%m', datetime(created_at / 1000, 'unixepoch')) as month,
               SUM(total) as total,
               COUNT(*) as count
        FROM sales
        WHERE company_id = ${companyId}
          AND deleted_at IS NULL
          AND status != 'cancelled'
          AND created_at >= cast(strftime('%s', date('now', '-12 months')) as integer) * 1000
        GROUP BY month
        ORDER BY month ASC
      `,

      prisma.$queryRaw`
        SELECT c.name as category,
               SUM(si.total) as total,
               SUM(si.quantity) as quantity
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id
        JOIN products p ON p.id = si.product_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE s.company_id = ${companyId}
          AND s.deleted_at IS NULL
          AND s.status != 'cancelled'
          AND s.created_at >= cast(strftime('%s', date('now', '-6 months')) as integer) * 1000
        GROUP BY c.name
        ORDER BY total DESC
      `,

      prisma.$queryRaw`
        SELECT strftime('%Y-%m', datetime(created_at / 1000, 'unixepoch')) as month,
               SUM(total) as total,
               COUNT(*) as count
        FROM purchases
        WHERE company_id = ${companyId}
          AND deleted_at IS NULL
          AND status != 'cancelled'
          AND created_at >= cast(strftime('%s', date('now', '-12 months')) as integer) * 1000
        GROUP BY month
        ORDER BY month ASC
      `,

      prisma.product.aggregate({
        where: { companyId, deletedAt: null, isTracked: true },
        _count: true,
        _sum: { currentStock: true },
      }),

      prisma.invoice.findMany({
        where: { companyId, deletedAt: null, status: { notIn: ['paid', 'cancelled'] } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, invoiceNumber: true, total: true, status: true, issueDate: true },
      }),

      prisma.invoice.count({
        where: { companyId, deletedAt: null, status: { notIn: ['paid', 'cancelled'] } },
      }),
    ]);

    const salesTotalMonth = Number(salesMonth._sum.total || 0);
    const salesTotalPrev = Number(salesPrevMonth._sum.total || 0);
    const purchasesTotalMonth = Number(purchasesMonth._sum.total || 0);
    const purchasesTotalPrev = Number(purchasesPrevMonth._sum.total || 0);

    const salesTrend = salesTotalPrev > 0 ? ((salesTotalMonth - salesTotalPrev) / salesTotalPrev) * 100 : 0;
    const purchasesTrend = purchasesTotalPrev > 0 ? ((purchasesTotalMonth - purchasesTotalPrev) / purchasesTotalPrev) * 100 : 0;

    const profit = salesTotalMonth - purchasesTotalMonth;
    const profitPrev = salesTotalPrev - purchasesTotalPrev;
    const profitTrend = profitPrev > 0 ? ((profit - profitPrev) / profitPrev) * 100 : 0;

    const lowStockCount = lowStockProducts.filter(p => Number(p.currentStock) > 0).length;
    const outOfStockCount = lowStockProducts.filter(p => Number(p.currentStock) <= 0).length;

    const productIds = topProducts.map(p => p.productId);
    const products = productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, sku: true },
        })
      : [];
    const productMap = {};
    for (const p of products) productMap[p.id] = p;

    return {
      salesToday: {
        total: Number(salesToday._sum.total || 0),
        count: salesToday._count || 0,
      },
      salesMonth: {
        total: salesTotalMonth,
        count: salesMonth._count || 0,
        trend: Math.round(salesTrend * 10) / 10,
      },
      purchasesMonth: {
        total: purchasesTotalMonth,
        count: purchasesMonth._count || 0,
        trend: Math.round(purchasesTrend * 10) / 10,
      },
      income: {
        total: salesTotalMonth,
        trend: Math.round(salesTrend * 10) / 10,
      },
      expenses: {
        total: purchasesTotalMonth,
        trend: Math.round(purchasesTrend * 10) / 10,
      },
      profit: {
        total: profit,
        trend: Math.round(profitTrend * 10) / 10,
      },
      topProducts: topProducts.map((item) => ({
        name: productMap[item.productId]?.name || 'Producto',
        sku: productMap[item.productId]?.sku || '',
        quantity: Number(item._sum.quantity || 0),
        revenue: Number(item._sum.total || 0),
      })),
      lowStockProducts: lowStockProducts.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock: Number(p.currentStock),
        minStock: Number(p.minStock),
        price: Number(p.salePrice),
      })),
      newCustomers: {
        count: newCustomers,
        trend: newCustomersPrev > 0 ? Math.round(((newCustomers - newCustomersPrev) / newCustomersPrev) * 100 * 10) / 10 : 100,
      },
      salesByMonth: (salesByMonthRaw || []).map((r) => ({
        month: this._formatMonth(r.month),
        total: Number(r.total || 0),
        count: Number(r.count || 0),
      })),
      salesByCategory: (salesByCategoryRaw || []).map((r) => ({
        category: r.category || 'Sin categoría',
        total: Number(r.total || 0),
        quantity: Number(r.quantity || 0),
      })),
      purchasesByMonth: (purchasesByMonthRaw || []).map((r) => ({
        month: this._formatMonth(r.month),
        total: Number(r.total || 0),
        count: Number(r.count || 0),
      })),
      inventorySummary: {
        totalProducts: inventoryTotals._count || 0,
        totalStock: Number(inventoryTotals._sum.currentStock || 0),
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
      },
      alerts: {
        pendingInvoices: pendingCount || 0,
        pendingInvoicesList: pendingInvoices.map((inv) => ({
          id: inv.id,
          number: inv.invoiceNumber,
          total: Number(inv.total),
          status: inv.status,
          date: inv.issueDate,
        })),
        criticalStock: lowStockCount,
        outOfStock: outOfStockCount,
        lowStockList: lowStockProducts.filter((p) => Number(p.currentStock) <= Number(p.minStock)).map((p) => ({
          id: p.id,
          name: p.name,
          stock: Number(p.currentStock),
          minStock: Number(p.minStock),
          status: Number(p.currentStock) <= 0 ? 'out_of_stock' : 'critical',
        })),
      },
    };
  }

  _formatMonth(ym) {
    if (!ym) return '';
    const parts = ym.split('-');
    if (parts.length !== 2) return ym;
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return months[parseInt(parts[1], 10) - 1] || ym;
  }
}
