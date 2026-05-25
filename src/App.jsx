import React, { useState } from 'react';
import { Scroll, Users, Book, Settings, Save, Play, Trash2, Plus, FolderOpen, Copy, Edit, ArrowLeft, Swords } from 'lucide-react';
import CharacterWizard from './components/CharacterWizard/CharacterWizard';
import defaultEquipment from './data/TS_4-equipaggiamento.json';
import EquipmentCatalogManager from './components/EquipmentCatalogManager';
import CombatCalculator from './components/CombatCalculator';
import { getCharacterHpTot } from './utils/skillHelpers';

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
  const [savedCharacters, setSavedCharacters] = useState(() => {
    try {
      const stored = localStorage.getItem('merp_characters');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });
  const [activeCharacter, setActiveCharacter] = useState(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const [equipmentCatalog, setEquipmentCatalog] = useState(() => {
    try {
      const stored = localStorage.getItem('merp_custom_equipment');
      return stored ? JSON.parse(stored) : defaultEquipment;
    } catch (e) {
      console.error(e);
      return defaultEquipment;
    }
  });

  const handleUpdateCatalog = (newCatalog) => {
    setEquipmentCatalog(newCatalog);
    localStorage.setItem('merp_custom_equipment', JSON.stringify(newCatalog));
  };

  const handleSaveCharacter = (charData) => {
    const name = charData.name?.trim() || 'Senza Nome';
    const id = charData.id || Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const updatedChar = { ...charData, id, name };

    setSavedCharacters(prev => {
      const idx = prev.findIndex(c => c.id === updatedChar.id);
      let nextList;
      if (idx >= 0) {
        nextList = [...prev];
        nextList[idx] = updatedChar;
      } else {
        nextList = [...prev, updatedChar];
      }
      localStorage.setItem('merp_characters', JSON.stringify(nextList));
      return nextList;
    });

    setActiveCharacter(updatedChar);
    alert(`Personaggio "${name}" salvato con successo!`);
    setActiveTab('roster');
  };

  const handleLoadCharacter = (charData) => {
    setActiveCharacter(charData);
    setActiveStepIndex(8); // Carica direttamente a step 9 (Riepilogo Scheda)
    setActiveTab('creation');
  };

  const handleDeleteCharacter = (id) => {
    const char = savedCharacters.find(c => c.id === id);
    if (!char) return;
    if (confirm(`Sei sicuro di voler eliminare permanentemente il personaggio "${char.name}"?`)) {
      setSavedCharacters(prev => {
        const nextList = prev.filter(c => c.id !== id);
        localStorage.setItem('merp_characters', JSON.stringify(nextList));
        return nextList;
      });
      if (activeCharacter?.id === id) {
        setActiveCharacter(null);
      }
    }
  };

  const handleUpdateCharacterHpSubiti = (charId, hpSubiti) => {
    setSavedCharacters(prev => {
      const nextList = prev.map(c => {
        if (c.id === charId) {
          return { ...c, hpSubiti };
        }
        return c;
      });
      localStorage.setItem('merp_characters', JSON.stringify(nextList));
      return nextList;
    });
  };

  const handleDuplicateCharacter = (charData) => {
    const defaultNewName = `${charData.name || 'Senza Nome'}_COPY`;
    const newName = prompt('Inserisci il nome per il personaggio duplicato:', defaultNewName);
    
    if (newName === null) return; // user cancelled prompt
    
    const trimmedName = newName.trim();
    if (!trimmedName) {
      alert('Il nome non può essere vuoto!');
      return;
    }

    const nameExists = savedCharacters.some(c => c.name.toLowerCase() === trimmedName.toLowerCase());
    if (nameExists) {
      alert(`Esiste già un personaggio con il nome "${trimmedName}"! Scegli un nome diverso.`);
      return;
    }

    const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const duplicatedChar = {
      ...charData,
      id,
      name: trimmedName
    };

    setSavedCharacters(prev => {
      const nextList = [...prev, duplicatedChar];
      localStorage.setItem('merp_characters', JSON.stringify(nextList));
      return nextList;
    });

    alert(`Personaggio "${trimmedName}" creato come copia di "${charData.name}"!`);
  };

  const handleStartNewCharacter = () => {
    setActiveCharacter(null);
    setActiveStepIndex(0); // Nuova creazione parte da step 1 (Popolo)
    setActiveTab('creation');
  };

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
            className={`nav-tab ${activeTab === 'combat' ? 'active' : ''}`}
            onClick={() => setActiveTab('combat')}
          >
            <Swords className="w-4 h-4" />
            Combattimento
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
            <CharacterWizard 
              key={activeCharacter?.id || 'new'} 
              initialData={activeCharacter} 
              initialStepIndex={activeStepIndex}
              onSave={handleSaveCharacter} 
              equipmentCatalog={equipmentCatalog}
            />
          </ErrorBoundary>
        )}
        {activeTab === 'roster' && (
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className="card-title">Roster Personaggi</h2>
                <p className="card-description">Gestione delle schede personaggio create.</p>
              </div>
              <button 
                className="btn btn-primary"
                onClick={handleStartNewCharacter}
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                <Plus className="w-4 h-4" />
                Nuovo Personaggio
              </button>
            </div>
            <div className="card-body">
              {savedCharacters.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <Users className="w-12 h-12" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                  <p className="mb-4">Nessun personaggio salvato. Inizia a crearne uno ora!</p>
                  <button className="btn btn-primary" onClick={handleStartNewCharacter}>
                    Crea Personaggio
                  </button>
                </div>
              ) : (
                <div className="grid-3">
                  {savedCharacters.map(char => {
                    const level = 1 + (char.levelDevelopments || []).length;
                    return (
                      <div 
                        key={char.id} 
                        className="card"
                        style={{ border: '1px solid var(--border-color)', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px' }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{char.name}</h3>
                            <span 
                              style={{ 
                                fontSize: '0.75rem', 
                                padding: '0.2rem 0.5rem', 
                                backgroundColor: 'var(--primary-light)', 
                                color: 'var(--primary-color)', 
                                fontWeight: 700,
                                borderRadius: '4px' 
                              }}
                            >
                              Liv. {level}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                            <p style={{ margin: '0.2rem 0' }}><strong>Popolo:</strong> {char.race?.popolo || '—'}</p>
                            <p style={{ margin: '0.2rem 0' }}><strong>Professione:</strong> {char.profession?.professione || '—'}</p>
                            {char.stats && (
                              <div style={{ marginTop: '0.75rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem' }}>
                                {(() => {
                                  const hpTot = getCharacterHpTot(char);
                                  const hpSub = char.hpSubiti || 0;
                                  const hpRem = Math.max(0, hpTot - hpSub);
                                  const isGrave = hpSub > (hpTot / 2);
                                  return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 650 }}>
                                        <span>Punti Ferita (PF):</span>
                                        <span style={{ color: isGrave ? '#b91c1c' : '#15803d', fontWeight: 'bold' }}>
                                          {hpRem} / {hpTot} {hpSub > 0 && `(${hpSub} sub.)`}
                                        </span>
                                      </div>
                                      <div style={{ height: '6px', width: '100%', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div 
                                          style={{ 
                                            height: '100%', 
                                            width: `${Math.max(0, Math.min(100, (hpRem / hpTot) * 100))}%`,
                                            backgroundColor: isGrave ? '#ef4444' : '#22c55e',
                                            transition: 'width 0.3s ease'
                                          }} 
                                        />
                                      </div>
                                      {isGrave && (
                                        <span style={{ fontSize: '0.65rem', color: '#b91c1c', fontWeight: 'bold', display: 'block', marginTop: '0.1rem' }}>
                                          ⚠️ Gravemente Ferito (-20 BO)
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                          <button 
                            className="btn btn-primary"
                            onClick={() => handleLoadCharacter(char)}
                            style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', gap: '0.25rem' }}
                            title="Carica Personaggio"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            Carica
                          </button>
                          <button 
                            className="btn btn-outline"
                            onClick={() => handleDuplicateCharacter(char)}
                            style={{ padding: '0.4rem', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                            title="Duplica Personaggio"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            className="btn btn-outline"
                            onClick={() => handleDeleteCharacter(char.id)}
                            style={{ padding: '0.4rem', color: 'var(--danger-color)', borderColor: 'rgba(220, 38, 38, 0.2)' }}
                            title="Elimina Personaggio"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === 'combat' && (
          <ErrorBoundary>
            <CombatCalculator 
              savedCharacters={savedCharacters}
              equipmentCatalog={equipmentCatalog}
              onUpdateHpSubiti={handleUpdateCharacterHpSubiti}
            />
          </ErrorBoundary>
        )}
        {activeTab === 'settings' && (
          <ErrorBoundary>
            <EquipmentCatalogManager 
              catalog={equipmentCatalog} 
              onUpdate={handleUpdateCatalog} 
            />
          </ErrorBoundary>
        )}
      </main>
    </div>
  );
}

export default App;
