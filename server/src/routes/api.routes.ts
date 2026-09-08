import { Router } from 'express';
import { WallController } from '../controllers/wall.controller';
import { CustomerController } from '../controllers/customer.controller';

const router = Router();
const wallController = new WallController();
const customerController = new CustomerController();

router.post('/wall/process-notification', wallController.processNotification);
router.get('/customers', customerController.getCustomers);
router.get('/customers/:musteriNo/audit-logs', customerController.getCustomerAuditHistory);
router.get('/audit-logs', customerController.getAuditLogs);

export default router;
