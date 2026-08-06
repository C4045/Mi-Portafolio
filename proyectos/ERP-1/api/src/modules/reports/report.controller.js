import { ReportService } from './report.service.js';
import { successResponse } from '../../utils/response.js';

const service = new ReportService();

export class ReportController {
  async trialBalance(req, res, next) {
    try {
      const result = await service.trialBalance(req.user.companyId, req.query);
      return successResponse(res, result);
    } catch (error) { next(error); }
  }

  async incomeStatement(req, res, next) {
    try {
      const result = await service.incomeStatement(req.user.companyId, req.query);
      return successResponse(res, result);
    } catch (error) { next(error); }
  }

  async balanceSheet(req, res, next) {
    try {
      const result = await service.balanceSheet(req.user.companyId, req.query);
      return successResponse(res, result);
    } catch (error) { next(error); }
  }

  async data(req, res, next) {
    try {
      const result = await service.getData(req.params.type, req.user.companyId, req.query);
      return successResponse(res, result);
    } catch (error) { next(error); }
  }

  async pdf(req, res, next) {
    try {
      const buffer = await service.generatePdf(req.params.type, req.user.companyId, req.query);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=reporte-${req.params.type}.pdf`);
      res.send(buffer);
    } catch (error) { next(error); }
  }

  async excel(req, res, next) {
    try {
      const workbook = await service.generateExcel(req.params.type, req.user.companyId, req.query);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=reporte-${req.params.type}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) { next(error); }
  }
}
