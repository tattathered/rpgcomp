import { useState } from 'react';
import profData from '../../../data/TB_6-professioni_bonus_abilita-3.json';
import profStats from '../../../data/Tabella-professioni_caratteristica_fondamentale.json';

export default function ProfessionStep({ characterData, setCharacterData }) {
  const [selectedProf, setSelectedProf] = useState(characterData.profession?.professione || '');

  const handleSelect = (prof) => {
    // Trova le caratteristiche primaria/secondaria per questa professione
    const statsInfo = profStats.find(p => p.professione.toLowerCase() === prof.professione.toLowerCase());
    
    const profToSave = {
      ...prof,
      primaria: statsInfo ? statsInfo['caratteristica fondamentale'] : '',
      secondaria: statsInfo ? statsInfo['caratteristica secondaria'] : ''
    };

    setSelectedProf(prof.professione);
    setCharacterData({ ...characterData, profession: profToSave });
  };

  return (
    <div>
      {characterData.race && (
        <div className="mb-6 p-4 border border-blue-200 rounded bg-blue-50 flex justify-between items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Popolo Selezionato</span>
            <h3 className="font-bold text-blue-900 m-0" style={{fontSize: '1.2rem', marginTop: '0.25rem'}}>{characterData.race.popolo}</h3>
          </div>
          <div className="text-sm text-blue-800 font-medium">
            {characterData.race['note (umani/non umani)']}
          </div>
        </div>
      )}

      <p className="mb-4 text-muted">
        Scegli la Professione del tuo personaggio. Essa definirà le sue abilità chiave, le caratteristiche prioritarie e i bonus di sviluppo.
      </p>

      <div className="grid-2">
        {profData.map((prof, index) => {
          const isSelected = selectedProf === prof.professione;
          const statsInfo = profStats.find(p => p.professione.toLowerCase() === prof.professione.toLowerCase());

          return (
            <div 
              key={index}
              onClick={() => handleSelect(prof)}
              className="card"
              style={{
                cursor: 'pointer',
                borderColor: isSelected ? 'var(--primary-color)' : 'var(--border-color)',
                backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--surface-color)',
                borderWidth: isSelected ? '2px' : '1px'
              }}
            >
              <div className="card-header" style={{padding: '1rem', borderBottom: '1px solid var(--border-color)'}}>
                <h3 className="card-title" style={{fontSize: '1.25rem', color: isSelected ? 'var(--primary-color)' : 'inherit'}}>{prof.professione}</h3>
                {statsInfo && (
                  <div className="mt-2 flex gap-2">
                    <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      Primaria: {statsInfo['caratteristica fondamentale']}
                    </span>
                    <span className="text-xs font-semibold px-2 py-1 bg-gray-200 text-gray-800 rounded">
                      Secondaria: {statsInfo['caratteristica secondaria']}
                    </span>
                  </div>
                )}
              </div>
              {isSelected && (
                <div className="card-body" style={{padding: '1rem', fontSize: '0.875rem'}}>
                  <p className="mb-2"><strong>Bonus Abilità Professione:</strong></p>
                  <ul style={{paddingLeft: '1.25rem', color: 'var(--text-muted)'}}>
                    {prof['resistenza fisica'] !== 0 && <li>Resistenza Fisica: {prof['resistenza fisica']}</li>}
                    {prof['abilità armi'] !== 0 && <li>Abilità Armi: {prof['abilità armi']}</li>}
                    {prof['abilità generiche'] !== 0 && <li>Abilità Generiche: {prof['abilità generiche']}</li>}
                    {prof['abilità sotterfugio'] !== 0 && <li>Sotterfugio: {prof['abilità sotterfugio']}</li>}
                    {prof['abilità magiche'] !== 0 && <li>Abilità Magiche: {prof['abilità magiche']}</li>}
                    {prof['lettura rune'] !== 0 && <li>Lettura Rune: {prof['lettura rune']}</li>}
                    {prof['uso oggetti magici'] !== 0 && <li>Uso Oggetti Magici: {prof['uso oggetti magici']}</li>}
                    {prof['incantesimi diretti'] !== 0 && <li>Incantesimi Diretti: {prof['incantesimi diretti']}</li>}
                    {prof['incantesimi base'] !== 0 && <li>Incantesimi Base: {prof['incantesimi base']}</li>}
                    {prof['percezione'] !== 0 && <li>Percezione: {prof['percezione']}</li>}
                  </ul>
                  {prof['liste incantesimi'] && (
                    <div className="mt-2 text-xs text-teal-800">
                      <strong>Liste:</strong> {prof['liste incantesimi']}
                      {prof['limite incantesimi'] && <div className="mt-1"><em>Limite:</em> {prof['limite incantesimi']}</div>}
                    </div>
                  )}
                  <p className="mt-2 text-xs italic">{prof.note}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
}
