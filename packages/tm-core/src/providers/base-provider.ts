/**
 * @fileoverview Base provider implementation for AI providers in tm-core
 * Provides common functionality and properties for all AI provider implementations
 */

import {
	IAIProvider,
	AIOptions,
	AIResponse,
	AIModel,
	ProviderInfo,
	ProviderUsageStats
} from '../interfaces/ai-provider.interface.js';
import { APIError } from '../errors/api-error.js';
import { ValidationError } from '../errors/validation-error.js';

/**
 * Configuration interface for BaseProvider
 */
export interface BaseProviderConfig {
	/** API key for the provider */
	apiKey: string;
	/** Optional model ID to use */
	model?: string;
}

/**
 * Abstract base class providing common functionality for all AI providers
 * Implements the IAIProvider interface with shared properties and basic methods
 */
export abstract class BaseProvider implements IAIProvider {
	/** API key for authentication */
	protected apiKey: string;
	/** Current model being used */
	protected model: string;
	/** Maximum number of retry attempts */
	protected maxRetries: number = 3;
	/** Delay between retries in milliseconds */
	protected retryDelay: number = 1000;

	/**
	 * Constructor for BaseProvider
	 * @param config - Configuration object with apiKey and optional model
	 */
	constructor(config: BaseProviderConfig) {
		this.validateApiKey(config.apiKey);
		this.apiKey = config.apiKey;
		this.model = config.model || this.getDefaultModel();
	}

	/**
	 * Get the currently configured model
	 * @returns Current model ID
	 */
	getModel(): string {
		return this.model;
	}

	// Template method for completion generation with built-in retry logic and error handling
	async generateCompletion(
		prompt: string,
		options?: AIOptions
	): Promise<AIResponse> {
		this.validatePrompt(prompt);
		const mergedOptions = this.mergeOptions(options);
		this.validateOptions(mergedOptions);

		return this.retryWithBackoff(async () => {
			const startTime = Date.now();
			this.log('debug', `Starting completion request with prompt length: ${prompt.length}`);
			
			try {
				const response = await this.generateCompletionInternal(prompt, mergedOptions);
				const duration = Date.now() - startTime;
				this.log('debug', `Completion request completed in ${duration}ms`);
				return response;
			} catch (error) {
				const duration = Date.now() - startTime;
				this.log('error', `Completion request failed after ${duration}ms: ${error}`);
				throw error;
			}
		});
	}

	// Abstract methods that concrete providers must implement
	protected abstract generateCompletionInternal(
		prompt: string,
		options?: AIOptions
	): Promise<AIResponse>;
	abstract generateStreamingCompletion(
		prompt: string,
		options?: AIOptions
	): AsyncIterator<Partial<AIResponse>>;
	abstract calculateTokens(text: string, model?: string): number;
	abstract getName(): string;
	abstract setModel(model: string): void;
	abstract getDefaultModel(): string;
	abstract isAvailable(): Promise<boolean>;
	abstract getProviderInfo(): ProviderInfo;
	abstract getAvailableModels(): AIModel[];
	abstract validateCredentials(): Promise<boolean>;
	abstract getUsageStats(): Promise<ProviderUsageStats | null>;
	abstract initialize(): Promise<void>;
	abstract close(): Promise<void>;

	/**
	 * Retry logic with exponential backoff
	 * @param operation - Function to retry
	 * @returns Promise with the operation result
	 */
	protected async retryWithBackoff<T>(operation: () => Promise<T>): Promise<T> {
		let lastError: Error;

		for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
			try {
				return await operation();
			} catch (error) {
				lastError = error as Error;
				
				// Don't retry on client errors (except rate limits)
				if (error instanceof APIError && error.isClientError() && !error.isRateLimitError()) {
					throw error;
				}
				
				// Don't retry if this is the last attempt
				if (attempt === this.maxRetries) {
					break;
				}
				
				// Calculate exponential backoff delay
				const delay = this.retryDelay * Math.pow(2, attempt);
				this.log('debug', `Attempt ${attempt + 1} failed, retrying in ${delay}ms: ${error.message}`);
				
				// Wait before retrying
				await new Promise(resolve => setTimeout(resolve, delay));
			}
		}
		
