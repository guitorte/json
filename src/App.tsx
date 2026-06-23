import { useState, useEffect } from 'react';
import Header from './components/Header';
import InputPanel from './components/InputPanel';
import TreePanel from './components/TreePanel';
import OutputPanel from './components/OutputPanel';
import { useJSONStore } from './store/jsonStore';
import { Layers, FileText, Compass, Eye, X, ChevronRight, HelpCircle } from 'lucide-react';

export default function App() {
  const { selectedPaths, isValid, setRawInput } = useJSONStore();

  const [isMobile, setIsMobile] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState<'source' | 'tree'>('source');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Responsive Width Detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-[100dvh] flex-col bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 antialiased overflow-hidden">
      {/* Brand Header */}
      <div className="hidden lg:block shrink-0">
        <Header />
      </div>

      {/* Main Workspace Area */}
      <main className="flex-1 overflow-hidden">
        {isMobile ? (
          /* =========================================================================
             MOBILE LAYOUT: Flow of double-screen with a floating bottom sheet preview
             ========================================================================= */
          <div className="relative flex h-full flex-col">
            {/* Screen selection tabs (Miller breadcrumb simulator) */}
            <div className="flex border-b border-slate-200 bg-white shrink-0">
              <button
                onClick={() => {
                  setActiveMobileTab('source');
                  setIsMobileDrawerOpen(false);
                }}
                className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2 text-[11px] font-bold uppercase tracking-wider transition ${
                  activeMobileTab === 'source'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                1. Source Input
              </button>
              <button
                onClick={() => setActiveMobileTab('tree')}
                className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2 text-[11px] font-bold uppercase tracking-wider transition ${
                  activeMobileTab === 'tree'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                2. Filter Tree
              </button>
            </div>

            {/* Render selected screen */}
            <div className="flex-1 overflow-hidden">
              {activeMobileTab === 'source' ? (
                <div className="flex h-full flex-col">
                  <div className="flex-1 overflow-hidden">
                    <InputPanel />
                  </div>
                  {/* Floating Action CTA to go to Step 2 */}
                  <div className="border-t border-slate-200 bg-white p-3.5">
                    <button
                      onClick={() => setActiveMobileTab('tree')}
                      disabled={!isValid}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-md hover:bg-slate-800 disabled:opacity-50 transition"
                    >
                      Carregar Filtros & Árvore
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full overflow-hidden">
                  <TreePanel />
                </div>
              )}
            </div>

            {/* FLOATING ACTION BOTTOM SHEET PREVIEW (Mobile Drawer) */}
            {activeMobileTab === 'tree' && (
              <>
                {/* Floating Button */}
                <button
                  onClick={() => setIsMobileDrawerOpen(true)}
                  className="fixed right-5 bottom-5 z-40 flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-xl ring-2 ring-white/10 hover:bg-slate-800 active:scale-95 transition-transform"
                >
                  <Eye className="h-4 w-4 text-emerald-400 animate-pulse" />
                  <span>Ver Saída ({selectedPaths.size})</span>
                </button>

                {/* Sliding Bottom Sheet Drawer */}
                <div
                  className={`fixed inset-0 z-50 transform bg-slate-900/60 transition-opacity duration-300 ${
                    isMobileDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                  }`}
                  onClick={() => setIsMobileDrawerOpen(false)}
                >
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-[82vh] rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 ease-out transform flex flex-col ${
                      isMobileDrawerOpen ? 'translate-y-0' : 'translate-y-full'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Drawer Handle / Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 bg-slate-50 rounded-t-3xl">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-slate-800">Visualização de Saída</span>
                      </div>
                      <button
                        onClick={() => setIsMobileDrawerOpen(false)}
                        className="rounded-full bg-slate-200 p-1.5 text-slate-500 hover:bg-slate-300 hover:text-slate-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Output Content */}
                    <div className="flex-1 overflow-hidden">
                      <OutputPanel />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          /* =========================================================================
             DESKTOP LAYOUT: High-precision resizable three-column layout
             ========================================================================= */
          <div className="flex h-full w-full overflow-hidden">
            {/* Panel 1: Input (30% wide) */}
            <div className="w-[30%] min-w-[320px] h-full border-r border-slate-200">
              <InputPanel />
            </div>

            {/* Panel 2: Interactive Tree Checklist (40% wide) */}
            <div className="w-[40%] min-w-[380px] h-full border-r border-slate-200">
              <TreePanel />
            </div>

            {/* Panel 3: Live Compiled Output (30% wide) */}
            <div className="w-[30%] min-w-[320px] h-full">
              <OutputPanel />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
