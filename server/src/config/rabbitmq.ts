import amqp from 'amqplib';
import { ENV } from './env';

export const RABBITMQ_CONSTANTS = {
  EXCHANGE: 'notification.exchange',
  QUEUE: 'notification.queue',
  ROUTING_KEY: 'notification.dispatch',
  DLX_EXCHANGE: 'notification.dlx',
  DLQ_QUEUE: 'notification.dlq',
  DLQ_ROUTING_KEY: 'notification.dead',
};

export class RabbitMQClient {
  private static instance: RabbitMQClient;
  private connection: any = null;
  private channel: amqp.Channel | null = null;
  private confirmChannel: amqp.ConfirmChannel | null = null;
  private isConnecting: boolean = false;

  private constructor() {}

  public static getInstance(): RabbitMQClient {
    if (!RabbitMQClient.instance) {
      RabbitMQClient.instance = new RabbitMQClient();
    }
    return RabbitMQClient.instance;
  }

  public async getChannel(): Promise<amqp.Channel | null> {
    if (this.channel) {
      return this.channel;
    }

    if (this.isConnecting) {
      return null;
    }

    try {
      this.isConnecting = true;
      const url = ENV.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
      
      if (!this.connection) {
        this.connection = await amqp.connect(url);
      }
      const ch = await this.connection.createChannel();
      this.channel = ch;

      await this.assertTopology(ch);
      return this.channel;
    } catch (error) {
      this.channel = null;
      return null;
    } finally {
      this.isConnecting = false;
    }
  }

  public async getConfirmChannel(): Promise<amqp.ConfirmChannel | null> {
    if (this.confirmChannel) {
      return this.confirmChannel;
    }

    if (this.isConnecting) {
      return null;
    }

    try {
      this.isConnecting = true;
      const url = ENV.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

      if (!this.connection) {
        this.connection = await amqp.connect(url);
      }
      const ch = await this.connection.createConfirmChannel();
      this.confirmChannel = ch;

      await this.assertTopology(ch);
      return this.confirmChannel;
    } catch (error) {
      this.confirmChannel = null;
      return null;
    } finally {
      this.isConnecting = false;
    }
  }

  private async assertTopology(ch: amqp.Channel | amqp.ConfirmChannel): Promise<void> {
    await ch.assertExchange(RABBITMQ_CONSTANTS.DLX_EXCHANGE, 'direct', { durable: true });
    await ch.assertQueue(RABBITMQ_CONSTANTS.DLQ_QUEUE, { durable: true });
    await ch.bindQueue(
      RABBITMQ_CONSTANTS.DLQ_QUEUE,
      RABBITMQ_CONSTANTS.DLX_EXCHANGE,
      RABBITMQ_CONSTANTS.DLQ_ROUTING_KEY
    );

    await ch.assertExchange(RABBITMQ_CONSTANTS.EXCHANGE, 'direct', { durable: true });
    await ch.assertQueue(RABBITMQ_CONSTANTS.QUEUE, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': RABBITMQ_CONSTANTS.DLX_EXCHANGE,
        'x-dead-letter-routing-key': RABBITMQ_CONSTANTS.DLQ_ROUTING_KEY,
      },
    });
    await ch.bindQueue(
      RABBITMQ_CONSTANTS.QUEUE,
      RABBITMQ_CONSTANTS.EXCHANGE,
      RABBITMQ_CONSTANTS.ROUTING_KEY
    );
  }

  /**
   * Publisher Confirms: Broker diske yazıp onay (ACK) verene kadar bekler.
   */
  public async publishWithConfirm(
    routingKey: string,
    message: object,
    correlationId?: string | null,
    messageId?: string | null,
    exchange: string = RABBITMQ_CONSTANTS.EXCHANGE
  ): Promise<boolean> {
    const ch = await this.getConfirmChannel();
    if (!ch) {
      throw new Error('RabbitMQ ConfirmChannel bağlantısı kurulamadı');
    }

    const payload = Buffer.from(JSON.stringify(message));
    const headers: Record<string, any> = {};
    if (correlationId) {
      headers['x-correlation-id'] = correlationId;
    }

    return new Promise<boolean>((resolve, reject) => {
      ch.publish(
        exchange,
        routingKey,
        payload,
        {
          persistent: true,
          timestamp: Date.now(),
          messageId: messageId || undefined,
          headers,
        },
        (err) => {
          if (err) {
            return reject(err);
          }
          resolve(true);
        }
      );
    });
  }

  public async publish(
    routingKey: string,
    message: object,
    exchange: string = RABBITMQ_CONSTANTS.EXCHANGE
  ): Promise<boolean> {
    try {
      const channel = await this.getChannel();
      if (!channel) {
        return false;
      }

      const payload = Buffer.from(JSON.stringify(message));
      return channel.publish(exchange, routingKey, payload, {
        persistent: true,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('[RabbitMQ Publish Error]:', error);
      return false;
    }
  }

  public async close(): Promise<void> {
    try {
      if (this.confirmChannel) {
        await this.confirmChannel.close();
      }
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
    } catch {
      // noop
    } finally {
      this.confirmChannel = null;
      this.channel = null;
      this.connection = null;
    }
  }
}
