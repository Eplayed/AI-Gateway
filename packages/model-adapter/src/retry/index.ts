import type { Logger } from '@ai-gateway/logger';

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    'Throttling',
    'RateLimitExceeded',
    'ServiceUnavailable',
    'InternalError',
    'Timeout',
  ],
};

export class RetryStrategy {
  private circuitBreakerStates = new Map<string, CircuitBreakerState>();

  constructor(
    private config: RetryConfig = DEFAULT_RETRY_CONFIG,
    private logger?: Logger,
  ) {}

  async execute<T>(
    key: string,
    fn: () => Promise<T>,
    customConfig?: Partial<RetryConfig>,
  ): Promise<T> {
    const mergedConfig = { ...this.config, ...customConfig };

    // 检查熔断器
    if (this.isCircuitBreakerOpen(key)) {
      throw new Error(`Circuit breaker is open for key: ${key}`);
    }

    let lastError: Error | undefined;
    let attempt = 0;
    let delay = mergedConfig.initialDelayMs;

    while (attempt <= mergedConfig.maxRetries) {
      try {
        const result = await fn();

        // 成功，重置熔断器
        this.resetCircuitBreaker(key);

        return result;
      } catch (error) {
        lastError = error as Error;
        attempt++;

        // 检查是否可重试
        if (!this.isRetryable(error, mergedConfig.retryableErrors)) {
          throw error;
        }

        // 最后一次尝试失败，记录熔断器
        if (attempt > mergedConfig.maxRetries) {
          this.recordFailure(key);
          throw lastError;
        }

        this.logger?.warn(
          { attempt, delay, error: lastError.message, key },
          `Request failed, retrying in ${delay}ms`,
        );

        // 等待后重试
        await this.sleep(delay);
        delay = Math.min(delay * mergedConfig.backoffMultiplier, mergedConfig.maxDelayMs);
      }
    }

    throw lastError;
  }

  private isRetryable(error: Error, retryableErrors: string[]): boolean {
    const errorMessage = error.message || '';
    const errorName = error.name || '';

    return retryableErrors.some(
      (retryable) =>
        errorMessage.includes(retryable) || errorName.includes(retryable),
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // 熔断器实现
  private recordFailure(key: string): void {
    const state = this.getCircuitBreakerState(key);
    state.failureCount++;
    state.lastFailureTime = Date.now();

    if (state.failureCount >= 5) {
      state.open = true;
      this.logger?.warn({ key }, 'Circuit breaker opened');
    }
  }

  private resetCircuitBreaker(key: string): void {
    const state = this.getCircuitBreakerState(key);
    state.failureCount = 0;
    state.open = false;
  }

  private isCircuitBreakerOpen(key: string): boolean {
    const state = this.getCircuitBreakerState(key);

    if (!state.open) {
      return false;
    }

    // 检查是否可以半开（冷却时间 60 秒）
    if (Date.now() - state.lastFailureTime > 60000) {
      state.open = false;
      state.failureCount = 0;
      return false;
    }

    return true;
  }

  private getCircuitBreakerState(key: string): CircuitBreakerState {
    if (!this.circuitBreakerStates.has(key)) {
      this.circuitBreakerStates.set(key, {
        failureCount: 0,
        open: false,
        lastFailureTime: 0,
      });
    }
    return this.circuitBreakerStates.get(key)!;
  }
}

interface CircuitBreakerState {
  failureCount: number;
  open: boolean;
  lastFailureTime: number;
}
