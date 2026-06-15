import React from 'react';
import { ArrowLeft } from 'lucide-react';
import CharacterSheetStep from '../CharacterWizard/steps/CharacterSheetStep';

export default function PlayerCharacterSheet({ characterData, onBack, spellCatalog }) {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>
          <ArrowLeft size={16} />
          Torna alla Dashboard
        </button>
        <span style={styles.charName}>Scheda di {characterData.name}</span>
      </header>
      <div style={styles.content}>
        <CharacterSheetStep 
          characterData={characterData} 
          setCharacterData={() => {}} 
          readOnly={true} 
          spellCatalog={spellCatalog}
        />
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '1rem'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '0.5rem 0',
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '1rem',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.5rem 1rem',
    fontSize: '0.85rem',
    fontWeight: '600',
    backgroundColor: 'var(--surface-color)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    color: 'var(--text-main)',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  charName: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: 'var(--text-main)',
  },
  content: {
    backgroundColor: 'var(--surface-color)',
    borderRadius: '12px',
    boxShadow: 'var(--shadow-sm)',
    padding: '0.5rem',
  }
};
