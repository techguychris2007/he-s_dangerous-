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
      <div className="min-h-screen w-full flex items-center justify-center p-6" style={{ background: '#0a1420' }}>
        <div className="max-w-lg w-full rounded-xl border border-[#c9a15f]/40 bg-[#111826] p-6 text-center">
          <h1 className="text-lg font-bold text-white mb-2">Something broke on this page</h1>
          <p className="text-sm text-[#9aa4b2] mb-4 leading-relaxed">
            An unexpected error stopped this page from rendering. The details are in your browser's
            console (F12 → Console) — that's the exact message to share for a fix.
          </p>
          <pre className="text-left text-xs text-[#e0a96d] bg-black/30 rounded-lg p-3 mb-4 overflow-x-auto whitespace-pre-wrap break-words">
            {error.message}
          </pre>
          <button
            onClick={this.handleReload}
            className="px-4 py-2 rounded-lg bg-[#c9a15f] text-black text-sm font-semibold hover:brightness-110 transition"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
