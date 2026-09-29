import { FastifyInstance } from 'fastify/types/instance';

export type Handler<T> = (payload: T) => void | Promise<void>;

export class LocalEventBus<E extends object> {
  private handlers: Partial<{ [K in keyof E]: Handler<E[K]>[] }> = {};

  constructor(private readonly logger: FastifyInstance['log']) {
    this.logger = logger;
  }

  subscribe<K extends keyof E>(event: K, handler: Handler<E[K]>) {
    const list = this.handlers[event] ?? [];
    list.push(handler);
    this.handlers[event] = list;
  }

  async publish<K extends keyof E>(event: K, payload: E[K]) {
    this.logger.info({ event, payload }, 'eventBus: publishing event');
    const list = this.handlers[event] ?? [];
    for (const handler of list) {
      await handler(payload);
    }
  }

  clear<K extends keyof E>(event?: K) {
    if (event) {
      delete this.handlers[event];
    } else {
      this.handlers = {};
    }
  }
}
