/**
 * colors.ts — color-related functions for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * Copyright (c) 2024, Ahmad Awais (MIT License).
 *
 * Ported to TypeScript with functional patterns, strict typing, and immutable data.
 */

import type { ColorIndex, ColorNames, HexColor, RGB } from './types.js';

// XTerm base 16 colors
const XTERM_BASE: readonly string[] = [
	'#000000',
	'#cd0000',
	'#00cd00',
	'#cdcd00',
	'#0000ee',
	'#cd00cd',
	'#00cdcd',
	'#e5e5e5',
	'#7f7f7f',
	'#ff0000',
	'#00ff00',
	'#ffff00',
	'#5c5cff',
	'#ff00ff',
	'#00ffff',
	'#ffffff',
] as const;

const toHexByte = (n: number): string => {
	const h = n.toString(16);
	return h.length < 2 ? `0${h}` : h;
};

// Generate all 256 xterm colors
const generateColors = (): { colors: readonly string[]; vcolors: readonly RGB[] } => {
	const colors: string[] = [];
	const vcolors: [number, number, number][] = [];

	const push = (i: number, r: number, g: number, b: number): void => {
		colors[i] = `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`;
		vcolors[i] = [r, g, b];
	};

	// 0 - 15: base xterm colors
	for (let i = 0; i < XTERM_BASE.length; i++) {
		const hex = XTERM_BASE[i];
		if (!hex) continue;
		const c = Number.parseInt(hex.substring(1), 16);
		push(i, (c >> 16) & 0xff, (c >> 8) & 0xff, c & 0xff);
	}

	// 16 - 231: 6x6x6 color cube
	for (let r = 0; r < 6; r++) {
		for (let g = 0; g < 6; g++) {
			for (let b = 0; b < 6; b++) {
				const i = 16 + r * 36 + g * 6 + b;
				push(i, r ? r * 40 + 55 : 0, g ? g * 40 + 55 : 0, b ? b * 40 + 55 : 0);
			}
		}
	}

	// 232 - 255: greyscale ramp
	for (let g = 0; g < 24; g++) {
		const l = g * 10 + 8;
		push(232 + g, l, l, l);
	}

	return { colors, vcolors };
};

const { colors: COLORS, vcolors: VCOLORS } = generateColors();

// Color distance using weighted Euclidean
const colorDistance = (
	r1: number,
	g1: number,
	b1: number,
	r2: number,
	g2: number,
	b2: number,
): number => (30 * (r1 - r2)) ** 2 + (59 * (g1 - g2)) ** 2 + (11 * (b1 - b2)) ** 2;

// Module-level cache for color matching
const matchCache = new Map<number, ColorIndex>();

const HEX_3_RE = /^#[0-9a-fA-F]{3}$/;
const HEX_6_RE = /^#[0-9a-fA-F]{6}$/;

const isValidHex = (hex: string): boolean => HEX_3_RE.test(hex) || HEX_6_RE.test(hex);

export const hexToRGB = (hex: string): RGB | undefined => {
	if (!isValidHex(hex)) return undefined;
	let h = hex;
	if (h.length === 4) {
		const c1 = h[1] ?? '0';
		const c2 = h[2] ?? '0';
		const c3 = h[3] ?? '0';
		h = `#${c1}${c1}${c2}${c2}${c3}${c3}`;
	}
	const col = Number.parseInt(h.substring(1), 16);
	return [(col >> 16) & 0xff, (col >> 8) & 0xff, col & 0xff];
};

export const rgbToHex = (r: number, g: number, b: number): HexColor =>
	`#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}` as HexColor;

export const rgbArrayToHex = (rgb: RGB): HexColor => rgbToHex(rgb[0], rgb[1], rgb[2]);

export const match = (input: string | RGB | readonly [number, number, number]): ColorIndex => {
	let r1: number;
	let g1: number;
	let b1: number;

	if (typeof input === 'string') {
		if (input[0] !== '#') return -1;
		const rgb = hexToRGB(input);
		if (!rgb) return -1;
		r1 = rgb[0];
		g1 = rgb[1];
		b1 = rgb[2];
	} else {
		r1 = input[0];
		g1 = input[1];
		b1 = input[2];
	}

	const hash = (r1 << 16) | (g1 << 8) | b1;
	const cached = matchCache.get(hash);
	if (cached !== undefined) return cached;

	let bestDistance = Number.POSITIVE_INFINITY;
	let bestIndex = -1;

	for (let i = 0; i < VCOLORS.length; i++) {
		const c = VCOLORS[i];
		if (!c) continue;

		const dist = colorDistance(r1, g1, b1, c[0], c[1], c[2]);
		if (dist === 0) {
			bestIndex = i;
			break;
		}
		if (dist < bestDistance) {
			bestDistance = dist;
			bestIndex = i;
		}
	}

	matchCache.set(hash, bestIndex);
	return bestIndex;
};

