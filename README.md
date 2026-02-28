# blessed

> A modern terminal interface library for Node.js — built with TypeScript.

Blessed gives you **type-safe** building blocks for terminal UIs: color matching, Unicode width calculation, keyboard input parsing, and a functional event emitter — all in a zero-dependency, strictly-typed package.

## Install

```sh
pnpm add blessed
```

```sh
npm install blessed
```

## Quick Start

```typescript
import {
  matchColor,
  hexToRGB,
  strWidth,
  parseKeySequence,
  createEmitter,
  on,
  emit,
} from 'blessed';

// Match a hex color to the nearest xterm-256 index
matchColor('#ff6347');  // → 209

// Convert hex to RGB tuple
hexToRGB('#ff6347');    // → [255, 99, 71]

// Calculate the visual width of a string (CJK = 2, emoji = 2)
strWidth('hello');      // → 5
strWidth('中文');        // → 4
strWidth('a中b');        // → 4

// Parse terminal key sequences
parseKeySequence('\x1b[A');  // → { name: 'up', ctrl: false, meta: false, shift: false, ... }
parseKeySequence('\x01');    // → { name: 'a', ctrl: true, ... }

// Functional event emitter (immutable state)
let state = createEmitter();
state = on(state, 'data', (chunk) => console.log('got:', chunk));
emit(state, 'data', 'hello');  // logs: "got: hello"
```

---

## Modules

### Colors

Full 256-color xterm palette with weighted Euclidean distance matching and caching.

```typescript
import {
  hexToRGB,
  rgbToHex,
  matchColor,
  convertColor,
  mixColors,
  reduceColor,
  colorNames,
  colors,
  vcolors,
} from 'blessed';
```

| Function | Description |
|---|---|
| `hexToRGB(hex)` | Convert `#rgb` or `#rrggbb` to `[r, g, b]`. Returns `undefined` for invalid input. |
| `rgbToHex(r, g, b)` | Convert RGB values to `#rrggbb` string. |
| `matchColor(input)` | Find nearest xterm-256 index for a hex string or RGB tuple. Cached for speed. |
| `convertColor(color)` | Convert a color name, number, hex, or RGB array to an xterm index. |
| `mixColors(c1, c2, alpha?)` | Blend two color indices. Default alpha = 0.5. |
| `reduceColor(color, total)` | Downgrade a color index to fit a smaller palette (16, 8, or 2 colors). |
| `colorNames` | Map of named colors → index (`red` → 1, `brightcyan` → 14, etc). |
| `colors` | Array of 256 hex strings. |
| `vcolors` | Array of 256 `[r, g, b]` tuples. |

```typescript
// Match any hex color to the closest terminal color
const idx = matchColor('#ff6347');    // 209
const rgb = hexToRGB('#ff6347');      // [255, 99, 71]

// Named color lookup
const red = convertColor('red');      // 1
const bg = convertColor('default');   // 0x1ff (sentinel for "default")

// Mix two colors
const blended = mixColors(1, 4);      // blend red and blue → closest purple

// Reduce for 8-color terminals
const reduced = reduceColor(200, 8);  // maps 256-color index to 0–7
```

### Unicode

East Asian width detection, combining character handling, and surrogate pair support.

```typescript
import {
  charWidth,
  strWidth,
  charWidthCategory,
  isCombining,
  isSurrogate,
  codePointAt,
  fromCodePoint,
} from 'blessed';
```

| Function | Description |
|---|---|
| `charWidth(codePoint, tabWidth?)` | Returns visual width: 0 (control/combining), 1 (narrow), or 2 (wide/CJK). |
| `strWidth(str, tabWidth?)` | Total visual width of a string, correctly handling CJK, emoji, and tabs. |
| `charWidthCategory(codePoint)` | Classify as `'narrow'`, `'wide'`, `'combining'`, or `'control'`. |
| `isCombining(codePoint)` | Check if a code point is a combining mark (zero-width overlay). |
| `isSurrogate(str, index)` | Check if the character at `index` is a surrogate pair (non-BMP). |
| `codePointAt(str, index)` | Safe wrapper for `String.prototype.codePointAt`. |
| `fromCodePoint(...points)` | Safe wrapper for `String.fromCodePoint`. |

