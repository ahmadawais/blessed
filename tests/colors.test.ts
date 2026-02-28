import { describe, expect, it } from 'vitest';
import {
	clearCache,
	colorNames,
	colors,
	convert,
	hexToRGB,
	match,
	mixColors,
	reduce,
	rgbArrayToHex,
	rgbToHex,
	vcolors,
} from '../src/colors.js';

describe('colors', () => {
	describe('hexToRGB', () => {
		it('converts 6-digit hex to RGB', () => {
			expect(hexToRGB('#ff0000')).toEqual([255, 0, 0]);
			expect(hexToRGB('#00ff00')).toEqual([0, 255, 0]);
			expect(hexToRGB('#0000ff')).toEqual([0, 0, 255]);
			expect(hexToRGB('#000000')).toEqual([0, 0, 0]);
			expect(hexToRGB('#ffffff')).toEqual([255, 255, 255]);
		});

		it('converts 3-digit shorthand hex to RGB', () => {
			expect(hexToRGB('#f00')).toEqual([255, 0, 0]);
			expect(hexToRGB('#0f0')).toEqual([0, 255, 0]);
			expect(hexToRGB('#00f')).toEqual([0, 0, 255]);
			expect(hexToRGB('#fff')).toEqual([255, 255, 255]);
		});
	});

	describe('rgbToHex', () => {
		it('converts RGB values to hex string', () => {
			expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
			expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
			expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
			expect(rgbToHex(0, 0, 0)).toBe('#000000');
		});
	});

	describe('rgbArrayToHex', () => {
		it('converts RGB array to hex string', () => {
			expect(rgbArrayToHex([255, 0, 0])).toBe('#ff0000');
			expect(rgbArrayToHex([0, 0, 0])).toBe('#000000');
		});
	});

	describe('match', () => {
		it('matches exact xterm colors', () => {
			expect(match('#000000')).toBe(0); // black
			expect(match('#ff0000')).toBe(9); // red (bright)
			expect(match('#ffffff')).toBe(15); // white
		});

		it('matches RGB arrays', () => {
			expect(match([0, 0, 0])).toBe(0);
			expect(match([255, 255, 255])).toBe(15);
		});

		it('returns -1 for non-hex strings', () => {
			expect(match('notahex')).toBe(-1);
		});

		it('finds closest color for arbitrary hex', () => {
			const result = match('#808080');
			expect(result).toBeGreaterThanOrEqual(0);
			expect(result).toBeLessThan(256);
		});

		it('caches results for repeat lookups', () => {
			clearCache();
			const first = match('#abcdef');
			const second = match('#abcdef');
			expect(first).toBe(second);
		});
	});

	describe('mixColors', () => {
		it('mixes two color indices', () => {
			const result = mixColors(0, 15);
			expect(result).toBeGreaterThanOrEqual(0);
			expect(result).toBeLessThan(256);
		});

		it('handles 0x1ff sentinel values', () => {
			const result = mixColors(0x1ff, 0x1ff);
			expect(result).toBe(0); // both default to black
		});
	});

	describe('reduce', () => {
		it('reduces 256-color to 16-color range', () => {
			const result = reduce(200, 16);
			expect(result).toBeGreaterThanOrEqual(0);
			expect(result).toBeLessThan(16);
		});

		it('reduces 16-color to 8-color range', () => {
			expect(reduce(10, 8)).toBe(2);
			expect(reduce(15, 8)).toBe(7);
		});

		it('reduces to 2-color range', () => {
			expect(reduce(3, 2)).toBe(1);
			expect(reduce(4, 2)).toBe(0);
		});

		it('passes through colors within range', () => {
			expect(reduce(5, 256)).toBe(5);
		});
	});

	describe('convert', () => {
		it('converts color name strings', () => {
			expect(convert('red')).toBe(1);
			expect(convert('blue')).toBe(4);
			expect(convert('white')).toBe(7);
		});

		it('converts number pass-through', () => {
			expect(convert(5)).toBe(5);
		});

		it('returns 0x1ff for default/unknown', () => {
			expect(convert('default')).toBe(0x1ff);
			expect(convert(-1)).toBe(0x1ff);
		});

		it('handles light/bright prefixed names', () => {
			expect(convert('lightred')).toBe(9);
			expect(convert('brightblue')).toBe(12);
		});
	});

	describe('colorNames', () => {
		it('has standard color mappings', () => {
			expect(colorNames.black).toBe(0);
			expect(colorNames.red).toBe(1);
			expect(colorNames.green).toBe(2);
			expect(colorNames.default).toBe(-1);
		});
	});

	describe('palette data', () => {
		it('generates 256 colors', () => {
			expect(colors.length).toBe(256);
			expect(vcolors.length).toBe(256);
		});

		it('has proper RGB tuples', () => {
			const black = vcolors[0];
			expect(black).toEqual([0, 0, 0]);
		});

		it('has valid hex strings', () => {
			expect(colors[0]).toBe('#000000');
			expect(colors[15]).toBe('#ffffff');
		});
	});
});
