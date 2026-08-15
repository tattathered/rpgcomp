import { useState } from 'react';
import { ArrowLeft, Package } from 'lucide-react';
import CharacterSheetStep from '../CharacterWizard/steps/CharacterSheetStep';
import InventoryEditor from '../Shared/InventoryEditor';
import { updateCharacterEquipment } from '../../services/characterService';

export default function PlayerCharacterSheet({ characterData, onBack, spellCatalog }) {
  const [showInventoryEditor, setShowInventoryEditor] = useState(false);
  const [localCharData, setLocalCharData] = useState(characterData);

  const handleInventorySaved = async (updatedData) => {
    try {
      await updateCharacterEquipment(localCharData.id, updatedData);
      setLocalCharData(prev => ({
        ...prev,
        equipment: updatedData.equipment,
        caricoKg: updatedData.caricoKg,
        penalitaCarico: updatedData.penalitaCarico,
        equippedArmor: updatedData.equippedArmor,
        equippedShield: updatedData.equippedShield,
        portafoglioMB: updatedData.portafoglioMB
      }));
      setShowInventoryEditor(false);
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
          onClick={() => setShowInventoryEditor(true)}
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

      {showInventoryEditor && (
        <InventoryEditor
          characterData={localCharData}
          gmId={localCharData.gmId || ''}
          onClose={() => setShowInventoryEditor(false)}
          onSaved={handleInventorySaved}
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
