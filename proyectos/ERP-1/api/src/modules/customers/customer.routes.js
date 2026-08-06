import { Router } from 'express';
import { CustomerController } from './customer.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';

const router = Router();
const controller = new CustomerController();

router.use(authenticate);

router.get('/', controller.index.bind(controller));
router.get('/list', controller.list.bind(controller));
router.post('/', requirePermission('crm.create'), controller.store.bind(controller));
router.get('/:id', controller.show.bind(controller));
router.put('/:id', requirePermission('crm.update'), controller.update.bind(controller));
router.delete('/:id', requirePermission('crm.delete'), controller.destroy.bind(controller));

export { router as customerRoutes };
