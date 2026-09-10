import { Router } from 'express';
import { WallController } from '../controllers/wall.controller';
import { CustomerController } from '../controllers/customer.controller';

import { requireJacpolPolicy } from '../middlewares/jacpol.middleware';

const router = Router();
const wallController = new WallController();
const customerController = new CustomerController();

router.post('/wall/process-notification', wallController.processNotification);
router.get('/customers', customerController.getCustomers);
router.get(
  '/customers/:musteriNo/audit-logs',
  requireJacpolPolicy('read', { type: 'customer_audit' }),
  customerController.getCustomerAuditHistory
);
router.get(
  '/audit-logs',
  requireJacpolPolicy('read', { type: 'customer_audit' }),
  customerController.getAuditLogs
);

export default router;