```typescript
// CJK characters are double-width
strWidth('中文');         // 4
strWidth('hello');       // 5
strWidth('a中b');         // 4 (1 + 2 + 1)

// Tab width is configurable
strWidth('\t', 4);       // 4
strWidth('\t');           // 8 (default)

// Classify characters
charWidthCategory(0x4e2d); // 'wide'  (中)
charWidthCategory(0x0300); // 'combining' (grave accent)
charWidthCategory(65);     // 'narrow' (A)
```

### Keys

Parse raw terminal input into structured key events. Handles ANSI escape codes, function keys, modifier detection (ctrl/meta/shift), and mouse filtering.

```typescript
import { parseKeySequence, parseKeypressData } from 'blessed';
```

| Function | Description |
|---|---|
| `parseKeySequence(sequence)` | Parse a single escape sequence into a `KeyEvent`, or `undefined` if unrecognized. |
| `parseKeypressData(data)` | Split a raw input buffer into an array of `[char, KeyEvent]` tuples. |

```typescript
// Arrow keys
parseKeySequence('\x1b[A');   // { name: 'up',    ctrl: false, meta: false, shift: false }
parseKeySequence('\x1b[B');   // { name: 'down',  ... }

// Modifiers
parseKeySequence('\x01');     // { name: 'a', ctrl: true }
parseKeySequence('\x1ba');    // { name: 'a', meta: true }
parseKeySequence('A');        // { name: 'a', shift: true }

// Function keys
parseKeySequence('\x1bOP');   // { name: 'f1' }
parseKeySequence('\x1b[24~'); // { name: 'f12' }

// Special keys
parseKeySequence('\r');       // { name: 'return' }
parseKeySequence('\n');       // { name: 'enter' }
parseKeySequence('\t');       // { name: 'tab' }
parseKeySequence('\x7f');     // { name: 'backspace' }
parseKeySequence('\x1b');     // { name: 'escape' }

// Parse a full input buffer (e.g., from process.stdin)
const events = parseKeypressData('a\x1b[Ab');
// → [ ['a', KeyEvent], [undefined, KeyEvent(up)], ['b', KeyEvent] ]
```

### Events

A **functional** event emitter — no classes, no `this`, no mutation. Every operation returns a new state object.

```typescript
import {
  createEmitter,
  on,
  off,
  once,
  emit,
  listeners,
  listenerCount,
  eventNames,
  removeAllListeners,
  setMaxListeners,
} from 'blessed';
```

| Function | Description |
|---|---|
| `createEmitter(maxListeners?)` | Create a new emitter state. Default max = 10. |
| `on(state, type, listener)` | Add a listener. Returns new state. |
| `off(state, type, listener)` | Remove a listener. Returns new state. |
| `once(state, type, listener)` | Add a one-time listener. Returns `{ state, remove }`. |
| `emit(state, type, ...args)` | Fire all listeners for an event. Returns `true` if any existed. |
| `listeners(state, type)` | Get all listeners for an event. |
| `listenerCount(state, type)` | Count listeners for an event. |
| `eventNames(state)` | List all event names with listeners. |
| `removeAllListeners(state, type?)` | Remove all listeners (optionally for one event). |
| `setMaxListeners(state, n)` | Update the max listeners count. |

```typescript
// Create → subscribe → emit
let state = createEmitter();
state = on(state, 'data', (chunk) => console.log('received:', chunk));
emit(state, 'data', 'hello');   // logs: "received: hello"

// One-time listener
const { state: s2 } = once(state, 'close', () => console.log('closed'));
emit(s2, 'close');   // logs: "closed"
emit(s2, 'close');   // nothing — already fired

// Unsubscribe
const handler = () => {};
let s3 = on(createEmitter(), 'tick', handler);
s3 = off(s3, 'tick', handler);
listenerCount(s3, 'tick');  // 0

// Error handling — unhandled 'error' events throw
const s4 = createEmitter();
emit(s4, 'error', new Error('boom'));  // throws!
```

### Helpers

Utility functions for tag manipulation, sorting, and Unicode string processing.

```typescript
import {
  stripTags,
  cleanTags,
  escapeTagText,
  generateTags,
  merge,
  sortByName,
  sortByIndex,
  dropUnicode,
} from 'blessed';
```