		throw lastError;
	}

	/**
	 * Validate API key
	 * @param apiKey - API key to validate
	 * @throws ValidationError if API key is invalid
	 */
	protected validateApiKey(apiKey: string): void {
		if (!apiKey || typeof apiKey !== 'string') {
			throw new ValidationError('API key is required and must be a non-empty string', {
				field: 'apiKey',
				value: apiKey,
				expected: 'non-empty string'
			});
		}
		
		if (apiKey.trim().length === 0) {
			throw new ValidationError('API key cannot be empty or only whitespace', {
				field: 'apiKey',
				value: apiKey,
				expected: 'non-empty string'
			});
		}
	}

	/**
	 * Validate prompt input
	 * @param prompt - Prompt to validate
	 * @throws ValidationError if prompt is invalid
	 */
	protected validatePrompt(prompt: string): void {
		if (!prompt || typeof prompt !== 'string') {
			throw new ValidationError('Prompt must be a non-empty string', {
				field: 'prompt',
				value: prompt,
				expected: 'non-empty string'
			});
		}

		if (prompt.trim().length === 0) {
			throw new ValidationError('Prompt cannot be empty or only whitespace', {
				field: 'prompt',
				value: prompt,
				expected: 'non-empty string'
			});
		}
	}

	/**
	 * Validate AI options
	 * @param options - Options to validate
	 * @throws ValidationError if options are invalid
	 */
	protected validateOptions(options: AIOptions): void {
		if (options.temperature !== undefined) {
			if (typeof options.temperature !== 'number' || options.temperature < 0 || options.temperature > 2) {
				throw new ValidationError('Temperature must be a number between 0 and 2', {
					field: 'temperature',
					value: options.temperature,
					expected: 'number between 0 and 2'
				});
			}
		}

		if (options.maxTokens !== undefined) {
			if (typeof options.maxTokens !== 'number' || options.maxTokens <= 0) {
				throw new ValidationError('Max tokens must be a positive number', {
					field: 'maxTokens',
					value: options.maxTokens,
					expected: 'positive number'
				});
			}
		}

		if (options.topP !== undefined) {
			if (typeof options.topP !== 'number' || options.topP < 0 || options.topP > 1) {
				throw new ValidationError('TopP must be a number between 0 and 1', {
					field: 'topP',
					value: options.topP,
					expected: 'number between 0 and 1'
				});
			}
		}

		if (options.frequencyPenalty !== undefined) {
			if (typeof options.frequencyPenalty !== 'number' || options.frequencyPenalty < -2 || options.frequencyPenalty > 2) {
				throw new ValidationError('Frequency penalty must be a number between -2 and 2', {
					field: 'frequencyPenalty',
					value: options.frequencyPenalty,
					expected: 'number between -2 and 2'
				});
			}
		}

		if (options.presencePenalty !== undefined) {
			if (typeof options.presencePenalty !== 'number' || options.presencePenalty < -2 || options.presencePenalty > 2) {
				throw new ValidationError('Presence penalty must be a number between -2 and 2', {
					field: 'presencePenalty',
					value: options.presencePenalty,
					expected: 'number between -2 and 2'
				});
			}
		}
	}

	/**
	 * Merge user options with default options
	 * @param userOptions - User-provided options
	 * @returns Merged options object
	 */
	protected mergeOptions(userOptions?: AIOptions): AIOptions {
		return {
			temperature: 0.7,
			maxTokens: 2000,
			stream: false,
			topP: 1.0,
			frequencyPenalty: 0.0,
			presencePenalty: 0.0,
			timeout: 30000,
			retries: this.maxRetries,
			...userOptions
		};
	}

	/**
	 * Protected logging method that only logs in development mode
	 * @param level - Log level (debug, info, warn, error)
	 * @param message - Message to log
	 * @param data - Optional additional data to log
	 */
	protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any): void {
		if (process.env.NODE_ENV !== 'production') {
			const timestamp = new Date().toISOString();
			const logPrefix = `[${timestamp}] [${this.getName()}] [${level.toUpperCase()}]`;
			
			if (data) {
				console.log(`${logPrefix} ${message}`, data);
			} else {
				console.log(`${logPrefix} ${message}`);
			}
		}
	}
}
