import '../config/env';
import { prisma } from '../config/prisma';
import { OutboxRepository } from '../repositories/outbox.repository';
import { OutboxRelayService } from '../services/outboxRelay.service';
import { RabbitMQClient } from '../config/rabbitmq';

describe('Transactional Outbox Relay', () => {
  let outboxRepo: OutboxRepository;
  let rabbitClient: RabbitMQClient;
  let relayService: OutboxRelayService;

  beforeAll(async () => {
    outboxRepo = OutboxRepository.getInstance();
    rabbitClient = RabbitMQClient.getInstance();
    relayService = new OutboxRelayService(outboxRepo, rabbitClient);
    await prisma.outboxMessage.deleteMany({ where: { status: 'PENDING' } });
  });

  afterAll(async () => {
    await rabbitClient.close();
  });

  it('publishes pending outbox messages to broker and updates status to PUBLISHED', async () => {
    const testCorrelationId = `RELAY_TEST_${Date.now()}`;
    const createdMsg = await prisma.outboxMessage.create({
      data: {
        eventType: 'notification.requested',
        payload: {
          musteriNo: '10000001',
          channel: 'DIGITAL',
          product: 'Kredi Kartı',
          test: true,
        },
        correlationId: testCorrelationId,
        status: 'PENDING',
        retryCount: 0,
      },
    });

    expect(createdMsg.status).toBe('PENDING');

    const stats = await relayService.processPendingBatch(50);
    expect(stats.processedCount).toBeGreaterThanOrEqual(1);
    expect(stats.successCount).toBeGreaterThanOrEqual(1);

    const updatedMsg = await prisma.outboxMessage.findUnique({
      where: { id: createdMsg.id },
    });

    expect(updatedMsg).not.toBeNull();
    expect(updatedMsg?.status).toBe('PUBLISHED');
    expect(updatedMsg?.processedAt).not.toBeNull();
  });

  it('marks message as FAILED when exceeding maximum retries', async () => {
    const failingMsg = await prisma.outboxMessage.create({
      data: {
        eventType: 'notification.requested',
        payload: { test: 'fail' },
        correlationId: `FAIL_TEST_${Date.now()}`,
        status: 'PENDING',
        retryCount: 4,
      },
    });

    await prisma.$transaction(async (tx) => {
      await outboxRepo.markFailedTransactional(tx, failingMsg.id, 'Broker Connection Timeout', 5);
    });

    const terminalMsg = await prisma.outboxMessage.findUnique({
      where: { id: failingMsg.id },
    });

    expect(terminalMsg?.status).toBe('FAILED');
    expect(terminalMsg?.errorReason).toBe('Broker Connection Timeout');
    expect(terminalMsg?.processedAt).not.toBeNull();
  });
});
