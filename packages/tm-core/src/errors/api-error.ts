/**
 * @fileoverview API error class
 * Specialized error for when API operations fail
 */

import { TaskMasterError, ERROR_CODES, type ErrorContext } from './task-master-error.js';

/**
 * API error details interface
 */
export interface APIErrorDetails {
	/** HTTP status code */
	statusCode?: number;
	/** Response body or error data */
	response?: any;
	/** Request URL */
	url?: string;
	/** HTTP method */
	method?: string;
	/** Request headers */
	headers?: Record<string, string>;
	/** Request body */
	requestBody?: any;
	/** API endpoint name */
	endpoint?: string;
	/** Rate limit information */
	rateLimit?: {
		limit: number;
		remaining: number;
		resetTime: Date;
	};
	/** Retry information */
	retryInfo?: {
		attempt: number;
		maxRetries: number;
		nextRetryAt?: Date;
	};
}

/**
 * Error thrown when API operations fail
 * 
 * Provides specialized handling for API failures with:
 * - HTTP status code information
 * - Request/response context
 * - Rate limiting information
 * - Retry logic support
 * - Authentication and authorization context
 * 
 * @example
 * ```typescript
 * throw new APIError('API request failed', {
 *   statusCode: 404,
 *   url: 'https://api.example.com/tasks/123',
 *   method: 'GET',
 *   response: { error: 'Not Found' }
 * });
 * ```
 */
export class APIError extends TaskMasterError {
	/** Detailed API error information */
	public readonly apiDetails: APIErrorDetails;

	/**
	 * Create a new APIError
	 * 
	 * @param message - Human-readable API error message
	 * @param apiDetails - Detailed API error information
	 * @param context - Additional error context
	 * @param cause - Original error that caused this error
	 */
	constructor(
		message: string,
		apiDetails: APIErrorDetails = {},
		context: ErrorContext = {},
		cause?: Error
	) {
		super(
			message,
			ERROR_CODES.API_ERROR,
			{
				details: apiDetails,
				resource: apiDetails.url || apiDetails.endpoint,
				operation: context.operation || APIError.getOperationName(apiDetails.method, apiDetails.endpoint),
				userMessage: context.userMessage || APIError.formatUserMessage(apiDetails),
				...context
			},
			cause
		);

		this.name = 'APIError';
		this.apiDetails = apiDetails;

		// Fix prototype chain for proper instanceof checks
		Object.setPrototypeOf(this, APIError.prototype);
	}

	/**
	 * Get operation name from method and endpoint
	 */
	private static getOperationName(method?: string, endpoint?: string): string {
		if (method && endpoint) {
			return `${method.toUpperCase()} ${endpoint}`;
		}
		if (method) {
			return `HTTP ${method.toUpperCase()}`;
		}
		return 'API request';
	}

	/**
	 * Format a user-friendly API error message
	 */
	private static formatUserMessage(details: APIErrorDetails): string {
		if (details.statusCode) {
			switch (details.statusCode) {
				case 400:
					return 'The request was invalid. Please check your input and try again.';
				case 401:
					return 'Authentication failed. Please check your credentials.';
				case 403:
					return 'You do not have permission to access this resource.';
				case 404:
					return 'The requested resource was not found.';
				case 429:
					return 'Too many requests. Please wait before trying again.';
				case 500:
				case 502:
				case 503:
				case 504:
					return 'The service is temporarily unavailable. Please try again later.';
				default:
					return `API request failed with status ${details.statusCode}`;
			}
		}
		return 'API request failed. Please try again.';
	}

	/**
	 * Check if this is a client error (4xx status code)
	 */
	public isClientError(): boolean {
		return this.apiDetails.statusCode ? this.apiDetails.statusCode >= 400 && this.apiDetails.statusCode < 500 : false;
	}

	/**
	 * Check if this is a server error (5xx status code)
	 */
	public isServerError(): boolean {
		return this.apiDetails.statusCode ? this.apiDetails.statusCode >= 500 && this.apiDetails.statusCode < 600 : false;
	}

