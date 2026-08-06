import { Router } from 'express';
import { ReportController } from './report.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';

const router = Router();
const controller = new ReportController();

router.use(authenticate);

router.get('/trial-balance', requirePermission('reports.view'), controller.trialBalance.bind(controller));
router.get('/income-statement', requirePermission('reports.view'), controller.incomeStatement.bind(controller));
router.get('/balance-sheet', requirePermission('reports.view'), controller.balanceSheet.bind(controller));

router.get('/:type/data', requirePermission('reports.view'), controller.data.bind(controller));
router.get('/:type/pdf', requirePermission('reports.export'), controller.pdf.bind(controller));
router.get('/:type/excel', requirePermission('reports.export'), controller.excel.bind(controller));

export { router as reportRoutes };
