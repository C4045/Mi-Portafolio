import { Router } from 'express';
import { RoleController } from './role.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';

const router = Router();
const controller = new RoleController();

router.use(authenticate);

router.get('/permissions', controller.listPermissions.bind(controller));
router.get('/', requirePermission('admin.roles'), controller.index.bind(controller));
router.post('/', requirePermission('admin.roles'), controller.store.bind(controller));
router.get('/:id', requirePermission('admin.roles'), controller.show.bind(controller));
router.put('/:id', requirePermission('admin.roles'), controller.update.bind(controller));
router.delete('/:id', requirePermission('admin.roles'), controller.destroy.bind(controller));
router.put('/:id/permissions', requirePermission('admin.roles'), controller.assignPermissions.bind(controller));

export { router as roleRoutes };
