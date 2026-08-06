import { Router } from 'express';
import { SaleController } from './sale.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';

const router = Router();
const controller = new SaleController();

router.use(authenticate);

router.get('/', controller.index.bind(controller));
router.post('/', requirePermission('sales.create'), controller.store.bind(controller));
router.get('/:id', controller.show.bind(controller));
router.put('/:id', requirePermission('sales.update'), controller.update.bind(controller));
router.delete('/:id', requirePermission('sales.cancel'), controller.destroy.bind(controller));
router.post('/:id/confirm', requirePermission('sales.update'), controller.confirm.bind(controller));
router.get('/:id/pdf', controller.generatePdf.bind(controller));
router.get('/export/excel', requirePermission('sales.export'), controller.exportExcel.bind(controller));
router.get('/:id/history', controller.history.bind(controller));

export { router as saleRoutes };
