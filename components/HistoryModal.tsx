import React from 'react';
import { HistoryItem, CalculationResult } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onCopy: (text: string) => void;
  onClearHistory: () => void;
  renderFraction: (val: string) => React.ReactNode;
}

const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelect,
  onCopy,
  onClearHistory,
  renderFraction
}) => {
  if (!isOpen) return null;

  // Helper to format timestamp
  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleResultClick = (e: React.MouseEvent, item: HistoryItem) => {
      e.stopPropagation();
      // Determine what to copy - usually the mixed or decimal value based on what's visible, 
      // but let's copy the 'mixed' string as default for this context or provide a cleaner copy.
      // We will copy the mixed string for consistency with the display.
      onCopy(item.result.mixed);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full sm:w-96 bg-slate-50 dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-700 h-[80vh] sm:h-[600px] flex flex-col rounded-t-3xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-200 overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900 z-10">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">History</h2>
          <div className="flex gap-2">
            {history.length > 0 && (
                <button 
                    onClick={onClearHistory}
                    className="px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                >
                    Clear
                </button>
            )}
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-200 dark:bg-slate-800 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 opacity-50">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>No history yet</p>
                </div>
            ) : (
                history.map((item, idx) => (
                    <div 
                        key={item.timestamp + idx}
                        onClick={() => onSelect(item)}
                        className="w-full text-right p-4 rounded-xl bg-white dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer group flex flex-col items-end"
                    >
                        <div className="flex justify-between items-start mb-1 w-full">
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                {formatTime(item.timestamp)}
                            </span>
                            <span className="text-xs sm:text-sm font-mono text-slate-500 dark:text-slate-400 truncate max-w-[70%]">
                                {item.input}
                            </span>
                        </div>
                        
                        {/* Result area is clickable for copy, separate from parent */}
                        <button 
                            onClick={(e) => handleResultClick(e, item)}
                            className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-right"
                            title="Click to copy result"
                        >
                            {renderFraction(item.result.mixed)}
                        </button>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;