// hooks/useWorkoutHistory.ts
// Undo/redo manager for workout plan changes — implements PS requirement (b).
// Uses useReducer for state (history + redoStack), so undo/redo are pure
// transitions that don't need refs. React 19-friendly: no ref reads during
// render, no setState-in-effect.
import { useReducer, useCallback } from "react";
function reducer(state, action) {
    switch (action.type) {
        case "push":
            return {
                history: [...state.history, action.change],
                redo: [],
                lastPopped: undefined,
            };
        case "undo": {
            if (state.history.length === 0)
                return { ...state, lastPopped: undefined };
            const last = state.history[state.history.length - 1];
            return {
                history: state.history.slice(0, -1),
                redo: [...state.redo, last],
                lastPopped: last,
            };
        }
        case "redo": {
            if (state.redo.length === 0)
                return { ...state, lastPopped: undefined };
            const last = state.redo[state.redo.length - 1];
            return {
                history: [...state.history, last],
                redo: state.redo.slice(0, -1),
                lastPopped: last,
            };
        }
        case "reset":
            return { history: action.history.slice(), redo: [], lastPopped: undefined };
        case "clearLastPopped":
            return { ...state, lastPopped: undefined };
        default:
            return state;
    }
}
/**
 * Undo/redo manager over a workout-plan change history.
 *
 * - `history`    : visible timeline (newest last).
 * - `undoStack`  : items popped off history via `undo()` — shown LIFO (newest pop first).
 * - `redoStack`  : items re-applied via `redo()` — shown LIFO.
 *
 * On `push(change)`:
 *   - history.append(change)
 *   - redoStack cleared (a new action invalidates redo).
 *
 * On `undo()`:
 *   - pops last history entry, pushes it onto redoStack, returns it.
 *
 * On `redo()`:
 *   - pops last redoStack entry, re-appends to history, returns it.
 */
export function useWorkoutHistory(initialHistory) {
    const [state, dispatch] = useReducer(reducer, {
        history: initialHistory.slice(),
        redo: [],
        lastPopped: undefined,
    });
    const push = useCallback((change) => {
        dispatch({ type: "push", change });
    }, []);
    const undo = useCallback(() => {
        dispatch({ type: "undo" });
        return state.lastPopped;
    }, [state.lastPopped]);
    const redo = useCallback(() => {
        dispatch({ type: "redo" });
        return state.lastPopped;
    }, [state.lastPopped]);
    const reset = useCallback((newHistory) => {
        dispatch({ type: "reset", history: newHistory });
    }, []);
    return {
        history: state.history,
        undoStack: state.history.slice().reverse(), // LIFO view: most recent undo-able first
        redoStack: state.redo.slice().reverse(),
        push,
        undo,
        redo,
        canUndo: state.history.length > 0,
        canRedo: state.redo.length > 0,
        reset,
    };
}
