import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { ENV } from './config/env';
import apiRoutes from './routes/api.routes';
import { correlationIdMiddleware } from './middlewares/correlationId.middleware';
import { metricsMiddleware } from './middlewares/metrics.middleware';
import { register, outboxPendingMessagesGauge } from './config/metrics';
import { prisma } from './config/prisma';

import { errorHandler } from './middlewares/errorHandler.middleware';

const app: Application = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(correlationIdMiddleware);
app.use(metricsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'musteri-onay-server',
    environment: ENV.NODE_ENV,
  });
});

app.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const pendingCount = await prisma.outboxMessage.count({
      where: { status: 'PENDING' },
    });
    outboxPendingMessagesGauge.set(pendingCount);

    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end((error as Error).message);
  }
});

app.use('/api', apiRoutes);

app.use(errorHandler);

export default app;
