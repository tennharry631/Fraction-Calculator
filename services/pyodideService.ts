import { PYTHON_CALCULATOR_SCRIPT } from '../constants';
import { CalculationResult, CalculatorMode, OutputUnit } from '../types';

let pyodideReadyPromise: Promise<void> | null = null;

const loadPyodideEngine = async (): Promise<void> => {
  if (window.pyodide) return;
  
  if (!window.loadPyodide) {
    await new Promise<void>((resolve, reject) => {
        let attempts = 0;
        const interval = setInterval(() => {
            if (window.loadPyodide) {
                clearInterval(interval);
                resolve();
            }
            attempts++;
            if (attempts > 50) {
                clearInterval(interval);
                reject(new Error("Pyodide script failed to load from CDN."));
            }
        }, 100);
    });
  }

  const pyodide = await window.loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/",
  });
  window.pyodide = pyodide;
  await pyodide.runPythonAsync(PYTHON_CALCULATOR_SCRIPT);
};

export const initializePyodide = (): Promise<void> => {
  if (!pyodideReadyPromise) {
    pyodideReadyPromise = loadPyodideEngine();
  }
  return pyodideReadyPromise;
};

export const calculateExpression = async (
  expr: string,
  mode: CalculatorMode,
  outputUnit: OutputUnit,
  precisionEnabled: boolean,
  precisionDenom: number
): Promise<CalculationResult> => {
  if (!window.pyodide) {
    throw new Error("Calculator engine not ready");
  }

  const escapedExpr = expr.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
  const code = `calculate("""${escapedExpr}""", "${mode}", "${outputUnit}", ${precisionEnabled ? 'True' : 'False'}, ${precisionDenom})`;
  
  try {
    const resultProxy = await window.pyodide.runPythonAsync(code);
    const resultArray = resultProxy.toJs();
    
    // Python returns: (mixed, improper, decimal)
    const mixed = resultArray[0];
    const improper = resultArray[1];
    const decimal = resultArray[2];

    if (mixed === "Error") {
      return { mixed, improper, decimal, isError: true };
    }

    return { mixed, improper, decimal, isError: false };
  } catch (error) {
    return {
      mixed: "Error",
      improper: "Error",
      decimal: error instanceof Error ? error.message : "Unknown error",
      isError: true,
    };
  }
};