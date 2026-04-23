// @ts-nocheck
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--stitch-bg)] flex items-center justify-center px-6">
          <div className="max-w-md w-full bg-white border border-[var(--stitch-line)] p-8 text-center shadow-sm">
            <p className="text-xs tracking-[0.2em] text-[var(--stitch-muted)] uppercase mb-3">ApnaGhr</p>
            <h1 className="text-2xl text-[var(--stitch-ink)] mb-3" >
              Something went wrong
            </h1>
            <p className="text-sm text-[var(--stitch-muted)] mb-6">
              The app hit an unexpected UI error. Reload the page to recover.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="px-5 py-3 bg-[var(--stitch-ink)] text-white hover:bg-[var(--stitch-ink)] transition-colors"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
