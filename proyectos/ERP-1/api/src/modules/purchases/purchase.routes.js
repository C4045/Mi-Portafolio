import { Router } from 'express';
import { PurchaseController } from './purchase.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';

const router = Router();
const controller = new PurchaseController();

router.use(authenticate);

router.get('/', controller.index.bind(controller));
router.post('/', requirePermission('purchases.orders'), controller.store.bind(controller));
router.get('/:id', controller.show.bind(controller));
router.put('/:id', requirePermission('purchases.orders'), controller.update.bind(controller));
router.delete('/:id', requirePermission('purchases.orders'), controller.destroy.bind(controller));
router.post('/:id/receive', requirePermission('purchases.orders'), controller.receive.bind(controller));
router.get('/:id/pdf', controller.generatePdf.bind(controller));

export { router as purchaseRoutes };
