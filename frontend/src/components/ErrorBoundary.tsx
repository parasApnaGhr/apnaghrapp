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
        <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center px-6">
          <div className="max-w-md w-full bg-white border border-[#E5E1DB] p-8 text-center shadow-sm">
            <p className="text-xs tracking-[0.2em] text-[#C6A87C] uppercase mb-3">ApnaGhr</p>
            <h1 className="text-2xl text-[#1A1C20] mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
              Something went wrong
            </h1>
            <p className="text-sm text-[#4A4D53] mb-6">
              The app hit an unexpected UI error. Reload the page to recover.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="px-5 py-3 bg-[#04473C] text-white hover:bg-[#03352D] transition-colors"
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