```typescript
// Strip blessed-style tags and ANSI codes
stripTags('{bold}hello{/bold}');        // 'hello'
stripTags('\x1b[31mred\x1b[0m');       // 'red'

// Generate tag pairs
generateTags({ fg: 'red', bold: true }, 'hello');
// '{bold}{red-fg}hello{/red-fg}{/bold}'

// Without text — returns { open, close }
generateTags({ bold: true });
// { open: '{bold}', close: '{/bold}' }

// Immutable merge
merge({ a: 1 }, { b: 2 });  // { a: 1, b: 2 }

// Sort with dotfile awareness
sortByName([{ name: '.bashrc' }, { name: 'alpha' }]);
// [{ name: 'alpha' }, { name: '.bashrc' }]
```

---

## Examples

### Primary Screen — Hello World

Writes directly to the terminal's primary screen. Output stays in your scrollback buffer.

```sh
npx tsx examples/hello-world.ts
```

This example demonstrates:
- **256-color palette rendering** — all 16 base colors, 216 cube colors, and 24 greyscale shades
- **Color matching** — maps arbitrary hex colors to the nearest xterm index
- **Named color lookup** — uses the built-in `colorNames` map
- **Unicode width calculation** — shows visual width vs JS `.length` for CJK, emoji, and mixed strings

> The primary screen is the default terminal mode. Everything you print stays visible in your scrollback history after the program exits.

### Alternate Screen — Interactive TUI

Uses the alternate screen buffer for a full-screen UI that disappears when you quit.

```sh
npx tsx examples/alternate-screen.ts
```

This example demonstrates:
- **Alternate screen buffer** — enters with `\x1b[?1049h`, exits with `\x1b[?1049l`
- **Raw keyboard input** — reads `process.stdin` in raw mode, parses with `parseKeySequence`
- **Functional event emitter** — all key events flow through `createEmitter()` / `on()` / `emit()`
- **Color cycling** — arrow keys shift through the 256-color palette in real time
- **Terminal resize handling** — re-renders on `SIGWINCH`
- **Clean exit** — restores cursor, exits alternate screen, disables raw mode

> The alternate screen is like a separate canvas. Your previous terminal content is preserved underneath and restored when the program exits. This is how `vim`, `htop`, and `less` work.

### Primary vs Alternate Screen

| | Primary Screen | Alternate Screen |
|---|---|---|
| **Buffer** | Shared scrollback | Separate buffer |
| **After exit** | Output stays visible | Screen restored |
| **Scrollback** | Preserved | Not available |
| **Use case** | CLI output, logs, reports | Full-screen TUIs, editors |
| **Enter** | (default) | `\x1b[?1049h` |
| **Exit** | (default) | `\x1b[?1049l` |

---

## Types

All types are exported for use in your own code:

```typescript
import type {
  KeyEvent,
  RGB,
  HexColor,
  ColorIndex,
  EventEmitterState,
  EventListener,
  StyleTag,
  CharWidthCategory,
  Brand,
} from 'blessed';
```

Key types:

- **`KeyEvent`** — `{ name, sequence, ctrl, meta, shift, code? }`
- **`RGB`** — `readonly [r: number, g: number, b: number]`
- **`HexColor`** — Template literal type `#${string}`
- **`ColorIndex`** — `number` (0–255 for xterm, 0x1ff for default)
- **`EventEmitterState`** — Immutable `{ readonly events, readonly maxListeners }`
- **`Brand<T, B>`** — Branded type helper for type-safe IDs

---

## Stack

| Tool | Purpose |
|---|---|
| **TypeScript** | `strict: true`, `noUncheckedIndexedAccess: true` |
| **tsup** | Dual ESM + CJS + DTS build |
| **Biome** | Linting + formatting |
| **Vitest** | Test runner |
| **pnpm** | Package manager |

## Development

```sh
pnpm install
pnpm test        # run tests
pnpm lint        # check with biome
pnpm typecheck   # tsc --noEmit
pnpm build       # tsup → dist/
pnpm dev         # tsup --watch
```

## License

MIT © [Ahmad Awais](https://github.com/ahmadawais)

Originally based on work by Christopher Jeffrey and contributors.
