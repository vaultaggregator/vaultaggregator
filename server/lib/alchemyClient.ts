import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

interface AlchemyConfig {
  url: string | undefined;
  perMin: number;
  ttl: number;
  minInterval: number;
  maxRetries: number;
  retryBase: number;
}

interface CacheEntry {
  data: any;
  expire: number;
}

const cfg: AlchemyConfig = {
  url: process.env.ALCHEMY_RPC_URL,
  perMin: Number(process.env.ALCHEMY_REQUESTS_PER_MIN || 600),
  ttl: Number(process.env.ALCHEMY_CACHE_TTL_S || 15),
  minInterval: Number(process.env.ALCHEMY_MIN_INTERVAL_MS || 250),
  maxRetries: Number(process.env.ALCHEMY_MAX_RETRIES || 3),
  retryBase: Number(process.env.ALCHEMY_RETRY_BASE_MS || 250)
};

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<any>>();
const lastCallAt = new Map<string, number>();
let windowStart = Date.now();
let windowCount = 0;

function hashKey(method: string, params: any[]): string {
  return crypto.createHash('sha1').update(method + ':' + JSON.stringify(params)).digest('hex');
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function now(): number { 
  return Date.now();
}

function rotateWindow(): void {
  const oneMin = 60_000;
  if (now() - windowStart >= oneMin) {
    windowStart = now();
    windowCount = 0;
  }
}

function log(line: string): void {
  const logPath = path.join(process.cwd(), 'alchemy_requests.log');
  const row = `[${new Date().toISOString()}] ${line}\n`;
  fs.appendFileSync(logPath, row);
  if (process.env.STAGE !== 'production') {
    console.log(row.trim());
  }
}

export async function alchemyRequest(method: string, params: any[] = [], opts: any = {}): Promise<any> {
  if (!cfg.url) {
    throw new Error('ALCHEMY_RPC_URL missing');
  }

  const key = hashKey(method, params);
  const cacheHit = cache.get(key);
  if (cacheHit && cacheHit.expire > now()) {
    log(`HIT method=${method} key=${key}`);
    return cacheHit.data;
  }

  if (inFlight.has(key)) {
    log(`JOIN method=${method} key=${key}`);
    return inFlight.get(key);
  }

  rotateWindow();
  if (windowCount >= cfg.perMin) {
    log(`BLOCK budget_exceeded method=${method}`);
    throw new Error('Budget exceeded, try later');
  }

  // Check for 70% budget warning
  if (windowCount >= cfg.perMin * 0.7) {
    log(`WARN budget_warning method=${method} count=${windowCount}/${cfg.perMin}`);
  }

  const last = lastCallAt.get(method) || 0;
  const elapsed = now() - last;
  if (elapsed < cfg.minInterval) {
    const wait = cfg.minInterval - elapsed;
    await sleep(wait);
  }

  let attempts = 0;
  const task = (async () => {
    while (true) {
      attempts += 1;
      lastCallAt.set(method, now());
      windowCount += 1;

      try {
        const res = await fetch(cfg.url!, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
        });

        if (!res.ok) {
          const body = await res.text();
          log(`ERR http=${res.status} method=${method} attempt=${attempts} body=${body.slice(0, 200)}`);
          if ((res.status === 429 || res.status >= 500) && attempts <= cfg.maxRetries) {
            const backoff = cfg.retryBase * 2 ** (attempts - 1) + Math.floor(Math.random() * 50);
            await sleep(backoff);
            continue;
          }
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();
        if (json.error) {
          log(`ERR rpc method=${method} attempt=${attempts} code=${json.error.code}`);
          throw new Error(`RPC ${json.error.code}`);
        }

        cache.set(key, { data: json.result, expire: now() + cfg.ttl * 1000 });
        log(`OK method=${method} attempts=${attempts} key=${key}`);
        return json.result;
      } catch (e: any) {
        if (attempts <= cfg.maxRetries) {
          const backoff = cfg.retryBase * 2 ** (attempts - 1) + Math.floor(Math.random() * 50);
          await sleep(backoff);
          continue;
        }
        log(`FAIL method=${method} attempts=${attempts} msg=${e.message}`);
        throw e;
      }
    }
  })();

  inFlight.set(key, task);
  try {
    const out = await task;
    return out;
  } finally {
    inFlight.delete(key);
  }
}

// Export budget status for monitoring
export function getBudgetStatus() {
  rotateWindow();
  return {
    current: windowCount,
    limit: cfg.perMin,
    percentage: Math.round((windowCount / cfg.perMin) * 100),
    windowStart: new Date(windowStart).toISOString()
  };
}