import { ImportExportService } from './import-export.service.js';
import { successResponse } from '../../utils/response.js';

const importExportService = new ImportExportService();

export class ImportExportController {
  async exportExcel(req, res, next) {
    try {
      const buffer = await importExportService.exportToExcel(req.user.companyId, req.query);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=productos-${Date.now()}.xlsx`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  async exportPdf(req, res, next) {
    try {
      const buffer = await importExportService.exportToPdf(req.user.companyId, req.query);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=productos-${Date.now()}.pdf`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }

  async importExcel(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Archivo requerido' });
      }
      const result = await importExportService.importFromExcel(req.file.buffer, req.user.id, req.user.companyId);
      return successResponse(res, result, `${result.created} productos importados, ${result.errors.length} errores`);
    } catch (error) {
      next(error);
    }
  }

  async downloadTemplate(req, res, next) {
    try {
      const buffer = await importExportService.generateTemplate();
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=plantilla-productos.xlsx');
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}
