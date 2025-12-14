import React from 'react';
import { CalculatorMode, OutputUnit } from '../types';
import { OUTPUT_UNITS, PRECISION_OPTIONS } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: CalculatorMode;
  precisionEnabled: boolean;
  setPrecisionEnabled: (v: boolean) => void;
  precision: number;
  setPrecision: (v: number) => void;
  outputUnit: OutputUnit;
  setOutputUnit: (v: OutputUnit) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  mode,
  precisionEnabled,
  setPrecisionEnabled,
  precision,
  setPrecision,
  outputUnit,
  setOutputUnit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full sm:w-80 bg-slate-900 border border-slate-700 p-6 rounded-t-3xl sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-200" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-6">
            {/* Precision Toggle */}
            <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">Rounding</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={precisionEnabled} onChange={e => setPrecisionEnabled(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            {/* Precision Select */}
            {precisionEnabled && (
                <div className="space-y-2">
                     <label className="text-xs uppercase text-slate-500 font-bold tracking-wider">Precision</label>
                     <div className="grid grid-cols-4 gap-2">
                        {PRECISION_OPTIONS.map(opt => (
                            <button 
                                key={opt.value}
                                onClick={() => setPrecision(opt.value)}
                                className={`px-2 py-2 text-xs font-bold rounded-lg border transition-all ${precision === opt.value ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                     </div>
                </div>
            )}
            
            <div className="text-xs text-slate-500 text-center pt-4">
                Fraction Calc Pro v1.2
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;