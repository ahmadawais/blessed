/**
 * unicode.ts — east asian width and surrogate pairs
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * Copyright (c) 2024, Ahmad Awais (MIT License).
 *
 * Borrowed from vangie/east-asian-width, komagata/eastasianwidth,
 * and mathiasbynens/String.prototype.codePointAt. See licenses in original.
 *
 * Ported to TypeScript with functional patterns and strict typing.
 */

import type { CharWidthCategory } from './types.js';

// Combining character ranges — marks zero-width overlay characters
const COMBINING_TABLE: readonly (readonly [number, number])[] = [
	[0x0300, 0x036f],
	[0x0483, 0x0486],
	[0x0488, 0x0489],
	[0x0591, 0x05bd],
	[0x05bf, 0x05bf],
	[0x05c1, 0x05c2],
	[0x05c4, 0x05c5],
	[0x05c7, 0x05c7],
	[0x0600, 0x0603],
	[0x0610, 0x0615],
	[0x064b, 0x065e],
	[0x0670, 0x0670],
	[0x06d6, 0x06e4],
	[0x06e7, 0x06e8],
	[0x06ea, 0x06ed],
	[0x070f, 0x070f],
	[0x0711, 0x0711],
	[0x0730, 0x074a],
	[0x07a6, 0x07b0],
	[0x07eb, 0x07f3],
	[0x0901, 0x0902],
	[0x093c, 0x093c],
	[0x0941, 0x0948],
	[0x094d, 0x094d],
	[0x0951, 0x0954],
	[0x0962, 0x0963],
	[0x0981, 0x0981],
	[0x09bc, 0x09bc],
	[0x09c1, 0x09c4],
	[0x09cd, 0x09cd],
	[0x09e2, 0x09e3],
	[0x0a01, 0x0a02],
	[0x0a3c, 0x0a3c],
	[0x0a41, 0x0a42],
	[0x0a47, 0x0a48],
	[0x0a4b, 0x0a4d],
	[0x0a70, 0x0a71],
	[0x0a81, 0x0a82],
	[0x0abc, 0x0abc],
	[0x0ac1, 0x0ac5],
	[0x0ac7, 0x0ac8],
	[0x0acd, 0x0acd],
	[0x0ae2, 0x0ae3],
	[0x0b01, 0x0b01],
	[0x0b3c, 0x0b3c],
	[0x0b3f, 0x0b3f],
	[0x0b41, 0x0b43],
	[0x0b4d, 0x0b4d],
	[0x0b56, 0x0b56],
	[0x0b82, 0x0b82],
	[0x0bc0, 0x0bc0],
	[0x0bcd, 0x0bcd],
	[0x0c3e, 0x0c40],
	[0x0c46, 0x0c48],
	[0x0c4a, 0x0c4d],
	[0x0c55, 0x0c56],
	[0x0cbc, 0x0cbc],
	[0x0cbf, 0x0cbf],
	[0x0cc6, 0x0cc6],
	[0x0ccc, 0x0ccd],
	[0x0ce2, 0x0ce3],
	[0x0d41, 0x0d43],
	[0x0d4d, 0x0d4d],
	[0x0dca, 0x0dca],
	[0x0dd2, 0x0dd4],
	[0x0dd6, 0x0dd6],
	[0x0e31, 0x0e31],
	[0x0e34, 0x0e3a],
	[0x0e47, 0x0e4e],
	[0x0eb1, 0x0eb1],
	[0x0eb4, 0x0eb9],
	[0x0ebb, 0x0ebc],
	[0x0ec8, 0x0ecd],
	[0x0f18, 0x0f19],
	[0x0f35, 0x0f35],
	[0x0f37, 0x0f37],
	[0x0f39, 0x0f39],
	[0x0f71, 0x0f7e],
	[0x0f80, 0x0f84],
	[0x0f86, 0x0f87],
	[0x0f90, 0x0f97],
	[0x0f99, 0x0fbc],
	[0x0fc6, 0x0fc6],
	[0x102d, 0x1030],
	[0x1032, 0x1032],
	[0x1036, 0x1037],
	[0x1039, 0x1039],
	[0x1058, 0x1059],
	[0x1160, 0x11ff],
	[0x135f, 0x135f],
	[0x1712, 0x1714],
	[0x1732, 0x1734],
	[0x1752, 0x1753],
	[0x1772, 0x1773],
	[0x17b4, 0x17b5],
	[0x17b7, 0x17bd],
	[0x17c6, 0x17c6],
	[0x17c9, 0x17d3],
	[0x17dd, 0x17dd],
	[0x180b, 0x180d],
	[0x18a9, 0x18a9],
	[0x1920, 0x1922],
	[0x1927, 0x1928],
	[0x1932, 0x1932],
	[0x1939, 0x193b],
	[0x1a17, 0x1a18],
	[0x1b00, 0x1b03],
	[0x1b34, 0x1b34],
	[0x1b36, 0x1b3a],
	[0x1b3c, 0x1b3c],
	[0x1b42, 0x1b42],
	[0x1b6b, 0x1b73],
	[0x1dc0, 0x1dca],
	[0x1dfe, 0x1dff],
	[0x200b, 0x200f],
	[0x202a, 0x202e],
	[0x2060, 0x2063],
	[0x206a, 0x206f],
	[0x20d0, 0x20ef],
	[0x302a, 0x302f],
	[0x3099, 0x309a],
	[0xa806, 0xa806],
	[0xa80b, 0xa80b],
	[0xa825, 0xa826],
	[0xfb1e, 0xfb1e],
	[0xfe00, 0xfe0f],
	[0xfe20, 0xfe23],
	[0xfeff, 0xfeff],
	[0xfff9, 0xfffb],
	[0x10a01, 0x10a03],
	[0x10a05, 0x10a06],
	[0x10a0c, 0x10a0f],
	[0x10a38, 0x10a3a],
	[0x10a3f, 0x10a3f],
	[0x1d167, 0x1d169],
	[0x1d173, 0x1d182],
	[0x1d185, 0x1d18b],
	[0x1d1aa, 0x1d1ad],
	[0x1d242, 0x1d244],
	[0xe0001, 0xe0001],
	[0xe0020, 0xe007f],
	[0xe0100, 0xe01ef],
] as const;

