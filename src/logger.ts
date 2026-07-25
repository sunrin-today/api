import pino from 'pino';
import pretty from 'pino-pretty';
import { env } from './env';

const ansi = {
  reset: '\x1b[0m',
  dim: '\x1b[90m',
  method: '\x1b[35m', // magenta — GET/POST
  path: '\x1b[37m', // white — /meal
  ok: '\x1b[32m', // green — 2xx
  warn: '\x1b[33m', // yellow — 4xx
  error: '\x1b[31m', // red — 5xx
  level: {
    INFO: '\x1b[32m',
    WARN: '\x1b[33m',
    ERROR: '\x1b[31m',
    DEBUG: '\x1b[34m',
    FATAL: '\x1b[41m',
  } as Record<string, string>,
};

function createPrettyStream() {
  return pretty({
    // Keep message ANSI intact (colorize would force the whole msg to cyan)
    colorize: false,
    singleLine: true,
    translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
    ignore: 'pid,hostname,service,method,path,status,ms',
    customPrettifiers: {
      time: (timestamp) => `${ansi.dim}${timestamp}${ansi.reset}`,
      level: (_level, _key, _log, { label }) => {
        const color = ansi.level[label] ?? ansi.dim;
        return `${color}${label}${ansi.reset}`;
      },
    },
  });
}

export const logger = env.isProduction
  ? pino({
      level: 'info',
      base: { service: 'sunrintoday-api' },
    })
  : pino(
      {
        level: 'debug',
        base: { service: 'sunrintoday-api' },
      },
      createPrettyStream(),
    );

function normalizePath(path: string) {
  const [pathname = '/', query] = path.split('?');
  const normalized =
    pathname.length > 1 && pathname.endsWith('/')
      ? pathname.slice(0, -1)
      : pathname;

  return query ? `${normalized}?${query}` : normalized;
}

function formatRequestLine(
  method: string,
  path: string,
  status: number,
  ms: number,
  message?: string,
) {
  const normalizedPath = normalizePath(path);

  if (env.isProduction) {
    return message
      ? `${method} ${normalizedPath} ${status} +${ms}ms — ${message}`
      : `${method} ${normalizedPath} ${status} +${ms}ms`;
  }

  const statusColor =
    status >= 500 ? ansi.error : status >= 400 ? ansi.warn : ansi.ok;

  const line = [
    `${ansi.method}${method}${ansi.reset}`,
    `${ansi.path}${normalizedPath}${ansi.reset}`,
    `${statusColor}${status}${ansi.reset}`,
    `${ansi.dim}+${ms}ms${ansi.reset}`,
  ].join(' ');

  if (!message) return line;

  return `${line} ${ansi.dim}— ${message}${ansi.reset}`;
}

export function logRequest({
  method,
  path,
  status,
  ms,
  message,
  err,
}: {
  method: string;
  path: string;
  status: number;
  ms: number;
  message?: string;
  err?: unknown;
}) {
  const line = formatRequestLine(method, path, status, ms, message);
  const payload = {
    method,
    path: normalizePath(path),
    status,
    ms,
    err,
  };

  if (status >= 500) {
    logger.error(payload, line);
  } else if (status >= 400) {
    logger.warn(payload, line);
  } else {
    logger.info(payload, line);
  }
}
