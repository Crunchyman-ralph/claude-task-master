/**
 * @fileoverview File not found error class
 * Specialized error for when files or resources cannot be located
 */

import { TaskMasterError, ERROR_CODES, type ErrorContext } from './task-master-error.js';

/**
 * Error thrown when a file or resource cannot be found
 * 
 * Provides specialized handling for file system operations with:
 * - File path information
 * - Operation context
 * - User-friendly error messages
 * 
 * @example
 * ```typescript
 * throw new FileNotFoundError('/path/to/missing/file.json', {
 *   operation: 'loadTasksFile',
 *   userMessage: 'The tasks file could not be found'
 * });
 * ```
 */
export class FileNotFoundError extends TaskMasterError {
	/** The file path that could not be found */
	public readonly filePath: string;

	/**
	 * Create a new FileNotFoundError
	 * 
	 * @param filePath - The file path that could not be found
	 * @param context - Additional error context
	 * @param cause - Original error that caused this error
	 */
	constructor(
		filePath: string,
		context: ErrorContext = {},
		cause?: Error
	) {
		const message = `File not found: ${filePath}`;
		
		super(
			message,
			ERROR_CODES.FILE_NOT_FOUND,
			{
				resource: filePath,
				userMessage: context.userMessage || `The file "${filePath}" could not be found`,
				...context
			},
			cause
		);

		this.name = 'FileNotFoundError';
		this.filePath = filePath;

		// Fix prototype chain for proper instanceof checks
		Object.setPrototypeOf(this, FileNotFoundError.prototype);
	}

	/**
	 * Create a FileNotFoundError for a specific operation
	 */
	static forOperation(
		filePath: string,
		operation: string,
		cause?: Error
	): FileNotFoundError {
		return new FileNotFoundError(
			filePath,
			{
				operation,
				userMessage: `Could not find the required file for ${operation}`
			},
			cause
		);
	}

	/**
	 * Create a FileNotFoundError for a tasks file
	 */
	static forTasksFile(filePath: string, cause?: Error): FileNotFoundError {
		return new FileNotFoundError(
			filePath,
			{
				operation: 'loadTasksFile',
				userMessage: 'The tasks file could not be found. Please check the file path and try again.'
			},
			cause
		);
	}

	/**
	 * Create a FileNotFoundError for a configuration file
	 */
	static forConfigFile(filePath: string, cause?: Error): FileNotFoundError {
		return new FileNotFoundError(
			filePath,
			{
				operation: 'loadConfigFile',
				userMessage: 'The configuration file could not be found. Please check your setup.'
			},
			cause
		);
	}
}