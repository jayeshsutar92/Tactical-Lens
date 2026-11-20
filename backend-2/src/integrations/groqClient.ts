import Groq from 'groq-sdk';
import { z } from 'zod';
import { config } from '../config/env.js';
import { AIProviderError, ConfigurationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

let _groqClient: Groq | null = null;

export function getGroqClient(): Groq {
  if (!_groqClient) {
    if (!config.groqApiKey || config.groqApiKey.trim() === '' || config.groqApiKey.startsWith('your_')) {
      throw new ConfigurationError(
        'GROQ_API_KEY is not configured. Please set a valid key in your environment or .env file.'
      );
    }

    try {
      _groqClient = new Groq({
        apiKey: config.groqApiKey,
        timeout: config.groqTimeoutMs,
      });
    } catch (err: any) {
      throw new AIProviderError(`Failed to initialize Groq client: ${err?.message || err}`);
    }
  }

  return _groqClient;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: 'json_object' };
}

export class GroqClient {
  /**
   * Executes a chat completion call with timeout handling and exponential backoff retries.
   */
  static async chatCompletion(
    messages: ChatMessage[],
    options: CompletionOptions = {}
  ): Promise<string> {
    const client = getGroqClient();
    const targetModel = options.model || config.groqModel;
    const maxRetries = config.groqMaxRetries;
    const temperature = options.temperature ?? 0.2;
    const maxTokens = options.maxTokens ?? 2500;
    const baseDelayMs = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(
          `Sending prompt to Groq model '${targetModel}' (attempt ${attempt}/${maxRetries})...`
        );

        // Bounded timeout race
        const completionPromise = client.chat.completions.create({
          model: targetModel,
          messages: messages as any,
          temperature,
          max_tokens: maxTokens,
          response_format: options.responseFormat,
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('GROQ_REQUEST_TIMEOUT')),
            config.groqTimeoutMs
          )
        );

        const response = await Promise.race([completionPromise, timeoutPromise]);
        const content = response.choices?.[0]?.message?.content;

        if (!content || !content.trim()) {
          throw new AIProviderError('Groq returned an empty completion response');
        }

        logger.info(`Groq completion received successfully (${content.length} characters).`);
        return content;
      } catch (err: any) {
        const errStr = err?.message || String(err);
        const isTimeout = errStr.includes('GROQ_REQUEST_TIMEOUT') || errStr.toLowerCase().includes('timeout');
        const isRateLimit =
          err?.status === 429 ||
          errStr.includes('429') ||
          errStr.toLowerCase().includes('rate limit');
        const isServerError =
          err?.status === 500 ||
          err?.status === 503 ||
          errStr.includes('500') ||
          errStr.includes('503') ||
          errStr.toLowerCase().includes('overloaded');

        if (isTimeout) {
          logger.warn(`Groq request timed out on attempt ${attempt}/${maxRetries}.`);
          if (attempt === maxRetries) {
            throw new AIProviderError('Groq request timed out after multiple attempts.', 504);
          }
        } else if ((isRateLimit || isServerError) && attempt < maxRetries) {
          const jitter = Math.random() * 400 + 100;
          const sleepTime = baseDelayMs * Math.pow(2, attempt - 1) + jitter;
          logger.warn(
            `Groq transient error on attempt ${attempt}: ${errStr}. Retrying in ${Math.round(sleepTime)}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, sleepTime));
          continue;
        } else {
          logger.error(`Groq API error on attempt ${attempt}/${maxRetries}: ${errStr}`);
          throw new AIProviderError(`Groq API error: ${errStr}`);
        }
      }
    }

    throw new AIProviderError('Groq request failed after all retry attempts.');
  }

  /**
   * Executes a completion enforcing JSON object structure and validating against a Zod schema.
   */
  static async chatCompletionStructured<T extends z.ZodTypeAny>(
    messages: ChatMessage[],
    schema: T,
    options: Omit<CompletionOptions, 'responseFormat'> = {}
  ): Promise<z.infer<T>> {
    const rawJsonStr = await this.chatCompletion(messages, {
      ...options,
      responseFormat: { type: 'json_object' },
    });

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawJsonStr);
    } catch (jsonErr: any) {
      logger.error(`Failed to parse Groq JSON response: ${jsonErr?.message || jsonErr}`);
      throw new AIProviderError(`Malformed JSON response from Groq: ${jsonErr?.message || jsonErr}`);
    }

    const validation = schema.safeParse(parsedJson);
    if (!validation.success) {
      logger.error('Groq JSON failed schema validation:', validation.error.format());
      throw new AIProviderError(
        `Groq response did not adhere to expected schema: ${validation.error.message}`,
        502,
        validation.error.errors
      );
    }

    return validation.data;
  }
}
