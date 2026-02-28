import { describe, expect, it } from 'vitest';
import {
	charWidth,
	charWidthCategory,
	codePointAt,
	combiningTable,
	fromCodePoint,
	isCombining,
	isSurrogate,
	strWidth,
} from '../src/unicode.js';

describe('unicode', () => {
	describe('codePointAt', () => {
		it('returns code point for ASCII', () => {
			expect(codePointAt('A', 0)).toBe(65);
			expect(codePointAt('z', 0)).toBe(122);
		});

		it('returns code point for multibyte characters', () => {
			expect(codePointAt('中', 0)).toBe(0x4e2d);
		});

		it('returns code point for surrogate pairs', () => {
			const emoji = '𠀀'; // U+20000
			expect(codePointAt(emoji, 0)).toBe(0x20000);
		});

		it('returns undefined for out-of-bounds', () => {
			expect(codePointAt('a', 5)).toBeUndefined();
		});
	});

	describe('fromCodePoint', () => {
		it('converts code point back to string', () => {
			expect(fromCodePoint(65)).toBe('A');
			expect(fromCodePoint(0x4e2d)).toBe('中');
		});

		it('handles surrogate pairs', () => {
			const result = fromCodePoint(0x20000);
			expect(result.length).toBe(2); // surrogate pair = 2 JS chars
		});
	});

	describe('isSurrogate', () => {
		it('detects surrogate pairs', () => {
			expect(isSurrogate('𠀀', 0)).toBe(true);
		});

		it('returns false for BMP characters', () => {
			expect(isSurrogate('A', 0)).toBe(false);
			expect(isSurrogate('中', 0)).toBe(false);
		});
	});

	describe('isCombining', () => {
		it('detects combining characters', () => {
			expect(isCombining(0x0300)).toBe(true); // combining grave accent
			expect(isCombining(0x0301)).toBe(true); // combining acute accent
		});

		it('returns false for non-combining characters', () => {
			expect(isCombining(65)).toBe(false); // 'A'
			expect(isCombining(0x4e2d)).toBe(false); // '中'
		});
	});

	describe('charWidth', () => {
		it('returns 0 for nul', () => {
			expect(charWidth(0)).toBe(0);
		});

		it('returns tab width for tab', () => {
			expect(charWidth(0x09)).toBe(8);
			expect(charWidth(0x09, 4)).toBe(4);
		});

		it('returns 0 for control characters', () => {
			expect(charWidth(1)).toBe(0);
			expect(charWidth(0x7f)).toBe(0);
		});

		it('returns 0 for combining characters', () => {
			expect(charWidth(0x0300)).toBe(0);
		});

		it('returns 1 for regular ASCII', () => {
			expect(charWidth(65)).toBe(1); // 'A'
			expect(charWidth(97)).toBe(1); // 'a'
		});

		it('returns 2 for CJK characters', () => {
			expect(charWidth(0x4e2d)).toBe(2); // '中'
			expect(charWidth(0x3000)).toBe(2); // ideographic space
		});

		it('returns 2 for fullwidth forms', () => {
			expect(charWidth(0xff01)).toBe(2); // fullwidth exclamation mark
		});

		it('returns 2 for Hangul syllables', () => {
			expect(charWidth(0xac00)).toBe(2);
		});
	});

	describe('strWidth', () => {
		it('calculates width of ASCII strings', () => {
			expect(strWidth('hello')).toBe(5);
			expect(strWidth('')).toBe(0);
		});

		it('calculates width of CJK strings', () => {
			expect(strWidth('中文')).toBe(4); // 2 chars × width 2
		});

		it('handles mixed ASCII and CJK', () => {
			expect(strWidth('a中b')).toBe(4); // 1 + 2 + 1
		});

		it('handles surrogate pairs', () => {
			expect(strWidth('𠀀')).toBe(2); // wide surrogate pair
		});
	});

	describe('charWidthCategory', () => {
		it('classifies control characters', () => {
			expect(charWidthCategory(1)).toBe('control');
			expect(charWidthCategory(0x7f)).toBe('control');
		});

		it('classifies combining characters', () => {
			expect(charWidthCategory(0x0300)).toBe('combining');
		});

		it('classifies wide characters', () => {
			expect(charWidthCategory(0x4e2d)).toBe('wide');
		});

		it('classifies narrow characters', () => {
			expect(charWidthCategory(65)).toBe('narrow');
		});
	});

	describe('combiningTable', () => {
		it('is a non-empty array of ranges', () => {
			expect(combiningTable.length).toBeGreaterThan(0);
			for (const entry of combiningTable) {
				expect(entry).toHaveLength(2);
				expect(entry[0]).toBeLessThanOrEqual(entry[1]);
			}
		});
	});
});
