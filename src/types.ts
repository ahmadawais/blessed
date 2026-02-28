/**
 * types.ts — core type definitions for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * Copyright (c) 2024, Ahmad Awais (MIT License).
 */

// Branded type helper for type-safe IDs
export type Brand<T, B extends string> = T & { readonly __brand: B };

// Color types
export type ColorIndex = number;
export type HexColor = `#${string}`;
export type RGB = readonly [r: number, g: number, b: number];

export interface ColorMatch {
	readonly index: ColorIndex;
	readonly distance: number;
}

export interface ColorPalette {
	readonly colors: readonly string[];
	readonly vcolors: readonly RGB[];
}

// Key event types
export interface KeyEvent {
	readonly sequence: string;
	readonly name: string | undefined;
	readonly ctrl: boolean;
	readonly meta: boolean;
	readonly shift: boolean;
	readonly code?: string;
}

// Event emitter types (functional)
export type EventListener = (...args: readonly unknown[]) => unknown;

export interface EventMap {
	readonly [event: string]: EventListener | readonly EventListener[] | undefined;
}

export interface EventEmitterState {
	events: Record<string, EventListener | EventListener[]>;
	maxListeners: number;
}

// Style types
export interface StyleTag {
	readonly open: string;
	readonly close: string;
}

export interface SortableByName {
	readonly name: string;
}

export interface SortableByIndex {
	readonly index: number;
}

// Color name lookup
export interface ColorNames {
	readonly [name: string]: number | undefined;
}

// Unicode character width info
export type CharWidthCategory = 'narrow' | 'wide' | 'combining' | 'control';

export interface CharInfo {
	readonly codePoint: number;
	readonly width: number;
	readonly category: CharWidthCategory;
}
