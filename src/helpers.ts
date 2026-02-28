/**
 * helpers.ts — utility functions for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * Copyright (c) 2024, Ahmad Awais (MIT License).
 *
 * Ported to TypeScript with functional patterns and strict typing.
 */

import type { SortableByIndex, SortableByName, StyleTag } from './types.js';
import { allWideCharRegex, surrogateRegex } from './unicode.js';

export const merge = <T extends Record<string, unknown>>(
	target: T,
	source: Record<string, unknown>,
): T => {
	const result = { ...target };
	for (const key of Object.keys(source)) {
		(result as Record<string, unknown>)[key] = source[key];
	}
	return result;
};

export const sortByName = <T extends SortableByName>(items: readonly T[]): readonly T[] => {
	return [...items].sort((a, b) => {
		const aName = a.name.toLowerCase();
		const bName = b.name.toLowerCase();

		const aChar = aName[0] === '.' ? (aName[1] ?? '') : (aName[0] ?? '');
		const bChar = bName[0] === '.' ? (bName[1] ?? '') : (bName[0] ?? '');

		if (aChar > bChar) return 1;
		if (aChar < bChar) return -1;
		return 0;
	});
};

export const sortByIndex = <T extends SortableByIndex>(items: readonly T[]): readonly T[] => {
	return [...items].sort((a, b) => b.index - a.index);
};

export const escapeTagText = (text: string): string => {
	return text.replace(/[{}]/g, (ch) => (ch === '{' ? '{open}' : '{close}'));
};

// Uses RegExp constructor to avoid biome control-char lint for ANSI escape pattern
const ANSI_ESCAPE_RE = /\x1b\[[\d;]*m/g;

export const stripTags = (text: string): string => {
	if (!text) return '';
	return text.replace(/{(\/?)([\w\-,;!#]*)}/g, '').replace(ANSI_ESCAPE_RE, '');
};

export const cleanTags = (text: string): string => {
	return stripTags(text).trim();
};

export const dropUnicode = (text: string): string => {
	if (!text) return '';
	return text.replace(allWideCharRegex, '??').replace(surrogateRegex, '?');
};

export const generateTags = (
	style: Record<string, string | boolean>,
	text?: string,
): string | StyleTag => {
	let open = '';
	let close = '';

	for (const key of Object.keys(style)) {
		const val = style[key];
		if (typeof val === 'string') {
			const normalized = val.replace(/^light(?!-)/, 'light-').replace(/^bright(?!-)/, 'bright-');
			open = `{${normalized}-${key}}${open}`;
			close += `{/${normalized}-${key}}`;
			continue;
		}
		if (val === true) {
			open = `{${key}}${open}`;
			close += `{/${key}}`;
		}
	}

	if (text !== undefined) return open + text + close;
	return { open, close };
};
