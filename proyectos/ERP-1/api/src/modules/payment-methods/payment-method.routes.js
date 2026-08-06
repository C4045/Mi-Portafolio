import { Router } from 'express';
import { PaymentMethodController } from './payment-method.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';

const router = Router();
const controller = new PaymentMethodController();

router.use(authenticate);

router.get('/', requirePermission('admin.config'), controller.index.bind(controller));
router.post('/', requirePermission('admin.config'), controller.store.bind(controller));
router.get('/:id', requirePermission('admin.config'), controller.show.bind(controller));
router.put('/:id', requirePermission('admin.config'), controller.update.bind(controller));

export { router as paymentMethodRoutes };
