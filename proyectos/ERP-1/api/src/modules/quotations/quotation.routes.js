import { Router } from 'express';
import { QuotationController } from './quotation.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';

const router = Router();
const controller = new QuotationController();

router.use(authenticate);

router.get('/', controller.index.bind(controller));
router.post('/', requirePermission('sales.create'), controller.store.bind(controller));
router.get('/:id', controller.show.bind(controller));
router.put('/:id', requirePermission('sales.update'), controller.update.bind(controller));
router.delete('/:id', requirePermission('sales.cancel'), controller.destroy.bind(controller));
router.post('/:id/accept', requirePermission('sales.update'), controller.accept.bind(controller));
router.post('/:id/convert-to-sale', requirePermission('sales.create'), controller.convertToSale.bind(controller));
router.get('/:id/pdf', controller.generatePdf.bind(controller));

export { router as quotationRoutes };
