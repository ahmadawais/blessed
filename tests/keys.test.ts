import { describe, expect, it } from 'vitest';
import { parseKeySequence, parseKeypressData } from '../src/keys.js';

describe('keys', () => {
	describe('parseKeySequence', () => {
		it('parses carriage return', () => {
			const key = parseKeySequence('\r');
			expect(key?.name).toBe('return');
		});

		it('parses enter (newline)', () => {
			const key = parseKeySequence('\n');
			expect(key?.name).toBe('enter');
		});

		it('parses tab', () => {
			const key = parseKeySequence('\t');
			expect(key?.name).toBe('tab');
		});

		it('parses backspace', () => {
			const key = parseKeySequence('\x7f');
			expect(key?.name).toBe('backspace');
			expect(key?.meta).toBe(false);
		});

		it('parses meta+backspace', () => {
			const key = parseKeySequence('\x1b\x7f');
			expect(key?.name).toBe('backspace');
			expect(key?.meta).toBe(true);
		});

		it('parses escape', () => {
			const key = parseKeySequence('\x1b');
			expect(key?.name).toBe('escape');
			expect(key?.meta).toBe(false);
		});

		it('parses double escape as meta escape', () => {
			const key = parseKeySequence('\x1b\x1b');
			expect(key?.name).toBe('escape');
			expect(key?.meta).toBe(true);
		});

		it('parses space', () => {
			const key = parseKeySequence(' ');
			expect(key?.name).toBe('space');
			expect(key?.meta).toBe(false);
		});

		it('parses meta+space', () => {
			const key = parseKeySequence('\x1b ');
			expect(key?.name).toBe('space');
			expect(key?.meta).toBe(true);
		});

		it('parses ctrl+letter', () => {
			const key = parseKeySequence('\x01'); // ctrl+a
			expect(key?.name).toBe('a');
			expect(key?.ctrl).toBe(true);
		});

		it('parses lowercase letters', () => {
			const key = parseKeySequence('a');
			expect(key?.name).toBe('a');
			expect(key?.ctrl).toBe(false);
			expect(key?.shift).toBe(false);
		});

		it('parses uppercase letters as shift', () => {
			const key = parseKeySequence('A');
			expect(key?.name).toBe('a');
			expect(key?.shift).toBe(true);
		});

		it('parses meta+letter', () => {
			const key = parseKeySequence('\x1ba');
			expect(key?.name).toBe('a');
			expect(key?.meta).toBe(true);
		});

		it('parses arrow keys', () => {
			expect(parseKeySequence('\x1b[A')?.name).toBe('up');
			expect(parseKeySequence('\x1b[B')?.name).toBe('down');
			expect(parseKeySequence('\x1b[C')?.name).toBe('right');
			expect(parseKeySequence('\x1b[D')?.name).toBe('left');
		});

		it('parses function keys', () => {
			expect(parseKeySequence('\x1bOP')?.name).toBe('f1');
			expect(parseKeySequence('\x1bOQ')?.name).toBe('f2');
			expect(parseKeySequence('\x1bOR')?.name).toBe('f3');
			expect(parseKeySequence('\x1bOS')?.name).toBe('f4');
		});

		it('parses home/end/insert/delete', () => {
			expect(parseKeySequence('\x1b[1~')?.name).toBe('home');
			expect(parseKeySequence('\x1b[2~')?.name).toBe('insert');
			expect(parseKeySequence('\x1b[3~')?.name).toBe('delete');
			expect(parseKeySequence('\x1b[4~')?.name).toBe('end');
		});

		it('parses page up/down', () => {
			expect(parseKeySequence('\x1b[5~')?.name).toBe('pageup');
			expect(parseKeySequence('\x1b[6~')?.name).toBe('pagedown');
		});

		it('returns undefined for mouse events', () => {
			expect(parseKeySequence('\x1b[M')).toBeUndefined();
		});

		it('returns undefined for unrecognized single char', () => {
			expect(parseKeySequence('©')).toBeUndefined();
		});
	});

	describe('parseKeypressData', () => {
		it('parses single character input', () => {
			const results = parseKeypressData('a');
			expect(results.length).toBe(1);
			expect(results[0]?.[0]).toBe('a');
			expect(results[0]?.[1]?.name).toBe('a');
		});

		it('parses multiple characters', () => {
			const results = parseKeypressData('abc');
			expect(results.length).toBe(3);
		});

		it('parses escape sequences mixed with text', () => {
			const results = parseKeypressData('a\x1b[Ab');
			expect(results.length).toBe(3);
			// 'a', arrow up, 'b'
			expect(results[0]?.[0]).toBe('a');
			expect(results[1]?.[1]?.name).toBe('up');
			expect(results[2]?.[0]).toBe('b');
		});

		it('returns empty array for mouse events', () => {
			const results = parseKeypressData('\x1b[M @!');
			expect(results).toEqual([]);
		});
	});
});
