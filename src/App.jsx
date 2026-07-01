import React, { useState, useEffect, useMemo } from 'react';
import { Scroll, Users, Book, Settings, Save, Play, Trash2, Plus, FolderOpen, Copy, Edit, ArrowLeft, Swords, Compass, AlertTriangle, Upload, Download, LogOut, UserPlus } from 'lucide-react';
import CharacterWizard from './components/CharacterWizard/CharacterWizard';
import defaultEquipment from './data/TS-4-equipaggiamento.json';
import EquipmentCatalogManager from './components/EquipmentCatalogManager';
import SpellCatalogManager from './components/SpellCatalogManager';
import CombatCalculator from './components/CombatCalculator';
import MovementManoeuvreResolver from './components/MovementManoeuvreResolver';
import FumbleResolver from './components/FumbleResolver';
import CriticalResolver from './components/CriticalResolver';
import StaticManoeuvreResolver from './components/StaticManoeuvreResolver';
import SpellResolver from './components/SpellResolver';
import { getCharacterHpTot } from './utils/skillHelpers';
import CsvExportManager from './components/CsvExportManager';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './components/Auth/LoginPage';
import PlayerDashboard from './components/Player/PlayerDashboard';
import PlayerManager from './components/GM/PlayerManager';
import CompanyManager from './components/GM/CompanyManager';
import CampaignManager from './components/GM/CampaignManager';
import { db } from './firebase';
import { collection, doc } from 'firebase/firestore';
import {
  subscribeToCharacters,
  saveCharacter,
  deleteCharacter,
  updateCharacterHp,
  updateCharacterParry,
  resetAllParries
} from './services/characterService';
import { getEquipmentCatalog, saveEquipmentCatalog } from './services/settingsService';
import { getSpellCatalog, saveSpellCatalog } from './services/spellCatalogService';
import { subscribeToCompanies } from './services/companyService';
import { subscribeToCampaigns } from './services/campaignService';
import {
  subscribeToCampaignNpcs,
  subscribeToCampaignCreatures,
  deleteCampaignNpc,
  deleteCampaignCreature,
  updateCampaignActorHp
} from './services/npcService';
import NpcCatalogTab from './components/GM/NpcCatalogTab';
import CreatureCatalogTab from './components/GM/CreatureCatalogTab';
import CampaignRosterManager from './components/GM/CampaignRosterManager';

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

const ACTION_SUB_TABS = [
  { id: 'static', label: 'Manovre Statiche', icon: Scroll },
  { id: 'movement', label: 'Manovre di movimento', icon: Compass },
  { id: 'combat', label: 'Combattimento', icon: Swords },
  { id: 'criticals', label: 'Colpi Critici', icon: AlertTriangle },
  { id: 'fumbles', label: 'Colpi Maldestri', icon: AlertTriangle },
  { id: 'spells_base', label: 'Incantesimi Base', icon: Book },
  { id: 'spells_direct', label: 'Incantesimi Diretti', icon: Book }
];

