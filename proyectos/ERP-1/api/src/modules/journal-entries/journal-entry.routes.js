import { Router } from 'express';
import { JournalEntryController } from './journal-entry.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';

const router = Router();
const controller = new JournalEntryController();

router.use(authenticate);

router.get('/', requirePermission('financial.read'), controller.index.bind(controller));
router.post('/', requirePermission('financial.journal_create'), controller.store.bind(controller));
router.get('/:id', requirePermission('financial.read'), controller.show.bind(controller));
router.put('/:id', requirePermission('financial.journal_create'), controller.update.bind(controller));
router.post('/:id/post', requirePermission('financial.journal_approve'), controller.post.bind(controller));
router.delete('/:id', requirePermission('financial.close'), controller.destroy.bind(controller));

export { router as journalEntryRoutes };
