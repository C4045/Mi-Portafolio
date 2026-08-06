import { SaleService } from './sale.service.js';
import { createSaleSchema, updateSaleSchema, saleQuerySchema } from './sale.validation.js';
import { successResponse, createdResponse, paginatedResponse } from '../../utils/response.js';
import ExcelJS from 'exceljs';

const saleService = new SaleService();

export class SaleController {
  async index(req, res, next) {
    try {
      const query = saleQuerySchema.parse(req.query);
      const result = await saleService.findAll(query, req.user.companyId);
      return paginatedResponse(res, result.data, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  async show(req, res, next) {
    try {
      const sale = await saleService.findById(req.params.id, req.user.companyId);
      return successResponse(res, sale);
    } catch (error) {
      next(error);
    }
  }

  async store(req, res, next) {
    try {
      const data = createSaleSchema.parse(req.body);
      const sale = await saleService.create(data, req.user.id, req.user.companyId);
      return createdResponse(res, sale, 'Venta creada');
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const data = updateSaleSchema.parse(req.body);
      const sale = await saleService.update(req.params.id, data, req.user.id, req.user.companyId);
      return successResponse(res, sale, 'Venta actualizada');
    } catch (error) {
      next(error);
    }
  }

  async destroy(req, res, next) {
    try {
      await saleService.delete(req.params.id, req.user.id, req.user.companyId);
      return successResponse(res, null, 'Venta cancelada');
    } catch (error) {
      next(error);
    }
  }

  async confirm(req, res, next) {
    try {
      const result = await saleService.confirm(req.params.id, req.user.id, req.user.companyId);
      return successResponse(res, result, 'Venta confirmada');
    } catch (error) {
      next(error);
    }
  }

  async generatePdf(req, res, next) {
    try {
      const buffer = await saleService.generatePdf(req.params.id, req.user.companyId);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=venta-${req.params.id}.pdf`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  async exportExcel(req, res, next) {
    try {
      const { data } = await saleService.findAll(req.query, req.user.companyId);
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Ventas');
      ws.columns = [
        { header: 'Documento', key: 'doc', width: 18 },
        { header: 'Fecha', key: 'date', width: 14 },
        { header: 'Cliente', key: 'customer', width: 30 },
        { header: 'Subtotal', key: 'subtotal', width: 16 },
        { header: 'Descuento', key: 'discount', width: 16 },
        { header: 'IVA', key: 'tax', width: 16 },
        { header: 'Total', key: 'total', width: 16 },
        { header: 'Estado', key: 'status', width: 14 },
      ];
      data.forEach((s) => ws.addRow({
        doc: `${s.documentSerie}-${s.documentNumber}`,
        date: s.issueDate ? new Date(s.issueDate).toLocaleDateString('es-PY') : '',
        customer: s.customer?.businessName || '',
        subtotal: Number(s.subtotal), discount: Number(s.discount), tax: Number(s.tax), total: Number(s.total), status: s.status,
      }));
      ws.getRow(1).font = { bold: true };
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=ventas.xlsx');
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) { next(error); }
  }

  async history(req, res, next) {
    try {
      const { prisma } = await import('../../config/database.js');
      const logs = await prisma.auditLog.findMany({
        where: { companyId: req.user.companyId, entity: { in: ['Sale', 'Quotation', 'Order', 'Invoice', 'Payment'] }, entityId: req.params.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
      });
      return successResponse(res, logs.map((l) => ({ id: l.id, action: l.action, entity: l.entity, entityId: l.entityId, oldValues: l.oldValues, newValues: l.newValues, createdAt: l.createdAt, user: l.user ? { id: l.user.id, name: `${l.user.firstName || ''} ${l.user.lastName || ''}`.trim() } : null })));
    } catch (error) { next(error); }
  }
}