function App() {
  const { user, userData, role, loading, logout, isGM, isPlayer } = useAuth();
  
  const [activeTab, setActiveTab] = useState('creation');
  const [activeActionSubTab, setActiveActionSubTab] = useState('static');
  const [activeSettingsSubTab, setActiveSettingsSubTab] = useState('equipment');
  const [activeCreaturesSubTab, setActiveCreaturesSubTab] = useState('npccatalog');
  const [fumbleRedirectData, setFumbleRedirectData] = useState(null);

  const [campaignNpcs, setCampaignNpcs] = useState([]);
  const [campaignCreatures, setCampaignCreatures] = useState([]);

  const handleRedirectToFumble = (data) => {
    setFumbleRedirectData(data);
    setActiveTab('actions');
    setActiveActionSubTab('fumbles');
  };

  const [savedCharacters, setSavedCharacters] = useState([]);
  const [activeCharacter, setActiveCharacter] = useState(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [equipmentCatalog, setEquipmentCatalog] = useState(defaultEquipment);
  const [spellCatalog, setSpellCatalog] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [activeCampaign, setActiveCampaign] = useState(() => {
    try {
      const stored = localStorage.getItem('merp_active_campaign');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const handleSetActiveCampaign = (camp) => {
    setActiveCampaign(camp);
    if (camp) {
      localStorage.setItem('merp_active_campaign', JSON.stringify(camp));
    } else {
      localStorage.removeItem('merp_active_campaign');
    }
  };

  // Sottoscrizione in tempo reale ai personaggi del GM
  useEffect(() => {
    if (!user || role !== 'GM') return;
    const unsubscribe = subscribeToCharacters(user.uid, (chars) => {
      setSavedCharacters(chars);
    });
    return unsubscribe;
  }, [user, role]);

  // Sottoscrizione in tempo reale alle compagnie
  useEffect(() => {
    if (!user || role !== 'GM') return;
    const unsub = subscribeToCompanies(user.uid, setCompanies);
    return unsub;
  }, [user, role]);

  // Sottoscrizione in tempo reale alle campagne
  useEffect(() => {
    if (!user || role !== 'GM') return;
    const unsub = subscribeToCampaigns(user.uid, setCampaigns);
    return unsub;
  }, [user, role]);

  // Caricamento del catalogo attrezzatura da Firestore
  useEffect(() => {
    if (!user || role !== 'GM') return;
    getEquipmentCatalog(user.uid).then((catalog) => {
      setEquipmentCatalog(catalog);
    });
  }, [user, role]);

  // Caricamento del catalogo incantesimi da Firestore
  useEffect(() => {
    if (!user || role !== 'GM') return;
    getSpellCatalog(user.uid).then((catalog) => {
      setSpellCatalog(catalog);
    });
  }, [user, role]);

  // Sincronizza lo stato locale della campagna con i dati aggiornati del server
  const currentActiveCampaign = useMemo(() => {
    if (!activeCampaign) return null;
    return campaigns.find(c => c.id === activeCampaign.id) || activeCampaign;
  }, [activeCampaign, campaigns]);

  // Sincronizzazione in tempo reale di NPG e Creature della campagna attiva
  useEffect(() => {
    if (!user || role !== 'GM' || !currentActiveCampaign) {
      setCampaignNpcs([]);
      setCampaignCreatures([]);
      return;
    }
    const unsubNpcs = subscribeToCampaignNpcs(user.uid, currentActiveCampaign.id, setCampaignNpcs);
    const unsubCreatures = subscribeToCampaignCreatures(user.uid, currentActiveCampaign.id, setCampaignCreatures);
    return () => {
      unsubNpcs();
      unsubCreatures();
    };
  }, [user, role, currentActiveCampaign]);

  const handleDeleteNpc = async (npcId) => {
    try {
      await deleteCampaignNpc(user.uid, npcId);
    } catch (err) {
      console.error(err);
      alert("Errore durante l'eliminazione del PNG: " + err.message);
    }
  };

  const handleDeleteCreature = async (creatureId) => {
    try {
      await deleteCampaignCreature(user.uid, creatureId);
    } catch (err) {
      console.error(err);
      alert("Errore durante l'eliminazione della creatura: " + err.message);
    }
  };

  const handleUpdateActorHp = async (type, actorId, newHp) => {
    try {
      await updateCampaignActorHp(user.uid, type, actorId, newHp);
    } catch (err) {
      console.error(err);
      alert("Errore durante l'aggiornamento dei PF: " + err.message);
    }
  };

  // Filtra i personaggi sulla base delle compagnie associate alla campagna attiva
  const activeCampaignCharacters = useMemo(() => {
    if (!currentActiveCampaign) return savedCharacters;
    const campCompanies = companies.filter(comp => currentActiveCampaign.companyIds?.includes(comp.id));
    const allowedCharIds = new Set(campCompanies.flatMap(comp => comp.characterIds || []));
    return savedCharacters.filter(char => allowedCharIds.has(char.id));
  }, [currentActiveCampaign, companies, savedCharacters]);

  const handleUpdateCatalog = async (newCatalog) => {
    setEquipmentCatalog(newCatalog);
    try {
      await saveEquipmentCatalog(user.uid, newCatalog);
    } catch (err) {
      console.error(err);
      alert("Errore durante il salvataggio del catalogo attrezzatura: " + err.message);
    }
  };

  const handleUpdateSpellCatalog = async (newCatalog) => {
    setSpellCatalog(newCatalog);
    try {
      await saveSpellCatalog(user.uid, newCatalog);
    } catch (err) {
      console.error(err);
      alert("Errore durante il salvataggio del catalogo incantesimi: " + err.message);
    }
  };

  const handleSaveCharacter = async (charData) => {
    const name = charData.name?.trim() || 'Senza Nome';
    try {
      const saved = await saveCharacter(user.uid, charData);
      setActiveCharacter(saved);
      alert(`Personaggio "${name}" salvato con successo!`);
      setActiveTab('roster');
    } catch (err) {
      console.error(err);
      alert("Errore durante il salvataggio del personaggio: " + err.message);
    }
  };

  const handleLoadCharacter = (charData) => {
    setActiveCharacter(charData);
    setActiveStepIndex(9); // Step 10. Riepilogo Scheda (indice 0-based = 9)
    setActiveTab('creation');
  };

  const handleDeleteCharacter = async (id) => {
    const char = savedCharacters.find(c => c.id === id);
    if (!char) return;
    if (confirm(`Sei sicuro di voler eliminare permanentemente il personaggio "${char.name}"?`)) {
      try {
        await deleteCharacter(user.uid, id);
        if (activeCharacter?.id === id) {
          setActiveCharacter(null);
        }
      } catch (err) {
        console.error(err);
        alert("Errore durante l'eliminazione del personaggio: " + err.message);
      }
    }
  };

  const handleUpdateCharacterHpSubiti = async (charId, hpSubiti) => {
    try {
      await updateCharacterHp(user.uid, charId, hpSubiti);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateCharacterBoSpesoParata = async (charId, boSpesoParata) => {
    try {
      await updateCharacterParry(user.uid, charId, boSpesoParata);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetAllParries = async () => {
    try {
      await resetAllParries(user.uid, savedCharacters.map(c => c.id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicateCharacter = async (charData) => {
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

    const id = doc(collection(db, "temp")).id; // Usa ID Firestore
    const duplicatedChar = {
      ...charData,
      id,
      name: trimmedName,
      createdAt: null, // Forza la ricreazione del timestamp
      hpSubiti: 0,
      boSpesoParata: 0
    };

    try {
      await saveCharacter(user.uid, duplicatedChar);
      alert(`Personaggio "${trimmedName}" creato come copia di "${charData.name}"!`);
    } catch (err) {
      console.error(err);
      alert("Errore durante la duplicazione: " + err.message);
    }
  };

  const handleExportCharacter = (char) => {
    try {
      const dataStr = JSON.stringify(char, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const level = 1 + (char.levelDevelopments || []).length;
      const exportFileDefaultName = `${char.name.replace(/\s+/g, '_')}_lvl_${level}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } catch (err) {
      alert("Errore durante l'esportazione: " + err.message);
    }
  };

  const handleImportCharacterClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          
          if (!parsed.name || !parsed.race || !parsed.profession) {
            alert("File JSON non valido: il file deve contenere almeno nome, popolo e professione del personaggio.");
            return;
          }
          
          const nameExists = savedCharacters.some(c => c.name.toLowerCase() === parsed.name.toLowerCase());
          
          let importedChar = { ...parsed };
          
          if (nameExists) {
            const choice = confirm(`Un personaggio con il nome "${parsed.name}" esiste già nel roster.\nVuoi sovrascriverlo (OK) o importarlo come copia con nome diverso (Annulla)?`);
            if (choice) {
              const existingChar = savedCharacters.find(c => c.name.toLowerCase() === parsed.name.toLowerCase());
              importedChar.id = existingChar.id; // Mantieni lo stesso ID per sovrascrivere
              await saveCharacter(user.uid, importedChar);
              alert(`Personaggio "${parsed.name}" sovrascritto con successo!`);
              return;
            } else {
              const newName = prompt("Inserisci un nuovo nome per il personaggio importato:", `${parsed.name}_copia`);
              if (!newName || !newName.trim()) {
                alert("Importazione annullata: nome non valido.");
                return;
              }
              importedChar.name = newName.trim();
              importedChar.id = doc(collection(db, "temp")).id;
            }
          } else {
            importedChar.id = parsed.id || doc(collection(db, "temp")).id;
          }
          
          await saveCharacter(user.uid, importedChar);
          alert(`Personaggio "${importedChar.name}" importato con successo!`);
        } catch (err) {
          alert("Errore durante la lettura del file: " + err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleStartNewCharacter = () => {
    setActiveCharacter(null);
    setActiveStepIndex(0); // Nuova creazione parte da step 1 (Popolo)
    setActiveTab('creation');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: "'Montserrat', sans-serif" }}>
        <div style={{ width: '48px', height: '48px', border: '4px solid rgba(2, 132, 199, 0.1)', borderTop: '4px solid var(--primary-color)', borderRadius: '50%', animation: 'spin 1s linear' }}></div>
        <div style={{ marginTop: '1rem', fontSize: '1rem', fontWeight: '500', color: '#94a3b8' }}>Caricamento in corso...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (isPlayer) {
    return <PlayerDashboard />;
  }

  return (
    <div className="app-container">
      <nav className="top-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <div className="top-nav-logo">
            <Book className="w-6 h-6" />
            <span>MERP Companion</span>
          </div>
          <div className="nav-tabs">
            <button 
              className={`nav-tab ${activeTab === 'creation' ? 'active' : ''}`}
              onClick={handleStartNewCharacter}
            >
              <Scroll className="w-4 h-4" />
              Creazione PG
            </button>
            <button 
              className={`nav-tab ${activeTab === 'roster' ? 'active' : ''}`}
              onClick={() => setActiveTab('roster')}
            >
              <FolderOpen className="w-4 h-4" />
              Roster PG / PNG
            </button>
            <button 
              className={`nav-tab ${activeTab === 'players' ? 'active' : ''}`}
              onClick={() => setActiveTab('players')}
            >
              <UserPlus className="w-4 h-4" />
              Giocatori
            </button>
            <button 
              className={`nav-tab ${activeTab === 'companies' ? 'active' : ''}`}
              onClick={() => setActiveTab('companies')}
            >
              <Users className="w-4 h-4" />
              Compagnie
            </button>
            <button 
              className={`nav-tab ${activeTab === 'campaigns' ? 'active' : ''}`}
              onClick={() => setActiveTab('campaigns')}
            >
              <Compass className="w-4 h-4" />
              Campagne
            </button>
            <button 
              className={`nav-tab ${activeTab === 'actions' ? 'active' : ''}`}
              onClick={() => setActiveTab('actions')}
            >
              <Swords className="w-4 h-4" />
              Risoluzione azioni
            </button>
            <button 
              className={`nav-tab ${activeTab === 'creatures' ? 'active' : ''}`}
              onClick={() => setActiveTab('creatures')}
            >
              <Users className="w-4 h-4" />
              PNG & Mostri
            </button>
            <button 
              className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings className="w-4 h-4" />
              Impostazioni
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>GM: <strong>{userData?.displayName || 'Custode'}</strong></span>
          <button 
            onClick={logout} 
            className="btn btn-outline" 
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', borderColor: 'var(--border-color)', color: 'var(--text-muted)', height: 'fit-content' }}
          >
            <LogOut className="w-4 h-4" />
            Esci
          </button>
        </div>
      </nav>

      {currentActiveCampaign && (
        <div style={{
          backgroundColor: 'var(--primary-light)',
          borderBottom: '1px solid var(--primary-color)',
          padding: '0.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.85rem',
          color: 'var(--primary-color)',
          fontWeight: 700
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Compass className="w-4 h-4" />
            <span>SESSIONE CAMPAGNA ATTIVA: <strong>{currentActiveCampaign.name}</strong></span>
            {currentActiveCampaign.description && (
              <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                - {currentActiveCampaign.description}
              </span>
            )}
          </div>
          <button 
            onClick={() => handleSetActiveCampaign(null)} 
            className="btn btn-outline" 
            style={{ 
              padding: '0.15rem 0.6rem', 
              fontSize: '0.75rem', 
              borderColor: 'rgba(2, 132, 199, 0.3)', 
              color: 'var(--primary-color)',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            Termina Sessione
          </button>
        </div>
      )}

      <main className="main-content">
        {activeTab === 'creation' && (
          <ErrorBoundary>
            <CharacterWizard 
              key={activeCharacter?.id || 'new'} 
              initialData={activeCharacter} 
              initialStepIndex={activeStepIndex}
              onSave={handleSaveCharacter} 
              equipmentCatalog={equipmentCatalog}
              spellCatalog={spellCatalog}
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
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  className="btn btn-outline"
                  onClick={handleImportCharacterClick}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Upload className="w-4 h-4" />
                  Importa PG
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleStartNewCharacter}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Plus className="w-4 h-4" />
                  Nuovo Personaggio
                </button>
              </div>
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
                            <p style={{ margin: '0.2rem 0' }}><strong>Popolo:</strong> {char.race?.nome || char.race?.popolo || '—'}</p>
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
                            style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', gap: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Carica Personaggio"
                          >
                            <FolderOpen className="w-3.5 h-3.5" />
                            Carica
                          </button>
                          <button 
                            className="btn btn-outline"
                            onClick={() => handleExportCharacter(char)}
                            style={{ padding: '0.4rem', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                            title="Esporta Personaggio"
                          >
                            <Download className="w-3.5 h-3.5" />
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
        {activeTab === 'players' && (
          <ErrorBoundary>
            <PlayerManager savedCharacters={savedCharacters} />
          </ErrorBoundary>
        )}
        {activeTab === 'companies' && (
          <ErrorBoundary>
            <CompanyManager savedCharacters={savedCharacters} />
          </ErrorBoundary>
        )}
        {activeTab === 'campaigns' && (
          <ErrorBoundary>
            <CampaignManager 
              activeCampaign={currentActiveCampaign} 
              onSetActiveCampaign={handleSetActiveCampaign} 
            />
          </ErrorBoundary>
        )}
        {activeTab === 'actions' && (
          <div>
            {/* Submenu Risoluzione Azioni — 3 colonne */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.5rem',
              marginBottom: '1.5rem',
            }}>
              {/* Prima riga */}
              {['static', 'movement', null].map((id, idx) => {
                if (!id) return <div key={`r1-${idx}`} />;
                const tab = ACTION_SUB_TABS.find(t => t.id === id);
                if (!tab) return <div key={id} />;
                const Icon = tab.icon;
                return (
                  <button
                    key={id}
                    onClick={() => { setActiveActionSubTab(id); setFumbleRedirectData(null); }}
                    style={{
                      padding: '0.6rem 0.5rem',
                      fontSize: '0.8rem',
                      fontWeight: activeActionSubTab === id ? 800 : 600,
                      textAlign: 'center',
                      border: `2px solid ${activeActionSubTab === id ? 'var(--primary-color)' : 'var(--border-color)'}`,
                      borderRadius: '8px',
                      backgroundColor: activeActionSubTab === id ? 'var(--primary-light)' : '#fafafa',
                      color: activeActionSubTab === id ? 'var(--primary-color)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                    }}
                    className="hover:brightness-95"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
              {/* Seconda riga */}
              {['combat', 'criticals', 'fumbles'].map((id) => {
                const tab = ACTION_SUB_TABS.find(t => t.id === id);
                if (!tab) return <div key={id} />;
                const Icon = tab.icon;
                return (
                  <button
                    key={id}
                    onClick={() => { setActiveActionSubTab(id); setFumbleRedirectData(null); }}
                    style={{
                      padding: '0.6rem 0.5rem',
                      fontSize: '0.8rem',
                      fontWeight: activeActionSubTab === id ? 800 : 600,
                      textAlign: 'center',
                      border: `2px solid ${activeActionSubTab === id ? 'var(--primary-color)' : 'var(--border-color)'}`,
                      borderRadius: '8px',
                      backgroundColor: activeActionSubTab === id ? 'var(--primary-light)' : '#fafafa',
                      color: activeActionSubTab === id ? 'var(--primary-color)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                    }}
                    className="hover:brightness-95"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
              {/* Terza riga */}
              {['spells_base', 'spells_direct', null].map((id, idx) => {
                if (!id) return <div key={`r3-${idx}`} />;
                const tab = ACTION_SUB_TABS.find(t => t.id === id);
                if (!tab) return <div key={id} />;
                const Icon = tab.icon;
                return (
                  <button
                    key={id}
                    onClick={() => { setActiveActionSubTab(id); setFumbleRedirectData(null); }}
                    style={{
                      padding: '0.6rem 0.5rem',
                      fontSize: '0.8rem',
                      fontWeight: activeActionSubTab === id ? 800 : 600,
                      textAlign: 'center',
                      border: `2px solid ${activeActionSubTab === id ? 'var(--primary-color)' : 'var(--border-color)'}`,
                      borderRadius: '8px',
                      backgroundColor: activeActionSubTab === id ? 'var(--primary-light)' : '#fafafa',
                      color: activeActionSubTab === id ? 'var(--primary-color)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                    }}
                    className="hover:brightness-95"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Contenuto Attivo */}
            {activeActionSubTab === 'combat' && (
              <ErrorBoundary>
                <CombatCalculator 
                  savedCharacters={activeCampaignCharacters}
                  campaignNpcs={campaignNpcs}
                  campaignCreatures={campaignCreatures}
                  onUpdateActorHp={handleUpdateActorHp}
                  equipmentCatalog={equipmentCatalog}
                  onUpdateHpSubiti={handleUpdateCharacterHpSubiti}
                  onUpdateBoSpesoParata={handleUpdateCharacterBoSpesoParata}
                  onResetAllParries={handleResetAllParries}
                />
              </ErrorBoundary>
            )}
            {activeActionSubTab === 'movement' && (
              <ErrorBoundary>
                <MovementManoeuvreResolver 
                  savedCharacters={activeCampaignCharacters}
                  campaignNpcs={campaignNpcs}
                  campaignCreatures={campaignCreatures}
                  onRedirectToFumble={handleRedirectToFumble}
                />
              </ErrorBoundary>
            )}
            {activeActionSubTab === 'fumbles' && (
              <ErrorBoundary>
                <FumbleResolver 
                  key={fumbleRedirectData ? `${fumbleRedirectData.tableCode}-${fumbleRedirectData.difficulty}-${fumbleRedirectData.diceRoll}` : 'fumble-resolver-standalone'}
                  initialTableCode={fumbleRedirectData?.tableCode || 'TTM-1'}
                  initialManoeuvreDifficulty={fumbleRedirectData?.difficulty || 'Normale'}
                  initialDiceRoll={fumbleRedirectData?.diceRoll || 50}
                  initialModifierCustom={fumbleRedirectData?.modifierCustom || 0}
                  showTitle={true}
                />
              </ErrorBoundary>
            )}
            {activeActionSubTab === 'static' && (
              <ErrorBoundary>
                <StaticManoeuvreResolver 
                  savedCharacters={activeCampaignCharacters}
                  campaignNpcs={campaignNpcs}
                />
              </ErrorBoundary>
            )}
            {activeActionSubTab === 'criticals' && (
              <ErrorBoundary>
                <CriticalResolver 
                  initialTableCode="TC-2"
                  initialSeverity="C"
                  initialDiceRoll={50}
                  showTitle={true}
                />
              </ErrorBoundary>
            )}
            {activeActionSubTab === 'spells_base' && (
              <ErrorBoundary>
                <SpellResolver 
                  initialType="base"
                  showTitle={true}
                />
              </ErrorBoundary>
            )}
            {activeActionSubTab === 'spells_direct' && (
              <ErrorBoundary>
                <SpellResolver 
                  initialType="dardo"
                  showTitle={true}
                />
              </ErrorBoundary>
            )}
          </div>
        )}
        {activeTab === 'settings' && (
          <div>
            {/* Submenu Impostazioni — orizzontale */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '1.5rem',
            }}>
              {[
                { id: 'equipment', label: 'Equipaggiamento' },
                { id: 'spells', label: 'Incantesimi' },
                { id: 'export', label: 'Esportazione (CSV)' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSettingsSubTab(tab.id)}
                  style={{
                    padding: '0.6rem 1.25rem',
                    fontSize: '0.85rem',
                    fontWeight: activeSettingsSubTab === tab.id ? 800 : 600,
                    textAlign: 'center',
                    border: `2px solid ${activeSettingsSubTab === tab.id ? 'var(--primary-color)' : 'var(--border-color)'}`,
                    borderRadius: '8px',
                    backgroundColor: activeSettingsSubTab === tab.id ? 'var(--primary-light)' : '#fafafa',
                    color: activeSettingsSubTab === tab.id ? 'var(--primary-color)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    flex: 1,
                    maxWidth: '240px',
                  }}
                  className="hover:brightness-95"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Contenuto condizionale */}
            <ErrorBoundary>
              {activeSettingsSubTab === 'equipment' && (
                <EquipmentCatalogManager 
                  catalog={equipmentCatalog} 
                  onUpdate={handleUpdateCatalog} 
                />
              )}
              {activeSettingsSubTab === 'spells' && spellCatalog && (
                <SpellCatalogManager 
                  catalog={spellCatalog}
                  onUpdate={handleUpdateSpellCatalog}
                />
              )}
              {activeSettingsSubTab === 'export' && (
                <CsvExportManager />
              )}
            </ErrorBoundary>
          </div>
        )}
        {activeTab === 'creatures' && (
          <div>
            {!currentActiveCampaign ? (
              <div className="card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
                <Compass className="w-12 h-12" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                <h3 className="text-lg font-bold mb-2">Nessuna Campagna Attiva</h3>
                <p className="max-w-md mx-auto text-sm">
                  Devi prima selezionare o creare una Campagna attiva dal menu <strong>Campagne</strong> per poter gestire, creare ed associare PNG o Mostri.
                </p>
              </div>
            ) : (
              <div>
                {/* Sotto-tab Navigazione */}
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '1.5rem',
                }}>
                  {[
                    { id: 'npccatalog', label: 'Crea PNG Standard (ST-3)' },
                    { id: 'creaturecatalog', label: 'Catalogo Creature & Mostri' },
                    { id: 'campaignroster', label: `Roster Attivo (${campaignNpcs.length + campaignCreatures.length} Attori)` },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCreaturesSubTab(tab.id)}
                      style={{
                        padding: '0.6rem 1.25rem',
                        fontSize: '0.85rem',
                        fontWeight: activeCreaturesSubTab === tab.id ? 800 : 600,
                        textAlign: 'center',
                        border: `2px solid ${activeCreaturesSubTab === tab.id ? 'var(--primary-color)' : 'var(--border-color)'}`,
                        borderRadius: '8px',
                        backgroundColor: activeCreaturesSubTab === tab.id ? 'var(--primary-light)' : '#fafafa',
                        color: activeCreaturesSubTab === tab.id ? 'var(--primary-color)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        flex: 1,
                        maxWidth: '280px',
                      }}
                      className="hover:brightness-95"
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Contenuto Condizionale Sotto-tab */}
                <ErrorBoundary>
                  {activeCreaturesSubTab === 'npccatalog' && (
                    <NpcCatalogTab 
                      gmId={user.uid}
                      campaignId={currentActiveCampaign.id}
                      onSaveSuccess={() => setActiveCreaturesSubTab('campaignroster')}
                    />
                  )}
                  {activeCreaturesSubTab === 'creaturecatalog' && (
                    <CreatureCatalogTab 
                      gmId={user.uid}
                      campaignId={currentActiveCampaign.id}
                      onSaveSuccess={() => setActiveCreaturesSubTab('campaignroster')}
                    />
                  )}
                  {activeCreaturesSubTab === 'campaignroster' && (
                    <CampaignRosterManager 
                      activeNpcs={campaignNpcs}
                      activeCreatures={campaignCreatures}
                      onDeleteNpc={handleDeleteNpc}
                      onDeleteCreature={handleDeleteCreature}
                      onUpdateHp={handleUpdateActorHp}
                    />
                  )}
                </ErrorBoundary>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
