/**
 * @fileoverview AI provider implementations for the tm-core package
 * This file exports all AI provider classes and interfaces
 */

// Provider interfaces and implementations
export * from './base-provider.js';
// export * from './anthropic-provider.js';
// export * from './openai-provider.js';
// export * from './perplexity-provider.js';

// Temporary backward compatibility exports for existing tests
/**
 * @deprecated This is a placeholder class for backward compatibility with existing tests
 */
export class PlaceholderProvider {
	name = 'placeholder';

	async generateResponse(prompt: string): Promise<string> {
		return `Placeholder response for: ${prompt}`;
	}
}
