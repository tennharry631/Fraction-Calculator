
import React from 'react';

interface DebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: string[];
}

const DebugModal: React.FC<DebugModalProps> = ({ isOpen, onClose, steps }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden m-4 flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-yellow-400">🐞</span> Calculation Steps
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto font-mono text-xs text-slate-300 space-y-1">
          {steps && steps.length > 0 ? (
            steps.map((step, i) => (
              <div key={i} className="border-b border-slate-800/50 pb-1 mb-1 last:border-0">
                <span className="text-slate-500 mr-2">[{i+1}]</span>
                {step}
              </div>
            ))
          ) : (
            <div className="text-center text-slate-500 italic p-4">
              No debug steps available. Run a calculation first.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebugModal;
