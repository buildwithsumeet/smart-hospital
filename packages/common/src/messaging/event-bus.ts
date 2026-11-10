import amqp from 'amqplib';
import { createLogger } from '../utils/logger';
import { BaseEvent, HOSPITAL_DLX_EXCHANGE, HOSPITAL_EXCHANGE } from '../events/events';

const logger = createLogger('EventBus');

type EventHandler<T = any> = (event: BaseEvent<T>) => Promise<void>;

export class EventBus {
  private static instance: EventBus;
  private connection: any = null;
  private channel: any = null;
  private amqpUrl: string;
  private isConnected = false;
  private inMemorySubscribers: Map<string, EventHandler[]> = new Map();

  private constructor(amqpUrl?: string) {
    this.amqpUrl = amqpUrl || process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
  }

  public static getInstance(amqpUrl?: string): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus(amqpUrl);
    }
    return EventBus.instance;
  }

  public async connect(): Promise<boolean> {
    try {
      this.connection = await amqp.connect(this.amqpUrl);
      this.channel = await this.connection.createChannel();

      // Assert main topic exchange
      await this.channel.assertExchange(HOSPITAL_EXCHANGE, 'topic', { durable: true });

      // Assert Dead Letter Exchange (DLX)
      await this.channel.assertExchange(HOSPITAL_DLX_EXCHANGE, 'topic', { durable: true });

      this.isConnected = true;
      logger.info(`Connected to RabbitMQ at ${this.amqpUrl}`);

      this.connection.on('error', (err: any) => {
        logger.error('RabbitMQ connection error:', err);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed. Attempting reconnect in 5s...');
        this.isConnected = false;
        setTimeout(() => this.connect(), 5000);
      });

      return true;
    } catch (err: any) {
      logger.warn(`RabbitMQ not available (${err.message}). Using resilient in-memory event bus fallback.`);
      this.isConnected = false;
      return false;
    }
  }

  public async publish<T>(topic: string, data: T): Promise<void> {
    const event: BaseEvent<T> = {
      eventId: Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
      topic,
      timestamp: new Date().toISOString(),
      data
    };

    if (this.isConnected && this.channel) {
      try {
        const payload = Buffer.from(JSON.stringify(event));
        this.channel.publish(HOSPITAL_EXCHANGE, topic, payload, { persistent: true });
        logger.debug(`Published event to topic [${topic}]:`, { eventId: event.eventId });
      } catch (err) {
        logger.error(`Error publishing to RabbitMQ [${topic}]:`, err);
      }
    }

    // Always notify in-memory subscribers (crucial for decoupled modular testing & resilient fallback)
    const handlers = this.inMemorySubscribers.get(topic) || [];
    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (handlerErr) {
        logger.error(`Error executing in-memory handler for [${topic}]:`, handlerErr);
      }
    }

    // Also match wildcards like appointment.*
    for (const [key, wildcardHandlers] of this.inMemorySubscribers.entries()) {
      if (key !== topic && this.matchTopic(key, topic)) {
        for (const handler of wildcardHandlers) {
          try {
            await handler(event);
          } catch (handlerErr) {
            logger.error(`Error executing wildcard handler for [${key}]:`, handlerErr);
          }
        }
      }
    }
  }

  public async subscribe<T>(
    queueName: string,
    routingPattern: string,
    handler: EventHandler<T>
  ): Promise<void> {
    // Register in-memory
    const existing = this.inMemorySubscribers.get(routingPattern) || [];
    existing.push(handler);
    this.inMemorySubscribers.set(routingPattern, existing);

    if (this.isConnected && this.channel) {
      try {
        // Assert queue with DLQ settings
        const dlqName = `${queueName}.dlq`;
        await this.channel.assertQueue(dlqName, { durable: true });
        await this.channel.bindQueue(dlqName, HOSPITAL_DLX_EXCHANGE, routingPattern);

        await this.channel.assertQueue(queueName, {
          durable: true,
          deadLetterExchange: HOSPITAL_DLX_EXCHANGE,
          deadLetterRoutingKey: routingPattern
        });

        await this.channel.bindQueue(queueName, HOSPITAL_EXCHANGE, routingPattern);

        await this.channel.consume(queueName, async (msg: any) => {
          if (!msg) return;
          try {
            const event: BaseEvent<T> = JSON.parse(msg.content.toString());
            await handler(event);
            this.channel?.ack(msg);
          } catch (processingErr) {
            logger.error(`Failed to process message from ${queueName}:`, processingErr);
            // Reject and route to Dead Letter Queue
            this.channel?.nack(msg, false, false);
          }
        });

        logger.info(`Subscribed queue [${queueName}] to topic pattern [${routingPattern}]`);
      } catch (err) {
        logger.error(`Failed to subscribe to RabbitMQ queue [${queueName}]:`, err);
      }
    }
  }

  private matchTopic(pattern: string, topic: string): boolean {
    const patternParts = pattern.split('.');
    const topicParts = topic.split('.');

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] === '#') return true;
      if (patternParts[i] === '*') continue;
      if (patternParts[i] !== topicParts[i]) return false;
    }
    return patternParts.length === topicParts.length;
  }

  public async close(): Promise<void> {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
      this.isConnected = false;
    } catch (err) {
      logger.error('Error closing EventBus connection:', err);
    }
  }
}
