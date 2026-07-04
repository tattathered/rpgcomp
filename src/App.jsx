import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, collection } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './contexts/AuthContext';
import { useCodex } from './contexts/CodexContext';
import LoginPage from './components/Auth/LoginPage';
import PlayerDashboard from './components/Player/PlayerDashboard';
import AppHeader from './components/AppHeader';
import AppTabs from './components/AppTabs';
import { getCharacterHpTot } from './utils/skillHelpers';
import {
  fetchCharacters,
  saveCharacter,
  deleteCharacter,
  duplicateCharacter,
  exportCharacter,
  importCharacter
} from './services/characterService';
import {
  fetchNpcs,
  deleteNpc
} from './services/npcService';
import {
  fetchCreatures,
  deleteCreature
} from './services/creatureService';
import {
  fetchCampaigns,
  setActiveCampaign
} from './services/campaignService';
import {
  fetchEquipmentCatalog,
  saveEquipmentCatalog
} from './services/settingsService';
import {
  fetchSpellCatalog,
  saveSpellCatalog
} from './services/spellCatalogService';
import { fetchCompanies } from './services/companyService';

export default function App() {
  const { user, userData, loading, logout, isPlayer } = useAuth();
  const { codexData } = useCodex();

  // --- STATO GLOBALE ---
  const [activeTab, setActiveTab] = useState('creation');
  const [activeCharacter, setActiveCharacter] = useState(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [savedCharacters, setSavedCharacters] = useState([]);
  const [campaignNpcs, setCampaignNpcs] = useState([]);
  const [campaignCreatures, setCampaignCreatures] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [currentActiveCampaign, setCurrentActiveCampaign] = useState(null);
  const [equipmentCatalog, setEquipmentCatalog] = useState([]);
  const [spellCatalog, setSpellCatalog] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [fumbleRedirectData, setFumbleRedirectData] = useState(null);

  // --- CARICAMENTO INIZIALE ---
  useEffect(() => {
    if (!user) return;
    const loadAll = async () => {
      try {
        const [chars, npcs, crets, camps, comps, equip, spells] = await Promise.all([
          fetchCharacters(user.uid),
          fetchNpcs(user.uid),
          fetchCreatures(user.uid),
          fetchCampaigns(user.uid),
          fetchCompanies(user.uid),
          fetchEquipmentCatalog(user.uid),
          fetchSpellCatalog(user.uid),
        ]);
        setSavedCharacters(chars);
        setCampaignNpcs(npcs);
        setCampaignCreatures(crets);
        setCampaigns(camps);
        setCompanies(comps);
        setEquipmentCatalog(equip || []);
        setSpellCatalog(spells);
      } catch (err) {
        console.error('Errore caricamento dati iniziali:', err);
      }
    };
    loadAll();
  }, [user]);

  // --- SINCRONIZZA CAMPAGNA ATTIVA ---
  useEffect(() => {
    const active = campaigns.find(c => c.active);
    setCurrentActiveCampaign(active || null);
  }, [campaigns]);

  // --- PERSONAGGI DELLA CAMPAGNA ATTIVA ---
  // Catena: Campagna → companyIds → Compagnie → characterIds → PG
  const activeCampaignCharacterIds = useMemo(() => {
    if (!currentActiveCampaign) return null; // null = mostra tutti
    const companyIds = currentActiveCampaign.companyIds || [];
    const campaignCompanies = companies.filter(c => companyIds.includes(c.id));
    const ids = new Set();
    campaignCompanies.forEach(comp => {
      (comp.characterIds || []).forEach(charId => ids.add(charId));
    });
    return ids;
  }, [currentActiveCampaign, companies]);

  const activeCampaignCharacters = activeCampaignCharacterIds
    ? savedCharacters.filter(c => activeCampaignCharacterIds.has(c.id))
    : savedCharacters;

  // --- HANDLER PERSONAGGI ---
  const handleSaveCharacter = useCallback(async (charData) => {
    if (!user) return;
    try {
      await saveCharacter(user.uid, charData);
      const chars = await fetchCharacters(user.uid);
      setSavedCharacters(chars);
      // Aggiorna anche il personaggio attivo se corrisponde
      setActiveCharacter(prev => (prev?.id === charData?.id ? charData : prev));
    } catch (err) {
      console.error('Errore salvataggio personaggio:', err);
    }
  }, [user]);

  const handleDeleteCharacter = useCallback(async (charId) => {
    if (!user) return;
    if (!window.confirm('Sei sicuro di voler eliminare questo personaggio?')) return;
    try {
      await deleteCharacter(user.uid, charId);
      setSavedCharacters(prev => prev.filter(c => c.id !== charId));
    } catch (err) {
      console.error('Errore eliminazione personaggio:', err);
    }
  }, [user]);

  const handleDuplicateCharacter = useCallback(async (char) => {
    if (!user) return;
    try {
      const newChar = await duplicateCharacter(user.uid, char);
      setSavedCharacters(prev => [...prev, newChar]);
    } catch (err) {
      console.error('Errore duplicazione personaggio:', err);
    }
  }, [user]);

  const handleExportCharacter = useCallback((char) => {
    exportCharacter(char);
  }, []);

  const handleImportCharacterClick = useCallback(() => {
    importCharacter(user, savedCharacters, setSavedCharacters);
  }, [user, savedCharacters]);

  const handleLoadCharacter = useCallback((char) => {
    setActiveCharacter(char);
    setActiveStepIndex(0);
    setActiveTab('sheet');
  }, []);

  const handleStartNewCharacter = useCallback(() => {
    setActiveCharacter(null);
    setActiveStepIndex(0);
    setActiveTab('creation');
  }, []);

  // --- NAVIGAZIONE SCHEDA -> WIZARD (per modifica creazione / upgrade livello) ---
  const handleNavigateToWizardStep = useCallback((charData, stepIndex) => {
    setActiveCharacter(charData);
    setActiveStepIndex(stepIndex);
    setActiveTab('creation');
  }, []);

  // --- SALVATAGGIO DA WIZARD CON RITORNO ALLA SCHEDA ---
  const handleWizardSaveAndReturn = useCallback(async (charData) => {
    if (!user) return;
    try {
      await saveCharacter(user.uid, charData);
      const chars = await fetchCharacters(user.uid);
      setSavedCharacters(chars);
      setActiveCharacter(charData);
      setActiveStepIndex(0);
      setActiveTab('sheet');
    } catch (err) {
      console.error('Errore salvataggio personaggio da wizard:', err);
    }
  }, [user]);

  // --- HANDLER HP ---
  const handleUpdateCharacterHpSubiti = useCallback(async (charId, hpSubiti) => {
    setSavedCharacters(prev => prev.map(c =>
      c.id === charId ? { ...c, hpSubiti } : c
    ));
    const char = savedCharacters.find(c => c.id === charId);
    if (char) {
      await saveCharacter(user.uid, { ...char, hpSubiti });
    }
  }, [user, savedCharacters]);

  const handleUpdateCharacterBoSpesoParata = useCallback(async (charId, boSpesoParata) => {
    setSavedCharacters(prev => prev.map(c =>
      c.id === charId ? { ...c, boSpesoParata } : c
    ));
    const char = savedCharacters.find(c => c.id === charId);
    if (char) {
      await saveCharacter(user.uid, { ...char, boSpesoParata });
    }
  }, [user, savedCharacters]);

  const handleResetAllParries = useCallback(async () => {
    const updated = savedCharacters.map(c => ({ ...c, boSpesoParata: 0 }));
    setSavedCharacters(updated);
    await Promise.all(updated.map(c => saveCharacter(user.uid, c)));
  }, [user, savedCharacters]);

  // --- HANDLER CAMPAGNA ---
  const handleSetActiveCampaign = useCallback(async (campaign) => {
    try {
      await setActiveCampaign(user.uid, campaign?.id || null);
      const camps = await fetchCampaigns(user.uid);
      setCampaigns(camps);
    } catch (err) {
      console.error('Errore impostazione campagna attiva:', err);
    }
  }, [user]);

  // --- HANDLER ATTORI (NPC/CREATURE) ---
  const handleUpdateActorHp = useCallback(async (type, actorId, newHp) => {
    if (type === 'npc') {
      setCampaignNpcs(prev => prev.map(n => n.id === actorId ? { ...n, hp: newHp } : n));
    } else if (type === 'creature') {
      setCampaignCreatures(prev => prev.map(c => c.id === actorId ? { ...c, PF_attuali: newHp } : c));
    }
  }, []);

  const handleDeleteNpc = useCallback(async (npcId) => {
    if (!window.confirm('Eliminare questo PNG?')) return;
    try {
      await deleteNpc(user.uid, npcId);
      setCampaignNpcs(prev => prev.filter(n => n.id !== npcId));
    } catch (err) {
      console.error('Errore eliminazione PNG:', err);
    }
  }, [user]);

  const handleDeleteCreature = useCallback(async (creatureId) => {
    if (!window.confirm('Eliminare questa creatura?')) return;
    try {
      await deleteCreature(user.uid, creatureId);
      setCampaignCreatures(prev => prev.filter(c => c.id !== creatureId));
    } catch (err) {
      console.error('Errore eliminazione creatura:', err);
    }
  }, [user]);

  // --- HANDLER CATALOGHI ---
  const handleUpdateCatalog = useCallback(async (newCatalog) => {
    if (!user) return;
    try {
      await saveEquipmentCatalog(user.uid, newCatalog);
      setEquipmentCatalog(newCatalog);
    } catch (err) {
      console.error('Errore salvataggio catalogo:', err);
    }
  }, [user]);

  const handleUpdateSpellCatalog = useCallback(async (newCatalog) => {
    if (!user) return;
    try {
      await saveSpellCatalog(user.uid, newCatalog);
      setSpellCatalog(newCatalog);
    } catch (err) {
      console.error('Errore salvataggio catalogo incantesimi:', err);
    }
  }, [user]);

  // --- HANDLER FUMBLE ---
  const handleRedirectToFumble = useCallback((data) => {
    setFumbleRedirectData(data);
    setActiveTab('actions');
  }, []);

  // --- LOADING ---
  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100vh',
        backgroundColor: '#0f172a', color: '#f8fafc',
        fontFamily: "'Montserrat', sans-serif"
      }}>
        <div style={{
          width: '48px', height: '48px',
          border: '4px solid rgba(2, 132, 199, 0.1)',
          borderTop: '4px solid var(--primary-color)',
          borderRadius: '50%', animation: 'spin 1s linear'
        }} />
        <div style={{ marginTop: '1rem', fontSize: '1rem', fontWeight: 500, color: '#94a3b8' }}>
          Caricamento in corso...
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;
  if (isPlayer) return <PlayerDashboard />;

  return (
    <div className="app-container">
      <AppHeader
        user={user}
        userData={userData}
        logout={logout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentActiveCampaign={currentActiveCampaign}
        handleSetActiveCampaign={handleSetActiveCampaign}
        handleStartNewCharacter={handleStartNewCharacter}
      />
      <AppTabs
        activeTab={activeTab}
        activeCharacter={activeCharacter}
        activeStepIndex={activeStepIndex}
        savedCharacters={savedCharacters}
        equipmentCatalog={equipmentCatalog}
        spellCatalog={spellCatalog}
        campaignNpcs={campaignNpcs}
        campaignCreatures={campaignCreatures}
        currentActiveCampaign={currentActiveCampaign}
        activeCampaignCharacters={activeCampaignCharacters}
        fumbleRedirectData={fumbleRedirectData}
        handleStartNewCharacter={handleStartNewCharacter}
        handleLoadCharacter={handleLoadCharacter}
        handleExportCharacter={handleExportCharacter}
        handleDuplicateCharacter={handleDuplicateCharacter}
        handleDeleteCharacter={handleDeleteCharacter}
        handleImportCharacterClick={handleImportCharacterClick}
        handleSetActiveCampaign={handleSetActiveCampaign}
        handleUpdateActorHp={handleUpdateActorHp}
        handleUpdateCharacterHpSubiti={handleUpdateCharacterHpSubiti}
        handleUpdateCharacterBoSpesoParata={handleUpdateCharacterBoSpesoParata}
        handleResetAllParries={handleResetAllParries}
        handleRedirectToFumble={handleRedirectToFumble}
        handleUpdateCatalog={handleUpdateCatalog}
        handleUpdateSpellCatalog={handleUpdateSpellCatalog}
        handleDeleteNpc={handleDeleteNpc}
        handleDeleteCreature={handleDeleteCreature}
        user={user}
        // --- NUOVE PROPS PER REQ-10 ---
        onSaveCharacter={handleSaveCharacter}
        onNavigateToWizardStep={handleNavigateToWizardStep}
        onWizardSaveAndReturn={handleWizardSaveAndReturn}
      />
    </div>
  );
}
