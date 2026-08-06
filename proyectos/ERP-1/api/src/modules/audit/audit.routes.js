import { Router } from 'express';
import { AuditController } from './audit.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';

const router = Router();
const controller = new AuditController();

router.use(authenticate);

router.get('/', requirePermission('admin.audit'), controller.findAll.bind(controller));
router.get('/:entity/:entityId', requirePermission('admin.audit'), controller.findByEntity.bind(controller));

export { router as auditRoutes };
