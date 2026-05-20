import { useState } from 'react';
import { Scroll, Users, Book, Settings, Save } from 'lucide-react';
import CharacterWizard from './components/CharacterWizard/CharacterWizard';

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
        {activeTab === 'creation' && <CharacterWizard />}
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
