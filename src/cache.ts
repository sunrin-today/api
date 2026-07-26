import { logger } from './logger';
import { redis } from './redis';

// bump when response shape changes so old payloads are not served
const PREFIX = 'sunrin:meal:r2';
const VERSION_KEY = `${PREFIX}:ver`;

/** Hard cap so no key lives forever even if caller passes a large TTL */
export const CACHE_TTL = {
  max: 6 * 60 * 60, // 6h
  today: 15 * 60, // 15m
  upcoming: 15 * 60, // 15m
  past: 6 * 60 * 60, // 6h
  missToday: 60, // 1m — today may be filled later
  missPast: 10 * 60, // 10m
  aggregate: 5 * 60, // 5m — week/month/period
  rest: 10 * 60, // 10m
} as const;

const MAX_VALUE_BYTES = 64 * 1024; // skip caching oversized payloads

/** Avoid an extra Upstash RTT on every read (version key). */
const VERSION_FRESH_MS = 1_000;
let memoryVersion = '0';
let memoryVersionAt = 0;

type CacheEnvelope<T> =
  | { kind: 'data'; data: T }
  | { kind: 'miss' };

function clampTtl(seconds: number) {
  return Math.max(1, Math.min(Math.floor(seconds), CACHE_TTL.max));
}

async function currentVersion(): Promise<string> {
  const now = Date.now();
  if (now - memoryVersionAt < VERSION_FRESH_MS) {
    return memoryVersion;
  }

  try {
    const version = await redis.get(VERSION_KEY);
    memoryVersion = version ?? '0';
    memoryVersionAt = now;
  } catch (err) {
    logger.warn({ err }, 'cache version refresh failed');
  }

  return memoryVersion;
}

async function cacheKey(parts: string[]) {
  const version = await currentVersion();
  return `${PREFIX}:v${version}:${parts.join(':')}`;
}

export async function invalidateMealCache() {
  try {
    const next = await redis.incr(VERSION_KEY);
    memoryVersion = String(next);
    memoryVersionAt = Date.now();
  } catch (err) {
    logger.warn({ err }, 'cache invalidate failed');
  }
}

export async function cacheGet<T>(
  parts: string[],
): Promise<
  { status: 'hit'; value: T } | { status: 'miss' } | { status: 'absent' }
> {
  try {
    const raw = await redis.get(await cacheKey(parts));
    if (raw == null) return { status: 'absent' };

    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (parsed.kind === 'miss') return { status: 'miss' };
    return { status: 'hit', value: parsed.data };
  } catch (err) {
    logger.warn({ err, parts }, 'cache get failed');
    return { status: 'absent' };
  }
}

export async function cacheSet<T>(
  parts: string[],
  value: T,
  ttlSeconds: number,
) {
  try {
    const payload = JSON.stringify({
      kind: 'data',
      data: value,
    } satisfies CacheEnvelope<T>);
    if (Buffer.byteLength(payload, 'utf8') > MAX_VALUE_BYTES) {
      logger.warn(
        { parts, bytes: Buffer.byteLength(payload, 'utf8') },
        'cache skip oversized',
      );
      return;
    }
    await redis.set(await cacheKey(parts), payload, 'EX', clampTtl(ttlSeconds));
  } catch (err) {
    logger.warn({ err, parts }, 'cache set failed');
  }
}

export async function cacheSetMiss(parts: string[], ttlSeconds: number) {
  try {
    const payload = JSON.stringify({
      kind: 'miss',
    } satisfies CacheEnvelope<never>);
    await redis.set(await cacheKey(parts), payload, 'EX', clampTtl(ttlSeconds));
  } catch (err) {
    logger.warn({ err, parts }, 'cache set miss failed');
  }
}

/** Seconds until local end-of-day (server TZ should be Asia/Seoul). */
export function secondsUntilEndOfDay(now = new Date()) {
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return Math.max(1, Math.ceil((end.getTime() - now.getTime()) / 1000));
}

export function ttlForDateKey(dateStr: string, now = new Date()) {
  const today = formatDateLocal(now);
  if (dateStr === today) {
    return Math.min(CACHE_TTL.today, secondsUntilEndOfDay(now));
  }
  if (dateStr > today) return CACHE_TTL.upcoming;
  return CACHE_TTL.past;
}

export function ttlForDateMiss(dateStr: string, now = new Date()) {
  const today = formatDateLocal(now);
  if (dateStr >= today) return CACHE_TTL.missToday;
  return CACHE_TTL.missPast;
}

function formatDateLocal(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
