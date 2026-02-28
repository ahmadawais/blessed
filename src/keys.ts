/**
 * keys.ts — keypress event parsing for terminal input
 * Copyright (c) 2010-2015, Joyent, Inc. and other contributors (MIT License).
 * Copyright (c) 2024, Ahmad Awais (MIT License).
 *
 * Originally from the Node.js tree. Ported to TypeScript with functional patterns.
 */

import type { KeyEvent } from './types.js';

// ANSI escape code patterns — uses RegExp constructor to avoid biome control-char lint
const META_KEY_RE = /^(?:\x1b)([a-zA-Z0-9])$/;

const FUNCTION_KEY_RE = new RegExp(
	`^(?:\\x1b+)(O|N|\\[|\\[\\[)(?:${[
		'(\\d+)(?:;(\\d+))?([~^$])',
		'(?:M([@ #!a`])(.)(.))',
		'(?:1;)?(\\d+)?([a-zA-Z])',
	].join('|')})`,
);

const ESCAPE_CODE_RE_ANYWHERE = new RegExp(
	[
		`(?:\\x1b+)(O|N|\\[|\\[\\[)(?:${[
			'(\\d+)(?:;(\\d+))?([~^$])',
			'(?:M([@ #!a`])(.)(.))',
			'(?:1;)?(\\d+)?([a-zA-Z])',
		].join('|')})`,
		'(?:\\x1b)([a-zA-Z0-9])',
		'\\x1b.',
	].join('|'),
);

const MOUSE_RE = /\x1b\[M/;

const isMouse = (s: string): boolean => MOUSE_RE.test(s);

// Function key code → key name mapping
const FUNCTION_KEY_MAP: Readonly<Record<string, string>> = {
	OP: 'f1',
	OQ: 'f2',
	OR: 'f3',
	OS: 'f4',
	'[11~': 'f1',
	'[12~': 'f2',
	'[13~': 'f3',
	'[14~': 'f4',
	'[[A': 'f1',
	'[[B': 'f2',
	'[[C': 'f3',
	'[[D': 'f4',
	'[[E': 'f5',
	'[15~': 'f5',
	'[17~': 'f6',
	'[18~': 'f7',
	'[19~': 'f8',
	'[20~': 'f9',
	'[21~': 'f10',
	'[23~': 'f11',
	'[24~': 'f12',
	'[A': 'up',
	'[B': 'down',
	'[C': 'right',
	'[D': 'left',
	'[E': 'clear',
	'[F': 'end',
	'[H': 'home',
	OA: 'up',
	OB: 'down',
	OC: 'right',
	OD: 'left',
	OE: 'clear',
	OF: 'end',
	OH: 'home',
	'[1~': 'home',
	'[2~': 'insert',
	'[3~': 'delete',
	'[4~': 'end',
	'[5~': 'pageup',
	'[6~': 'pagedown',
	'[[5~': 'pageup',
	'[[6~': 'pagedown',
	'[7~': 'home',
	'[8~': 'end',
	'[Z': 'tab',
};

// Keys with shift modifier from rxvt
const SHIFT_KEYS: Readonly<Record<string, string>> = {
	'[a': 'up',
	'[b': 'down',
	'[c': 'right',
	'[d': 'left',
	'[e': 'clear',
	'[2$': 'insert',
	'[3$': 'delete',
	'[5$': 'pageup',
	'[6$': 'pagedown',
	'[7$': 'home',
	'[8$': 'end',
};

// Keys with ctrl modifier from rxvt
const CTRL_KEYS: Readonly<Record<string, string>> = {
	Oa: 'up',
	Ob: 'down',
	Oc: 'right',
	Od: 'left',
	Oe: 'clear',
	'[2^': 'insert',
	'[3^': 'delete',
	'[5^': 'pageup',
	'[6^': 'pagedown',
	'[7^': 'home',
	'[8^': 'end',
};

export const parseKeySequence = (s: string): KeyEvent | undefined => {
	if (isMouse(s)) return undefined;

	const key: {
		sequence: string;
		name: string | undefined;
		ctrl: boolean;
		meta: boolean;
		shift: boolean;
		code?: string;
	} = {
		sequence: s,
		name: undefined,
		ctrl: false,
		meta: false,
		shift: false,
	};

	if (s === '\r') {
		key.name = 'return';
		return key;
	}

	if (s === '\n') {
		key.name = 'enter';
		return key;
	}

	if (s === '\t') {
		key.name = 'tab';
		return key;
	}

	if (s === '\b' || s === '\x7f' || s === '\x1b\x7f' || s === '\x1b\b') {
		key.name = 'backspace';
		key.meta = s.charAt(0) === '\x1b';
		return key;
	}

	if (s === '\x1b' || s === '\x1b\x1b') {
		key.name = 'escape';
		key.meta = s.length === 2;
		return key;
	}

	if (s === ' ' || s === '\x1b ') {
		key.name = 'space';
		key.meta = s.length === 2;
		return key;
	}

	if (s.length === 1 && s <= '\x1a') {
		key.name = String.fromCharCode(s.charCodeAt(0) + 'a'.charCodeAt(0) - 1);
		key.ctrl = true;
		return key;
	}

	if (s.length === 1 && s >= 'a' && s <= 'z') {
		key.name = s;
		return key;
	}

	if (s.length === 1 && s >= 'A' && s <= 'Z') {
		key.name = s.toLowerCase();
		key.shift = true;
		return key;
	}

	// meta+character
	const metaParts = META_KEY_RE.exec(s);
	if (metaParts?.[1]) {
		key.name = metaParts[1].toLowerCase();
		key.meta = true;
		key.shift = /^[A-Z]$/.test(metaParts[1]);
		return key;
	}

	// function key / ANSI escape sequence
	const funcParts = FUNCTION_KEY_RE.exec(s);
	if (funcParts) {
		const code =
			(funcParts[1] ?? '') + (funcParts[2] ?? '') + (funcParts[4] ?? '') + (funcParts[9] ?? '');
		const modifier = Number(funcParts[3] ?? funcParts[8] ?? 1) - 1;

		key.ctrl = !!(modifier & 4);
		key.meta = !!(modifier & 10);
		key.shift = !!(modifier & 1);
		key.code = code;

		// Check special modifier key maps first
		const shiftName = SHIFT_KEYS[code];
		if (shiftName) {
			key.name = shiftName;
			key.shift = true;
			return key;
		}

		const ctrlName = CTRL_KEYS[code];
		if (ctrlName) {
			key.name = ctrlName;
			key.ctrl = true;
			return key;
		}

		// Standard function key mapping
		const mappedName = FUNCTION_KEY_MAP[code];
		if (mappedName) {
			key.name = mappedName;
			if (code === '[Z') key.shift = true;
			return key;
		}

		// Unrecognized function key sequence — fall through to return undefined
	}

	// No recognized key
	if (key.name === undefined) return undefined;
	return key;
};

export const parseKeypressData = (
	data: string,
): readonly (readonly [string | undefined, KeyEvent | undefined])[] => {
	if (isMouse(data)) return [];

	const results: [string | undefined, KeyEvent | undefined][] = [];
	let s = data;
	const buffer: string[] = [];

	let execResult = ESCAPE_CODE_RE_ANYWHERE.exec(s);
	while (execResult) {
		const beforeMatch = s.slice(0, execResult.index);
		for (const ch of beforeMatch) {
			buffer.push(ch);
		}
		buffer.push(execResult[0]);
		s = s.slice(execResult.index + execResult[0].length);
		execResult = ESCAPE_CODE_RE_ANYWHERE.exec(s);
	}
	for (const ch of s) {
		buffer.push(ch);
	}

	for (const seq of buffer) {
		const key = parseKeySequence(seq);
		const isSingleCodePoint = Array.from(seq).length === 1;
		const ch = isSingleCodePoint ? seq : undefined;
		if (key || ch) {
			results.push([ch, key]);
		}
	}

	return results;
};
