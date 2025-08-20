/**
 * @fileoverview Main entry point for the tm-core package
 * This file exports all public APIs from the core Task Master library
 */

// Re-export types
export type * from './types/index.js';

// Re-export interfaces
export type * from './interfaces/index.js';
export * from './interfaces/index.js';

// Re-export providers
export * from './providers/index.js';

// Re-export storage
export * from './storage/index.js';

// Re-export parser
export * from './parser/index.js';

// Re-export utilities
export * from './utils/index.js';

// Re-export errors
export * from './errors/index.js';

// Re-export config
export * from './config/index.js';

// Package metadata
export const version = '1.0.0';
export const name = '@task-master/tm-core';
