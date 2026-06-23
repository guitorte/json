import { FileJson, Layers, Share2, HelpCircle } from 'lucide-react';
import { useJSONStore } from '../store/jsonStore';

export default function Header() {
  const { selectedPaths, isValid, parsedJson } = useJSONStore();
  
  // Quick size estimator of the active input payload
  const getPayloadSizeText = () => {
    const rawInput = useJSONStore.getState().rawInput;
    if (!rawInput) return '0 B';
    const bytes = new Blob([rawInput]).size;
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <header className="border-b border-slate-200 bg-white shadow-xs">
      <div className="mx-auto flex max-w-[1600px] flex-col justify-between px-4 py-3.5 sm:flex-row sm:items-center">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm ring-1 ring-slate-900/10 transition-transform duration-200 hover:scale-105">
            <FileJson className="h-5.5 w-5.5" />
          </div>
          <div>
            <h1 className="font-sans text-lg font-bold tracking-tight text-slate-900">
              JSON Easy Editor
            </h1>
            <p className="text-xs text-slate-500">
              Visual Projection, Pruning & Transposition Motor
            </p>
          </div>
        </div>

        {/* Runtime State Indicators (Architectural Honesty with Clean Human Labels) */}
        <div className="mt-3 flex flex-wrap items-center gap-3 sm:mt-0">
          {isValid && parsedJson && (
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-600 ring-1 ring-slate-200/50">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Input Size: <strong className="font-medium text-slate-900">{getPayloadSizeText()}</strong></span>
              <span className="text-slate-300">|</span>
              <span>Selected: <strong className="font-medium text-slate-900">{selectedPaths.size} paths</strong></span>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-lg bg-indigo-50/50 px-3 py-1.5 text-xs text-indigo-700 ring-1 ring-indigo-100">
            <Layers className="h-3.5 w-3.5 text-indigo-500" />
            <span className="font-medium">Client-Side Isolation (Offline Safe)</span>
          </div>
        </div>
      </div>
    </header>
  );
}
