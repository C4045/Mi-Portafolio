import { Router } from 'express';
import { AccountController } from './account.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';

const router = Router();
const controller = new AccountController();

router.use(authenticate);

router.get('/', requirePermission('financial.read'), controller.index.bind(controller));
router.get('/list', requirePermission('financial.read'), controller.list.bind(controller));
router.post('/', requirePermission('financial.journal_create'), controller.store.bind(controller));
router.get('/:id', requirePermission('financial.read'), controller.show.bind(controller));
router.put('/:id', requirePermission('financial.journal_create'), controller.update.bind(controller));
router.delete('/:id', requirePermission('financial.journal_create'), controller.destroy.bind(controller));

export { router as accountRoutes };
