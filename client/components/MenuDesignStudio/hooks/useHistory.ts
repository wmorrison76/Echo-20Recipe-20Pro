import { useCallback, useRef, useState, useReducer } from "react";

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

type HistoryAction<T> =
  | { type: "PUSH"; payload: T }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "RESET"; payload: T };

interface UseHistoryOptions {
  maxStates?: number;
}

export function useHistory<T>(
  initialState: T,
  options: UseHistoryOptions = {}
): {
  state: T;
  setState: (newState: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
  history: HistoryState<T>;
} {
  const { maxStates = 50 } = options;

  const historyReducer = useCallback(
    (state: HistoryState<T>, action: HistoryAction<T>): HistoryState<T> => {
      switch (action.type) {
        case "PUSH": {
          // Don't add if same as present state
          if (JSON.stringify(state.present) === JSON.stringify(action.payload)) {
            return state;
          }

          const newPast = [...state.past, state.present];
          // Limit history size
          if (newPast.length > maxStates) {
            newPast.shift();
          }

          return {
            past: newPast,
            present: action.payload,
            future: [],
          };
        }

        case "UNDO": {
          if (state.past.length === 0) return state;

          const newPast = state.past.slice(0, -1);
          const newPresent = state.past[state.past.length - 1];
          const newFuture = [state.present, ...state.future];

          return {
            past: newPast,
            present: newPresent,
            future: newFuture,
          };
        }

        case "REDO": {
          if (state.future.length === 0) return state;

          const newFuture = state.future.slice(1);
          const newPresent = state.future[0];
          const newPast = [...state.past, state.present];

          return {
            past: newPast,
            present: newPresent,
            future: newFuture,
          };
        }

        case "RESET": {
          return {
            past: [],
            present: action.payload,
            future: [],
          };
        }

        default:
          return state;
      }
    },
    [maxStates]
  );

  const [history, dispatch] = useReducer(historyReducer, {
    past: [],
    present: initialState,
    future: [],
  });

  const debouncedPushRef = useRef<NodeJS.Timeout | null>(null);

  const setState = useCallback(
    (newState: T) => {
      // Clear existing debounce
      if (debouncedPushRef.current) {
        clearTimeout(debouncedPushRef.current);
      }

      // Debounce history push by 500ms to avoid excessive history entries
      debouncedPushRef.current = setTimeout(() => {
        dispatch({ type: "PUSH", payload: newState });
      }, 500);

      // Update immediate state without waiting for debounce
      // This is handled through the reducer's present state
    },
    []
  );

  // Immediate update for rapid feedback (doesn't create history entry)
  const immediateUpdate = useCallback((newState: T) => {
    dispatch({ type: "PUSH", payload: newState });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: "UNDO" });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: "REDO" });
  }, []);

  const clearHistory = useCallback(() => {
    dispatch({ type: "RESET", payload: history.present });
  }, [history.present]);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return {
    state: history.present,
    setState: immediateUpdate, // Changed to immediateUpdate for better UX
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    history,
  };
}
