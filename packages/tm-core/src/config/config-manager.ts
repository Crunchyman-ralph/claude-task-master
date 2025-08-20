/**
 * @fileoverview ConfigManager class for managing and validating configuration
 * Provides type-safe configuration management with Zod validation
 */

import type { IConfiguration } from '../interfaces/configuration.interface.js';
import { configurationSchema } from './validation.js';
import { ValidationError } from '../errors/validation-error.js';

/**
 * ConfigManager class for handling configuration management
 * 
 * Provides:
 * - Type-safe configuration access
 * - Zod schema validation
 * - Default value handling
 * - Clear error messages for validation failures
 */
export class ConfigManager {
	/** Internal validated configuration object */
	private config: IConfiguration;

	/**
	 * Create a new ConfigManager instance
	 * 
	 * @param partialConfig - Partial configuration object to merge with defaults
	 */
	constructor(partialConfig: Partial<IConfiguration> = {}) {
		// Create complete configuration with defaults
		const configWithDefaults: any = {
			projectPath: partialConfig.projectPath ?? process.cwd(),
			aiProvider: partialConfig.aiProvider ?? 'anthropic',
			apiKeys: partialConfig.apiKeys ?? {},
			models: {
				main: 'claude-3-5-sonnet-20241022',
				fallback: 'gpt-4o-mini',
				...partialConfig.models
			},
			providers: partialConfig.providers ?? {},
			tasks: {
				defaultPriority: 'medium',
				defaultComplexity: 'moderate',
				maxSubtasks: 20,
				maxConcurrentTasks: 5,
				autoGenerateIds: true,
				validateDependencies: true,
				enableTimestamps: true,
				enableEffortTracking: false,
				...partialConfig.tasks
			},
			tags: {
				enableTags: partialConfig.tags?.enableTags ?? true,
				defaultTag: 'master',
				maxTagsPerTask: 10,
				autoCreateFromBranch: false,
				tagNamingConvention: 'kebab-case',
				...partialConfig.tags
			},
			storage: {
				type: 'file',
				enableBackup: true,
				maxBackups: 5,
				enableCompression: false,
				encoding: 'utf8',
				atomicOperations: true,
				...partialConfig.storage
			},
			retry: {
				retryAttempts: 3,
				retryDelay: 1000,
				maxRetryDelay: 30000,
				backoffMultiplier: 2,
				requestTimeout: 30000,
				retryOnNetworkError: true,
				retryOnRateLimit: true,
				...partialConfig.retry
			},
			logging: {
				enabled: true,
				level: 'info',
				logRequests: false,
				logPerformance: false,
				logStackTraces: true,
				maxFileSize: 10,
				maxFiles: 5,
				...partialConfig.logging
			},
			security: {
				validateApiKeys: true,
				enableRateLimit: true,
				maxRequestsPerMinute: 60,
				sanitizeInputs: true,
				maxPromptLength: 100000,
				allowedFileExtensions: ['.txt', '.md', '.json'],
				enableCors: false,
				...partialConfig.security
			},
			custom: partialConfig.custom,
			version: partialConfig.version ?? '1.0.0',
			lastUpdated: partialConfig.lastUpdated ?? new Date().toISOString()
		};

		// Validate and store the configuration
		this.config = this.validate(configWithDefaults as IConfiguration);
	}

	/**
	 * Validate configuration using Zod schema
	 * 
	 * @param config - Configuration object to validate
	 * @returns Validated configuration object
	 * @throws ValidationError when validation fails
	 */
	validate(config: any): IConfiguration {
		try {
			// Use Zod schema to validate and transform the configuration
			return configurationSchema.parse(config);
		} catch (error: any) {
			// Transform Zod error into our ValidationError format
			if (error.issues) {
				const validationErrors = error.issues.map((issue: any) => ({
					field: issue.path.join('.'),
					value: issue.received,
					expected: issue.expected,
					rule: issue.code,
					path: issue.path.join('.')
				}));

				throw ValidationError.forSchema('IConfiguration', validationErrors, {
					operation: 'validateConfiguration',
					userMessage: 'Configuration validation failed. Please check your configuration values.'
				});
			}

			// If it's not a Zod error, wrap it in a ValidationError
			throw new ValidationError(
				'Configuration validation failed',
				{
					rule: 'schema-validation'
				},
				{
					operation: 'validateConfiguration',
					userMessage: 'The provided configuration is invalid'
				},
				error
			);
		}
	}

	/**
	 * Get a configuration value by key with full type safety
	 * 
	 * @template K - Key of IConfiguration interface
	 * @param key - Configuration key to retrieve
	 * @returns Typed configuration value
	 */
	get<K extends keyof IConfiguration>(key: K): IConfiguration[K] {
		return this.config[key];
	}

	/**
	 * Get the full validated configuration object
	 * 
	 * @returns Complete configuration object
	 */
	getAll(): IConfiguration {
		return { ...this.config };
	}
}