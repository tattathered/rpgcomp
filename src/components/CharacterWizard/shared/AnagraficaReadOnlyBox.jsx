export default function AnagraficaReadOnlyBox({ characterData, simple = true }) {
  const {
    name = '—',
    playerName = '—',
    altezza = '—',
    peso = '—',
    hairColor = '—',
    eyeColor = '—',
    personality = '—',
    specialFeature = '—',
    history = ''
  } = characterData || {};

  if (simple) {
    return (
      <div className="mb-4 card p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem', marginTop: 0 }}>
          Anagrafica personaggio
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Nome personaggio</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-color)' }}>{name}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Nome giocatore</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-color)' }}>{playerName}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 card p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginTop: 0 }}>
        Anagrafica personaggio
      </h3>
      
      {/* Griglia a 3 colonne */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Nome personaggio</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-color)' }}>{name}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Altezza (in cm)</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-color)' }}>{altezza}{altezza !== '—' && ' cm'}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Colore capelli</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-color)' }}>{hairColor}</div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Nome giocatore</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-color)' }}>{playerName}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Peso (in kg)</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-color)' }}>{peso}{peso !== '—' && ' kg'}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Colore occhi</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-color)' }}>{eyeColor}</div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Carattere/temperamento</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-color)' }}>{personality}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Caratteristica particolare</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-color)' }}>{specialFeature}</div>
        </div>
      </div>

      {history && history.trim() !== '' && (
        <div style={{ borderTop: '1px dashed var(--border-color)', marginTop: '0.75rem', paddingTop: '0.75rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>Storia del personaggio</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-color)', whiteSpace: 'pre-wrap', fontStyle: 'italic', lineHeight: '1.4' }}>{history}</div>
        </div>
      )}
    </div>
  );
}
