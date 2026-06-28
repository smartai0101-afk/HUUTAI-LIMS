"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ReactFlowProvider, useReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { saveMethodWorkflowAction } from "@/lib/actions/method-workflow";
import { AiExtractionBanner } from "@/components/analytical-methods/AiExtractionBanner";
import type { MethodWorkflowView } from "@/types/analytical-methods";
import type { WorkflowNodeType } from "@prisma/client";
import {
  WorkflowCanvas,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "./workflow/WorkflowCanvas";
import { WorkflowToolbar } from "./workflow/WorkflowToolbar";
import { WorkflowPropertiesPanel } from "./workflow/WorkflowPropertiesPanel";
import { WorkflowShortcutsModal } from "./workflow/WorkflowShortcutsModal";
import { useWorkflowHistory } from "./workflow/useWorkflowHistory";
import { useWorkflowKeyboardShortcuts } from "./workflow/useWorkflowKeyboardShortcuts";
import {
  buildSavePayload,
  cloneSnapshot,
  mergeSnapshot,
  serializeForCompare,
  workflowToSnapshot,
} from "./workflow/workflowSnapshot";
import { copySelection, duplicateSelection, pasteFromClipboard } from "./workflow/workflowClipboard";
import { AUTO_SAVE_MS, PROTECTED_NODE_IDS, type WorkflowClipboard, type WorkflowSnapshot } from "./workflow/types";

type Props = {
  methodId: string;
  workflow: MethodWorkflowView;
  editable: boolean;
};

function WorkflowEditorInner({ methodId, workflow, editable }: Props) {
  const initialSnapshot = useMemo(() => workflowToSnapshot(workflow), [workflow]);
  const {
    present,
    canUndo,
    canRedo,
    commit,
    applyTransient,
    undo,
    redo,
    resetBaseline,
    getPresent,
  } = useWorkflowHistory(initialSnapshot);

  const { setViewport, zoomIn, zoomOut } = useReactFlow();
  const clipboardRef = useRef<WorkflowClipboard | null>(null);
  const savedFingerprintRef = useRef(serializeForCompare(initialSnapshot));
  const workflowIdRef = useRef(workflow.id);
  const savingRef = useRef(false);
  const propertyEditBaselineRef = useRef<string | null>(null);

  const [newType, setNewType] = useState<WorkflowNodeType>("Step");
  const [saveMsg, setSaveMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [lastEditAt, setLastEditAt] = useState(0);

  const isDirty = serializeForCompare(present) !== savedFingerprintRef.current;

  useEffect(() => {
    if (workflow.id !== workflowIdRef.current && !isDirty) {
      workflowIdRef.current = workflow.id;
      const next = workflowToSnapshot(workflow);
      resetBaseline(next);
      savedFingerprintRef.current = serializeForCompare(next);
    }
  }, [workflow, isDirty, resetBaseline]);

  useEffect(() => {
    if (!editable || !isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [editable, isDirty]);

  const touchEdit = useCallback(() => setLastEditAt(Date.now()), []);

  const handleSave = useCallback(async () => {
    if (!editable || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setSaveMsg("");
    const snapshot = getPresent();
    const result = await saveMethodWorkflowAction(methodId, buildSavePayload(snapshot));
    savingRef.current = false;
    setSaving(false);
    if (result.error) {
      setSaveMsg(result.error);
      return;
    }
    savedFingerprintRef.current = serializeForCompare(snapshot);
    resetBaseline(snapshot);
    setSaveMsg("Đã lưu workflow (draft)");
  }, [editable, getPresent, methodId, resetBaseline]);

  useEffect(() => {
    if (!editable || !isDirty || savingRef.current) return;
    const timer = window.setTimeout(async () => {
      if (savingRef.current || !editable) return;
      setAutoSaving(true);
      await handleSave();
      setAutoSaving(false);
    }, AUTO_SAVE_MS);
    return () => window.clearTimeout(timer);
  }, [editable, isDirty, lastEditAt, handleSave]);

  const commitPresent = useCallback(() => {
    commit(cloneSnapshot(getPresent()));
    touchEdit();
  }, [commit, getPresent, touchEdit]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const filtered = changes.filter((c) => {
        if (c.type === "remove" && PROTECTED_NODE_IDS.has(c.id)) return false;
        return true;
      });

      const current = getPresent();
      const nextNodes = applyNodeChanges(filtered, current.nodes);
      const shouldCommit = filtered.some(
        (c) => c.type === "remove" || c.type === "add" || c.type === "replace",
      );

      if (shouldCommit) {
        commit(mergeSnapshot(current, { nodes: nextNodes }));
        touchEdit();
        return;
      }

      applyTransient((prev) => ({
        ...prev,
        nodes: nextNodes,
      }));
    },
    [applyTransient, commit, getPresent, touchEdit],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const current = getPresent();
      const nextEdges = applyEdgeChanges(changes, current.edges);

      if (changes.some((c) => c.type === "remove")) {
        commit(mergeSnapshot(current, { edges: nextEdges }));
        touchEdit();
        return;
      }

      applyTransient((prev) => ({
        ...prev,
        edges: nextEdges,
      }));
    },
    [applyTransient, commit, getPresent, touchEdit],
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      const current = getPresent();
      commit(
        mergeSnapshot(current, {
          edges: addEdge(connection, current.edges),
        }),
      );
      touchEdit();
    },
    [commit, getPresent, touchEdit],
  );

  const handleNodeDragStop = useCallback(() => {
    commitPresent();
  }, [commitPresent]);

  const handleViewportChange = useCallback(
    (viewport: WorkflowSnapshot["viewport"]) => {
      applyTransient((prev) => ({ ...prev, viewport }));
    },
    [applyTransient],
  );

  const addNode = useCallback(() => {
    if (!editable) return;
    const current = getPresent();
    const id = `node-${crypto.randomUUID().slice(0, 8)}`;
    const next = mergeSnapshot(current, {
      nodes: [
        ...current.nodes.map((n) => ({ ...n, selected: false })),
        {
          id,
          type: "workflowNode",
          position: { x: 200 + current.nodes.length * 20, y: 200 + current.nodes.length * 20 },
          data: { label: "Bước mới", description: "", nodeType: newType },
          selected: true,
        },
      ],
    });
    commit(next);
    touchEdit();
  }, [commit, editable, getPresent, newType, touchEdit]);

  const deleteSelection = useCallback(() => {
    if (!editable) return;
    const current = getPresent();
    const selectedNodeIds = new Set(
      current.nodes.filter((n) => n.selected && !PROTECTED_NODE_IDS.has(n.id)).map((n) => n.id),
    );
    const selectedEdgeIds = new Set(current.edges.filter((e) => e.selected).map((e) => e.id));

    if (selectedNodeIds.size === 0 && selectedEdgeIds.size === 0) return;

    const next = mergeSnapshot(current, {
      nodes: current.nodes.filter((n) => !selectedNodeIds.has(n.id)),
      edges: current.edges.filter(
        (e) =>
          !selectedEdgeIds.has(e.id) &&
          !selectedNodeIds.has(e.source) &&
          !selectedNodeIds.has(e.target),
      ),
    });
    commit(next);
    touchEdit();
  }, [commit, editable, getPresent, touchEdit]);

  const copyToClipboard = useCallback(() => {
    if (!editable) return;
    const current = getPresent();
    clipboardRef.current = copySelection(current.nodes, current.edges);
  }, [editable, getPresent]);

  const pasteFromInternalClipboard = useCallback(() => {
    if (!editable || !clipboardRef.current) return;
    const current = getPresent();
    const pasted = pasteFromClipboard(clipboardRef.current, current.nodes, current.edges);
    commit(mergeSnapshot(current, { nodes: pasted.nodes, edges: pasted.edges }));
    touchEdit();
  }, [commit, editable, getPresent, touchEdit]);

  const duplicateSelected = useCallback(() => {
    if (!editable) return;
    const current = getPresent();
    const duplicated = duplicateSelection(current.nodes, current.edges);
    if (!duplicated) return;
    commit(mergeSnapshot(current, duplicated));
    touchEdit();
  }, [commit, editable, getPresent, touchEdit]);

  const selectAllNodes = useCallback(() => {
    if (!editable) return;
    applyTransient((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => ({ ...n, selected: true })),
      edges: prev.edges.map((e) => ({ ...e, selected: false })),
    }));
  }, [applyTransient, editable]);

  const clearSelection = useCallback(() => {
    applyTransient((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => ({ ...n, selected: false })),
      edges: prev.edges.map((e) => ({ ...e, selected: false })),
    }));
  }, [applyTransient]);

  const resetZoom = useCallback(() => {
    const current = getPresent();
    void setViewport({ ...current.viewport, zoom: 1 });
    applyTransient((prev) => ({ ...prev, viewport: { ...prev.viewport, zoom: 1 } }));
  }, [applyTransient, getPresent, setViewport]);

  const updateNodeProperty = useCallback(
    (nodeId: string, field: "label" | "description" | "nodeType", value: string) => {
      if (!propertyEditBaselineRef.current) {
        propertyEditBaselineRef.current = serializeForCompare(getPresent());
      }
      applyTransient((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, [field]: value } } : n,
        ),
      }));
    },
    [applyTransient, getPresent],
  );

  const commitPropertyEdit = useCallback(() => {
    if (!propertyEditBaselineRef.current) return;
    const currentFingerprint = serializeForCompare(getPresent());
    if (currentFingerprint !== propertyEditBaselineRef.current) {
      commitPresent();
    }
    propertyEditBaselineRef.current = null;
  }, [commitPresent, getPresent]);

  const shortcutHandlers = useMemo(
    () => ({
      onUndo: undo,
      onRedo: redo,
      onSave: () => void handleSave(),
      onCopy: copyToClipboard,
      onPaste: pasteFromInternalClipboard,
      onDuplicate: duplicateSelected,
      onDelete: deleteSelection,
      onSelectAll: selectAllNodes,
      onClearSelection: clearSelection,
      onZoomIn: () => zoomIn(),
      onZoomOut: () => zoomOut(),
      onResetZoom: resetZoom,
    }),
    [
      undo,
      redo,
      handleSave,
      copyToClipboard,
      pasteFromInternalClipboard,
      duplicateSelected,
      deleteSelection,
      selectAllNodes,
      clearSelection,
      zoomIn,
      zoomOut,
      resetZoom,
    ],
  );

  useWorkflowKeyboardShortcuts({ enabled: editable, handlers: shortcutHandlers });

  return (
    <div className="space-y-4">
      <AiExtractionBanner />
      {!editable ? (
        <p className="text-sm text-amber-700">Phiên bản đã phê duyệt — tạo phiên bản mới để chỉnh sửa.</p>
      ) : null}

      <WorkflowToolbar
        editable={editable}
        newType={newType}
        onNewTypeChange={setNewType}
        onAddNode={addNode}
        onDelete={deleteSelection}
        onSave={() => void handleSave()}
        onUndo={undo}
        onRedo={redo}
        onShowShortcuts={() => setShortcutsOpen(true)}
        canUndo={canUndo}
        canRedo={canRedo}
        isDirty={isDirty}
        saving={saving}
        autoSaving={autoSaving}
        saveMsg={saveMsg}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        <div className="h-[520px] rounded-2xl border border-slate-200 bg-slate-50">
          <WorkflowCanvas
            editable={editable}
            snapshot={present}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onNodeDragStop={handleNodeDragStop}
            onViewportChange={handleViewportChange}
            restoreViewport={initialSnapshot.viewport}
          />
        </div>

        <WorkflowPropertiesPanel
          nodes={present.nodes}
          editable={editable}
          onUpdateNode={updateNodeProperty}
          onCommitPropertyEdit={commitPropertyEdit}
        />
      </div>

      <WorkflowShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}

export function WorkflowEditor(props: Props) {
  return (
    <ReactFlowProvider>
      <WorkflowEditorInner {...props} />
    </ReactFlowProvider>
  );
}
