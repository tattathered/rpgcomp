# [REQ-10] Scheda Personaggio Standalone + 4 Pulsanti Contestuali

## Stato: 🟢 In Verifica
**Ultimo aggiornamento:** 2026-08-14

---

## Descrizione e Criteri di Accettazione (DoD)

- [x] **Tab 'sheet' autonomo** in AppTabs: CharacterSheetStep non è più solo dentro il wizard
- [x] **Carica PG dal roster** → apre tab 'sheet' (non più wizard step 1)
- [x] **Pulsante "Modifica Creazione"** nell'header della scheda, accanto a "Stampa Scheda / PDF" → apre wizard allo step 8 (Riepilogo Creazione)
- [x] **Pulsante "Upgrade Livello"** nel box Professione, accanto a "(Liv. {n})" → apre wizard allo step 9 (Apprendimento)
- [x] **Pulsante "Modifica Equipaggiamento"** nel box Inventario → apre la modale condivisa `Shared/EquipmentEditor` (GM+Player, flag ACQUISTO, armatura attiva, scudo, portafoglio)
- [x] **Pulsante "Modifica Liste Incantesimi"** nel box Liste Incantesimi Appresi → permette di aggiungere/rimuovere liste (con datalist catalogo)
- [x] **Flusso salvataggio centralizzato**: wizard → salva su Firestore → torna a tab 'sheet' con dati aggiornati
- [x] **Modifiche inline** (equip, liste) salvano direttamente su Firestore tramite onSaveCharacter, con refresh della vista

## Dettaglio Implementazione

### App.jsx
- `handleLoadCharacter`: `activeTab = 'sheet'` (prima era `'creation'`)
- `handleNavigateToWizardStep(charData, stepIndex)`: passa dati personaggio + step index e cambia tab in `'creation'`
- `handleWizardSaveAndReturn(charData)`: salva su Firestore, refresh roster, setActiveCharacter, tab → `'sheet'`
- `handleSaveCharacter`: ora aggiorna anche `activeCharacter` con i dati freschi dopo salvataggio

### AppTabs.jsx
- Nuovo tab: `activeTab === 'sheet'` → `CharacterSheetStep` con props `onSaveCharacter`, `onNavigateToStep`, `equipmentCatalog`
- `CharacterWizard` usa `onWizardSaveAndReturn` come `onSave` (torna al tab sheet dopo salvataggio)

### CharacterSheetStep.jsx
- Nuove props: `onNavigateToStep` (opzionale), `onSaveCharacter` (opzionale), `equipmentCatalog`
- `handleSetData`: wrapper che in modalità standalone chiama `onSaveCharacter` (salva su Firestore), in modalità wizard usa `setCharacterData` normale
- Pulsanti:
  - "Modifica Creazione" → `onNavigateToStep(7)` (step 8: creation_summary)
  - "+1 Livello" → `onNavigateToStep(8)` (step 9: learning)
  - "Modifica Equipaggiamento" → apre modale `EquipmentEditor` (mode='gm'): il componente restituisce il characterData completo aggiornato via `onSave(updatedData)` → `handleSetData` → `onSaveCharacter`
  - "Modifica Liste" → toggle `editMode='spellLists'`: mostra input per aggiunta/rimozione liste con datalist
  - Rimosso `InventoryEditor` (modale) — sostituito dall'editor condiviso `Shared/EquipmentEditor` (FIX-011)
  - Rimossi stati inline equip (`equipItemsState`, `equipSearchQuery`, `equipActiveCategory`, `equipSummary`, `equipHandleSave`)

## Impatti sul Codice / Architettura

### File modificati:
- `src/App.jsx` — nuovi handler, modifica handleLoadCharacter, handleSaveCharacter aggiorna activeCharacter
- `src/components/AppTabs.jsx` — nuovo tab sheet, passaggio nuove props
- `src/components/CharacterWizard/steps/CharacterSheetStep.jsx` — 4 pulsanti, handleSetData, editor equip inline rimosso (FIX-011)
- `src/components/Shared/EquipmentEditor.jsx` — nuovo editor equip unico condiviso GM+Player (FIX-011)
- `src/components/Player/PlayerCharacterSheet.jsx` — usa `EquipmentEditor` (mode='player') al posto di `InventoryEditor` (FIX-011)
