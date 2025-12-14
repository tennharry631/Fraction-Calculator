import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializePyodide, calculateExpression } from './services/pyodideService';
import { CalculatorMode, CalculationResult, OutputUnit, HistoryItem } from './types';
import { SECRET_PHRASES, OUTPUT_UNITS } from './constants';
import Keypad from './components/Keypad';
import SettingsModal from './components/SettingsModal';
import HistoryModal from './components/HistoryModal';

const App: React.FC = () => {
  // --- STATE ---
  const [input, setInput] = useState('');
  const [result, setResult] = useState<CalculationResult>({ mixed: '—', improper: '—', decimal: '—', isError: false });
  const [loading, setLoading] = useState(true);
  
  // Modes
  const [mode, setMode] = useState<CalculatorMode>('basic');
  const [viewMode, setViewMode] = useState<'mixed'|'improper'|'decimal'>('mixed');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showToast, setShowToast] = useState(false);
  
  // Data
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
        const saved = localStorage.getItem('calc_history');
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
  });

  // Config
  const [precisionEnabled, setPrecisionEnabled] = useState(true);
  const [precisionDenom, setPrecisionDenom] = useState(32);
  const [outputUnit, setOutputUnit] = useState<OutputUnit>('Feet-In');
  
  // Refs
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const secretBuffer = useRef('');

  // --- INIT ---
  useEffect(() => {
    const load = async () => {
      try {
        await initializePyodide();
        setLoading(false);
      } catch (e) {
        console.error("Failed to load Pyodide", e);
      }
    };
    load();
  }, []);

  // --- THEME ---
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('calc_history', JSON.stringify(history));
  }, [history]);

  // --- CALCULATION LOGIC ---
  const handleCalculate = useCallback(async () => {
    if (!input.trim()) {
      setResult({ mixed: '—', improper: '—', decimal: '—', isError: false });
      return;
    }
    const res = await calculateExpression(input, mode, outputUnit, precisionEnabled, precisionDenom);
    setResult(res);

    // Save to History (only if triggered manually via Enter/=)
    // NOTE: This callback is reused for auto-recalc on unit change, so we might duplicate history if not careful.
    // However, for simplicity, we allow it here. If strict "only new calculations" is needed, we'd separate the logic.
    // To prevent spamming history on Unit Change, we can check if the result is different or just update the current view.
    // For now, we will add to history to allow user to see "Same expression = New Unit Result".
    if (!res.isError) {
        setHistory(prev => {
            if (prev.length > 0 && prev[0].input === input.trim() && prev[0].result.mixed === res.mixed) return prev;
            const newItem: HistoryItem = { 
                input: input.trim(), 
                result: res, 
                timestamp: Date.now() 
            };
            return [newItem, ...prev].slice(0, 100);
        });
    }
  }, [input, mode, outputUnit, precisionEnabled, precisionDenom]);

  // Auto-calculate when Output Unit changes (if input exists)
  useEffect(() => {
    if (input.trim() && mode === 'advanced') {
      // Create a debounce or just direct call. Direct call is fine for select change.
      // We don't want to add to history every time unit changes? 
      // Actually, typically we just want to update the view.
      // Let's call calculateExpression directly to update result WITHOUT adding to history.
      const runCalc = async () => {
          const res = await calculateExpression(input, mode, outputUnit, precisionEnabled, precisionDenom);
          setResult(res);
      };
      runCalc();
    }
  }, [outputUnit, precisionEnabled, precisionDenom]); // Recalc on config change

  // --- SECRET PHRASES ---
  useEffect(() => {
    const checkSecrets = (char: string) => {
      if (/[a-zA-Z]/.test(char)) {
        secretBuffer.current = (secretBuffer.current + char.toLowerCase()).slice(-20);
        for (const [phrase, secretRes] of Object.entries(SECRET_PHRASES)) {
          if (secretBuffer.current.endsWith(phrase)) {
             setResult({
               mixed: secretRes.mixed,
               improper: secretRes.mixed,
               decimal: secretRes.decimal,
               isError: false
             });
             secretBuffer.current = '';
             return;
          }
        }
      }
    };
    if (input.length > 0) checkSecrets(input[input.length - 1]);
  }, [input]);

  // --- HANDLERS ---
  const handleInsert = (text: string) => {
    setInput(prev => prev + text);
  };
  const handleClear = () => {
    setInput('');
    setResult({ mixed: '—', improper: '—', decimal: '—', isError: false });
    secretBuffer.current = '';
  };
  const handleBackspace = () => setInput(prev => prev.slice(0, -1));

  const copyToClipboard = async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      } catch (err) {
        console.error('Failed to copy', err);
      }
  };

  const handleCopy = async () => {
    const val = getActiveResult();
    if (val && val !== '—' && val !== 'Error') {
        await copyToClipboard(val);
    }
  };

  const handleHistoryCopy = (text: string) => {
      copyToClipboard(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleCalculate();
      }
      if (e.key === 'Escape') {
          e.preventDefault();
          handleClear();
      }
  };

  const handleHistorySelect = (item: HistoryItem) => {
      setInput(item.input);
      setResult(item.result);
      setIsHistoryOpen(false);
  };

  // --- RENDER HELPERS ---
  const renderFraction = (fractionStr: string) => {
    if (result.isError) return fractionStr;
    if (fractionStr === '—') return '0';
    
    // Check for mixed fraction pattern: "1 3/4" or "-1 3/4"
    const mixedMatch = fractionStr.match(/^(-?\d+)\s+(\d+)\/(\d+)(.*)$/);
    if (mixedMatch) {
      const [_, whole, num, den, suffix] = mixedMatch;
      return (
        <span className="inline-flex items-center gap-1">
          <span>{whole}</span>
          <span className="flex flex-col items-center justify-center text-[0.55em] leading-none">
             <span className="border-b border-current pb-[2px]">{num}</span>
             <span className="pt-[2px]">{den}</span>
          </span>
          {suffix && <span className="text-[0.6em] font-light opacity-60 self-center">{suffix}</span>}
        </span>
      );
    }
    
    // Check for simple fraction "3/4"
    const simpleMatch = fractionStr.match(/^(-?)(\d+)\/(\d+)(.*)$/);
    if (simpleMatch) {
      const [_, sign, num, den, suffix] = simpleMatch;
      return (
        <span className="inline-flex items-center gap-1">
          {sign && <span>{sign}</span>}
          <span className="flex flex-col items-center justify-center text-[0.6em] leading-none">
             <span className="border-b border-current pb-[2px]">{num}</span>
             <span className="pt-[2px]">{den}</span>
          </span>
          {suffix && <span className="text-[0.6em] font-light opacity-60 self-center">{suffix}</span>}
        </span>
      );
    }
    
    return fractionStr;
  };

  const getActiveResult = () => {
      if (result.isError) return result.decimal; // Error msg stored in decimal field
      switch(viewMode) {
          case 'mixed': return result.mixed;
          case 'improper': return result.improper;
          case 'decimal': return result.decimal;
      }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-center p-6 text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium">Initializing Engine...</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white overflow-hidden transition-colors">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center px-4 py-2 z-10 shrink-0">
        <div className="flex flex-col">
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">Fraction Calc Pro</h1>
            <button onClick={() => setMode(m => m === 'basic' ? 'advanced' : 'basic')} className="text-left text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                {mode} Mode 
            </button>
        </div>
        
        <div className="flex items-center gap-2">
             <button 
                onClick={() => setIsHistoryOpen(true)}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors bg-slate-200 dark:bg-slate-900 rounded-lg"
                title="History"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>

            <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors bg-slate-200 dark:bg-slate-900 rounded-lg"
                title="Toggle Dark Mode"
            >
                {isDarkMode ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                    </svg>
                )}
            </button>

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors bg-slate-200 dark:bg-slate-900 rounded-lg"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
            </button>
        </div>
      </div>

      {/* --- DISPLAY --- */}
      <div className="flex-1 flex flex-col px-4 pb-2 min-h-0">
        
        {/* Main Result */}
        <div 
            onClick={handleCopy}
            className="flex-1 flex flex-col items-end justify-center min-h-[60px] active:opacity-70 cursor-pointer select-none"
            title="Click to copy"
        >
            <div className={`font-bold transition-all duration-300 text-right leading-none ${result.isError ? 'text-red-500 text-2xl' : 'text-slate-900 dark:text-white text-5xl sm:text-6xl'}`}>
                {viewMode === 'decimal' || result.isError 
                   ? getActiveResult() 
                   : renderFraction(getActiveResult())
                }
            </div>
        </div>
        
        {/* Expression History */}
        <div className="flex justify-end text-slate-400 font-mono text-xs mb-2 min-h-[1rem] break-all truncate">
          {input.length > 0 ? `${input} =` : ''}
        </div>

        {/* View Toggles & Unit Select */}
        <div className="self-end mb-4 flex items-center gap-2">
            {/* Output Unit Dropdown (Advanced Mode Only) */}
            {mode === 'advanced' && (
                <div className="relative group">
                    <select
                        value={outputUnit}
                        onChange={(e) => setOutputUnit(e.target.value as OutputUnit)}
                        className="appearance-none bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider pl-3 pr-7 py-2 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 border-none cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-800 transition-colors"
                    >
                        {OUTPUT_UNITS.map(u => (
                            <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                        <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>
            )}

            {/* View Mode Buttons */}
            <div className="flex p-0.5 bg-slate-200 dark:bg-slate-900 rounded-lg">
                {(['mixed', 'improper', 'decimal'] as const).map((m) => (
                    <button
                        key={m}
                        onClick={() => setViewMode(m)}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                            viewMode === m 
                            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        {m}
                    </button>
                ))}
            </div>
        </div>

        {/* Input Box */}
        <div className="w-full relative group shrink-0">
            <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                readOnly={false}
                placeholder={mode === 'basic' ? "3/4 + 1/2" : "1ft 6in + 20cm"}
                className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-lg font-mono text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-700 outline-none focus:border-blue-500/50 transition-colors resize-none"
                rows={1}
            />
        </div>
      </div>

      {/* --- KEYPAD --- */}
      <div className="shrink-0 z-20">
        <Keypad 
          onInsert={handleInsert} 
          onClear={handleClear} 
          onCalculate={handleCalculate}
          onBackspace={handleBackspace}
          mode={mode}
        />
      </div>

      {/* --- MODALS --- */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        mode={mode}
        precisionEnabled={precisionEnabled}
        setPrecisionEnabled={setPrecisionEnabled}
        precision={precisionDenom}
        setPrecision={setPrecisionDenom}
        outputUnit={outputUnit}
        setOutputUnit={setOutputUnit}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelect={handleHistorySelect}
        onCopy={handleHistoryCopy}
        onClearHistory={() => setHistory([])}
        renderFraction={renderFraction}
      />
      
      {/* --- TOAST --- */}
      {showToast && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2 bg-slate-800/90 text-white text-sm font-medium rounded-full backdrop-blur-sm animate-in fade-in zoom-in duration-200 z-50 shadow-xl">
           Copied to clipboard!
        </div>
      )}
    </div>
  );
};

export default App;