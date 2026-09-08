import { prisma } from '../config/prisma';
import { OutboxRepository, IOutboxRepository } from '../repositories/outbox.repository';
import { RabbitMQClient, RABBITMQ_CONSTANTS } from '../config/rabbitmq';
import { outboxPublishedCounter, outboxFailedCounter } from '../config/metrics';

export interface OutboxRelayStats {
  processedCount: number;
  successCount: number;
  failureCount: number;
}

export class OutboxRelayService {
  private static instance: OutboxRelayService;
  private readonly outboxRepository: IOutboxRepository;
  private readonly rabbitClient: RabbitMQClient;
  private timer: NodeJS.Timeout | null = null;
  private isProcessing: boolean = false;
  private isRunning: boolean = false;

  constructor(
    outboxRepository: IOutboxRepository = OutboxRepository.getInstance(),
    rabbitClient: RabbitMQClient = RabbitMQClient.getInstance()
  ) {
    this.outboxRepository = outboxRepository;
    this.rabbitClient = rabbitClient;
  }

  public static getInstance(): OutboxRelayService {
    if (!OutboxRelayService.instance) {
      OutboxRelayService.instance = new OutboxRelayService();
    }
    return OutboxRelayService.instance;
  }

  public async processPendingBatch(batchSize: number = 10): Promise<OutboxRelayStats> {
    if (this.isProcessing) {
      return { processedCount: 0, successCount: 0, failureCount: 0 };
    }

    this.isProcessing = true;
    const stats: OutboxRelayStats = { processedCount: 0, successCount: 0, failureCount: 0 };

    try {
      await prisma.$transaction(async (tx) => {
        const pendingMessages = await this.outboxRepository.fetchAndLockPending(tx, batchSize);

        if (!pendingMessages || pendingMessages.length === 0) {
          return;
        }

        stats.processedCount = pendingMessages.length;

        for (const msg of pendingMessages) {
          try {
            const payload = typeof msg.payload === 'string' ? JSON.parse(msg.payload) : msg.payload;

            await this.rabbitClient.publishWithConfirm(
              RABBITMQ_CONSTANTS.ROUTING_KEY,
              payload,
              msg.correlationId,
              msg.id
            );

            await this.outboxRepository.markPublishedTransactional(tx, msg.id);
            stats.successCount++;
            outboxPublishedCounter.inc();

            console.log(
              `[OUTBOX RELAY]: Event [${msg.id}] published (Correlation-ID: ${msg.correlationId || 'N/A'})`
            );
          } catch (error) {
            const nextRetry = (msg.retryCount || 0) + 1;
            const errorMsg = (error as Error).message || 'Delivery failed';

            await this.outboxRepository.markFailedTransactional(tx, msg.id, errorMsg, nextRetry);
            stats.failureCount++;
            if (nextRetry >= 5) {
              outboxFailedCounter.inc();
            }

            console.error(
              `[OUTBOX RELAY]: Event [${msg.id}] retry ${nextRetry}/5 failed: ${errorMsg}`
            );
          }
        }
      });
    } catch (err) {
      console.error('[OUTBOX RELAY]: Batch processing error:', (err as Error).message);
    } finally {
      this.isProcessing = false;
    }

    return stats;
  }

  public start(intervalMs: number = 2000): void {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log(`[OUTBOX RELAY]: Servis başlatıldı. (${intervalMs}ms)`);

    this.timer = setInterval(async () => {
      if (!this.isRunning) return;
      await this.processPendingBatch();
    }, intervalMs);
  }

  public async stop(): Promise<void> {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }
}
