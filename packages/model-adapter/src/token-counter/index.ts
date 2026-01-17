/**
 * Token 计算器
 * 使用近似算法估算 Token 数量
 * 注意：DashScope 有自己的 Token 计算规则，这里使用 GPT-2 tokenizer 作为近似
 */

const TOKENIZER_URL = 'https://tiktoken.pages.dev/js/cl100k_base.json';

let encoding: Record<string, number[]> | null = null;

async function loadEncoding(): Promise<Record<string, number[]>> {
  if (encoding) return encoding;

  try {
    const response = await fetch(TOKENIZER_URL);
    encoding = await response.json();
    return encoding;
  } catch (error) {
    console.warn('Failed to load tokenizer, using approximate count');
    return {};
  }
}

function approximateCount(text: string): number {
  // 简单近似：英文约 4 字符/token，中文约 1.5 字符/token
  let count = 0;
  let chineseChars = 0;
  let otherChars = 0;

  for (const char of text) {
    if (/[\u4e00-\u9fa5]/.test(char)) {
      chineseChars++;
    } else {
      otherChars++;
    }
  }

  count = Math.ceil(chineseChars / 1.5) + Math.ceil(otherChars / 4);
  return count;
}

export async function countTokens(text: string): Promise<number> {
  try {
    const enc = await loadEncoding();
    if (Object.keys(enc).length === 0) {
      return approximateCount(text);
    }

    // 使用精确的 tokenizer
    let count = 0;
    for (let i = 0; i < text.length; ) {
      let found = false;
      // 从最长到最短匹配
      for (let len = Math.min(text.length - i, 5); len >= 1; len--) {
        const sub = text.slice(i, i + len);
        if (enc[sub]) {
          count++;
          i += len;
          found = true;
          break;
        }
      }
      if (!found) {
        count++;
        i++;
      }
    }
    return count;
  } catch {
    return approximateCount(text);
  }
}

export function countTokensSync(text: string): number {
  return approximateCount(text);
}

/**
 * 计算 DashScope 模型的 Token 成本
 * @param promptTokens 输入 Token 数
 * @param completionTokens 输出 Token 数
 * @param pricing 定价配置
 */
export function calculateCost(
  promptTokens: number,
  completionTokens: number,
  pricing: { inputPricePer1kTokens: number; outputPricePer1kTokens: number },
): { inputCost: number; outputCost: number; totalCost: number } {
  const inputCost = (promptTokens / 1000) * pricing.inputPricePer1kTokens;
  const outputCost = (completionTokens / 1000) * pricing.outputPricePer1kTokens;

  return {
    inputCost: Number(inputCost.toFixed(6)),
    outputCost: Number(outputCost.toFixed(6)),
    totalCost: Number((inputCost + outputCost).toFixed(6)),
  };
}

/**
 * 预估 Token 数量和成本
 * @param input 输入文本
 * @param estimatedOutputRatio 预估输出/输入比例
 * @param pricing 定价配置
 */
export async function estimateCost(
  input: string,
  estimatedOutputRatio: number = 0.5,
  pricing: { inputPricePer1kTokens: number; outputPricePer1kTokens: number },
): Promise<{
  inputTokens: number;
  estimatedOutputTokens: number;
  estimatedCost: number;
  currency: string;
  confidence: number;
}> {
  const inputTokens = await countTokens(input);
  const estimatedOutputTokens = Math.ceil(inputTokens * estimatedOutputRatio);

  const { totalCost } = calculateCost(inputTokens, estimatedOutputTokens, pricing);

  return {
    inputTokens,
    estimatedOutputTokens,
    estimatedCost: Number(totalCost.toFixed(6)),
    currency: pricing.inputPricePer1kTokens < 0.1 ? 'CNY' : 'USD',
    confidence: 0.7, // 预估置信度 0-1
  };
}
