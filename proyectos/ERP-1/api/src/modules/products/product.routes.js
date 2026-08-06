import { Router } from 'express';
import multer from 'multer';
import { ProductController } from './product.controller.js';
import { ImportExportController } from './import-export.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';

const router = Router();
const controller = new ProductController();
const importExport = new ImportExportController();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

router.get('/', controller.index.bind(controller));
router.get('/stock-alerts', controller.getStockAlerts.bind(controller));

router.post('/export/excel', requirePermission('inventory.products'), importExport.exportExcel.bind(importExport));
router.post('/export/pdf', requirePermission('inventory.products'), importExport.exportPdf.bind(importExport));
router.get('/export/template', requirePermission('inventory.products'), importExport.downloadTemplate.bind(importExport));
router.post('/import/excel', requirePermission('inventory.products'), upload.single('file'), importExport.importExcel.bind(importExport));

router.post('/', requirePermission('inventory.products'), controller.store.bind(controller));
router.get('/:id', controller.show.bind(controller));
router.put('/:id', requirePermission('inventory.products'), controller.update.bind(controller));
router.delete('/:id', requirePermission('inventory.products'), controller.destroy.bind(controller));
router.post('/:id/adjust-stock', requirePermission('inventory.products'), controller.adjustStock.bind(controller));
router.get('/:id/history', controller.getHistory.bind(controller));

export { router as productRoutes };
