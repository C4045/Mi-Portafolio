import { Router } from 'express';
import { UserController } from './user.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';

const router = Router();
const controller = new UserController();

router.use(authenticate);

router.get('/', requirePermission('admin.users'), controller.index.bind(controller));
router.post('/', requirePermission('admin.users'), controller.store.bind(controller));
router.get('/:id', requirePermission('admin.users'), controller.show.bind(controller));
router.put('/:id', requirePermission('admin.users'), controller.update.bind(controller));
router.delete('/:id', requirePermission('admin.users'), controller.destroy.bind(controller));
router.put('/:id/roles', requirePermission('admin.users'), controller.assignRoles.bind(controller));

export { router as userRoutes };
