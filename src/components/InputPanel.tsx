import { useState, useEffect, ChangeEvent } from 'react';
import Editor from '@monaco-editor/react';
import { Sparkles, Check, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { useJSONStore } from '../store/jsonStore';
import { PRESETS } from '../data/presets';

export default function InputPanel() {
  const {
    rawInput,
    isValid,
    validationError,
    setRawInput,
    beautifyInput,
    loadPreset
  } = useJSONStore();

  const [isMobile, setIsMobile] = useState(false);

  // Monitor screen size for mobile textarea fallback
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleEditorChange = (value: string | undefined) => {
    setRawInput(value || '');
  };

  const handleTextAreaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setRawInput(e.target.value);
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header and Toolbar */}
      <div className="flex flex-col border-b border-slate-200 bg-slate-50 p-3.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <FileText className="h-4 w-4 text-slate-400" />
            1. Source Payload
          </span>
          
          {isValid ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/10">
              <Check className="h-3.5 w-3.5" />
              Valid JSON
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-600/10 animate-pulse">
              <AlertCircle className="h-3.5 w-3.5" />
              Syntax Error
            </span>
          )}
        </div>

        {/* Quick Format Action */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            onClick={beautifyInput}
            disabled={!isValid}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Format / Beautify
          </button>

          <span className="text-[10px] text-slate-400">Paste your raw payload below</span>
        </div>
      </div>

      {/* Preset Loader Carousel */}
      <div className="border-b border-slate-200 px-3.5 py-2 bg-white">
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">Load Playground Examples:</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => loadPreset(preset.name, preset.json)}
              className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-900 hover:text-white"
              title={preset.description}
            >
              {preset.name.split(' (')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Text Editor Workspace */}
      <div className="relative flex-1 bg-slate-50 p-1">
        {isMobile ? (
          <textarea
            value={rawInput}
            onChange={handleTextAreaChange}
            className="h-full w-full rounded-lg border border-slate-200 bg-slate-950 p-3 font-mono text-xs leading-relaxed text-slate-100 focus:border-slate-400 focus:outline-hidden"
            placeholder="Paste your JSON payload here..."
            spellCheck="false"
            id="mobile-textarea-input"
          />
        ) : (
          <div className="absolute inset-0 border border-slate-200 rounded-lg overflow-hidden bg-white">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={rawInput}
              onChange={handleEditorChange}
              loading={<div className="p-4 text-xs text-slate-500 font-mono">Loading Monaco Editor...</div>}
              options={{
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

      {/* Validation Error Feedback Box (CLS Protective Layout) */}
      <div className="min-h-[50px] border-t border-slate-200 bg-slate-50 p-3 flex flex-col justify-center">
        {validationError ? (
          <div className="flex items-start gap-2.5 text-rose-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
            <div className="text-xs">
              <span className="font-semibold">JSON Validation Failed:</span>
              <p className="mt-0.5 font-mono text-[11px] leading-tight break-all max-h-16 overflow-y-auto">{validationError}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 text-slate-500 text-xs">
            <Check className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Schema is ready. All structures parsed successfully.</span>
          </div>
        )}
      </div>
    </div>
  );
}
