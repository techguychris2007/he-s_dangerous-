declare module 'JSCPP' {
  export interface JSCPPConfig {
    stdio?: {
      write?: (s: string) => void;
      drain?: () => string;
    };
    unsigned_overflow?: 'error' | 'warn' | 'ignore';
    /** milliseconds; JSCPP throws "Time limit exceeded." once the interpreter loop exceeds this */
    maxTimeout?: number;
  }

  function run(code: string, input: string, config?: JSCPPConfig): number;

  const JSCPP: { run: typeof run };
  export default JSCPP;
}
