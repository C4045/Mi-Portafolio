import { Router } from 'express';
import { PermissionController } from './permission.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';

const router = Router();
const controller = new PermissionController();

router.use(authenticate);

router.get('/', requirePermission('admin.roles'), controller.index.bind(controller));
router.get('/:id', requirePermission('admin.roles'), controller.show.bind(controller));
router.post('/', requirePermission('admin.roles'), controller.store.bind(controller));
router.delete('/:id', requirePermission('admin.roles'), controller.destroy.bind(controller));

export { router as permissionRoutes };
