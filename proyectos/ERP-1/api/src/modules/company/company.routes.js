import { Router } from 'express';
import { CompanyController } from './company.controller.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { requirePermission } from '../../middlewares/authorize.js';

const router = Router();
const controller = new CompanyController();

router.use(authenticate);

router.get('/', controller.show.bind(controller));
router.put('/', requirePermission('admin.config'), controller.update.bind(controller));

router.get('/sucursales', controller.listSucursales.bind(controller));
router.post('/sucursales', requirePermission('admin.config'), controller.createSucursal.bind(controller));
router.put('/sucursales/:id', requirePermission('admin.config'), controller.updateSucursal.bind(controller));
router.delete('/sucursales/:id', requirePermission('admin.config'), controller.deleteSucursal.bind(controller));

export { router as companyRoutes };
