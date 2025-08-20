/**
 * @fileoverview Utility functions for the tm-core package
 * This file exports all utility functions and helper classes
 */

// Utility implementations
export * from './id-generator.js';

// Temporary backward compatibility exports for existing tests
/**
 * Formats a date for task timestamps
 * @deprecated This is a placeholder function for backward compatibility
 */
export function formatDate(date: Date = new Date()): string {
	return date.toISOString();
}
