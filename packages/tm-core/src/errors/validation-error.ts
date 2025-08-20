/**
 * @fileoverview Validation error class
 * Specialized error for when data validation fails
 */

import { TaskMasterError, ERROR_CODES, type ErrorContext } from './task-master-error.js';

/**
 * Validation error details interface
 */
export interface ValidationDetails {
	/** The field that failed validation */
	field?: string;
	/** The invalid value */
	value?: any;
	/** Expected value or format */
	expected?: any;
	/** Validation rule that failed */
	rule?: string;
	/** Schema path for nested validation */
	path?: string;
	/** Multiple validation errors for complex objects */
	errors?: ValidationDetails[];
}

/**
 * Error thrown when data validation fails
 * 
 * Provides specialized handling for validation failures with:
 * - Field-specific validation information
 * - Multiple error support for complex objects
 * - Schema validation context
 * - User-friendly error messages
 * 
 * @example
 * ```typescript
 * throw new ValidationError('Task validation failed', {
 *   field: 'status',
 *   value: 'invalid-status',
 *   expected: ['pending', 'in-progress', 'completed'],
 *   rule: 'enum'
 * });
 * ```
 */
export class ValidationError extends TaskMasterError {
	/** Detailed validation information */
	public readonly validationDetails: ValidationDetails;

	/**
	 * Create a new ValidationError
	 * 
	 * @param message - Human-readable validation error message
	 * @param validationDetails - Detailed validation information
	 * @param context - Additional error context
	 * @param cause - Original error that caused this error
	 */
	constructor(
		message: string,
		validationDetails: ValidationDetails = {},
		context: ErrorContext = {},
		cause?: Error
	) {
		super(
			message,
			ERROR_CODES.VALIDATION_ERROR,
			{
				details: validationDetails,
				userMessage: context.userMessage || ValidationError.formatUserMessage(validationDetails),
				...context
			},
			cause
		);

		this.name = 'ValidationError';
		this.validationDetails = validationDetails;

		// Fix prototype chain for proper instanceof checks
		Object.setPrototypeOf(this, ValidationError.prototype);
	}

	/**
	 * Format a user-friendly validation error message
	 */
	private static formatUserMessage(details: ValidationDetails): string {
		if (details.field && details.expected) {
			if (Array.isArray(details.expected)) {
				return `The field "${details.field}" must be one of: ${details.expected.join(', ')}`;
			} else {
				return `The field "${details.field}" must be ${details.expected}`;
			}
		}
		
		if (details.field) {
			return `The field "${details.field}" is invalid`;
		}

		return 'The provided data failed validation';
	}

	/**
	 * Create a ValidationError for a required field
	 */
	static forRequiredField(fieldName: string, context: ErrorContext = {}): ValidationError {
		return new ValidationError(
			`Required field "${fieldName}" is missing`,
			{
				field: fieldName,
				rule: 'required'
			},
			{
				operation: 'validateRequired',
				userMessage: `The field "${fieldName}" is required`,
				...context
			}
		);
	}

	/**
	 * Create a ValidationError for invalid enum value
	 */
	static forInvalidEnum(
		fieldName: string,
		value: any,
		allowedValues: any[],
		context: ErrorContext = {}
	): ValidationError {
		return new ValidationError(
			`Invalid value "${value}" for field "${fieldName}"`,
			{
				field: fieldName,
				value,
				expected: allowedValues,
				rule: 'enum'
			},
			{
				operation: 'validateEnum',
				...context
			}
		);
	}

	/**
	 * Create a ValidationError for invalid type
	 */
	static forInvalidType(
		fieldName: string,
		value: any,
		expectedType: string,
		context: ErrorContext = {}
	): ValidationError {
		const actualType = value === null ? 'null' : typeof value;
		
		return new ValidationError(
			`Invalid type for field "${fieldName}": expected ${expectedType}, got ${actualType}`,
			{
				field: fieldName,
				value,
				expected: expectedType,
				rule: 'type'
			},
			{
				operation: 'validateType',
				userMessage: `The field "${fieldName}" must be a ${expectedType}`,
				...context
			}
		);
	}

	/**
	 * Create a ValidationError for schema validation
	 */
	static forSchema(
		schema: string,
		errors: ValidationDetails[],
		context: ErrorContext = {}
	): ValidationError {
		const errorCount = errors.length;
		const message = `Schema validation failed for ${schema} (${errorCount} error${errorCount !== 1 ? 's' : ''})`;
		
		return new ValidationError(
			message,
			{
				rule: 'schema',
				errors
			},
			{
				operation: 'validateSchema',
				userMessage: `The data does not match the expected ${schema} format`,
				...context
			}
		);
	}

	/**
	 * Create a ValidationError for task validation
	 */
	static forTask(
		taskId: string,
		fieldName: string,
		value: any,
		expectedType: string,
		context: ErrorContext = {}
	): ValidationError {
		return new ValidationError(
			`Task ${taskId} validation failed: invalid ${fieldName}`,
			{
				field: fieldName,
				value,
				expected: expectedType,
				rule: 'task-field'
			},
			{
				resource: `task:${taskId}`,
				operation: 'validateTask',
				userMessage: `Task ${taskId} has an invalid ${fieldName}`,
				...context
			}
		);
	}

	/**
	 * Create a ValidationError for task status validation
	 */
	static forTaskStatus(
		taskId: string,
		status: string,
		allowedStatuses: string[],
		context: ErrorContext = {}
	): ValidationError {
		return new ValidationError(
			`Invalid status "${status}" for task ${taskId}`,
			{
				field: 'status',
				value: status,
				expected: allowedStatuses,
				rule: 'task-status'
			},
			{
				resource: `task:${taskId}`,
				operation: 'validateTaskStatus',
				userMessage: `Task status "${status}" is not valid. Allowed statuses are: ${allowedStatuses.join(', ')}`,
				...context
			}
		);
	}

	/**
	 * Create a ValidationError for task dependencies
	 */
	static forTaskDependency(
		taskId: string,
		dependencyId: string,
		reason: string,
		context: ErrorContext = {}
	): ValidationError {
		return new ValidationError(
			`Invalid dependency for task ${taskId}: ${dependencyId} (${reason})`,
			{
				field: 'dependencies',
				value: dependencyId,
				rule: 'dependency'
			},
			{
				resource: `task:${taskId}`,
				operation: 'validateTaskDependencies',
				userMessage: `Task ${taskId} has an invalid dependency: ${reason}`,
				...context
			}
		);
	}
}