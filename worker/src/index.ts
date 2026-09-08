import amqp, { Message } from 'amqplib';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import {
  startMetricsServer,
  stopMetricsServer,
  workerProcessedCounter,
  workerIdempotentSkipsCounter,
  workerDlqCounter,
  workerNotificationStateTransitionTotal,
} from './metrics';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5439/musteri_onay_db?schema=public';
const METRICS_PORT = parseInt(process.env.METRICS_PORT || '5002', 10);

const QUEUE_NAME = 'notification.queue';
const EXCHANGE_NAME = 'notification.exchange';
const ROUTING_KEY = 'notification.dispatch';
const DLX_EXCHANGE = 'notification.dlx';
const DLQ_QUEUE = 'notification.dlq';
const DLQ_ROUTING_KEY = 'notification.dead';
const MAX_RETRIES = 3;

startMetricsServer(METRICS_PORT);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

interface NotificationEventPayload {
  eventType: string;
  musteriNo: string;
  musteriAdi: string;
  musteriSoyadi: string;
  musteriTckn: string;
  channel: 'DIGITAL' | 'BRANCH_CALL';
  product: string;
  contactChannels: {
    email: boolean;
    sms: boolean;
  };
  operatorSicil: string;
  timestamp: string;
}

interface StructuredLog {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  correlationId: string;
  service: string;
  message: string;
  details?: Record<string, any>;
}

function logStructured(
  level: 'INFO' | 'WARN' | 'ERROR',
  correlationId: string,
  message: string,
  details?: Record<string, any>
): void {
  const logEntry: StructuredLog = {
    timestamp: new Date().toISOString(),
    level,
    correlationId,
    service: 'NotificationWorker',
    message,
    ...(details ? { details } : {}),
  };
  console.log(JSON.stringify(logEntry));
}

async function processNotificationJob(
  event: NotificationEventPayload,
  correlationId: string
): Promise<void> {
  const { musteriNo, musteriAdi, musteriSoyadi, channel, product } = event;
  const contactChannels = event.contactChannels || { sms: false, email: false };

  logStructured('INFO', correlationId, 'Processing notification', {
    musteriNo,
    customer: `${musteriAdi || ''} ${musteriSoyadi || ''}`.trim(),
    channel,
    product,
    sms: contactChannels.sms,
    email: contactChannels.email,
  });

  await new Promise((resolve) => setTimeout(resolve, 300));

  if (contactChannels.sms) {
    logStructured('INFO', correlationId, 'SMS dispatched', { musteriNo, product });
  }

  if (contactChannels.email) {
    logStructured('INFO', correlationId, 'Email dispatched', { musteriNo, product });
  }

  logStructured('INFO', correlationId, 'Notification delivered', { musteriNo, product });
}

