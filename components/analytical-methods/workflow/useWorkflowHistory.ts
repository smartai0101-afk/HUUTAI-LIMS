"use client";

import { useCallback, useRef, useState } from "react";
import { type WorkflowSnapshot } from "./types";
import { cloneSnapshot } from "./workflowSnapshot";
import { historyCommit, historyRedo, historyUndo, type HistoryState } from "./workflowHistory";

export function useWorkflowHistory(initial: WorkflowSnapshot) {
  const [state, setState] = useState<HistoryState>(() => ({
    past: [],
    present: cloneSnapshot(initial),
    future: [],
  }));

  const presentRef = useRef(state.present);
  presentRef.current = state.present;

  const commit = useCallback((next: WorkflowSnapshot) => {
    setState((prev) => {
      const nextState = historyCommit(prev, next);
      presentRef.current = nextState.present;
      return nextState;
    });
  }, []);

  const applyTransient = useCallback((updater: (prev: WorkflowSnapshot) => WorkflowSnapshot) => {
    setState((prev) => {
      const present = cloneSnapshot(updater(prev.present));
      presentRef.current = present;
      return { ...prev, present };
    });
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      const nextState = historyUndo(prev);
      presentRef.current = nextState.present;
      return nextState;
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      const nextState = historyRedo(prev);
      presentRef.current = nextState.present;
      return nextState;
    });
  }, []);

  const resetBaseline = useCallback((snapshot: WorkflowSnapshot) => {
    const present = cloneSnapshot(snapshot);
    presentRef.current = present;
    setState({
      past: [],
      present,
      future: [],
    });
  }, []);

  return {
    present: state.present,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    commit,
    applyTransient,
    undo,
    redo,
    resetBaseline,
    getPresent: () => presentRef.current,
  };
}
