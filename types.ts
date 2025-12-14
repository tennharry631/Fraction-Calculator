export interface PyodideInterface {
  runPython: (code: string) => any;
  runPythonAsync: (code: string) => Promise<any>;
  toJs: () => any;
}

declare global {
  interface Window {
    loadPyodide: (config: { indexURL: string }) => Promise<PyodideInterface>;
    pyodide: PyodideInterface;
  }
}

export type CalculatorMode = 'basic' | 'advanced';

export interface CalculationResult {
  mixed: string;
  improper: string;
  decimal: string;
  isError: boolean;
}

export type OutputUnit = 'Meter' | 'Centimeter' | 'Millimeter' | 'Inch' | 'Feet' | 'Feet-In';

export interface SecretPhrase {
  mixed: string;
  decimal: string;
}

export interface HistoryItem {
  input: string;
  result: CalculationResult;
  timestamp: number;
}