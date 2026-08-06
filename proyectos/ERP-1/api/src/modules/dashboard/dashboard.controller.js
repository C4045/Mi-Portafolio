import { DashboardService } from './dashboard.service.js';
import { successResponse } from '../../utils/response.js';

const dashboardService = new DashboardService();

export class DashboardController {
  async executive(req, res, next) {
    try {
      const data = await dashboardService.getExecutiveDashboard(req.user.companyId);
      return successResponse(res, data);
    } catch (error) {
      next(error);
    }
  }
}