	/**
	 * Check if this is a rate limit error
	 */
	public isRateLimitError(): boolean {
		return this.apiDetails.statusCode === 429;
	}

	/**
	 * Check if the request can be retried
	 */
	public isRetryable(): boolean {
		// Retry server errors and rate limit errors, but not client errors (except rate limits)
		if (this.isRateLimitError()) return true;
		if (this.isServerError()) return true;
		return false;
	}

	/**
	 * Create an APIError for authentication failure
	 */
	static forAuthentication(
		endpoint?: string,
		details?: Partial<APIErrorDetails>,
		context: ErrorContext = {}
	): APIError {
		return new APIError(
			'Authentication failed',
			{
				statusCode: 401,
				endpoint,
				...details
			},
			{
				operation: 'authenticate',
				userMessage: 'Authentication failed. Please check your API credentials.',
				...context
			}
		);
	}

	/**
	 * Create an APIError for authorization failure
	 */
	static forAuthorization(
		endpoint?: string,
		details?: Partial<APIErrorDetails>,
		context: ErrorContext = {}
	): APIError {
		return new APIError(
			'Authorization failed',
			{
				statusCode: 403,
				endpoint,
				...details
			},
			{
				operation: 'authorize',
				userMessage: 'You do not have permission to perform this action.',
				...context
			}
		);
	}

	/**
	 * Create an APIError for rate limiting
	 */
	static forRateLimit(
		endpoint?: string,
		rateLimit?: APIErrorDetails['rateLimit'],
		context: ErrorContext = {}
	): APIError {
		const resetTime = rateLimit?.resetTime;
		const waitTime = resetTime ? Math.ceil((resetTime.getTime() - Date.now()) / 1000) : undefined;
		
		return new APIError(
			'Rate limit exceeded',
			{
				statusCode: 429,
				endpoint,
				rateLimit
			},
			{
				operation: 'rateLimitCheck',
				userMessage: waitTime 
					? `Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`
					: 'Rate limit exceeded. Please wait before trying again.',
				...context
			}
		);
	}

	/**
	 * Create an APIError for network failure
	 */
	static forNetwork(
		endpoint?: string,
		cause?: Error,
		context: ErrorContext = {}
	): APIError {
		return new APIError(
			'Network request failed',
			{
				endpoint
			},
			{
				operation: 'networkRequest',
				userMessage: 'Network request failed. Please check your internet connection and try again.',
				...context
			},
			cause
		);
	}

	/**
	 * Create an APIError for timeout
	 */
	static forTimeout(
		endpoint?: string,
		timeout?: number,
		context: ErrorContext = {}
	): APIError {
		return new APIError(
			'Request timeout',
			{
				endpoint,
				response: { timeout }
			},
			{
				operation: 'timeoutCheck',
				userMessage: timeout 
					? `Request timed out after ${timeout}ms. Please try again.`
					: 'Request timed out. Please try again.',
				...context
			}
		);
	}

	/**
	 * Create an APIError for server error
	 */
	static forServerError(
		statusCode: number,
		endpoint?: string,
		response?: any,
		context: ErrorContext = {}
	): APIError {
		return new APIError(
			`Server error ${statusCode}`,
			{
				statusCode,
				endpoint,
				response
			},
			{
				operation: 'serverRequest',
				...context
			}
		);
	}

	/**
	 * Create an APIError from an HTTP response
	 */
	static fromResponse(
		response: {
			status: number;
			statusText?: string;
			url?: string;
			data?: any;
			headers?: Record<string, string>;
		},
		request?: {
			method?: string;
			url?: string;
			headers?: Record<string, string>;
			body?: any;
		},
		context: ErrorContext = {}
	): APIError {
		return new APIError(
			`HTTP ${response.status} ${response.statusText || 'Error'}`,
			{
				statusCode: response.status,
				url: response.url || request?.url,
				method: request?.method,
				response: response.data,
				headers: response.headers,
				requestBody: request?.body
			},
			context
		);
	}
}