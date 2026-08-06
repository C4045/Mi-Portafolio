import { Router } from 'express';
import { CategoryController } from './category.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';

const router = Router();
const controller = new CategoryController();

router.use(authenticate);

router.get('/', controller.index.bind(controller));
router.get('/list', controller.list.bind(controller));
router.post('/', requirePermission('inventory.categories'), controller.store.bind(controller));
router.get('/:id', controller.show.bind(controller));
router.put('/:id', requirePermission('inventory.categories'), controller.update.bind(controller));
router.delete('/:id', requirePermission('inventory.categories'), controller.destroy.bind(controller));

export { router as categoryRoutes };
