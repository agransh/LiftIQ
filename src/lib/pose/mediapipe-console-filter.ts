/**
 * MediaPipe Tasks Vision WASM logs TFLite delegate init (e.g. XNNPACK) via
 * Emscripten stderr → console.error. Next.js devtools treats that as a runtime
 * error. Filter known harmless INFO lines once per page load.
 */
let installed = false;

export function installMediaPipeConsoleFilter(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  const shouldMute = (args: unknown[]) => {
    const t = args.map((a) => (typeof a === "string" ? a : String(a))).join(" ");
    return (
      /TensorFlow Lite XNNPACK/i.test(t) ||
      /INFO:\s*Created TensorFlow Lite/i.test(t) ||
      /Created TensorFlow Lite.*delegate/i.test(t)
    );
  };

  for (const key of ["error", "warn", "info", "log"] as const) {
    const orig = console[key].bind(console);
    console[key] = (...args: unknown[]) => {
      if (shouldMute(args)) return;
      orig(...args);
    };
  }
}

installMediaPipeConsoleFilter();
