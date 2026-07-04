import { Book, LogOut, Compass } from 'lucide-react';

export default function AppHeader({
  user,
  userData,
  logout,
  activeTab,
  setActiveTab,
  currentActiveCampaign,
  handleSetActiveCampaign,
  handleStartNewCharacter
}) {
  const NAV_TABS = [
    { id: 'creation', label: 'Creazione PG', icon: 'Scroll' },
    { id: 'roster', label: 'Roster PG / PNG', icon: 'FolderOpen' },
    { id: 'players', label: 'Giocatori', icon: 'UserPlus' },
    { id: 'companies', label: 'Compagnie', icon: 'Users' },
    { id: 'campaigns', label: 'Campagne', icon: 'Compass' },
    { id: 'actions', label: 'Risoluzione azioni', icon: 'Swords' },
    { id: 'creatures', label: 'PNG & Mostri', icon: 'Users' },
    { id: 'settings', label: 'Impostazioni', icon: 'Settings' },
  ];

  const iconMap = {
    Scroll: '📜',
    FolderOpen: '📂',
    UserPlus: '👤',
    Users: '👥',
    Compass: '🧭',
    Swords: '⚔',
    Settings: '⚙',
  };

  return (
    <>
      <nav className="top-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <div className="top-nav-logo">
            <Book className="w-6 h-6" />
            <span>MERP Companion</span>
          </div>
          <div className="nav-tabs">
            {NAV_TABS.map(tab => (
              <button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={tab.id === 'creation' ? handleStartNewCharacter : () => setActiveTab(tab.id)}
              >
                <span style={{ fontSize: '1rem' }}>{iconMap[tab.icon]}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            GM: <strong>{userData?.displayName || 'Custode'}</strong>
          </span>
          <button
            onClick={logout}
            className="btn btn-outline"
            style={{
              padding: '0.4rem 0.8rem', fontSize: '0.85rem',
              display: 'flex', alignItems: 'center', gap: '0.25rem',
              borderColor: 'var(--border-color)', color: 'var(--text-muted)',
              height: 'fit-content'
            }}
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
              padding: '0.15rem 0.6rem', fontSize: '0.75rem',
              borderColor: 'rgba(2, 132, 199, 0.3)', color: 'var(--primary-color)',
              backgroundColor: 'white', cursor: 'pointer'
            }}
          >
            Termina Sessione
          </button>
        </div>
      )}
    </>
  );
}
