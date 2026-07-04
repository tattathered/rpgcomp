import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card p-6 border border-red-300 rounded-xl bg-red-50 text-red-900 my-4">
          <h3 className="font-bold text-lg mb-2">⚠️ Errore nel componente</h3>
          <p className="text-sm mb-2">Si è verificato un errore durante il rendering di questa sezione.</p>
          <pre className="text-xs bg-red-100 p-3 rounded overflow-auto max-h-32">
            {this.state.error?.message || 'Errore sconosciuto'}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded transition"
          >
            Riprova
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
