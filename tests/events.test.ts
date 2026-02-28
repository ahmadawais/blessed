import { describe, expect, it } from 'vitest';
import {
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
} from '../src/events.js';

describe('events', () => {
	describe('createEmitter', () => {
		it('creates an empty emitter state', () => {
			const state = createEmitter();
			expect(state.events).toEqual({});
			expect(state.maxListeners).toBe(10);
		});

		it('accepts custom maxListeners', () => {
			const state = createEmitter(50);
			expect(state.maxListeners).toBe(50);
		});
	});

	describe('setMaxListeners', () => {
		it('updates maxListeners immutably', () => {
			const state = createEmitter();
			const updated = setMaxListeners(state, 25);
			expect(updated.maxListeners).toBe(25);
			expect(state.maxListeners).toBe(10); // original unchanged
		});
	});

	describe('addListener / on', () => {
		it('adds a first listener as a function', () => {
			const state = createEmitter();
			const handler = (): void => {};
			const updated = addListener(state, 'test', handler);
			expect(updated.events.test).toBe(handler);
		});

		it('converts to array when second listener added', () => {
			let state = createEmitter();
			const h1 = (): void => {};
			const h2 = (): void => {};
			state = on(state, 'test', h1);
			state = on(state, 'test', h2);
			expect(Array.isArray(state.events.test)).toBe(true);
			expect((state.events.test as unknown[]).length).toBe(2);
		});

		it('does not mutate original state', () => {
			const state = createEmitter();
			const updated = addListener(state, 'test', () => {});
			expect(state.events.test).toBeUndefined();
			expect(updated.events.test).toBeDefined();
		});
	});

	describe('removeListener / off', () => {
		it('removes a single listener', () => {
			const handler = (): void => {};
			let state = createEmitter();
			state = addListener(state, 'test', handler);
			state = removeListener(state, 'test', handler);
			expect(state.events.test).toBeUndefined();
		});

		it('removes specific listener from array', () => {
			const h1 = (): void => {};
			const h2 = (): void => {};
			let state = createEmitter();
			state = on(state, 'test', h1);
			state = on(state, 'test', h2);
			state = off(state, 'test', h1);
			expect(state.events.test).toBe(h2);
		});

		it('returns same state when event does not exist', () => {
			const state = createEmitter();
			const result = removeListener(state, 'nope', () => {});
			expect(result).toBe(state);
		});
	});

	describe('removeAllListeners', () => {
		it('removes all listeners for a specific event', () => {
			let state = createEmitter();
			state = on(state, 'a', () => {});
			state = on(state, 'b', () => {});
			state = removeAllListeners(state, 'a');
			expect(state.events.a).toBeUndefined();
			expect(state.events.b).toBeDefined();
		});

		it('removes all listeners when no type given', () => {
			let state = createEmitter();
			state = on(state, 'a', () => {});
			state = on(state, 'b', () => {});
			state = removeAllListeners(state);
			expect(state.events).toEqual({});
		});
	});

	describe('once', () => {
		it('returns state with the listener added', () => {
			const state = createEmitter();
			const handler = (): void => {};
			const { state: updated } = once(state, 'test', handler);
			expect(listenerCount(updated, 'test')).toBe(1);
		});
	});

	describe('listeners', () => {
		it('returns empty array when no listeners', () => {
			const state = createEmitter();
			expect(listeners(state, 'nope')).toEqual([]);
		});

		it('returns single listener in array', () => {
			const handler = (): void => {};
			const state = on(createEmitter(), 'test', handler);
			expect(listeners(state, 'test')).toEqual([handler]);
		});
	});

	describe('listenerCount', () => {
		it('returns 0 for no listeners', () => {
			expect(listenerCount(createEmitter(), 'x')).toBe(0);
		});

		it('returns correct count', () => {
			let state = createEmitter();
			state = on(state, 'x', () => {});
			state = on(state, 'x', () => {});
			expect(listenerCount(state, 'x')).toBe(2);
		});
	});

	describe('emit', () => {
		it('calls registered listeners', () => {
			let called = false;
			let state = createEmitter();
			state = on(state, 'test', () => {
				called = true;
			});
			const result = emit(state, 'test');
			expect(result).toBe(true);
			expect(called).toBe(true);
		});

		it('passes arguments to listeners', () => {
			let received: unknown;
			let state = createEmitter();
			state = on(state, 'test', (arg: unknown) => {
				received = arg;
			});
			emit(state, 'test', 42);
			expect(received).toBe(42);
		});

		it('returns false when no listener exists', () => {
			const state = createEmitter();
			expect(emit(state, 'nope')).toBe(false);
		});

		it('throws on unhandled error event', () => {
			const state = createEmitter();
			expect(() => emit(state, 'error', new Error('test'))).toThrow('test');
		});

		it('calls multiple listeners', () => {
			let count = 0;
			let state = createEmitter();
			state = on(state, 'test', () => {
				count++;
			});
			state = on(state, 'test', () => {
				count++;
			});
			emit(state, 'test');
			expect(count).toBe(2);
		});
	});

	describe('eventNames', () => {
		it('returns empty array for new emitter', () => {
			expect(eventNames(createEmitter())).toEqual([]);
		});

		it('returns registered event names', () => {
			let state = createEmitter();
			state = on(state, 'a', () => {});
			state = on(state, 'b', () => {});
			expect(eventNames(state).sort()).toEqual(['a', 'b']);
		});
	});
});
