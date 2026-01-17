import pino from 'pino';
import pinoPretty from 'pino-pretty';

export interface LoggerConfig {
  level?: 'debug' | 'info' | 'warn' | 'error';
  format?: 'json' | 'pretty';
  service?: string;
}

export type Logger = pino.Logger;

let loggerInstance: Logger | null = null;

export function createLogger(config: LoggerConfig = {}): Logger {
  if (loggerInstance) {
    return loggerInstance;
  }

  const {
    level = 'info',
    format = 'json',
    service = 'ai-gateway',
  } = config;

  const pinoConfig: pino.LoggerOptions = {
    level,
    formatters: {
      level: (label) => ({ level: label }),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    serializers: {
      error: pino.stdSerializers.err,
    },
    base: {
      service,
      environment: process.env.NODE_ENV || 'development',
    },
  };

  if (format === 'pretty') {
    const stream = pinoPretty({
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    });
    loggerInstance = pino(pinoConfig, stream);
  } else {
    loggerInstance = pino(pinoConfig);
  }

  return loggerInstance;
}

export function getLogger(): Logger {
  if (!loggerInstance) {
    return createLogger();
  }
  return loggerInstance;
}

export default { createLogger, getLogger };
