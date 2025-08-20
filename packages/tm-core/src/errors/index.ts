/**
 * @fileoverview Custom error classes for the tm-core package
 * This file exports all custom error types and error handling utilities
 */

// Base error exports
export * from './task-master-error.js';

// Specialized error exports
export * from './file-not-found-error.js';
export * from './parse-error.js';
export * from './validation-error.js';
export * from './api-error.js';

// Future error implementations will be added here
// export * from './task-errors.js';
// export * from './storage-errors.js';
// export * from './provider-errors.js';

// Re-export key types and constants for convenience
export type { ErrorContext, SerializableError } from './task-master-error.js';
export type { ValidationDetails } from './validation-error.js';
export type { APIErrorDetails } from './api-error.js';

// Temporary backward compatibility exports for existing tests
import { TaskMasterError } from './task-master-error.js';

/**
 * @deprecated Backward compatibility alias for TaskMasterError
 */
export class TmCoreError extends TaskMasterError {
	constructor(message: string, context?: any) {
		super(message, context);
		this.name = 'TmCoreError';
	}
}

/**
 * @deprecated Backward compatibility alias for FileNotFoundError
 */
export class TaskNotFoundError extends TaskMasterError {
	constructor(taskId: string, context?: any) {
		super(`Task not found: ${taskId}`, 'TASK_NOT_FOUND', context);
		this.name = 'TaskNotFoundError';
	}
}

// Additional error class for test compatibility
/**
 * @deprecated Storage error class for backward compatibility
 */
export class StorageError extends Error {
	code = 'STORAGE_ERROR';
	constructor(message: string) {
		super(message);
		this.name = 'StorageError';
	}
}
