/** Hosts the .NET WebAssembly runtime and the Roslyn compiler (built from tools/csharp-runner and
 *  served from /csharp-runtime/) in a dedicated Worker, so a learner's infinite loop can only hang
 *  this thread, which csharpRunner.ts terminates and replaces. The runtime boots once per worker and
 *  then serves every run, because booting costs far more than compiling. */

interface RunnerExports {
  Runner: { RunAsync(requestJson: string): Promise<string>; WarmUpAsync(): Promise<string> };
}

let exportsPromise: Promise<RunnerExports> | null = null;

async function boot(base: string): Promise<RunnerExports> {
  // Without this flag the .NET loader assumes any Worker is one of its own threads and waits
  // forever for a main thread to hand it the runtime.
  (globalThis as { dotnetSidecar?: boolean }).dotnetSidecar = true;
  const url = new URL('csharp-runtime/_framework/dotnet.js', base).href;
  const { dotnet } = await import(/* @vite-ignore */ url);
  const runtime = await dotnet.create();
  const exports = await runtime.getAssemblyExports(runtime.getConfig().mainAssemblyName) as RunnerExports;
  await exports.Runner.WarmUpAsync();
  return exports;
}

self.onmessage = async (e: MessageEvent<{ id: number; base: string; request?: unknown }>) => {
  const { id, base, request } = e.data;
  try {
    exportsPromise ??= boot(base);
    const exports = await exportsPromise;
    if (!request) { self.postMessage({ id, ready: true }); return; }
    const response = await exports.Runner.RunAsync(JSON.stringify(request));
    self.postMessage({ id, response: JSON.parse(response) });
  } catch (error) {
    exportsPromise = null;
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) });
  }
};
