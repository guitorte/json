export interface TreeNode {
  id: string;                      // Unique deterministic ID based on the node's path
  key: string;                     // Original key name
  path: string;                    // Absolute path (e.g. "$.store.book[*].title")
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
  value?: any;                     // Raw value (only for leaf nodes)
  children?: TreeNode[];           // Children tree nodes
  selectedState: 'checked' | 'unchecked' | 'indeterminate';
  alias?: string;                  // Alias for projection mode
  isExpanded?: boolean;            // Node expansion state
}

export interface FlatNode {
  id: string;                      // Same as path
  key: string;                     // Key name
  path: string;                    // Absolute path
  type: TreeNode['type'];
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
  selectedState: 'checked' | 'unchecked' | 'indeterminate';
  alias?: string;                  // User-defined alias
  valueSnippet?: string;           // Formatted value preview
  value?: any;                     // Raw node value for leaf editing
}

export type EditorMode = 'prune' | 'extract';

export interface PresetExample {
  name: string;
  description: string;
  json: string;
}
