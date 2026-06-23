import { useState, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  List,
  Tag,
  Pencil,
  Check,
  X,
  Compass,
  Maximize2,
  Minimize2,
  CheckSquare,
  Square,
  MinusSquare
} from 'lucide-react';
import { useJSONStore } from '../store/jsonStore';
import { TreeNode, FlatNode } from '../types';
import { flattenTree } from '../utils/jsonEngine';

export default function TreePanel() {
  const {
    treeRoot,
    selectedPaths,
    indeterminatePaths,
    expandedPaths,
    searchQuery,
    aliases,
    togglePath,
    setAlias,
    setNodeValue,
    toggleExpanded,
    expandAll,
    collapseAll,
    selectAll,
    selectNone,
    setSearchQuery
  } = useJSONStore();

  // Keep track of the node currently undergoing alias editing
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [tempAlias, setTempAlias] = useState('');

  // Keep track of the node currently undergoing value editing
  const [editingValuePath, setEditingValuePath] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  // Auto-expand parents of matching search query items, and compute visible nodes
  const visibleFlatNodes = useMemo(() => {
    if (!treeRoot) return [];

    // 1. Flatten the tree based on current expandedPaths
    const flat = flattenTree(treeRoot);

    // 2. Filter or highlight based on search query
    // If search is active, we can highlight matching elements
    return flat;
  }, [treeRoot, expandedPaths, selectedPaths, indeterminatePaths, aliases]);

  const handleStartEditAlias = (path: string, currentAlias?: string) => {
    setEditingPath(path);
    setTempAlias(currentAlias || '');
  };

  const handleSaveAlias = (path: string) => {
    setAlias(path, tempAlias);
    setEditingPath(null);
  };

  const handleCancelAlias = () => {
    setEditingPath(null);
  };

  // Check if a node matches the search query (case insensitive)
  const isMatch = (key: string, path: string) => {
    if (!searchQuery) return false;
    const q = searchQuery.toLowerCase();
    return key.toLowerCase().includes(q) || path.toLowerCase().includes(q);
  };

  // Simple function to get type colors
  const getTypeBadgeClass = (type: TreeNode['type']) => {
    switch (type) {
      case 'object': return 'bg-sky-50 text-sky-700 border-sky-100';
      case 'array': return 'bg-purple-50 text-purple-700 border-purple-100';
      case 'string': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'number': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'boolean': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="flex h-full flex-col bg-white border-r border-slate-200">
      {/* Panel Toolbar Header */}
      <div className="flex flex-col border-b border-slate-200 bg-slate-50 p-2 lg:p-3.5 shrink-0">
        <span className="hidden lg:flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <Compass className="h-4 w-4 text-slate-400" />
          2. Schema Selection & Alias Map
        </span>
 
        {/* Global Key Search Bar */}
        <div className="relative mt-0 lg:mt-3">
          <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keys (e.g. customer, email)..."
            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pr-3 pl-9 text-xs placeholder-slate-400 shadow-2xs transition focus:border-slate-400 focus:outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute top-2.5 right-2.5 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
 
        {/* Dynamic Action Buttons */}
        <div className="mt-2 lg:mt-3 flex flex-wrap items-center justify-between gap-1.5 border-t border-slate-200/60 pt-2 lg:pt-3">
          <div className="flex items-center gap-1">
            <button
              onClick={selectAll}
              className="rounded-md bg-white border border-slate-200 px-1.5 py-0.5 lg:px-2 lg:py-1 text-[10px] lg:text-[11px] font-medium text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              Select All
            </button>
            <button
              onClick={selectNone}
              className="rounded-md bg-white border border-slate-200 px-1.5 py-0.5 lg:px-2 lg:py-1 text-[10px] lg:text-[11px] font-medium text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              Deselect All
            </button>
          </div>
 
          <div className="flex items-center gap-1">
            <button
              onClick={expandAll}
              title="Expand All"
              className="flex items-center gap-1 rounded-md bg-white border border-slate-200 p-0.5 lg:p-1 text-slate-600 hover:bg-slate-50"
            >
              <Maximize2 className="h-3 w-3" />
              <span className="text-[10px] lg:text-[11px] font-medium pr-1">Expand</span>
            </button>
            <button
              onClick={collapseAll}
              title="Collapse All"
              className="flex items-center gap-1 rounded-md bg-white border border-slate-200 p-0.5 lg:p-1 text-slate-600 hover:bg-slate-50"
            >
              <Minimize2 className="h-3 w-3" />
              <span className="text-[10px] lg:text-[11px] font-medium pr-1">Collapse</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Schema Checklist Viewport */}
      <div className="flex-1 overflow-y-auto px-1 py-2">
        {visibleFlatNodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Tag className="h-8 w-8 text-slate-300" />
            <p className="mt-2 text-xs text-slate-500">No schema keys loaded. Validate your JSON.</p>
          </div>
        ) : (
          <div className="min-w-max pr-4">
            {visibleFlatNodes.map((node: FlatNode) => {
              const matched = isMatch(node.key, node.path);
              const isRoot = node.path === '$';

              // If a search query is active and this node/children do not match, we dim it slightly
              const dimClass = searchQuery && !matched ? 'opacity-55' : 'opacity-100';

              return (
                <div
                  key={node.id}
                  className={`group flex items-center gap-1.5 py-2 lg:py-1 px-2.5 rounded-md hover:bg-slate-50 transition-colors ${dimClass}`}
                  style={{ paddingLeft: `${Math.max(node.depth * 16 + 8, 8)}px` }}
                >
                  {/* Expand/Collapse Seta */}
                  <div className="w-8 h-8 lg:w-5 lg:h-5 flex items-center justify-center shrink-0">
                    {node.hasChildren ? (
                      <button
                        onClick={() => toggleExpanded(node.path)}
                        className="p-2 lg:p-0.5 rounded-md text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
                      >
                        {node.isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </button>
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-slate-300/60" />
                    )}
                  </div>

                  {/* Checkbox Trigger (Fitts's Law 44px clickable target box) */}
                  <button
                    onClick={() => togglePath(node.path, node.selectedState !== 'checked')}
                    className="flex h-8 w-8 lg:h-6 lg:w-6 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 transition shrink-0"
                    title={`Toggle selection of ${node.key}`}
                  >
                    {node.selectedState === 'checked' && (
                      <CheckSquare className="h-4.5 w-4.5 text-slate-900 fill-slate-100" />
                    )}
                    {node.selectedState === 'unchecked' && (
                      <Square className="h-4.5 w-4.5 text-slate-300 hover:text-slate-500" />
                    )}
                    {node.selectedState === 'indeterminate' && (
                      <MinusSquare className="h-4.5 w-4.5 text-slate-500" />
                    )}
                  </button>

                  {/* Key icon */}
                  <div className="text-slate-400 shrink-0">
                    {node.type === 'object' ? (
                      node.isExpanded ? <FolderOpen className="h-3.5 w-3.5" /> : <Folder className="h-3.5 w-3.5" />
                    ) : node.type === 'array' ? (
                      <List className="h-3.5 w-3.5 text-purple-400" />
                    ) : (
                      <Tag className="h-3 w-3 text-slate-400" />
                    )}
                  </div>

                  {/* Key Label Text (Highlighted if matches query) */}
                  <span
                    className={`font-mono text-xs select-none tracking-tight cursor-pointer ${
                      isRoot ? 'font-bold text-slate-800' : 'text-slate-700'
                    } ${matched ? 'bg-amber-100 text-slate-950 font-semibold px-0.5 rounded-xs' : ''}`}
                    onClick={() => togglePath(node.path, node.selectedState !== 'checked')}
                  >
                    {node.key}
                  </span>

                  {/* Value Snippet Preview (only for leaf nodes) */}
                  {!node.hasChildren && node.value !== undefined && (
                    editingValuePath === node.path ? (
                      <div className="flex items-center gap-1 bg-slate-50 p-0.5 shadow-2xs rounded-md border border-slate-300">
                        <span className="text-[11px] font-mono text-slate-400">:</span>
                        <input
                          type="text"
                          value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setNodeValue(node.path, tempValue);
                              setEditingValuePath(null);
                            }
                            if (e.key === 'Escape') {
                              setEditingValuePath(null);
                            }
                          }}
                          onBlur={() => {
                            setNodeValue(node.path, tempValue);
                            setEditingValuePath(null);
                          }}
                          className="w-36 lg:w-28 bg-white px-1.5 py-1 lg:py-0.5 font-mono text-[11px] text-slate-800 border-0 focus:outline-hidden ring-1 ring-slate-200 rounded-sm animate-fade-in"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <span
                        onDoubleClick={() => {
                          setEditingValuePath(node.path);
                          setTempValue(node.value !== undefined ? String(node.value) : '');
                        }}
                        onClick={() => {
                          setEditingValuePath(node.path);
                          setTempValue(node.value !== undefined ? String(node.value) : '');
                        }}
                        className="font-mono text-[11px] text-indigo-600 bg-indigo-50 hover:bg-indigo-100/80 px-1.5 py-0.5 rounded-sm cursor-edit transition max-w-48 truncate select-none border border-indigo-100/30"
                        title="Click to edit this value"
                      >
                        : {node.valueSnippet}
                      </span>
                    )
                  )}

                  {/* Type Badge */}
                  <span className={`px-1.5 py-0.5 font-mono text-[9px] rounded-sm font-semibold border ${getTypeBadgeClass(node.type)}`}>
                    {node.type}
                  </span>

                  {/* Absolute path display on hover */}
                  <span className="hidden lg:inline-block opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[9px] text-slate-300 ml-2 select-all">
                    {node.path}
                  </span>

                  {/* Alias Management Column */}
                  <div className="ml-auto flex items-center gap-1.5 pl-3">
                    {editingPath === node.path ? (
                      <div className="flex items-center gap-1 rounded-md border border-slate-300 bg-slate-50 p-0.5 shadow-2xs">
                        <input
                          type="text"
                          value={tempAlias}
                          onChange={(e) => setTempAlias(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveAlias(node.path);
                            if (e.key === 'Escape') handleCancelAlias();
                          }}
                          placeholder="New alias name..."
                          className="w-24 bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-800 border-0 focus:outline-hidden"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveAlias(node.path)}
                          className="rounded-sm bg-emerald-500 p-0.5 text-white hover:bg-emerald-600"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          onClick={handleCancelAlias}
                          className="rounded-sm bg-slate-200 p-0.5 text-slate-600 hover:bg-slate-300"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {node.alias ? (
                          <span className="inline-flex items-center gap-1 rounded-sm bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-indigo-700">
                            → {node.alias}
                          </span>
                        ) : null}
                        
                        {!isRoot && (
                          <button
                            onClick={() => handleStartEditAlias(node.path, node.alias)}
                            className="lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100 p-2 lg:p-1 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100 transition shrink-0 opacity-100"
                            title="Edit Alias name"
                          >
                            <Pencil className="h-3.5 w-3.5 lg:h-3 lg:w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
