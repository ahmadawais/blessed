/**
 * alternate-screen.ts — Alternate screen TUI example
 *
 * Demonstrates using the alternate screen buffer for a full-screen
 * terminal UI that cleans up when you exit. Uses blessed's key parsing
 * and event emitter to handle keyboard input.
 *
 * Run: npx tsx examples/alternate-screen.ts
 * Press q or Ctrl+C to exit.
 */

import {
	type EventEmitterState,
	colorNames,
	createEmitter,
	emit,
	matchColor,
	on,
	parseKeySequence,
	strWidth,
} from '../src/index.js';

// ─── ANSI escape sequences ──────────────────────────────────

const ESC = '\x1b[';
const ENTER_ALT_SCREEN = `${ESC}?1049h`;
const EXIT_ALT_SCREEN = `${ESC}?1049l`;
const HIDE_CURSOR = `${ESC}?25l`;
const SHOW_CURSOR = `${ESC}?25h`;
const CLEAR = `${ESC}2J${ESC}H`;
const RESET = `${ESC}0m`;

const moveTo = (row: number, col: number): string => `${ESC}${row};${col}H`;
const fg256 = (idx: number): string => `${ESC}38;5;${idx}m`;
const bg256 = (idx: number): string => `${ESC}48;5;${idx}m`;

// ─── Terminal state ──────────────────────────────────────────

interface AppState {
	readonly width: number;
	readonly height: number;
	readonly selectedColor: number;
	readonly statusText: string;
	readonly keyLog: readonly string[];
}

const getTermSize = (): { width: number; height: number } => ({
	width: process.stdout.columns || 80,
	height: process.stdout.rows || 24,
});

// ─── Rendering ───────────────────────────────────────────────

const drawBox = (
	row: number,
	col: number,
	w: number,
	h: number,
	borderColor: number,
): string => {
	const bc = fg256(borderColor);
	let out = '';
	out += `${moveTo(row, col)}${bc}╔${'═'.repeat(w - 2)}╗${RESET}`;
	for (let i = 1; i < h - 1; i++) {
		out += `${moveTo(row + i, col)}${bc}║${' '.repeat(w - 2)}║${RESET}`;
	}
	out += `${moveTo(row + h - 1, col)}${bc}╚${'═'.repeat(w - 2)}╝${RESET}`;
	return out;
};

const centerText = (text: string, width: number): string => {
	const textWidth = strWidth(text);
	const pad = Math.max(0, Math.floor((width - textWidth) / 2));
	return ' '.repeat(pad) + text;
};

const render = (state: AppState): void => {
	let out = CLEAR;
	const { width, height, selectedColor, statusText, keyLog } = state;

	// Title box
	const boxW = Math.min(60, width - 4);
	const boxCol = Math.max(1, Math.floor((width - boxW) / 2) + 1);
	out += drawBox(2, boxCol, boxW, 5, 15);
	out += `${moveTo(3, boxCol + 1)}${fg256(15)}${centerText('blessed — Alternate Screen Demo', boxW - 2)}${RESET}`;
	out += `${moveTo(4, boxCol + 1)}${fg256(8)}${centerText('Interactive keyboard-driven TUI', boxW - 2)}${RESET}`;
	out += `${moveTo(5, boxCol + 1)}${fg256(8)}${centerText('Press arrow keys, letters, q to quit', boxW - 2)}${RESET}`;

	// Color display
	const colorRow = 9;
	out += `${moveTo(colorRow, boxCol + 2)}${fg256(15)}Selected color: ${bg256(selectedColor)}  ${fg256(selectedColor)}████${RESET} ${fg256(8)}(index: ${selectedColor})${RESET}`;

	// Color palette bar
	out += `${moveTo(colorRow + 2, boxCol + 2)}`;
	for (let i = 0; i < Math.min(48, boxW - 4); i++) {
		const idx = (selectedColor + i) % 256;
		out += `${bg256(idx)} ${RESET}`;
	}

	// Key log
	out += `${moveTo(colorRow + 4, boxCol + 2)}${fg256(15)}Recent keys:${RESET}`;
	const logStart = colorRow + 5;
	const maxLogLines = Math.min(keyLog.length, height - logStart - 3);
	for (let i = 0; i < maxLogLines; i++) {
		const entry = keyLog[keyLog.length - maxLogLines + i];
		if (!entry) continue;
		out += `${moveTo(logStart + i, boxCol + 4)}${fg256(7)}${entry}${RESET}`;
	}

	// Status bar
	out += `${moveTo(height - 1, 1)}${bg256(236)}${fg256(252)} ${statusText}${' '.repeat(Math.max(0, width - strWidth(statusText) - 2))}${RESET}`;

	process.stdout.write(out);
};

// ─── Main ────────────────────────────────────────────────────

const main = (): void => {
	const { width, height } = getTermSize();

	let appState: AppState = {
		width,
		height,
		selectedColor: matchColor('#4169e1'),
		statusText: 'q = quit | ←→ = change color | Type anything to see key events',
		keyLog: [],
	};

	let emitterState: EventEmitterState = createEmitter();

	// Event handlers
	emitterState = on(emitterState, 'key', (name: unknown, key: unknown) => {
		const keyName = String(name);
		const keyObj = key as { ctrl?: boolean; meta?: boolean; shift?: boolean; sequence?: string };

		// Quit
		if (keyName === 'q' || (keyName === 'c' && keyObj.ctrl)) {
			cleanup();
			process.exit(0);
		}

		// Change color
		if (keyName === 'right' || keyName === 'l') {
			appState = { ...appState, selectedColor: (appState.selectedColor + 1) % 256 };
		}
		if (keyName === 'left' || keyName === 'h') {
			appState = { ...appState, selectedColor: (appState.selectedColor + 255) % 256 };
		}
		if (keyName === 'up' || keyName === 'k') {
			appState = { ...appState, selectedColor: (appState.selectedColor + 16) % 256 };
		}
		if (keyName === 'down' || keyName === 'j') {
			appState = { ...appState, selectedColor: (appState.selectedColor + 240) % 256 };
		}

		// Log the key
		const modifiers = [keyObj.ctrl ? 'ctrl' : '', keyObj.meta ? 'meta' : '', keyObj.shift ? 'shift' : '']
			.filter(Boolean)
			.join('+');
		const display = modifiers ? `${modifiers}+${keyName}` : keyName;
		const newLog = [...appState.keyLog, display].slice(-10);
		appState = { ...appState, keyLog: newLog };

		render(appState);
	});

	// Enter alternate screen
	process.stdout.write(ENTER_ALT_SCREEN + HIDE_CURSOR);
	render(appState);

	// Raw mode for keyboard input
	if (process.stdin.isTTY) {
		process.stdin.setRawMode(true);
	}
	process.stdin.resume();
	process.stdin.setEncoding('utf8');

	process.stdin.on('data', (data: string) => {
		const parsed = parseKeySequence(data);
		if (parsed) {
			emit(emitterState, 'key', parsed.name, parsed);
		} else if (data.length === 1) {
			emit(emitterState, 'key', data, { name: data, ctrl: false, meta: false, shift: false });
		}
	});

	// Handle resize
	process.stdout.on('resize', () => {
		const size = getTermSize();
		appState = { ...appState, width: size.width, height: size.height };
		render(appState);
	});

	const cleanup = (): void => {
		process.stdout.write(SHOW_CURSOR + EXIT_ALT_SCREEN);
		if (process.stdin.isTTY) {
			process.stdin.setRawMode(false);
		}
	};

	process.on('exit', cleanup);
	process.on('SIGINT', () => {
		cleanup();
		process.exit(0);
	});
};

main();
