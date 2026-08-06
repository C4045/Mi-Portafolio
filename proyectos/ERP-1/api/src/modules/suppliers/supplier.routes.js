import { Router } from 'express';
import { SupplierController } from './supplier.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';

const router = Router();
const controller = new SupplierController();

router.use(authenticate);

router.get('/', controller.index.bind(controller));
router.get('/list', controller.list.bind(controller));
router.post('/', requirePermission('purchases.suppliers'), controller.store.bind(controller));
router.get('/:id', controller.show.bind(controller));
router.put('/:id', requirePermission('purchases.suppliers'), controller.update.bind(controller));
router.delete('/:id', requirePermission('purchases.suppliers'), controller.destroy.bind(controller));

export { router as supplierRoutes };
