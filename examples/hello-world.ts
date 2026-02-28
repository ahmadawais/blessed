/**
 * hello-world.ts — Primary screen example
 *
 * Demonstrates writing directly to the primary terminal screen
 * using ANSI escape codes and blessed's color matching.
 *
 * Run: npx tsx examples/hello-world.ts
 */

import { colorNames, hexToRGB, matchColor, rgbToHex, strWidth } from '../src/index.js';

// ─── ANSI helpers (zero-dependency) ───────────────────────────

const ESC = '\x1b[';
const RESET = `${ESC}0m`;

const fg256 = (idx: number): string => `${ESC}38;5;${idx}m`;
const bg256 = (idx: number): string => `${ESC}48;5;${idx}m`;
const bold = (text: string): string => `${ESC}1m${text}${RESET}`;

// ─── Color palette demo ──────────────────────────────────────

const printColorPalette = (): void => {
	console.log(bold('\n 🎨 256-Color Palette\n'));

	// Base 16 colors
	let line = ' ';
	for (let i = 0; i < 16; i++) {
		line += `${bg256(i)}  ${RESET}`;
	}
	console.log(line);
	console.log();

	// 6×6×6 color cube (216 colors)
	for (let row = 0; row < 12; row++) {
		let cubeRow = ' ';
		for (let col = 0; col < 18; col++) {
			const idx = 16 + row * 18 + col;
			if (idx < 232) {
				cubeRow += `${bg256(idx)}  ${RESET}`;
			}
		}
		console.log(cubeRow);
	}
	console.log();

	// Greyscale ramp
	let grey = ' ';
	for (let i = 232; i < 256; i++) {
		grey += `${bg256(i)}  ${RESET}`;
	}
	console.log(grey);
	console.log();
};

// ─── Color matching demo ─────────────────────────────────────

const printColorMatching = (): void => {
	console.log(bold(' 🔍 Color Matching\n'));

	const samples = ['#ff6347', '#4169e1', '#32cd32', '#ffd700', '#8a2be2', '#00ced1'];

	for (const hex of samples) {
		const rgb = hexToRGB(hex);
		if (!rgb) continue;
		const idx = matchColor(hex);
		const matched = rgbToHex(rgb[0], rgb[1], rgb[2]);
		console.log(
			`  ${bg256(idx)}    ${RESET}  ${hex} → xterm index ${fg256(idx)}${idx}${RESET}  (${matched})`,
		);
	}
	console.log();
};

// ─── Named colors demo ──────────────────────────────────────

const printNamedColors = (): void => {
	console.log(bold(' 📛 Named Colors\n'));

	const names = ['red', 'green', 'blue', 'cyan', 'magenta', 'yellow', 'white', 'brightred'];

	let line = '  ';
	for (const name of names) {
		const idx = colorNames[name] ?? 0;
		line += `${bg256(idx)} ${name} ${RESET} `;
	}
	console.log(line);
	console.log();
};

// ─── Unicode width demo ─────────────────────────────────────

const printUnicodeWidth = (): void => {
	console.log(bold(' 📐 Unicode String Width\n'));

	const samples = [
		'hello',
		'中文测试',
		'café',
		'🎉🎊',
		'a中b',
		'TypeScript™',
		'──────────',
	];

	for (const str of samples) {
		const width = strWidth(str);
		const jsLen = str.length;
		console.log(`  "${str}"  →  width: ${fg256(14)}${width}${RESET}  (JS length: ${jsLen})`);
	}
	console.log();
};

// ─── Run ─────────────────────────────────────────────────────

console.log();
console.log(bold(`${fg256(15)} ╔══════════════════════════════════════════╗`));
console.log(bold(`${fg256(15)} ║         blessed — Hello World            ║`));
console.log(bold(`${fg256(15)} ║   Primary Screen Terminal Demo           ║`));
console.log(bold(`${fg256(15)} ╚══════════════════════════════════════════╝${RESET}`));

printColorPalette();
printColorMatching();
printNamedColors();
printUnicodeWidth();

console.log(` ${fg256(8)}This runs on the primary screen — output stays in your scrollback.${RESET}\n`);
