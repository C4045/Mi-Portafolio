import { Router } from 'express';
import { OrderController } from './order.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';

const router = Router();
const controller = new OrderController();

router.use(authenticate);

router.get('/', controller.index.bind(controller));
router.post('/', requirePermission('sales.create'), controller.store.bind(controller));
router.get('/:id', controller.show.bind(controller));
router.put('/:id', requirePermission('sales.update'), controller.update.bind(controller));
router.delete('/:id', requirePermission('sales.cancel'), controller.destroy.bind(controller));
router.post('/:id/confirm', requirePermission('sales.update'), controller.confirm.bind(controller));
router.post('/:id/fulfill', requirePermission('sales.update'), controller.fulfill.bind(controller));
router.get('/:id/pdf', controller.generatePdf.bind(controller));

export { router as orderRoutes };
