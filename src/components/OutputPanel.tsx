import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import {
  FileCode,
  Copy,
  Check,
  Download,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Sheet,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useJSONStore } from '../store/jsonStore';
import { jsonToCSV } from '../utils/jsonEngine';

export default function OutputPanel() {
  const {
    outputJson,
    editorMode,
    flattenToRows,
    isProcessing,
    processingError,
    setEditorMode,
    setFlattenToRows
  } = useJSONStore();

  const [isMobile, setIsMobile] = useState(false);
  const [copied, setCopied] = useState(false);

  // Monitor screen size for mobile textarea fallback
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([outputJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `json-easy-editor-output-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    try {
      const parsed = JSON.parse(outputJson);
      const arrayData = Array.isArray(parsed) ? parsed : [parsed];
      const csvContent = jsonToCSV(arrayData);
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `json-easy-editor-output-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Could not generate CSV. Ensure the output is formatted and valid.');
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Paradigm / Mode selector */}
      <div className="flex flex-col border-b border-slate-200 bg-slate-50 p-3.5">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <FileCode className="h-4 w-4 text-slate-400" />
          3. Transform Output
        </span>

        {/* Mode Toggles */}
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-slate-200/65 p-1 text-center">
          <button
            onClick={() => setEditorMode('prune')}
            className={`rounded-md py-1.5 text-xs font-medium transition ${
              editorMode === 'prune'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Preservation mode: Keep structural format but remove unchecked nodes."
          >
            Preserve (Poda)
          </button>
          <button
            onClick={() => setEditorMode('extract')}
            className={`rounded-md py-1.5 text-xs font-medium transition ${
              editorMode === 'extract'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="Extraction mode: Flatten/reconstruct only selected keys with aliases."
          >
            Extract (Mapeamento)
          </button>
        </div>

        {/* Extra Mode Controls if Extract mode is active */}
        {editorMode === 'extract' && (
          <div className="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-3">
            <span className="text-[11px] font-medium text-slate-600">Flatten Arrays to Rows</span>
            <button
              onClick={() => setFlattenToRows(!flattenToRows)}
              className="text-slate-500 transition hover:text-slate-900"
              title="Toggle flattening of array objects into database-like flat rows (perfect for CSV/Excel extraction)"
            >
              {flattenToRows ? (
                <ToggleRight className="h-6 w-6 text-indigo-600" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-slate-400" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons Toolbar */}
      <div className="flex items-center justify-between gap-1.5 border-b border-slate-200 bg-white px-3.5 py-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            disabled={!outputJson || isProcessing}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-50"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                Copy
              </>
            )}
          </button>

          <button
            onClick={handleDownloadJSON}
            disabled={!outputJson || isProcessing}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-50"
            title="Download output as JSON"
          >
            <Download className="h-3.5 w-3.5 text-slate-400" />
            JSON
          </button>

          <button
            onClick={handleDownloadCSV}
            disabled={!outputJson || isProcessing}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-50"
            title="Export output as flattened CSV table"
          >
            <Sheet className="h-3.5 w-3.5 text-emerald-600" />
            CSV
          </button>
        </div>

        {isProcessing && (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 animate-pulse">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
            Compiling...
          </span>
        )}
      </div>

      {/* Output Viewer Area */}
      <div className="relative flex-1 bg-slate-50 p-1">
        {processingError ? (
          <div className="absolute inset-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
            <AlertTriangle className="h-5 w-5 text-rose-500 mb-2" />
            <span className="font-semibold">Engine Compilation Failed:</span>
            <p className="mt-1 font-mono text-[11px] leading-relaxed">{processingError}</p>
          </div>
        ) : !outputJson ? (
          <div className="absolute inset-4 flex flex-col items-center justify-center text-center text-slate-400">
            <FileCode className="h-8 w-8 text-slate-300" />
            <p className="mt-2 text-xs">Awaiting schema selection...</p>
          </div>
        ) : isMobile ? (
          <textarea
            readOnly
            value={outputJson}
            className="h-full w-full rounded-lg border border-slate-200 bg-slate-950 p-3 font-mono text-xs leading-relaxed text-slate-100 focus:outline-hidden"
            spellCheck="false"
            id="mobile-textarea-output"
          />
        ) : (
          <div className="absolute inset-0 border border-slate-200 rounded-lg overflow-hidden bg-white">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={outputJson}
              loading={<div className="p-4 text-xs text-slate-500 font-mono">Loading Monaco Editor...</div>}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 12,
                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                tabSize: 2,
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineNumbers: 'on',
                folding: true,
                automaticLayout: true,
                theme: 'vs'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
