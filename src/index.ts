/**
 * blessed — a modern terminal interface library for Node.js
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * Copyright (c) 2024, Ahmad Awais (MIT License).
 *
 * Built with TypeScript, functional patterns, and strict typing.
 */

// Core types
export type {
	Brand,
	CharInfo,
	CharWidthCategory,
	ColorIndex,
	ColorMatch,
	ColorNames,
	ColorPalette,
	EventEmitterState,
	EventListener,
	EventMap,
	HexColor,
	KeyEvent,
	RGB,
	SortableByIndex,
	SortableByName,
	StyleTag,
} from './types.js';

// Colors
export {
	clearCache as clearColorCache,
	colorNames,
	colors,
	convert as convertColor,
	hexToRGB,
	match as matchColor,
	mixColors,
	reduce as reduceColor,
	rgbArrayToHex,
	rgbToHex,
	vcolors,
} from './colors.js';

// Unicode
export {
	allWideCharRegex,
	charWidth,
	charWidthCategory,
	codePointAt,
	combiningTable,
	fromCodePoint,
	isCombining,
	isSurrogate,
	strWidth,
	surrogateRegex,
	surrogateWideCharRegex,
	wideCharRegex,
} from './unicode.js';

// Helpers
export {
	cleanTags,
	dropUnicode,
	escapeTagText,
	generateTags,
	merge,
	sortByIndex,
	sortByName,
	stripTags,
} from './helpers.js';

// Keys
export { parseKeySequence, parseKeypressData } from './keys.js';

// Events (functional emitter)
export {
	addListener,
	createEmitter,
	emit,
	eventNames,
	listenerCount,
	listeners,
	off,
	on,
	once,
	removeAllListeners,
	removeListener,
	setMaxListeners,
} from './events.js';
