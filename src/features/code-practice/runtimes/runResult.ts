export interface RunResult {
  stdout: string;
  stderr: string;
  /** false if the code errored/crashed/timed out (stderr carries the reason either way) */
  ok: boolean;
}
