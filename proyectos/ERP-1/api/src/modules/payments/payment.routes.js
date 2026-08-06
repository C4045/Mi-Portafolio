import { Router } from 'express';
import { PaymentController } from './payment.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';

const router = Router();
const controller = new PaymentController();

router.use(authenticate);

router.get('/', controller.index.bind(controller));
router.post('/', requirePermission('sales.create'), controller.store.bind(controller));
router.get('/:id', controller.show.bind(controller));

export { router as paymentRoutes };
