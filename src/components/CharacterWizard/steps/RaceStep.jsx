import { useState, useEffect } from 'react';
import racesData from '../../../data/TB_3-popoli_bonus-v3.json';

export default function RaceStep({ characterData, setCharacterData }) {
  const [selectedRace, setSelectedRace] = useState(characterData.race || '');

  const handleSelect = (race) => {
    setSelectedRace(race.popolo);
    setCharacterData({ ...characterData, race: race });
  };

  const half = Math.ceil(racesData.length / 2);
  const leftCol = racesData.slice(0, half);
  const rightCol = racesData.slice(half);

  const renderRaceCard = (race, index) => {
    const isSelected = selectedRace === race.popolo;
    return (
      <div 
        key={index}
        onClick={() => handleSelect(race)}
        className={`card cursor-pointer transition-all ${isSelected ? 'border-primary shadow-md' : 'hover:border-gray-400'}`}
        style={{
          cursor: 'pointer',
          borderColor: isSelected ? 'var(--primary-color)' : 'var(--border-color)',
          backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--surface-color)',
          borderWidth: isSelected ? '2px' : '1px',
          width: '100%',
          marginBottom: '1rem'
        }}
      >
        <div className="card-header" style={{padding: '1rem', borderBottom: 'none'}}>
          <h3 className="card-title" style={{fontSize: '1.1rem'}}>{race.popolo}</h3>
          <p className="card-description">{race['note (umani/non umani)']}</p>
        </div>
        {isSelected && (
          <div className="card-body" style={{padding: '0 1rem 1rem 1rem'}}>
            <div className="text-sm">
              <strong>Bonus Caratteristiche:</strong>
              <div className="grid-3 mt-2 mb-3">
                <div>FR: {race['bonus a FR']}</div>
                <div>AG: {race['bonus a AG']}</div>
                <div>CO: {race['bonus a CO']}</div>
                <div>IN: {race['bonus a IN']}</div>
                <div>IT: {race['bonus a IT']}</div>
                <div>PR: {race['bonus a PR']}</div>
              </div>
              <strong>Bonus Tiri Resistenza:</strong>
              <div className="grid-3 mt-2">
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
      <p className="mb-4 text-muted">
        Seleziona il Popolo di appartenenza. Questo determinerà i modificatori base alle tue caratteristiche e ai tuoi Tiri Resistenza.
      </p>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          {leftCol.map((race, index) => renderRaceCard(race, index))}
        </div>
        <div style={{ flex: 1 }}>
          {rightCol.map((race, index) => renderRaceCard(race, index + half))}
        </div>
      </div>
    </div>
  );
}
