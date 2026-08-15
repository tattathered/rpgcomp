import { useState } from 'react';
import { ArrowLeft, Package } from 'lucide-react';
import CharacterSheetStep from '../CharacterWizard/steps/CharacterSheetStep';
import EquipmentEditor from '../Shared/EquipmentEditor';
import { updateCharacterEquipment } from '../../services/characterService';

export default function PlayerCharacterSheet({ characterData, onBack, spellCatalog }) {
  const [showEquipmentEditor, setShowEquipmentEditor] = useState(false);
  const [localCharData, setLocalCharData] = useState(characterData);

  const handleEquipmentSaved = async (updatedData) => {
    try {
      await updateCharacterEquipment(localCharData.gmId || '', localCharData.id, updatedData);
      setLocalCharData(updatedData);
      setShowEquipmentEditor(false);
    } catch (err) {
      console.error('Errore salvataggio inventario:', err);
      alert('Errore durante il salvataggio: ' + err.message);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>
          <ArrowLeft size={16} />
          Torna alla Dashboard
        </button>
        <span style={styles.charName}>Scheda di {localCharData.name}</span>
        <button
          onClick={() => setShowEquipmentEditor(true)}
          style={styles.inventoryBtn}
        >
          <Package size={14} />
          Gestisci Inventario
        </button>
      </header>
      <div style={styles.content}>
        <CharacterSheetStep 
          characterData={localCharData} 
          setCharacterData={setLocalCharData} 
          readOnly={false} 
          spellCatalog={spellCatalog}
        />
      </div>

      {showEquipmentEditor && (
        <EquipmentEditor
          characterData={localCharData}
          onSave={handleEquipmentSaved}
          onClose={() => setShowEquipmentEditor(false)}
          mode="player"
        />
      )}
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
    flex: 1,
  },
  inventoryBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.5rem 1rem',
    fontSize: '0.8rem',
    fontWeight: '600',
    backgroundColor: '#d97706',
    border: '1px solid #b45309',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  content: {
    backgroundColor: 'var(--surface-color)',
    borderRadius: '12px',
    boxShadow: 'var(--shadow-sm)',
    padding: '0.5rem',
  }
};
