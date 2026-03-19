import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-charcoal flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
             <span className="text-red-500 text-2xl">⚠️</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-white mb-4">Something went wrong</h1>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            The application encountered an unexpected error. This might be due to a missing configuration or a network issue.
          </p>
          <pre className="bg-black/50 p-4 rounded-xl text-xs text-red-400 text-left overflow-auto max-w-2xl mb-8">
            {this.state.error?.message}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="bg-gold text-charcoal px-8 py-3 rounded-xl font-bold hover:bg-yellow-400 transition-all"
          >
            Refresh Session
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
