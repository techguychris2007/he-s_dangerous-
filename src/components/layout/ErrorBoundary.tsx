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
        <div className="max-w-lg w-full rounded-xl border border-[#79d0d5]/40 bg-[#111826] p-6 text-center">
          <h1 className="text-lg font-bold text-white mb-2">This page needs a fresh start</h1>
          <p className="text-sm text-[#9aa4b2] mb-4 leading-relaxed">
            We couldn’t display this page. Try reloading it, or return to your dashboard to continue learning.
          </p>
          <details className="mb-4 text-left text-xs text-[#9aa4b2]"><summary className="cursor-pointer py-2">Details for support</summary><pre className="text-[#e0a96d] bg-black/30 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words">{error.message}</pre></details>
          <button
            onClick={this.handleReload}
            className="px-4 py-2 rounded-lg bg-[#79d0d5] text-black text-sm font-semibold hover:brightness-110 transition"
          >
            Reload page
          </button>
          <button onClick={() => { window.location.hash = '/'; this.handleReload(); }} className="ml-3 px-4 py-2 rounded-lg border border-[#9aa4b2]/40 text-white text-sm font-semibold hover:bg-white/10">Return to dashboard</button>
        </div>
      </div>
    );
  }
}
