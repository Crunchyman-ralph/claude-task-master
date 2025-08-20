/**
 * @fileoverview Storage interface definitions for the tm-core package
 * This file re-exports storage interfaces from the storage module for convenience
 * The actual definitions are in ../storage/storage.interface.js
 */

// Re-export storage interfaces from the storage module
export type { 
	IStorage,
	StorageStats,
	StorageConfig
} from '../storage/storage.interface.js';

export { 
	BaseStorage
} from '../storage/storage.interface.js';
