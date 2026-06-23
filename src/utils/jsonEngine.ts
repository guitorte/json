import { TreeNode, FlatNode } from '../types';

export function isArrayOfObjects(arr: any[]): boolean {
  if (!Array.isArray(arr) || arr.length === 0) return false;
  return arr.some(item => item && typeof item === 'object' && !Array.isArray(item));
}

export function mergeArraySchemas(arr: any[]): any {
  const merged: any = {};
  for (const item of arr) {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      for (const key of Object.keys(item)) {
        if (!(key in merged)) {
          merged[key] = item[key];
        } else if (item[key] !== null && typeof item[key] === 'object') {
          if (merged[key] && typeof merged[key] === 'object') {
            if (Array.isArray(merged[key]) && Array.isArray(item[key])) {
              merged[key] = [...merged[key], ...item[key]];
            } else if (!Array.isArray(merged[key]) && !Array.isArray(item[key])) {
              merged[key] = mergeArraySchemas([merged[key], item[key]]);
            }
          }
        }
      }
    }
  }
  return merged;
}

function getValueType(value: any): TreeNode['type'] {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') return t;
  return 'object';
}

export function buildVisualTree(
  value: any,
  key: string = 'root',
  path: string = '$',
  selectedPaths: Set<string> = new Set(),
  indeterminatePaths: Set<string> = new Set(),
  aliases: Record<string, string> = {},
  expandedPaths: Set<string> = new Set()
): TreeNode {
  const type = getValueType(value);
  const id = path;
  
  const node: TreeNode = {
    id,
    key,
    path,
    type,
    selectedState: selectedPaths.has(path)
      ? 'checked'
      : indeterminatePaths.has(path)
        ? 'indeterminate'
        : 'unchecked',
    alias: aliases[path] || undefined,
    isExpanded: expandedPaths.has(path),
  };

  if (type === 'object' && value !== null) {
    const children: TreeNode[] = [];
    for (const k of Object.keys(value)) {
      const childPath = path === '$' ? `$.${k}` : `${path}.${k}`;
      children.push(buildVisualTree(value[k], k, childPath, selectedPaths, indeterminatePaths, aliases, expandedPaths));
    }
    // Sort children by key name for consistent display
    children.sort((a, b) => a.key.localeCompare(b.key));
    node.children = children;
  } else if (type === 'array' && value !== null) {
    const children: TreeNode[] = [];
    if (isArrayOfObjects(value)) {
      const merged = mergeArraySchemas(value);
      for (const k of Object.keys(merged)) {
        const childPath = `${path}[*].${k}`;
        children.push(buildVisualTree(merged[k], k, childPath, selectedPaths, indeterminatePaths, aliases, expandedPaths));
      }
      children.sort((a, b) => a.key.localeCompare(b.key));
    } else {
      if (value.length > 0) {
        const childPath = `${path}[*]`;
        children.push(buildVisualTree(value[0], '*', childPath, selectedPaths, indeterminatePaths, aliases, expandedPaths));
      }
    }
    node.children = children;
  } else {
    node.value = value;
  }

  return node;
}

export function flattenTree(
  node: TreeNode,
  depth: number = 0,
  visibleNodes: FlatNode[] = []
): FlatNode[] {
  const hasChildren = !!(node.children && node.children.length > 0);
  
  let valueSnippet = '';
  if (!hasChildren && node.value !== undefined) {
    if (typeof node.value === 'string') {
      valueSnippet = node.value.length > 30 ? `"${node.value.substring(0, 30)}..."` : `"${node.value}"`;
    } else {
      valueSnippet = String(node.value);
    }
  }

  visibleNodes.push({
    id: node.id,
    key: node.key,
    path: node.path,
    type: node.type,
    depth,
    hasChildren,
    isExpanded: !!node.isExpanded,
    selectedState: node.selectedState,
    alias: node.alias,
    valueSnippet,
    value: node.value,
  });

  if (hasChildren && node.isExpanded) {
    for (const child of node.children!) {
      flattenTree(child, depth + 1, visibleNodes);
    }
  }

  return visibleNodes;
}

export function updateJSONValueAtPath(data: any, targetPath: string, newValue: any): any {
  const recurse = (val: any, curPath: string): any => {
    if (curPath === targetPath) {
      if (typeof val === 'number') {
        const num = Number(newValue);
        return isNaN(num) ? newValue : num;
      }
      if (typeof val === 'boolean') {
        return newValue === 'true' || newValue === true;
      }
      return newValue;
    }

    if (val === null || val === undefined) {
      return val;
    }

    if (Array.isArray(val)) {
      const wildcardPrefix = curPath === '$' ? '$[*]' : `${curPath}[*]`;
      if (targetPath.startsWith(wildcardPrefix)) {
        return val.map(item => recurse(item, wildcardPrefix));
      }
      return val;
    }

    if (typeof val === 'object') {
      const updatedObj = { ...val };
      for (const key of Object.keys(val)) {
        const childPath = curPath === '$' ? `$.${key}` : `${curPath}.${key}`;
        if (targetPath.startsWith(childPath)) {
          updatedObj[key] = recurse(val[key], childPath);
        }
      }
      return updatedObj;
    }

    return val;
  };

  return recurse(data, '$');
}

export function getLastKey(path: string): string {
  const parts = path.split('.');
  const last = parts[parts.length - 1];
  if (last.endsWith(']')) {
    const idx = last.indexOf('[');
    if (idx !== -1) return last.substring(0, idx);
  }
  return last;
}

/**
 * Converts flat array of JSON rows to standard CSV string
 */
export function jsonToCSV(flatData: any[]): string {
  if (!Array.isArray(flatData) || flatData.length === 0) return '';
  
  // Collect all unique keys
  const keysSet = new Set<string>();
  for (const row of flatData) {
    if (row && typeof row === 'object') {
      for (const k of Object.keys(row)) {
        keysSet.add(k);
      }
    }
  }
  
  const headers = Array.from(keysSet);
  if (headers.length === 0) return '';
  
  const escapeValue = (val: any): string => {
    if (val === null || val === undefined) return '';
    let strValue = '';
    if (typeof val === 'object') {
      strValue = JSON.stringify(val);
    } else {
      strValue = String(val);
    }
    // Escape quotes and wrap in quotes if has comma, newline, or quotes
    const needsQuotes = strValue.includes(',') || strValue.includes('\n') || strValue.includes('"');
    const escaped = strValue.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };
  
  const csvLines = [
    headers.map(escapeValue).join(','),
    ...flatData.map(row => headers.map(h => escapeValue(row[h])).join(','))
  ];
  
  return csvLines.join('\n');
}
