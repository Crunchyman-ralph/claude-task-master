/**
 * @fileoverview Storage layer for the tm-core package
 * This file exports all storage-related classes and interfaces
 */

// Storage implementations
export * from './file-storage.js';
export * from './storage.interface.js';

// Temporary backward compatibility exports for existing tests
/**
 * @deprecated This is a placeholder class for backward compatibility with existing tests
 */
export class PlaceholderStorage {
	private data = new Map<string, string>();

	async read(path: string): Promise<string | null> {
		return this.data.get(path) || null;
	}

	async write(path: string, data: string): Promise<void> {
		this.data.set(path, data);
	}

	async exists(path: string): Promise<boolean> {
		return this.data.has(path);
	}

	async delete(path: string): Promise<void> {
		this.data.delete(path);
	}
}
