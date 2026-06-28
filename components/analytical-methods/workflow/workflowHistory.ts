import { MAX_HISTORY, type WorkflowSnapshot } from "./types";
import { cloneSnapshot } from "./workflowSnapshot";

export type HistoryState = {
  past: WorkflowSnapshot[];
  present: WorkflowSnapshot;
  future: WorkflowSnapshot[];
};

export function historyCommit(state: HistoryState, next: WorkflowSnapshot): HistoryState {
  return {
    past: [...state.past, cloneSnapshot(state.present)].slice(-MAX_HISTORY),
    present: cloneSnapshot(next),
    future: [],
  };
}

export function historyUndo(state: HistoryState): HistoryState {
  if (state.past.length === 0) return state;
  const previous = state.past[state.past.length - 1]!;
  return {
    past: state.past.slice(0, -1),
    present: cloneSnapshot(previous),
    future: [cloneSnapshot(state.present), ...state.future],
  };
}

export function historyRedo(state: HistoryState): HistoryState {
  if (state.future.length === 0) return state;
  const next = state.future[0]!;
  return {
    past: [...state.past, cloneSnapshot(state.present)],
    present: cloneSnapshot(next),
    future: state.future.slice(1),
  };
}
