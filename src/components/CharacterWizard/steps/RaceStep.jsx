import { useState, useEffect } from 'react';
import racesData from '../../../data/TB-3-modifiche_speciali_popolo.json';
import { db } from '../../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';

const COLUMNS_MAPPING = {
  // Column 1 - Blu tenue e Giallo tenue
  'Dúnedain': { col: 1, colorType: 'blu' },
  'Uomini delle Città Gondoriani': { col: 1, colorType: 'blu' },
  'Uomini delle Città Rohirrim': { col: 1, colorType: 'blu' },
  'Uomini delle Campagne Gondoriani': { col: 1, colorType: 'blu' },
  'Uomini delle Campagne Rohirrim': { col: 1, colorType: 'blu' },
  'Uomini dei Boschi': { col: 1, colorType: 'blu' },
  'Beorniani': { col: 1, colorType: 'blu' },
  'Wose': { col: 1, colorType: 'blu' },
  'Uomini delle Città Eriadoriani': { col: 1, colorType: 'giallo' },
  'Uomini delle Campagne Eriadoriani': { col: 1, colorType: 'giallo' },
  'Dorwinrim': { col: 1, colorType: 'giallo' },
  'Lossoth': { col: 1, colorType: 'giallo' },

  // Column 2 - Verde tenue
  'Mezzelfi': { col: 2, colorType: 'verde' },
  'Elfi Sindar': { col: 2, colorType: 'verde' },
  'Elfi Silvani': { col: 2, colorType: 'verde' },
  'Elfi Noldor': { col: 2, colorType: 'verde' },
  'Hobbit': { col: 2, colorType: 'verde' },
  'Nani': { col: 2, colorType: 'verde' },
  'Umli': { col: 2, colorType: 'verde' },

  // Column 3 - Rosso tenue e Nero tenue
  'Dunlandiani': { col: 3, colorType: 'rosso' },
  'Esterling': { col: 3, colorType: 'rosso' },
  'Haradrim': { col: 3, colorType: 'rosso' },
  'Corsari': { col: 3, colorType: 'rosso' },
  'Númenóreani Neri': { col: 3, colorType: 'rosso' },
  'Mezzorchi': { col: 3, colorType: 'nero' },
  'Orchetti': { col: 3, colorType: 'nero' },
  'Uruk-hai': { col: 3, colorType: 'nero' },
  'Mezzotroll': { col: 3, colorType: 'nero' },
  'Troll': { col: 3, colorType: 'nero' },
  'Olog-hai': { col: 3, colorType: 'nero' }
};

