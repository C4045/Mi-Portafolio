import { Router } from 'express';
import { DashboardController } from './dashboard.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';

const router = Router();
const controller = new DashboardController();

router.use(authenticate);

router.get('/stats', controller.executive.bind(controller));

export { router as dashboardRoutes };
