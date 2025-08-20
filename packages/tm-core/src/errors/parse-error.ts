/**
 * @fileoverview Parse error class
 * Specialized error for when data parsing operations fail
 */

import { TaskMasterError, ERROR_CODES, type ErrorContext } from './task-master-error.js';

/**
 * Error thrown when parsing operations fail
 * 
 * Provides specialized handling for data parsing with:
 * - File/data source information
 * - Parsing context (line numbers, format type)
 * - User-friendly error messages
 * - Support for different data formats (JSON, YAML, etc.)
 * 
 * @example
 * ```typescript
 * throw new ParseError('Invalid JSON syntax', 'tasks.json', {
 *   details: { line: 42, column: 15 },
 *   operation: 'parseTasksFile',
 *   userMessage: 'There was an error in your tasks file'
 * });
 * ```
 */
export class ParseError extends TaskMasterError {
	/** The source being parsed (file path, data description, etc.) */
	public readonly source: string;

	/** The format being parsed (json, yaml, xml, etc.) */
	public readonly format?: string;

	/**
	 * Create a new ParseError
	 * 
	 * @param message - Detailed error message about the parsing failure
	 * @param source - The source being parsed (file path, data description, etc.)
	 * @param context - Additional error context including parsing details
	 * @param cause - Original error that caused this error
	 */
	constructor(
		message: string,
		source: string,
		context: ErrorContext & { format?: string } = {},
		cause?: Error
	) {
		const { format, ...errorContext } = context;
		
		super(
			message,
			ERROR_CODES.PARSE_ERROR,
			{
				resource: source,
				userMessage: context.userMessage || `Failed to parse ${source}${format ? ` as ${format.toUpperCase()}` : ''}`,
				...errorContext
			},
			cause
		);

		this.name = 'ParseError';
		this.source = source;
		this.format = format;

		// Fix prototype chain for proper instanceof checks
		Object.setPrototypeOf(this, ParseError.prototype);
	}

	/**
	 * Create a ParseError for JSON parsing
	 */
	static forJSON(
		source: string,
		details?: { line?: number; column?: number },
		cause?: Error
	): ParseError {
		return new ParseError(
			`Invalid JSON syntax in ${source}`,
			source,
			{
				format: 'json',
				details,
				operation: 'parseJSON',
				userMessage: `The JSON file "${source}" contains syntax errors. Please check the file format.`
			},
			cause
		);
	}

	/**
	 * Create a ParseError for YAML parsing
	 */
	static forYAML(
		source: string,
		details?: { line?: number; column?: number },
		cause?: Error
	): ParseError {
		return new ParseError(
			`Invalid YAML syntax in ${source}`,
			source,
			{
				format: 'yaml',
				details,
				operation: 'parseYAML',
				userMessage: `The YAML file "${source}" contains syntax errors. Please check the file format.`
			},
			cause
		);
	}

	/**
	 * Create a ParseError for task data parsing
	 */
	static forTaskData(
		source: string,
		details?: { taskId?: string; field?: string },
		cause?: Error
	): ParseError {
		return new ParseError(
			`Invalid task data structure in ${source}`,
			source,
			{
				format: 'task-data',
				details,
				operation: 'parseTaskData',
				userMessage: `The task data in "${source}" is not properly formatted. Please check the structure.`
			},
			cause
		);
	}

	/**
	 * Create a ParseError for PRD parsing
	 */
	static forPRD(
		source: string,
		details?: { section?: string; line?: number },
		cause?: Error
	): ParseError {
		return new ParseError(
			`Failed to parse PRD content in ${source}`,
			source,
			{
				format: 'prd',
				details,
				operation: 'parsePRD',
				userMessage: `The PRD document "${source}" could not be parsed. Please check the document format.`
			},
			cause
		);
	}

	/**
	 * Create a generic ParseError for any data format
	 */
	static forFormat(
		source: string,
		format: string,
		details?: any,
		cause?: Error
	): ParseError {
		return new ParseError(
			`Failed to parse ${format.toUpperCase()} data in ${source}`,
			source,
			{
				format,
				details,
				operation: `parse${format.toUpperCase()}`,
				userMessage: `The ${format.toUpperCase()} data in "${source}" could not be parsed. Please check the format.`
			},
			cause
		);
	}
}