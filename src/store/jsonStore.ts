import { create } from 'zustand';
import { TreeNode, FlatNode, EditorMode } from '../types';
import { buildVisualTree, flattenTree, updateJSONValueAtPath } from '../utils/jsonEngine';
import { createJSONWorker } from '../utils/jsonWorkerBlob';

interface JSONEditorState {
  // Input states
  rawInput: string;
  parsedJson: any;
  isValid: boolean;
  validationError: string | null;
  
  // Tree states
  treeRoot: TreeNode | null;
  selectedPaths: Set<string>;
  indeterminatePaths: Set<string>;
  aliases: Record<string, string>;
  expandedPaths: Set<string>;
  searchQuery: string;
  
  // Output and Mode states
  editorMode: EditorMode;
  flattenToRows: boolean;
  outputJson: string;
  isProcessing: boolean;
  processingError: string | null;

  // Actions
  setRawInput: (input: string) => void;
  beautifyInput: () => void;
  loadPreset: (name: string, json: string) => void;
  togglePath: (path: string, checked: boolean) => void;
  setAlias: (path: string, alias: string) => void;
  setNodeValue: (path: string, newValue: any) => void;
  toggleExpanded: (path: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  selectAll: () => void;
  selectNone: () => void;
  setEditorMode: (mode: EditorMode) => void;
  setFlattenToRows: (flat: boolean) => void;
  setSearchQuery: (query: string) => void;
  triggerOutputUpdate: () => void;
}

// Global active Web Worker instance for output updates
let activeWorker: Worker | null = null;

// Deeply find a tree node by path
function findNodeByPath(node: TreeNode, path: string): TreeNode | null {
  if (node.path === path) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeByPath(child, path);
      if (found) return found;
    }
  }
  return null;
}

// Recursively set selected state top-down
function setPathSelectionRecursive(
  node: TreeNode,
  checked: boolean,
  selectedSet: Set<string>,
  indeterminateSet: Set<string>
) {
  if (checked) {
    selectedSet.add(node.path);
    indeterminateSet.delete(node.path);
  } else {
    selectedSet.delete(node.path);
    indeterminateSet.delete(node.path);
  }
  
  if (node.children) {
    for (const child of node.children) {
      setPathSelectionRecursive(child, checked, selectedSet, indeterminateSet);
    }
  }
}

// Recursively recalculate selection states bottom-up
function updateNodeSelectionState(
  node: TreeNode,
  selectedSet: Set<string>,
  indeterminateSet: Set<string>
): 'checked' | 'unchecked' | 'indeterminate' {
  if (!node.children || node.children.length === 0) {
    return selectedSet.has(node.path) ? 'checked' : 'unchecked';
  }
  
  let checkedCount = 0;
  let uncheckedCount = 0;
  
  for (const child of node.children) {
    const childState = updateNodeSelectionState(child, selectedSet, indeterminateSet);
    if (childState === 'checked') checkedCount++;
    else if (childState === 'unchecked') uncheckedCount++;
  }
  
  if (checkedCount === node.children.length) {
    selectedSet.add(node.path);
    indeterminateSet.delete(node.path);
    return 'checked';
  } else if (uncheckedCount === node.children.length) {
    selectedSet.delete(node.path);
    indeterminateSet.delete(node.path);
    return 'unchecked';
  } else {
    selectedSet.delete(node.path);
    indeterminateSet.add(node.path);
    return 'indeterminate';
  }
}

// Recursively collect all paths in a tree
function collectAllPaths(node: TreeNode, paths: Set<string>) {
  paths.add(node.path);
  if (node.children) {
    for (const child of node.children) {
      collectAllPaths(child, paths);
    }
  }
}

const INITIAL_JSON = JSON.stringify({
  "welcome": "Welcome to JSON Easy Editor!",
  "instructions": "Prune or extract fields from this JSON",
  "features": [
    { "id": 1, "name": "Tree Checklist selection", "details": "Check parents or children to prune fields" },
    { "id": 2, "name": "Alias Renaming / Mapping", "details": "Use the pencil icon to assign a new output name" },
    { "id": 3, "name": "Preserve (Pruning) vs Extract (Projection)", "details": "Preserve keeps structural format, Extract flattens or projects" }
  ],
  "status": {
    "ready": true,
    "environment": "Client-Side High Performance"
  }
}, null, 2);