// Build combining lookup set for O(1) checks
const buildCombiningSet = (): Set<number> => {
	const set = new Set<number>();
	for (const [start, end] of COMBINING_TABLE) {
		for (let i = start; i <= end; i++) {
			set.add(i);
		}
	}
	return set;
};

const combiningSet = buildCombiningSet();

export const codePointAt = (str: string, position: number): number | undefined => {
	return str.codePointAt(position);
};

export const fromCodePoint = (...codePoints: readonly number[]): string => {
	return String.fromCodePoint(...codePoints);
};

export const isSurrogate = (str: string, i: number): boolean => {
	const point = str.codePointAt(i);
	if (point === undefined) return false;
	return point > 0x00ffff;
};

export const isCombining = (point: number): boolean => {
	return combiningSet.has(point);
};

export const charWidth = (point: number, tabWidth = 8): number => {
	// nul
	if (point === 0) return 0;

	// tab
	if (point === 0x09) return tabWidth;

	// 8-bit control characters
	if (point < 32 || (point >= 0x7f && point < 0xa0)) return 0;

	// combining / zero-width
	if (combiningSet.has(point)) return 0;

	// fullwidth forms
	if (
		point === 0x3000 ||
		(0xff01 <= point && point <= 0xff60) ||
		(0xffe0 <= point && point <= 0xffe6)
	) {
		return 2;
	}

	// CJK and other double-wide
	if (
		(0x1100 <= point && point <= 0x115f) ||
		(0x11a3 <= point && point <= 0x11a7) ||
		(0x11fa <= point && point <= 0x11ff) ||
		(0x2329 <= point && point <= 0x232a) ||
		(0x2e80 <= point && point <= 0x2e99) ||
		(0x2e9b <= point && point <= 0x2ef3) ||
		(0x2f00 <= point && point <= 0x2fd5) ||
		(0x2ff0 <= point && point <= 0x2ffb) ||
		(0x3001 <= point && point <= 0x303e) ||
		(0x3041 <= point && point <= 0x3096) ||
		(0x3099 <= point && point <= 0x30ff) ||
		(0x3105 <= point && point <= 0x312d) ||
		(0x3131 <= point && point <= 0x318e) ||
		(0x3190 <= point && point <= 0x31ba) ||
		(0x31c0 <= point && point <= 0x31e3) ||
		(0x31f0 <= point && point <= 0x321e) ||
		(0x3220 <= point && point <= 0x3247) ||
		(0x3250 <= point && point <= 0x32fe) ||
		(0x3300 <= point && point <= 0x4dbf) ||
		(0x4e00 <= point && point <= 0xa48c) ||
		(0xa490 <= point && point <= 0xa4c6) ||
		(0xa960 <= point && point <= 0xa97c) ||
		(0xac00 <= point && point <= 0xd7a3) ||
		(0xd7b0 <= point && point <= 0xd7c6) ||
		(0xd7cb <= point && point <= 0xd7fb) ||
		(0xf900 <= point && point <= 0xfaff) ||
		(0xfe10 <= point && point <= 0xfe19) ||
		(0xfe30 <= point && point <= 0xfe52) ||
		(0xfe54 <= point && point <= 0xfe66) ||
		(0xfe68 <= point && point <= 0xfe6b) ||
		(0x1b000 <= point && point <= 0x1b001) ||
		(0x1f200 <= point && point <= 0x1f202) ||
		(0x1f210 <= point && point <= 0x1f23a) ||
		(0x1f240 <= point && point <= 0x1f248) ||
		(0x1f250 <= point && point <= 0x1f251) ||
		(0x20000 <= point && point <= 0x2f73f) ||
		(0x2b740 <= point && point <= 0x2fffd) ||
		(0x30000 <= point && point <= 0x3fffd)
	) {
		return 2;
	}

	return 1;
};

