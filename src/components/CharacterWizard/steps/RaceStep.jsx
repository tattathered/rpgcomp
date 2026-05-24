import { useState, useEffect } from 'react';
import racesData from '../../../data/TB_3-popoli_bonus-v3.json';

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
  const [selectedRace, setSelectedRace] = useState(characterData.race || '');
  const [characterName, setCharacterName] = useState(characterData.name || '');

  useEffect(() => {
    setCharacterName(characterData.name || '');
  }, [characterData.name]);

  useEffect(() => {
    let err = null;
    if (!characterName || !characterName.trim()) {
      err = 'Inserisci il nome del personaggio.';
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
  }, [characterName, selectedRace, characterData.stepErrors, setCharacterData]);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setCharacterName(val);
    setCharacterData(prev => ({ ...prev, name: val }));
  };

  const handleSelect = (race) => {
    setSelectedRace(race.popolo);
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
  const col1Races = col1Order.map(name => racesData.find(r => r.popolo === name)).filter(Boolean);
  const col2Races = racesData.filter(r => COLUMNS_MAPPING[r.popolo]?.col === 2);
  const col3Races = racesData.filter(r => COLUMNS_MAPPING[r.popolo]?.col === 3);

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
    const isSelected = selectedRace === race.popolo;
    return (
      <div 
        key={index}
        onClick={() => handleSelect(race)}
        className="card cursor-pointer"
        style={getRaceCardStyle(race.popolo, isSelected)}
      >
        <div className="card-header" style={{padding: '1rem', borderBottom: 'none', backgroundColor: 'transparent'}}>
          <h3 className="card-title" style={{fontSize: '1.1rem', color: 'inherit'}}>{race.popolo}</h3>
          <p className="card-description" style={{color: 'inherit', opacity: 0.8}}>{race['note (umani/non umani)']}</p>
        </div>
        {isSelected && (
          <div className="card-body" style={{padding: '0 1rem 1rem 1rem'}}>
            <div className="text-sm" style={{color: 'inherit'}}>
              <strong style={{color: 'inherit'}}>Bonus Caratteristiche:</strong>
              <div className="grid-3 mt-2 mb-3" style={{color: 'inherit'}}>
                <div>FR: {race['bonus a FR']}</div>
                <div>AG: {race['bonus a AG']}</div>
                <div>CO: {race['bonus a CO']}</div>
                <div>IN: {race['bonus a IN']}</div>
                <div>IT: {race['bonus a IT']}</div>
                <div>PR: {race['bonus a PR']}</div>
              </div>
              <strong style={{color: 'inherit'}}>Bonus Tiri Resistenza:</strong>
              <div className="grid-3 mt-2" style={{color: 'inherit'}}>
                <div>ESS: {race['bonus a TR-ESS']}</div>
                <div>FLS: {race['bonus a TR-FLS']}</div>
                <div>VEL: {race['bonus a TR-VEL']}</div>
                <div>MAL: {race['bonus a TR-MAL']}</div>
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
        <label className="block text-sm font-bold text-gray-700 mb-2">Nome del Personaggio</label>
        <input 
          type="text" 
          value={characterName} 
          onChange={handleNameChange} 
          placeholder="Inserisci il nome del personaggio..." 
          className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
          style={{ width: '100%', padding: '0.6rem 0.8rem', fontSize: '0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}
        />
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
