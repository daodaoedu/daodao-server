import { AsyncLocalStorage } from 'async_hooks';
import rateLimit, { type Options, type RateLimitRequestHandler, type Store } from 'express-rate-limit';
import Redis from 'ioredis';
import { RedisStore, type RedisReply } from 'rate-limit-redis';

let client: Redis | undefined;
let connecting: Promise<void> | undefined;
const commandContext = new AsyncLocalStorage<{ failure?: Error }>();

/** Use a dedicated bounded-latency connection without queuing offline requests. */
function getClient(): Redis {
  if (!client) {
    client = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      port: Number(process.env.REDIS_PORT ?? 6379),
      password: process.env.REDIS_PASSWORD,
      db: Number(process.env.REDIS_DB ?? 0),
      lazyConnect: true,
      enableOfflineQueue: false,
      autoResendUnfulfilledCommands: false,
      maxRetriesPerRequest: 0,
      connectTimeout: 500,
      commandTimeout: 500,
      retryStrategy: (attempt): number => Math.min(attempt * 100, 2000),
    });
    // Each failed request is logged by express-rate-limit's passOnStoreError.
    // An error listener is also required while the client reconnects in idle time.
    client.on('error', (error: Error): void => {
      console.error('Rate-limit Redis connection error:', error.message);
    });
  }
  return client;
}

/** Disconnect the dedicated connection during shutdown or isolated integration tests. */
export function disconnectRateLimitRedis(): void {
  client?.disconnect();
  client = undefined;
  connecting = undefined;
}

/** Share counters across processes while isolating each environment and limiter. */
export function createSharedRateLimiter(
  name: string,
  options: Partial<Omit<Options, 'store' | 'passOnStoreError'>>,
): RateLimitRequestHandler {
  let delegate: RedisStore | undefined;
  let configuration: Options;
  const prefix = `rate-limit:${process.env.APP_ENV ?? process.env.NODE_ENV ?? 'development'}:${name}:`;

  /** Delay script loading until a request can use Redis; rejected loads remain recoverable. */
  async function getStore(): Promise<RedisStore> {
    const connection = getClient();
    if (connection.status === 'wait') {
      connecting = connection.connect().finally(() => { connecting = undefined; });
    }
    if (connecting) await connecting;
    if (connection.status !== 'ready') throw new Error('Rate-limit Redis is unavailable');
    if (!delegate) {
      delegate = new RedisStore({
        prefix,
        sendCommand: async (...args: string[]): Promise<RedisReply> => {
          const context = commandContext.getStore();
          if (context?.failure) throw context.failure;
          try {
            return await connection.call(args[0], ...args.slice(1)) as RedisReply;
          } catch (error) {
            // rate-limit-redis retries every EVAL error. Only NOSCRIPT is safe:
            // a timeout may mean INCR executed and only its response was lost.
            if (context && error instanceof Error && !error.message.startsWith('NOSCRIPT')) {
              context.failure = error;
            }
            throw error;
          }
        },
      });
      // The store eagerly loads two scripts. Both need rejection handlers even
      // when only increment is used; its retry path reloads a failed script later.
      void delegate.incrementScriptSha.catch(() => undefined);
      void delegate.getScriptSha.catch(() => undefined);
      delegate.init(configuration);
    }
    return delegate;
  }

  const store: Store = {
    prefix,
    init: (config): void => { configuration = config; },
    increment: async (key) => commandContext.run({}, async () => (await getStore()).increment(key)),
    decrement: async (key): Promise<void> => (await getStore()).decrement(key),
    resetKey: async (key): Promise<void> => (await getStore()).resetKey(key),
  };
  return rateLimit({ ...options, store, passOnStoreError: true });
}
