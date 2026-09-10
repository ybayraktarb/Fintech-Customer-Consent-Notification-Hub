import { Request, Response, NextFunction } from 'express';
import { pdpService } from '../config/jacpol.config';

/**
 * Express middleware for Attribute-Based Access Control (ABAC) using JACPoL PDP.
 * @param action 
 * @param resourceMeta 
 */
export function requireJacpolPolicy(action: string, resourceMeta: Record<string, any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isDevOrTest = process.env.NODE_ENV !== 'production';
      const user = (req as any).user || {};



      const subjectRole = isDevOrTest
        ? (req.headers['x-user-role'] as string) || user.role || 'guest'
        : user.role || 'guest';

      const subjectId = isDevOrTest
        ? (req.headers['x-user-id'] as string) || user.id || 'anonymous'
        : user.id || 'anonymous';

      const subject = {
        id: subjectId,
        role: subjectRole,
      };


      const resource = {
        ...resourceMeta,
        ...req.params,
      };


      const now = new Date();
      const trTimeFormatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Istanbul',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const trWeekdayFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Europe/Istanbul',
        weekday: 'long',
      });

      const serverTime = trTimeFormatter.format(now);
      const serverWeekday = trWeekdayFormatter.format(now).toLowerCase();
      const serverDate = now.toISOString().slice(0, 10);

      const environment = {
        ip: req.ip || req.socket.remoteAddress,
        time: (isDevOrTest && (req.headers['x-mock-time'] as string)) || serverTime,
        weekday: (isDevOrTest && (req.headers['x-mock-weekday'] as string)) || serverWeekday,
        date: serverDate,
      };


      const accessRequest = {
        subject,
        resource,
        action,
        environment,
      };

      const decision = await pdpService.evaluate(accessRequest);

      if (decision.decision === 'deny') {
        return res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Yetkilendirme reddedildi: Bu işlem için erişim yetkiniz bulunmamaktadır.',
          details: isDevOrTest
            ? {
              requiredAction: action,
              evaluatedSubject: subject,
              environment: {
                time: environment.time,
                weekday: environment.weekday,
              },
            }
            : undefined,
        });
      }

      return next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Yetkilendirme değerlendirmesi sırasında bir hata oluştu.',
      });
    }
  };
}
