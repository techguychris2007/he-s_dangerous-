import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** Without this, an uncaught error anywhere in the render tree unmounts the ENTIRE app and leaves a
 *  blank #root with zero indication anything went wrong — the exact "nothing shows up, no error, just
 *  an empty box" symptom. This catches it, logs the real error/stack to the console (so it's still
 *  fully debuggable), and shows something a learner can actually act on instead of silent nothing. */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[DarkWorld] Uncaught render error:', error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[var(--chrome-bg)]">
        <div className="max-w-lg w-full rounded-xl border border-[var(--chrome-line-strong)] bg-[var(--chrome-raise)] p-7 text-center">
          <p className="text-2xs font-bold uppercase tracking-[0.16em] text-[var(--chrome-highlight)] mb-3">Connection interrupted</p>
          <h1 className="text-xl font-bold text-[var(--chrome-ink)] mb-2">This page needs a fresh start</h1>
          <p className="text-sm text-[var(--chrome-text)] mb-4 leading-relaxed">
            We couldn’t display this page. Try reloading it, or return to your dashboard to continue learning.
          </p>
          <details className="mb-5 text-left text-xs text-[var(--chrome-muted)]"><summary className="cursor-pointer py-2">Details for support</summary><pre className="font-mono text-[var(--term-system)] bg-black/30 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words">{error.message}</pre></details>
          <button
            onClick={this.handleReload}
            className="px-4 py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-semibold hover:brightness-110 transition"
          >
            Reload page
          </button>
          <button onClick={() => { window.location.hash = '/'; this.handleReload(); }} className="ml-3 px-4 py-2.5 rounded-lg border border-[var(--chrome-line-strong)] text-[var(--chrome-ink)] text-sm font-semibold hover:bg-[var(--chrome-hover)]">Return to dashboard</button>
        </div>
      </div>
    );
  }
}