export default function RaceStep({ characterData, setCharacterData }) {
  const { user } = useAuth();
  const gmId = user?.uid;

  const [selectedRace, setSelectedRace] = useState(characterData.race?.nome || characterData.race?.popolo || '');
  const [characterName, setCharacterName] = useState(characterData.name || '');
  const [playerName, setPlayerName] = useState(characterData.playerName || '');
  const [altezza, setAltezza] = useState(characterData.altezza || '');
  const [peso, setPeso] = useState(characterData.peso || '');
  const [hairColor, setHairColor] = useState(characterData.hairColor || '');
  const [eyeColor, setEyeColor] = useState(characterData.eyeColor || '');
  const [personality, setPersonality] = useState(characterData.personality || '');
  const [specialFeature, setSpecialFeature] = useState(characterData.specialFeature || '');
  const [history, setHistory] = useState(characterData.history || '');
  const [playersList, setPlayersList] = useState([]);

  // Carica i giocatori del GM registrati
  useEffect(() => {
    if (!gmId) return;
    const playersRef = collection(db, 'gms', gmId, 'players');
    const unsub = onSnapshot(playersRef, (snapshot) => {
      const list = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.displayName) {
          list.push(data);
        }
      });
      list.sort((a, b) => a.displayName.localeCompare(b.displayName));
      setPlayersList(list);
    }, (error) => {
      console.error('Errore nel caricamento dei giocatori nel wizard:', error);
    });
    return unsub;
  }, [gmId]);

  useEffect(() => {
    setCharacterName(characterData.name || '');
    setPlayerName(characterData.playerName || '');
    setAltezza(characterData.altezza || '');
    setPeso(characterData.peso || '');
    setHairColor(characterData.hairColor || '');
    setEyeColor(characterData.eyeColor || '');
    setPersonality(characterData.personality || '');
    setSpecialFeature(characterData.specialFeature || '');
    setHistory(characterData.history || '');
    setSelectedRace(characterData.race?.nome || characterData.race?.popolo || '');
  }, [
    characterData.name,
    characterData.playerName,
    characterData.altezza,
    characterData.peso,
    characterData.hairColor,
    characterData.eyeColor,
    characterData.personality,
    characterData.specialFeature,
    characterData.history,
    characterData.race
  ]);

  useEffect(() => {
    let err = null;
    if (!characterName || !characterName.trim()) {
      err = 'Inserisci il nome del personaggio.';
    } else if (!playerName || !playerName.trim()) {
      err = 'Inserisci il nome del giocatore.';
    } else if (!altezza || isNaN(Number(altezza)) || Number(altezza) <= 0) {
      err = 'Devi inserire un\'altezza valida (maggiore di 0 cm) prima di procedere.';
    } else if (!peso || isNaN(Number(peso)) || Number(peso) <= 0) {
      err = 'Devi inserire un peso corporeo valido (maggiore di 0 kg) prima di procedere.';
    } else if (!selectedRace) {
      err = 'Seleziona il popolo di appartenenza.';
    }

    if (characterData.stepErrors?.race !== err) {
      setCharacterData(prev => ({
        ...prev,
        stepErrors: {
          ...(prev.stepErrors || {}),
          race: err
        }
      }));
    }
  }, [characterName, playerName, altezza, peso, selectedRace, characterData.stepErrors, setCharacterData]);

  const handleFieldChange = (field, val) => {
    if (field === 'name') setCharacterName(val);
    else if (field === 'playerName') setPlayerName(val);
    else if (field === 'altezza') setAltezza(val);
    else if (field === 'peso') setPeso(val);
    else if (field === 'hairColor') setHairColor(val);
    else if (field === 'eyeColor') setEyeColor(val);
    else if (field === 'personality') setPersonality(val);
    else if (field === 'specialFeature') setSpecialFeature(val);
    else if (field === 'history') setHistory(val);

    setCharacterData(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const handleSelect = (race) => {
    setSelectedRace(race.nome);
    setCharacterData(prev => ({ ...prev, race: race }));
  };

  // Dividiamo i popoli in 3 colonne
  const col1Order = [
    'Dúnedain',
    'Uomini delle Città Gondoriani',
    'Uomini delle Città Rohirrim',
    'Uomini delle Campagne Gondoriani',
    'Uomini delle Campagne Rohirrim',
    'Uomini dei Boschi',
    'Beorniani',
    'Wose',
    'Uomini delle Città Eriadoriani',
    'Uomini delle Campagne Eriadoriani',
    'Dorwinrim',
    'Lossoth'
  ];
  const col1Races = col1Order.map(name => racesData.find(r => r.nome === name)).filter(Boolean);
  const col2Races = racesData.filter(r => COLUMNS_MAPPING[r.nome]?.col === 2);
  const col3Races = racesData.filter(r => COLUMNS_MAPPING[r.nome]?.col === 3);

  const getRaceCardStyle = (racePopolo, isSelected) => {
    const mapping = COLUMNS_MAPPING[racePopolo] || { colorType: 'giallo' };
    let bg = 'var(--theme-race-giallo-bg)';
    let text = 'var(--theme-race-giallo-text)';
    let border = 'var(--theme-race-giallo-border)';

    if (mapping.colorType === 'blu') {
      bg = 'var(--theme-race-blu-bg)';
      text = 'var(--theme-race-blu-text)';
      border = 'var(--theme-race-blu-border)';
    } else if (mapping.colorType === 'verde') {
      bg = 'var(--theme-race-verde-bg)';
      text = 'var(--theme-race-verde-text)';
      border = 'var(--theme-race-verde-border)';
    } else if (mapping.colorType === 'rosso') {
      bg = 'var(--theme-race-rosso-bg)';
      text = 'var(--theme-race-rosso-text)';
      border = 'var(--theme-race-rosso-border)';
    } else if (mapping.colorType === 'nero') {
      bg = 'var(--theme-race-nero-bg)';
      text = 'var(--theme-race-nero-text)';
      border = 'var(--theme-race-nero-border)';
    }

    return {
      cursor: 'pointer',
      backgroundColor: bg,
      color: text,
      borderColor: isSelected ? '#6366f1' : border, // indigo-500 highlight
      borderWidth: isSelected ? '3px' : '1px',
      boxShadow: isSelected ? '0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.1)' : 'none',
      transform: isSelected ? 'scale(1.02)' : 'none',
      width: '100%',
      marginBottom: '1rem',
      borderRadius: 'var(--radius-md, 8px)',
      transition: 'all 0.2s ease-in-out'
    };
  };

  const renderRaceCard = (race, index) => {
    const isSelected = selectedRace === race.nome;
    return (
      <div 
        key={index}
        onClick={() => handleSelect(race)}
        className="card cursor-pointer"
        style={getRaceCardStyle(race.nome, isSelected)}
      >
        <div className="card-header" style={{padding: '1rem', borderBottom: 'none', backgroundColor: 'transparent'}}>
          <h3 className="card-title" style={{fontSize: '1.1rem', color: 'inherit'}}>{race.nome}</h3>
          <p className="card-description" style={{color: 'inherit', opacity: 0.8}}>{race.categoria}</p>
        </div>
        {isSelected && (
          <div className="card-body" style={{padding: '0 1rem 1rem 1rem'}}>
            <div className="text-sm" style={{color: 'inherit'}}>
              <strong style={{color: 'inherit'}}>Bonus Caratteristiche:</strong>
              <div className="grid-3 mt-2 mb-3" style={{color: 'inherit'}}>
                <div>FR: {race['mod_fr']}</div>
                <div>AG: {race['mod_ag']}</div>
                <div>CO: {race['mod_co']}</div>
                <div>IN: {race['mod_in']}</div>
                <div>IT: {race['mod_it']}</div>
                <div>PR: {race['mod_pr']}</div>
              </div>
              <strong style={{color: 'inherit'}}>Bonus Tiri Resistenza:</strong>
              <div className="grid-3 mt-2" style={{color: 'inherit'}}>
                <div>ESS: {race['mod_tr_ess']}</div>
                <div>FLS: {race['mod_tr_fls']}</div>
                <div>VEL: {race['mod_tr_vel']}</div>
                <div>MAL: {race['mod_tr_mal']}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6 card p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: 0 }}>
          Anagrafica personaggio
        </h3>
        
        {/* Griglia a 3 colonne */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nome personaggio <span style={{ color: 'red' }}>*</span></label>
            <input 
              type="text" 
              value={characterName} 
              onChange={(e) => handleFieldChange('name', e.target.value)} 
              placeholder="Nome del personaggio" 
              className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              style={{ width: '100%', padding: '0.5rem 0.7rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Altezza (in cm) <span style={{ color: 'red' }}>*</span></label>
            <input 
              type="number" 
              min="1"
              value={altezza} 
              onChange={(e) => {
                const val = e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1);
                handleFieldChange('altezza', val);
              }} 
              placeholder="Es: 180" 
              className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              style={{ width: '100%', padding: '0.5rem 0.7rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Colore capelli</label>
            <input 
              type="text" 
              value={hairColor} 
              onChange={(e) => handleFieldChange('hairColor', e.target.value)} 
              placeholder="Es: Castani" 
              className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              style={{ width: '100%', padding: '0.5rem 0.7rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nome giocatore <span style={{ color: 'red' }}>*</span></label>
            <select
              value={playerName}
              onChange={(e) => handleFieldChange('playerName', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              style={{ width: '100%', padding: '0.5rem 0.7rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', backgroundColor: 'white' }}
            >
              <option value="">-- Seleziona un giocatore --</option>
              {playersList.map((player) => (
                <option key={player.uid || player.email} value={player.displayName}>
                  {player.displayName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Peso (in kg) <span style={{ color: 'red' }}>*</span></label>
            <input 
              type="number" 
              min="1"
              value={peso} 
              onChange={(e) => {
                const val = e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1);
                handleFieldChange('peso', val);
              }} 
              placeholder="Es: 75" 
              className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              style={{ width: '100%', padding: '0.5rem 0.7rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Colore occhi</label>
            <input 
              type="text" 
              value={eyeColor} 
              onChange={(e) => handleFieldChange('eyeColor', e.target.value)} 
              placeholder="Es: Azzurri" 
              className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              style={{ width: '100%', padding: '0.5rem 0.7rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
            />
          </div>
        </div>

        {/* Griglia a 2 colonne */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem' }}>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Carattere/temperamento</label>
            <input 
              type="text" 
              value={personality} 
              onChange={(e) => handleFieldChange('personality', e.target.value)} 
              placeholder="Es: Calmo, riflessivo" 
              className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              style={{ width: '100%', padding: '0.5rem 0.7rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Caratteristica particolare</label>
            <input 
              type="text" 
              value={specialFeature} 
              onChange={(e) => handleFieldChange('specialFeature', e.target.value)} 
              placeholder="Es: Cicatrice sull'occhio sinistro" 
              className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              style={{ width: '100%', padding: '0.5rem 0.7rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
            />
          </div>
        </div>

        {/* Storia del personaggio */}
        <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
          <label className="block text-xs font-bold text-gray-700 mb-1">Storia del personaggio</label>
          <textarea 
            value={history} 
            onChange={(e) => handleFieldChange('history', e.target.value)} 
            placeholder="Inserisci qui la storia e la descrizione del personaggio..." 
            className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            style={{ width: '100%', padding: '0.5rem 0.7rem', fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', minHeight: '120px', resize: 'vertical' }}
          />
        </div>
      </div>

      <p className="mb-4 text-muted">
        Seleziona il Popolo di appartenenza. Questo determinerà i modificatori base alle tue caratteristiche e ai tuoi Tiri Resistenza.
      </p>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {col1Races.map((race, index) => renderRaceCard(race, index))}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {col2Races.map((race, index) => renderRaceCard(race, index))}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {col3Races.map((race, index) => renderRaceCard(race, index))}
        </div>
      </div>
    </div>
  );
}
