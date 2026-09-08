import { Request, Response, NextFunction } from 'express';
import { httpRequestDurationSeconds, httpRequestsTotal } from '../config/metrics';

/**
 * Normalizes route path for Prometheus metrics.
 * Unmatched or dynamic 404 paths are grouped into 'unmatched_route'
 * to avoid high cardinality labels in TSDB.
 */
export function sanitizeRoute(req: Request): string {
  if (req.route?.path) {
    return `${req.baseUrl || ''}${req.route.path}`;
  }
  return 'unmatched_route';
}

/**
 * Express middleware for recording HTTP RED metrics (Rate, Errors, Duration).
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.path === '/metrics' || req.path === '/health') {
    return next();
  }

  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    const route = sanitizeRoute(req);
    const statusCode = res.statusCode.toString();

    httpRequestDurationSeconds.observe(
      { method: req.method, route, status_code: statusCode },
      durationInSeconds
    );

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: statusCode,
    });
  });

  next();
}
