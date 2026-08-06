import { Router } from 'express';
import { MovementController } from './movement.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';

const router = Router();
const controller = new MovementController();

router.use(authenticate);

router.get('/', controller.index.bind(controller));
router.get('/summary', controller.getSummary.bind(controller));
router.post('/', requirePermission('inventory.movements'), controller.store.bind(controller));
router.get('/:id', controller.show.bind(controller));

export { router as movementRoutes };
