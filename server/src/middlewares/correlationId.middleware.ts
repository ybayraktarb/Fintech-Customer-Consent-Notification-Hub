import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  namespace Express {
    interface Request {
      correlationId: string;
    }
  }
}

export const CORRELATION_HEADER = 'x-correlation-id';

/**
 * W3C / Enterprise Distributed Tracing Middleware
 * HTTP isteği üzerindeki X-Correlation-ID header'ını yakalar veya yeni bir UUIDv4 üretir.
 * Yanıt header'ına ekler ve req.correlationId nesnesine bağlar.
 */
export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId =
    (req.headers[CORRELATION_HEADER] as string) ||
    (req.headers['x-request-id'] as string);

  const correlationId = incomingId && incomingId.trim().length > 0
    ? incomingId.trim()
    : randomUUID();

  req.correlationId = correlationId;
  res.setHeader(CORRELATION_HEADER, correlationId);

  next();
}
