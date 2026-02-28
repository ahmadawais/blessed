import { describe, expect, it } from 'vitest';
import {
	cleanTags,
	dropUnicode,
	escapeTagText,
	generateTags,
	merge,
	sortByIndex,
	sortByName,
	stripTags,
} from '../src/helpers.js';

describe('helpers', () => {
	describe('merge', () => {
		it('merges source properties into target', () => {
			const target = { a: 1, b: 2 };
			const source = { b: 3, c: 4 };
			const result = merge(target, source);
			expect(result).toEqual({ a: 1, b: 3, c: 4 });
		});

		it('does not mutate the original target', () => {
			const target = { a: 1 };
			const source = { b: 2 };
			merge(target, source);
			expect(target).toEqual({ a: 1 });
		});
	});

	describe('sortByName', () => {
		it('sorts items alphabetically by name', () => {
			const items = [{ name: 'charlie' }, { name: 'alpha' }, { name: 'bravo' }];
			const sorted = sortByName(items);
			expect(sorted[0]?.name).toBe('alpha');
			expect(sorted[1]?.name).toBe('bravo');
			expect(sorted[2]?.name).toBe('charlie');
		});

		it('handles dotfiles — sorts by second character', () => {
			const items = [{ name: '.bashrc' }, { name: '.awk' }, { name: 'alpha' }];
			const sorted = sortByName(items);
			expect(sorted[0]?.name).toBe('.awk');
			expect(sorted[1]?.name).toBe('alpha');
			expect(sorted[2]?.name).toBe('.bashrc');
		});

		it('does not mutate original array', () => {
			const items = [{ name: 'b' }, { name: 'a' }];
			sortByName(items);
			expect(items[0]?.name).toBe('b');
		});
	});

	describe('sortByIndex', () => {
		it('sorts items by index descending', () => {
			const items = [{ index: 1 }, { index: 3 }, { index: 2 }];
			const sorted = sortByIndex(items);
			expect(sorted[0]?.index).toBe(3);
			expect(sorted[1]?.index).toBe(2);
			expect(sorted[2]?.index).toBe(1);
		});
	});

	describe('escapeTagText', () => {
		it('escapes curly braces', () => {
			expect(escapeTagText('{bold}')).toBe('{open}bold{close}');
		});

		it('leaves non-brace text untouched', () => {
			expect(escapeTagText('hello world')).toBe('hello world');
		});
	});

	describe('stripTags', () => {
		it('removes blessed-style tags', () => {
			expect(stripTags('{bold}hello{/bold}')).toBe('hello');
		});

		it('removes ANSI escape codes', () => {
			expect(stripTags('\x1b[31mred\x1b[0m')).toBe('red');
		});

		it('returns empty string for falsy input', () => {
			expect(stripTags('')).toBe('');
		});
	});

	describe('cleanTags', () => {
		it('strips tags and trims whitespace', () => {
			expect(cleanTags('  {bold}hello{/bold}  ')).toBe('hello');
		});
	});

	describe('dropUnicode', () => {
		it('replaces wide characters with ??', () => {
			const result = dropUnicode('中文');
			expect(result).toBe('????');
		});

		it('returns empty string for empty input', () => {
			expect(dropUnicode('')).toBe('');
		});
	});

	describe('generateTags', () => {
		it('wraps text in style tags', () => {
			const result = generateTags({ fg: 'red', bold: true }, 'hello');
			expect(result).toContain('{red-fg}');
			expect(result).toContain('{/red-fg}');
			expect(result).toContain('{bold}');
			expect(result).toContain('{/bold}');
			expect(result).toContain('hello');
		});

		it('returns open/close object when no text given', () => {
			const result = generateTags({ bold: true });
			expect(typeof result).toBe('object');
			if (typeof result === 'object') {
				expect(result.open).toContain('{bold}');
				expect(result.close).toContain('{/bold}');
			}
		});

		it('normalizes light- prefix in color values', () => {
			const result = generateTags({ fg: 'lightred' }, 'test');
			expect(typeof result).toBe('string');
			expect(result).toContain('light-red');
		});
	});
});