export const useJSONStore = create<JSONEditorState>((set, get) => {
  
  // Helper to trigger background work
  const runWorkerUpdate = () => {
    const { parsedJson, isValid, selectedPaths, aliases, editorMode, flattenToRows, rawInput } = get();
    
    if (!isValid || !parsedJson) {
      set({ outputJson: '', isProcessing: false });
      return;
    }
    
    // Check if anything is selected. If empty, output empty JSON or appropriate reminder.
    if (selectedPaths.size === 0) {
      set({ outputJson: '{}', isProcessing: false });
      return;
    }

    set({ isProcessing: true, processingError: null });

    if (activeWorker) {
      activeWorker.terminate();
    }

    activeWorker = createJSONWorker();
    
    activeWorker.onmessage = (e: MessageEvent) => {
      const { success, result, error } = e.data;
      if (success) {
        set({
          outputJson: JSON.stringify(result, null, 2),
          isProcessing: false,
          processingError: null
        });
      } else {
        set({
          outputJson: '',
          isProcessing: false,
          processingError: error || 'Error executing transformation'
        });
      }
    };

    activeWorker.postMessage({
      action: editorMode === 'prune' ? 'prune' : 'extract',
      jsonStr: rawInput,
      selectedPaths: Array.from(selectedPaths),
      aliases,
      flattenToRows
    });
  };

  // Setup initial tree and state
  let initialParsed: any = null;
  let initialValid = false;
  let initialError: string | null = null;
  let initialTree: TreeNode | null = null;
  const initialSelected = new Set<string>();
  const initialIndeterminate = new Set<string>();
  const initialExpanded = new Set<string>();

  try {
    initialParsed = JSON.parse(INITIAL_JSON);
    initialValid = true;
    initialTree = buildVisualTree(initialParsed, 'root', '$', initialSelected, initialIndeterminate, {}, initialExpanded);
    // Expand root by default
    initialExpanded.add('$');
    if (initialTree && initialTree.children) {
      for (const c of initialTree.children) {
        initialExpanded.add(c.path);
      }
    }
    // Select all by default initially
    collectAllPaths(initialTree, initialSelected);
    initialTree = buildVisualTree(initialParsed, 'root', '$', initialSelected, initialIndeterminate, {}, initialExpanded);
  } catch (err: any) {
    initialError = err.message;
  }

  return {
    rawInput: INITIAL_JSON,
    parsedJson: initialParsed,
    isValid: initialValid,
    validationError: initialError,
    
    treeRoot: initialTree,
    selectedPaths: initialSelected,
    indeterminatePaths: initialIndeterminate,
    aliases: {},
    expandedPaths: initialExpanded,
    searchQuery: '',
    
    editorMode: 'prune',
    flattenToRows: false,
    outputJson: INITIAL_JSON,
    isProcessing: false,
    processingError: null,

    setRawInput: (input: string) => {
      try {
        if (!input.trim()) {
          set({
            rawInput: input,
            parsedJson: null,
            isValid: false,
            validationError: "JSON cannot be empty.",
            treeRoot: null
          });
          return;
        }

        const parsed = JSON.parse(input);
        
        // Build new tree but retain some state where possible
        const selectedSet = new Set<string>();
        const indeterminateSet = new Set<string>();
        const expandedSet = new Set<string>(get().expandedPaths);
        
        // If it's a completely new file, expand root and its first-level kids
        if (expandedSet.size <= 1) {
          expandedSet.add('$');
        }

        const tempTree = buildVisualTree(parsed, 'root', '$', selectedSet, indeterminateSet, get().aliases, expandedSet);
        
        // By default, select everything in the new tree
        collectAllPaths(tempTree, selectedSet);
        
        // Re-build tree with exact selection
        const finalTree = buildVisualTree(parsed, 'root', '$', selectedSet, indeterminateSet, get().aliases, expandedSet);

        // Auto-detect if we have an array of objects to toggle flattenToRows
        let defaultFlatten = false;
        if (Array.isArray(parsed)) {
          const hasObjs = parsed.some(x => x && typeof x === 'object' && !Array.isArray(x));
          if (hasObjs) defaultFlatten = true;
        } else {
          // Check if there is an array of objects inside the root
          for (const k of Object.keys(parsed)) {
            if (Array.isArray(parsed[k]) && parsed[k].some((x: any) => x && typeof x === 'object' && !Array.isArray(x))) {
              defaultFlatten = true;
              break;
            }
          }
        }

        set({
          rawInput: input,
          parsedJson: parsed,
          isValid: true,
          validationError: null,
          treeRoot: finalTree,
          selectedPaths: selectedSet,
          indeterminatePaths: indeterminateSet,
          flattenToRows: defaultFlatten
        });

        get().triggerOutputUpdate();
      } catch (err: any) {
        set({
          rawInput: input,
          isValid: false,
          validationError: err.message || "Invalid JSON syntax."
        });
      }
    },

    beautifyInput: () => {
      const { isValid, parsedJson } = get();
      if (isValid && parsedJson) {
        const beautified = JSON.stringify(parsedJson, null, 2);
        set({ rawInput: beautified });
      }
    },

    loadPreset: (name: string, json: string) => {
      // Clear state for a fresh load
      set({ aliases: {}, searchQuery: '' });
      get().setRawInput(json);
    },

    togglePath: (path: string, checked: boolean) => {
      const { treeRoot, selectedPaths, indeterminatePaths } = get();
      if (!treeRoot) return;

      const targetNode = findNodeByPath(treeRoot, path);
      if (!targetNode) return;

      const newSelected = new Set(selectedPaths);
      const newIndeterminate = new Set(indeterminatePaths);

      // 1. Top-down update on children
      setPathSelectionRecursive(targetNode, checked, newSelected, newIndeterminate);

      // 2. Bottom-up recalculation starting from root
      updateNodeSelectionState(treeRoot, newSelected, newIndeterminate);

      // 3. Rebuild tree structure to refresh UI selection state values
      const refreshedTree = buildVisualTree(
        get().parsedJson,
        'root',
        '$',
        newSelected,
        newIndeterminate,
        get().aliases,
        get().expandedPaths
      );

      set({
        selectedPaths: newSelected,
        indeterminatePaths: newIndeterminate,
        treeRoot: refreshedTree
      });

      get().triggerOutputUpdate();
    },

    setAlias: (path: string, alias: string) => {
      const newAliases = { ...get().aliases };
      if (!alias.trim()) {
        delete newAliases[path];
      } else {
        newAliases[path] = alias.trim();
      }

      // Rebuild tree structure to refresh UI values
      const refreshedTree = buildVisualTree(
        get().parsedJson,
        'root',
        '$',
        get().selectedPaths,
        get().indeterminatePaths,
        newAliases,
        get().expandedPaths
      );

      set({
        aliases: newAliases,
        treeRoot: refreshedTree
      });

      get().triggerOutputUpdate();
    },

    setNodeValue: (path: string, newValue: any) => {
      const { parsedJson, selectedPaths, indeterminatePaths, aliases, expandedPaths } = get();
      if (!parsedJson) return;

      const updatedJson = updateJSONValueAtPath(parsedJson, path, newValue);
      const updatedRaw = JSON.stringify(updatedJson, null, 2);

      const refreshedTree = buildVisualTree(
        updatedJson,
        'root',
        '$',
        selectedPaths,
        indeterminatePaths,
        aliases,
        expandedPaths
      );

      set({
        parsedJson: updatedJson,
        rawInput: updatedRaw,
        treeRoot: refreshedTree
      });

      get().triggerOutputUpdate();
    },

    toggleExpanded: (path: string) => {
      const newExpanded = new Set(get().expandedPaths);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }

      // Rebuild tree
      const refreshedTree = buildVisualTree(
        get().parsedJson,
        'root',
        '$',
        get().selectedPaths,
        get().indeterminatePaths,
        get().aliases,
        newExpanded
      );

      set({
        expandedPaths: newExpanded,
        treeRoot: refreshedTree
      });
    },

    expandAll: () => {
      const { treeRoot } = get();
      if (!treeRoot) return;

      const newExpanded = new Set<string>();
      collectAllPaths(treeRoot, newExpanded);

      const refreshedTree = buildVisualTree(
        get().parsedJson,
        'root',
        '$',
        get().selectedPaths,
        get().indeterminatePaths,
        get().aliases,
        newExpanded
      );

      set({
        expandedPaths: newExpanded,
        treeRoot: refreshedTree
      });
    },

    collapseAll: () => {
      const newExpanded = new Set<string>(['$']);

      const refreshedTree = buildVisualTree(
        get().parsedJson,
        'root',
        '$',
        get().selectedPaths,
        get().indeterminatePaths,
        get().aliases,
        newExpanded
      );

      set({
        expandedPaths: newExpanded,
        treeRoot: refreshedTree
      });
    },

    selectAll: () => {
      const { treeRoot } = get();
      if (!treeRoot) return;

      const newSelected = new Set<string>();
      collectAllPaths(treeRoot, newSelected);
      const newIndeterminate = new Set<string>();

      const refreshedTree = buildVisualTree(
        get().parsedJson,
        'root',
        '$',
        newSelected,
        newIndeterminate,
        get().aliases,
        get().expandedPaths
      );

      set({
        selectedPaths: newSelected,
        indeterminatePaths: newIndeterminate,
        treeRoot: refreshedTree
      });

      get().triggerOutputUpdate();
    },

    selectNone: () => {
      const newSelected = new Set<string>();
      const newIndeterminate = new Set<string>();

      const refreshedTree = buildVisualTree(
        get().parsedJson,
        'root',
        '$',
        newSelected,
        newIndeterminate,
        get().aliases,
        get().expandedPaths
      );

      set({
        selectedPaths: newSelected,
        indeterminatePaths: newIndeterminate,
        treeRoot: refreshedTree
      });

      get().triggerOutputUpdate();
    },

    setEditorMode: (mode: EditorMode) => {
      set({ editorMode: mode });
      get().triggerOutputUpdate();
    },

    setFlattenToRows: (flat: boolean) => {
      set({ flattenToRows: flat });
      get().triggerOutputUpdate();
    },

    setSearchQuery: (query: string) => {
      set({ searchQuery: query });
    },

    triggerOutputUpdate: () => {
      runWorkerUpdate();
    }
  };
});
