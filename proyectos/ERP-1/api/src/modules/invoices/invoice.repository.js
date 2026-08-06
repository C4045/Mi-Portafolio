import { prisma } from '../../config/database.js';
import { buildSearch, buildSort } from '../../utils/helpers.js';

export class InvoiceRepository {
  async findAll({ companyId, page, limit, skip, search, sortBy, sortOrder, status, dateFrom, dateTo }) {
    const where = { companyId, deletedAt: null };
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.issueDate = {};
      if (dateFrom) where.issueDate.gte = new Date(dateFrom);
      if (dateTo) where.issueDate.lte = new Date(dateTo);
    }
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { documentNumber: { contains: search } },
      ];
    }
    const orderBy = buildSort(sortBy, sortOrder, ['issueDate', 'invoiceNumber', 'total', 'status', 'createdAt']);
    const include = {
      sale: { select: { id: true, documentSerie: true, documentNumber: true } },
    };
    const [data, total] = await Promise.all([
      prisma.invoice.findMany({ where, orderBy, skip, take: limit, include }),
      prisma.invoice.count({ where }),
    ]);
    return { data, total };
  }

  async findById(id) {
    return prisma.invoice.findUnique({
      where: { id },
      include: {
        sale: { include: { customer: { select: { id: true, businessName: true, documentNumber: true, phone: true, email: true, address: true } }, user: { select: { id: true, firstName: true, lastName: true } } } },
        items: true,
      },
    });
  }

  async findBySaleId(saleId) {
    return prisma.invoice.findFirst({ where: { saleId, deletedAt: null }, include: { items: true } });
  }

  async getLastInvoiceNumber(companyId) {
    return prisma.invoice.findFirst({
      where: { companyId, deletedAt: null },
      orderBy: { invoiceNumber: 'desc' },
      select: { invoiceNumber: true },
    });
  }

  async getLastDocumentNumber(companyId, serie) {
    return prisma.invoice.findFirst({
      where: { companyId, documentSerie: serie, deletedAt: null },
      orderBy: { documentNumber: 'desc' },
      select: { documentNumber: true },
    });
  }

  async create(data) {
    return prisma.invoice.create({ data });
  }

  async softDelete(id, deletedBy) {
    return prisma.invoice.update({ where: { id }, data: { deletedAt: new Date(), deletedBy, status: 'cancelled' } });
  }
}
