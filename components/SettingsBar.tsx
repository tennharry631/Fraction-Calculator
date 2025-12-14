import React from 'react';
import { CalculatorMode, OutputUnit } from '../types';
import { OUTPUT_UNITS, PRECISION_OPTIONS } from '../constants';

interface SettingsBarProps {
  mode: CalculatorMode;
  precisionEnabled: boolean;
  setPrecisionEnabled: (v: boolean) => void;
  precision: number;
  setPrecision: (v: number) => void;
  outputUnit: OutputUnit;
  setOutputUnit: (v: OutputUnit) => void;
}

const SettingsBar: React.FC<SettingsBarProps> = ({
  mode,
  precisionEnabled,
  setPrecisionEnabled,
  precision,
  setPrecision,
  outputUnit,
  setOutputUnit,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
      <label className="flex items-center gap-2 cursor-pointer group">
        <div className="relative">
          <input
            type="checkbox"
            checked={precisionEnabled}
            onChange={(e) => setPrecisionEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
        </div>
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 group-hover:text-brand-600 transition-colors">
          Precision
        </span>
      </label>

      <select
        value={precision}
        onChange={(e) => setPrecision(Number(e.target.value))}
        className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 border-transparent focus:border-brand-500 focus:ring-brand-500 rounded-md text-gray-800 dark:text-gray-200"
      >
        {PRECISION_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {mode === 'advanced' && (
        <div className="flex items-center gap-2 ml-auto">
          <span className="hidden sm:inline text-xs font-semibold text-gray-500 dark:text-gray-400">
            Output:
          </span>
          <select
            value={outputUnit}
            onChange={(e) => setOutputUnit(e.target.value as OutputUnit)}
            className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 border-transparent focus:border-brand-500 focus:ring-brand-500 rounded-md text-gray-800 dark:text-gray-200 max-w-[100px] sm:max-w-none truncate"
          >
            {OUTPUT_UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default SettingsBar;