export const mixColors = (c1Index: ColorIndex, c2Index: ColorIndex, alpha = 0.5): ColorIndex => {
	const idx1 = c1Index === 0x1ff ? 0 : c1Index;
	const idx2 = c2Index === 0x1ff ? 0 : c2Index;

	const color1 = VCOLORS[idx1];
	const color2 = VCOLORS[idx2];
	if (!color1 || !color2) return 0;

	const r = (color1[0] + (color2[0] - color1[0]) * alpha) | 0;
	const g = (color1[1] + (color2[1] - color1[1]) * alpha) | 0;
	const b = (color1[2] + (color2[2] - color1[2]) * alpha) | 0;

	return match([r, g, b]);
};

export const reduce = (color: ColorIndex, total: number): ColorIndex => {
	if (color >= 16 && total <= 16) {
		return ccolors[color] ?? color;
	}
	if (color >= 8 && total <= 8) return color - 8;
	if (color >= 2 && total <= 2) return color % 2;
	return color;
};

export const colorNames: ColorNames = {
	default: -1,
	normal: -1,
	bg: -1,
	fg: -1,
	black: 0,
	red: 1,
	green: 2,
	yellow: 3,
	blue: 4,
	magenta: 5,
	cyan: 6,
	white: 7,
	lightblack: 8,
	lightred: 9,
	lightgreen: 10,
	lightyellow: 11,
	lightblue: 12,
	lightmagenta: 13,
	lightcyan: 14,
	lightwhite: 15,
	brightblack: 8,
	brightred: 9,
	brightgreen: 10,
	brightyellow: 11,
	brightblue: 12,
	brightmagenta: 13,
	brightcyan: 14,
	brightwhite: 15,
	grey: 8,
	gray: 8,
	lightgrey: 7,
	lightgray: 7,
	brightgrey: 7,
	brightgray: 7,
} as const;

export const convert = (color: unknown): ColorIndex => {
	if (typeof color === 'number') return color !== -1 ? color : 0x1ff;

	if (typeof color === 'string') {
		const normalized = color.replace(/[\- ]/g, '');
		const named = colorNames[normalized];
		if (named !== undefined) return named !== -1 ? named : 0x1ff;
		const matched = match(normalized);
		return matched !== -1 ? matched : 0x1ff;
	}

	if (Array.isArray(color) && color.length >= 3) {
		const matched = match(color as unknown as RGB);
		return matched !== -1 ? matched : 0x1ff;
	}

	return 0x1ff;
};

// Map higher colors → first 8 colors for 8-color terminals
const generateCColors = (): readonly number[] => {
	const tempVcolors = VCOLORS.slice(0, 8);
	const tempColors = COLORS.slice(0, 8);

	const matchWith8 = (input: string | RGB): ColorIndex => {
		let r1: number;
		let g1: number;
		let b1: number;

		if (typeof input === 'string') {
			if (input[0] !== '#') return -1;
			const rgb = hexToRGB(input);
			if (!rgb) return -1;
			r1 = rgb[0];
			g1 = rgb[1];
			b1 = rgb[2];
		} else {
			r1 = input[0];
			g1 = input[1];
			b1 = input[2];
		}

		let bestDistance = Number.POSITIVE_INFINITY;
		let bestIndex = -1;

		for (let i = 0; i < tempVcolors.length; i++) {
			const c = tempVcolors[i];
			if (!c) continue;
			const dist = colorDistance(r1, g1, b1, c[0], c[1], c[2]);
			if (dist === 0) return i;
			if (dist < bestDistance) {
				bestDistance = dist;
				bestIndex = i;
			}
		}

		return bestIndex;
	};

	return COLORS.map((c) => matchWith8(c));
};

const ccolors = generateCColors();

// Exported palette data
export const colors: readonly string[] = COLORS;
export const vcolors: readonly RGB[] = VCOLORS;

export const clearCache = (): void => {
	matchCache.clear();
};
