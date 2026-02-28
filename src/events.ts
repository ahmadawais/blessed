/**
 * events.ts — functional event emitter for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * Copyright (c) 2024, Ahmad Awais (MIT License).
 *
 * Functional rewrite — no classes, no `this`, just data and functions.
 */

import type { EventEmitterState, EventListener } from './types.js';

export const createEmitter = (maxListeners = 10): EventEmitterState => ({
	events: {},
	maxListeners,
});

export const setMaxListeners = (state: EventEmitterState, n: number): EventEmitterState => ({
	...state,
	maxListeners: n,
});

export const addListener = (
	state: EventEmitterState,
	type: string,
	listener: EventListener,
): EventEmitterState => {
	const events = { ...state.events };
	const existing = events[type];

	if (!existing) {
		events[type] = listener;
	} else if (typeof existing === 'function') {
		events[type] = [existing, listener];
	} else {
		events[type] = [...existing, listener];
	}

	return { ...state, events };
};

export const on = addListener;

export const removeListener = (
	state: EventEmitterState,
	type: string,
	listener: EventListener,
): EventEmitterState => {
	const handler = state.events[type];
	if (!handler) return state;

	const events = { ...state.events };

	if (typeof handler === 'function') {
		if (handler === listener) {
			delete events[type];
		}
		return { ...state, events };
	}

	const filtered = handler.filter((h) => h !== listener);
	if (filtered.length === 0) {
		delete events[type];
	} else if (filtered.length === 1 && filtered[0]) {
		events[type] = filtered[0];
	} else {
		events[type] = filtered;
	}

	return { ...state, events };
};

export const off = removeListener;

export const removeAllListeners = (state: EventEmitterState, type?: string): EventEmitterState => {
	if (type) {
		const events = { ...state.events };
		delete events[type];
		return { ...state, events };
	}
	return { ...state, events: {} };
};

export const once = (
	state: EventEmitterState,
	type: string,
	listener: EventListener,
): { state: EventEmitterState; remove: () => EventEmitterState } => {
	let fired = false;

	const wrapper: EventListener = (...args: readonly unknown[]): unknown => {
		if (fired) return;
		fired = true;
		return listener(...args);
	};

	const nextState = addListener(state, type, wrapper);

	return {
		state: nextState,
		remove: (): EventEmitterState => removeListener(nextState, type, wrapper),
	};
};

export const listeners = (state: EventEmitterState, type: string): readonly EventListener[] => {
	const handler = state.events[type];
	if (!handler) return [];
	if (typeof handler === 'function') return [handler];
	return handler;
};

export const listenerCount = (state: EventEmitterState, type: string): number => {
	return listeners(state, type).length;
};

export const emit = (
	state: EventEmitterState,
	type: string,
	...args: readonly unknown[]
): boolean => {
	const handler = state.events[type];

	if (!handler) {
		if (type === 'error') {
			const err = args[0];
			throw err instanceof Error ? err : new Error(String(err));
		}
		return false;
	}

	if (typeof handler === 'function') {
		handler(...args);
		return true;
	}

	for (const h of handler) {
		h(...args);
	}
	return true;
};

export const eventNames = (state: EventEmitterState): readonly string[] => {
	return Object.keys(state.events);
};