async function startWorker() {
  console.log(`[Worker] Starting notification consumer (${RABBITMQ_URL})`);

  try {
    const connection: any = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertExchange(DLX_EXCHANGE, 'direct', { durable: true });
    await channel.assertQueue(DLQ_QUEUE, { durable: true });
    await channel.bindQueue(DLQ_QUEUE, DLX_EXCHANGE, DLQ_ROUTING_KEY);

    await channel.assertExchange(EXCHANGE_NAME, 'direct', { durable: true });
    await channel.assertQueue(QUEUE_NAME, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': DLX_EXCHANGE,
        'x-dead-letter-routing-key': DLQ_ROUTING_KEY,
      },
    });
    await channel.bindQueue(QUEUE_NAME, EXCHANGE_NAME, ROUTING_KEY);

    await channel.prefetch(5);
    console.log(`[Worker] Listening on queue: ${QUEUE_NAME}`);

    channel.consume(
      QUEUE_NAME,
      async (msg: Message | null) => {
        if (!msg) return;

        const headers = msg.properties.headers || {};
        const correlationId = (headers['x-correlation-id'] as string) || 'N/A';
        const retryCount = (headers['x-retry-count'] as number) || 0;

        let rawContent = '';
        let event: NotificationEventPayload;

        try {
          rawContent = msg.content.toString();
          event = JSON.parse(rawContent);
        } catch (err) {
          console.error('[Worker] Malformed JSON message discarded:', (err as Error).message);
          channel.ack(msg);
          return;
        }

        const messageId =
          msg.properties.messageId ||
          (event as any).id ||
          `IDEM_${event.musteriNo}_${event.timestamp || Date.now()}`;

        try {
          const alreadyProcessed = await prisma.processedMessage.findUnique({
            where: { messageId },
          });

          if (alreadyProcessed) {
            workerIdempotentSkipsCounter.inc();
            logStructured('WARN', correlationId, `Duplicate message skipped: ${messageId}`, {
              messageId,
              musteriNo: event.musteriNo,
            });
            channel.ack(msg);
            return;
          }

          await prisma.processedMessage.create({
            data: {
              messageId,
              consumerName: 'NotificationWorker',
              processedAt: new Date(),
            },
          });
        } catch (inboxErr: any) {
          if (inboxErr?.code === 'P2002') {
            workerIdempotentSkipsCounter.inc();
            logStructured('WARN', correlationId, `Concurrent duplicate suppressed: ${messageId}`);
            channel.ack(msg);
            return;
          }
          logStructured('ERROR', correlationId, 'Inbox check failed', { error: inboxErr.message });
        }

        try {
          await processNotificationJob(event, correlationId);
          workerProcessedCounter.inc();

          await prisma.customerNotificationLog.updateMany({
            where: {
              OR: [
                { outboxMessageId: messageId },
                { musteriNo: event.musteriNo, bildirimDurumu: 'QUEUED' },
              ],
            },
            data: {
              bildirimDurumu: 'DELIVERED',
              guncellemeZmn: new Date(),
            },
          }).catch((err: any) => console.error('[Worker] DB update error:', err?.message || err));

          workerNotificationStateTransitionTotal.inc({
            from_state: 'QUEUED',
            to_state: 'DELIVERED',
            channel: event.channel || 'DIGITAL',
          });

          channel.ack(msg);
        } catch (error) {
          await prisma.processedMessage.delete({ where: { messageId } }).catch(() => {});

          const errorMsg = (error as Error).message;
          logStructured(
            'ERROR',
            correlationId,
            `Job failed (attempt ${retryCount + 1}/${MAX_RETRIES})`,
            { error: errorMsg, messageId }
          );

          if (retryCount < MAX_RETRIES) {
            const delayMs = Math.pow(2, retryCount) * 1000;

            setTimeout(() => {
              channel.publish(EXCHANGE_NAME, ROUTING_KEY, msg.content, {
                persistent: true,
                messageId: msg.properties.messageId,
                headers: {
                  ...headers,
                  'x-retry-count': retryCount + 1,
                },
              });
            }, delayMs);

            channel.ack(msg);
          } else {
            workerDlqCounter.inc();
            logStructured('ERROR', correlationId, `Max retries exceeded, routing to DLQ: ${messageId}`);

            await prisma.customerNotificationLog.updateMany({
              where: {
                OR: [
                  { outboxMessageId: messageId },
                  { musteriNo: event.musteriNo, bildirimDurumu: 'QUEUED' },
                ],
              },
              data: {
                bildirimDurumu: 'FAILED',
                guncellemeZmn: new Date(),
              },
            }).catch((err: any) => console.error('[Worker] DLQ status update error:', err?.message || err));

            workerNotificationStateTransitionTotal.inc({
              from_state: 'QUEUED',
              to_state: 'FAILED',
              channel: event.channel || 'DIGITAL',
            });

            channel.nack(msg, false, false);
          }
        }
      },
      { noAck: false }
    );

    channel.consume(
      DLQ_QUEUE,
      (dlqMsg: Message | null) => {
        if (!dlqMsg) return;
        try {
          const payload = JSON.parse(dlqMsg.content.toString());
          console.warn(`[DLQ] Dead message archived:`, {
            musteriNo: payload.musteriNo,
            product: payload.product,
          });
          channel.ack(dlqMsg);
        } catch {
          channel.ack(dlqMsg);
        }
      },
      { noAck: false }
    );

    const shutdown = async () => {
      console.log('\n[Worker] Shutting down gracefully...');
      await stopMetricsServer();
      await channel.close();
      await connection.close();
      await prisma.$disconnect();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.warn(`[Worker] RabbitMQ connection failed, retrying in 5s...`);
    setTimeout(startWorker, 5000);
  }
}

startWorker();
