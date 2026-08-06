import { Router } from 'express';
import { InvoiceController } from './invoice.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';

const router = Router();
const controller = new InvoiceController();

router.use(authenticate);

router.get('/', controller.index.bind(controller));
router.get('/:id', controller.show.bind(controller));
router.post('/from-sale/:saleId', requirePermission('sales.update'), controller.generateFromSale.bind(controller));
router.delete('/:id', requirePermission('sales.cancel'), controller.destroy.bind(controller));
router.get('/:id/pdf', controller.generatePdf.bind(controller));

export { router as invoiceRoutes };
