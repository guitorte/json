const workerCode = `
  self.onmessage = (e) => {
    const { action, jsonStr, selectedPaths, aliases, flattenToRows } = e.data;
    try {
      const data = JSON.parse(jsonStr);
      const pathsSet = new Set(selectedPaths);
      let result;
      
      if (action === 'prune') {
        result = pruneJSON(data, pathsSet);
      } else if (action === 'extract') {
        if (flattenToRows) {
          result = projectJSONFlat(data, pathsSet, aliases);
        } else {
          result = projectJSONNested(data, pathsSet, aliases);
        }
      }
      
      self.postMessage({ success: true, result });
    } catch (err) {
      self.postMessage({ success: false, error: err.message });
    }
  };

  function pruneJSON(data, selectedPaths) {
    const matchPath = (currentPath) => {
      if (selectedPaths.has(currentPath)) return true;
      for (const p of selectedPaths) {
        if (p.startsWith(currentPath + '.') || p.startsWith(currentPath + '[')) {
          return true;
        }
      }
      return false;
    };

    const recurse = (val, currentPath) => {
      if (val === null || typeof val !== 'object') {
        return selectedPaths.has(currentPath) ? val : undefined;
      }

      if (Array.isArray(val)) {
        if (val.length === 0) {
          return selectedPaths.has(currentPath) ? [] : undefined;
        }
        const prunedArray = [];
        for (let i = 0; i < val.length; i++) {
          const item = val[i];
          if (item && typeof item === 'object' && !Array.isArray(item)) {
            const prunedItem = recurseObject(item, currentPath + '[*]');
            if (prunedItem !== undefined) {
              prunedArray.push(prunedItem);
            }
          } else {
            const prunedItem = recurse(item, currentPath + '[*]');
            if (prunedItem !== undefined) {
              prunedArray.push(prunedItem);
            }
          }
        }
        return prunedArray.length > 0 || selectedPaths.has(currentPath) ? prunedArray : undefined;
      }

      return recurseObject(val, currentPath);
    };

    const recurseObject = (obj, currentPath) => {
      const prunedObj = {};
      let hasKeys = false;
      for (const key of Object.keys(obj)) {
        const childPath = currentPath === '$' ? '$.' + key : currentPath + '.' + key;
        if (matchPath(childPath)) {
          const prunedVal = recurse(obj[key], childPath);
          if (prunedVal !== undefined) {
            prunedObj[key] = prunedVal;
            hasKeys = true;
          }
        }
      }
      return hasKeys || selectedPaths.has(currentPath) ? prunedObj : undefined;
    };

    return recurse(data, '$');
  }

  function extractValuesForPath(data, path) {
    const results = [];
    const recurse = (val, curPath, curIdx) => {
      if (curPath === path) {
        results.push({ value: val, index: curIdx });
        return;
      }
      if (val === null || val === undefined) return;
      if (Array.isArray(val)) {
        const wildcardPath = curPath + '[*]';
        if (path.startsWith(wildcardPath)) {
          for (let i = 0; i < val.length; i++) {
            recurse(val[i], wildcardPath, curIdx ? curIdx + '.' + i : '' + i);
          }
        }
      } else if (typeof val === 'object') {
        for (const key of Object.keys(val)) {
          const nextPath = curPath === '$' ? '$.' + key : curPath + '.' + key;
          if (path.startsWith(nextPath)) {
            recurse(val[key], nextPath, curIdx);
          }
        }
      }
    };
    recurse(data, '$', '');
    return results;
  }

  function projectJSONFlat(data, selectedPaths, aliases) {
    const pathValuesMap = {};
    for (const path of selectedPaths) {
      pathValuesMap[path] = extractValuesForPath(data, path);
    }

    const arrayIndices = new Set();
    for (const path of selectedPaths) {
      for (const item of pathValuesMap[path]) {
        if (item.index) {
          arrayIndices.add(item.index);
        }
      }
    }

    if (arrayIndices.size === 0) {
      const row = {};
      for (const path of selectedPaths) {
        const items = pathValuesMap[path];
        const displayName = aliases[path] || getLastKey(path);
        if (items.length > 0) {
          row[displayName] = items[0].value;
        }
      }
      return [row];
    }

    const rows = [];
    const sortedIndices = Array.from(arrayIndices).sort((a, b) => {
      // Sort indexes like 0, 1, 2, 10 numerically where possible
      const aParts = a.split('.').map(Number);
      const bParts = b.split('.').map(Number);
      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        if (aParts[i] === undefined) return -1;
        if (bParts[i] === undefined) return 1;
        if (aParts[i] !== bParts[i]) return aParts[i] - bParts[i];
      }
      return 0;
    });

    for (const idx of sortedIndices) {
      const row = {};
      for (const path of selectedPaths) {
        const items = pathValuesMap[path];
        const displayName = aliases[path] || getLastKey(path);
        const match = items.find(item => item.index === idx) || items.find(item => item.index === '');
        if (match) {
          row[displayName] = match.value;
        }
      }
      rows.push(row);
    }
    return rows;
  }

  function projectJSONNested(data, selectedPaths, aliases) {
    const matchPath = (currentPath) => {
      if (selectedPaths.has(currentPath)) return true;
      for (const p of selectedPaths) {
        if (p.startsWith(currentPath + '.') || p.startsWith(currentPath + '[')) {
          return true;
        }
      }
      return false;
    };

    const recurse = (val, currentPath) => {
      if (val === null || typeof val !== 'object') {
        return selectedPaths.has(currentPath) ? val : undefined;
      }
      if (Array.isArray(val)) {
        if (val.length === 0) {
          return selectedPaths.has(currentPath) ? [] : undefined;
        }
        const prunedArray = [];
        for (let i = 0; i < val.length; i++) {
          const item = val[i];
          if (item && typeof item === 'object' && !Array.isArray(item)) {
            const prunedItem = recurseObject(item, currentPath + '[*]');
            if (prunedItem !== undefined) {
              prunedArray.push(prunedItem);
            }
          } else {
            const prunedItem = recurse(item, currentPath + '[*]');
            if (prunedItem !== undefined) {
              prunedArray.push(prunedItem);
            }
          }
        }
        return prunedArray.length > 0 || selectedPaths.has(currentPath) ? prunedArray : undefined;
      }
      return recurseObject(val, currentPath);
    };

    const recurseObject = (obj, currentPath) => {
      const prunedObj = {};
      let hasKeys = false;
      for (const key of Object.keys(obj)) {
        const childPath = currentPath === '$' ? '$.' + key : currentPath + '.' + key;
        if (matchPath(childPath)) {
          const prunedVal = recurse(obj[key], childPath);
          if (prunedVal !== undefined) {
            const finalKey = aliases[childPath] || key;
            prunedObj[finalKey] = prunedVal;
            hasKeys = true;
          }
        }
      }
      return hasKeys || selectedPaths.has(currentPath) ? prunedObj : undefined;
    };

    return recurse(data, '$');
  }

  function getLastKey(path) {
    const parts = path.split('.');
    const last = parts[parts.length - 1];
    if (last.endsWith(']')) {
      const idx = last.indexOf('[');
      if (idx !== -1) return last.substring(0, idx);
    }
    return last;
  }
`;

export function createJSONWorker(): Worker {
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
}
