import React, { useRef } from 'react';
import { CalculatorMode } from '../types';

interface KeypadProps {
  onInsert: (char: string) => void;
  onClear: () => void;
  onCalculate: () => void;
  onBackspace: () => void;
  mode: CalculatorMode;
  hasInput: boolean;
}

const Keypad: React.FC<KeypadProps> = ({ onInsert, onClear, onCalculate, onBackspace, mode, hasInput }) => {
  const baseBtn = "relative w-full rounded-2xl text-xl font-medium shadow-sm active:scale-95 transition-all duration-100 select-none flex items-center justify-center";
  
  // Updated styles for Light/Dark mode support
  const numBtn = `${baseBtn} h-14 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-slate-200 dark:shadow-none`;
  const opBtn = `${baseBtn} h-14 bg-slate-200 dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold text-2xl hover:bg-slate-300 dark:hover:bg-slate-800`;
  const actionBtn = `${baseBtn} h-14 bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-800 font-semibold`;
  const acBtn = `${baseBtn} h-14 bg-slate-200 dark:bg-slate-900 text-red-500 hover:bg-slate-300 dark:hover:bg-slate-800 font-semibold`;
  const equalsBtn = `${baseBtn} h-14 bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/30 shadow-lg`;
  const unitBtn = `${baseBtn} h-10 bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold uppercase tracking-wide hover:bg-slate-400 dark:hover:bg-slate-600`;

  // Ref to track long press
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const handleAcTouchStart = () => {
    if (hasInput) {
      longPressTimer.current = setTimeout(() => {
        onClear();
        if (navigator.vibrate) navigator.vibrate(50);
      }, 600);
    }
  };

  const handleAcTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleAcClick = () => {
    if (hasInput) {
      onBackspace();
    } else {
      onClear();
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 pb-8 bg-slate-100 dark:bg-slate-950 rounded-t-[2rem] transition-colors">
      
      {mode === 'advanced' && (
        <div className="grid grid-cols-4 gap-3 mb-1">
          <button onClick={() => onInsert('ft')} className={unitBtn}>ft</button>
          <button onClick={() => onInsert('in')} className={unitBtn}>in</button>
          <button onClick={() => onInsert('m')} className={unitBtn}>m</button>
          <button onClick={() => onInsert('cm')} className={unitBtn}>cm</button>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        {/* Row 1 */}
        <button 
          onClick={handleAcClick} 
          onTouchStart={handleAcTouchStart}
          onTouchEnd={handleAcTouchEnd}
          onMouseDown={handleAcTouchStart}
          onMouseUp={handleAcTouchEnd}
          onMouseLeave={handleAcTouchEnd}
          className={acBtn}
          title={hasInput ? "Tap to backspace, hold to clear" : "Clear All"}
        >
          {hasInput ? (
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12l-2.25 2.25m-4.288-2.422l.722-.722a.75.75 0 01.53-.22h6.75a.75.75 0 01.75.75v6.75a.75.75 0 01-.75.75h-6.75a.75.75 0 01-.53-.22l-3.375-3.375a.75.75 0 010-1.06l3.375-3.375z" />
             </svg>
          ) : "AC"}
        </button>
        
        <button onClick={() => onInsert('(')} className={actionBtn}>(</button>
        <button onClick={() => onInsert(')')} className={actionBtn}>)</button>
        <button onClick={() => onInsert('/')} className={opBtn}>/</button>

        {/* Row 2 */}
        <button onClick={() => onInsert('7')} className={numBtn}>7</button>
        <button onClick={() => onInsert('8')} className={numBtn}>8</button>
        <button onClick={() => onInsert('9')} className={numBtn}>9</button>
        <button onClick={() => onInsert('*')} className={opBtn}>×</button>

        {/* Row 3 */}
        <button onClick={() => onInsert('4')} className={numBtn}>4</button>
        <button onClick={() => onInsert('5')} className={numBtn}>5</button>
        <button onClick={() => onInsert('6')} className={numBtn}>6</button>
        <button onClick={() => onInsert('-')} className={opBtn}>−</button>

        {/* Row 4 */}
        <button onClick={() => onInsert('1')} className={numBtn}>1</button>
        <button onClick={() => onInsert('2')} className={numBtn}>2</button>
        <button onClick={() => onInsert('3')} className={numBtn}>3</button>
        <button onClick={() => onInsert('+')} className={opBtn}>+</button>

        {/* Row 5 */}
        <button onClick={() => onInsert('0')} className={numBtn}>0</button>
        <button onClick={() => onInsert('.')} className={numBtn}>.</button>
        <button onClick={() => onInsert(' ')} className={actionBtn}>Space</button>
        <button onClick={onCalculate} className={equalsBtn}>=</button>
      </div>
    </div>
  );
};

export default Keypad;