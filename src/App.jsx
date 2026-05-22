import React, { useState } from 'react';
import { Scroll, Users, Book, Settings, Save } from 'lucide-react';
import CharacterWizard from './components/CharacterWizard/CharacterWizard';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '8px', margin: '2rem' }}>
          <h2 style={{ color: '#cc0000' }}>Si è verificato un errore a runtime!</h2>
          <p><strong>Messaggio:</strong> {this.state.error && this.state.error.message}</p>
          <pre style={{ background: '#f9f9f9', padding: '1rem', overflowX: 'auto', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.stack}
          </pre>
          <pre style={{ background: '#f9f9f9', padding: '1rem', overflowX: 'auto', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#cc0000', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Ricarica la pagina
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [activeTab, setActiveTab] = useState('creation');

  return (
    <div className="app-container">
      <nav className="top-nav">
        <div className="top-nav-logo">
          <Book className="w-6 h-6" />
          <span>MERP Companion</span>
        </div>
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeTab === 'creation' ? 'active' : ''}`}
            onClick={() => setActiveTab('creation')}
          >
            <Scroll className="w-4 h-4" />
            Creazione PG
          </button>
          <button 
            className={`nav-tab ${activeTab === 'roster' ? 'active' : ''}`}
            onClick={() => setActiveTab('roster')}
          >
            <Users className="w-4 h-4" />
            Roster PG / PNG
          </button>
          <button 
            className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings className="w-4 h-4" />
            Impostazioni
          </button>
        </div>
      </nav>

      <main className="main-content">
        {activeTab === 'creation' && (
          <ErrorBoundary>
            <CharacterWizard />
          </ErrorBoundary>
        )}
        {activeTab === 'roster' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Roster Personaggi</h2>
              <p className="card-description">Gestione delle schede personaggio create.</p>
            </div>
            <div className="card-body">
              <p className="text-muted">Nessun personaggio ancora creato. Usa il tab Creazione PG per iniziare.</p>
            </div>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Impostazioni</h2>
              <p className="card-description">Configurazioni del companion.</p>
            </div>
            <div className="card-body">
              <p className="text-muted">In fase di sviluppo.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