export const strWidth = (str: string, tabWidth = 8): number => {
	let width = 0;
	for (let i = 0; i < str.length; i++) {
		const point = str.codePointAt(i);
		if (point === undefined) continue;
		width += charWidth(point, tabWidth);
		if (point > 0x00ffff) i++; // skip surrogate pair
	}
	return width;
};

export const charWidthCategory = (point: number): CharWidthCategory => {
	if (point < 32 || (point >= 0x7f && point < 0xa0)) return 'control';
	if (combiningSet.has(point)) return 'combining';
	if (charWidth(point) === 2) return 'wide';
	return 'narrow';
};

// Regex patterns for wide/surrogate/combining characters
export const wideCharRegex = new RegExp(
	'([' +
		'\\u1100-\\u115f' +
		'\\u2329\\u232a' +
		'\\u2e80-\\u303e\\u3040-\\ua4cf' +
		'\\uac00-\\ud7a3' +
		'\\uf900-\\ufaff' +
		'\\ufe10-\\ufe19' +
		'\\ufe30-\\ufe6f' +
		'\\uff00-\\uff60' +
		'\\uffe0-\\uffe6' +
		'])',
	'g',
);

export const surrogateWideCharRegex = new RegExp(
	'(' + '[\\ud840-\\ud87f][\\udc00-\\udffd]' + '|' + '[\\ud880-\\ud8bf][\\udc00-\\udffd]' + ')',
	'g',
);

export const allWideCharRegex = new RegExp(
	`(${surrogateWideCharRegex.source.slice(1, -1)}|${wideCharRegex.source.slice(1, -1)})`,
	'g',
);

export const surrogateRegex = /[\ud800-\udbff][\udc00-\udfff]/g;

export { COMBINING_TABLE as combiningTable };
