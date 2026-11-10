import { Router } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { config } from '../config';
import { createLogger } from '@hospital/common';

const logger = createLogger('Gateway:Proxy');
const router = Router();

const createServiceProxy = (targetUrl: string, serviceName: string) => {
  const proxyOptions: Options = {
    target: targetUrl,
    changeOrigin: true,
    logLevel: 'silent',
    onError: (err, req, res) => {
      logger.error(`Proxy failure forwarding to ${serviceName} (${targetUrl}): ${err.message}`);
      // Cast res to any to invoke HTTP response methods safely
      const response = res as any;
      if (response && !response.headersSent) {
        response.status(503).json({
          success: false,
          message: `${serviceName} is temporarily unreachable. Please try again shortly.`,
          statusCode: 503
        });
      }
    }
  };

  return createProxyMiddleware(proxyOptions);
};

// Route proxy configurations
router.use('/auth', createServiceProxy(config.services.auth, 'Auth Service'));
router.use('/patients', createServiceProxy(config.services.patient, 'Patient Service'));
router.use('/doctors', createServiceProxy(config.services.doctor, 'Doctor Service'));
router.use('/appointments', createServiceProxy(config.services.appointment, 'Appointment Service'));
router.use('/billing', createServiceProxy(config.services.billing, 'Billing Service'));
router.use('/notifications', createServiceProxy(config.services.notification, 'Notification Service'));

export default router;
