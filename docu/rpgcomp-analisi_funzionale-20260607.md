Sto analizzando il codice e la documentazione per ricostruire in modo completo le funzionalità e le entità del sistema.
Searched for files matching `**/src/**/*.jsx`, 31 matches
Searched for files matching `**/src/**/*.js`, 9 matches
Searched for regex `login|sign in|auth|GM|Giocatore|character|personaggio|campaign|compagnia|equipment|equipaggiamento|wizard|step` (`**/src/**`), 200 results
Searched for regex `login|GM|Giocatore|compagnia|campagna|equipaggiamento|Personaggio|Personaggio|PG|wizard|creazione` (`**/docu/**`), 114 results

Sto leggendo i componenti e i servizi core per mappare entità, funzionalità e stato reale del progetto.
Read [](file:///Users/yagni/Geek/vs_code/continue/rpgcomp/src/contexts/AuthContext.jsx)
Read [](file:///Users/yagni/Geek/vs_code/continue/rpgcomp/src/App.jsx#1-1), lines 1 to 220
Read [](file:///Users/yagni/Geek/vs_code/continue/rpgcomp/src/components/GM/PlayerManager.jsx#1-1), lines 1 to 220
Read [](file:///Users/yagni/Geek/vs_code/continue/rpgcomp/src/components/GM/CompanyManager.jsx#1-1), lines 1 to 220
Read [](file:///Users/yagni/Geek/vs_code/continue/rpgcomp/src/components/GM/CampaignManager.jsx#1-1), lines 1 to 220
Read [](file:///Users/yagni/Geek/vs_code/continue/rpgcomp/src/components/CharacterWizard/CharacterWizard.jsx)
Read [](file:///Users/yagni/Geek/vs_code/continue/rpgcomp/src/components/Auth/LoginPage.jsx)
Read [](file:///Users/yagni/Geek/vs_code/continue/rpgcomp/src/services/characterService.js)
Read [](file:///Users/yagni/Geek/vs_code/continue/rpgcomp/src/services/playerService.js)
Read [](file:///Users/yagni/Geek/vs_code/continue/rpgcomp/src/services/settingsService.js)
Read [](file:///Users/yagni/Geek/vs_code/continue/rpgcomp/src/components/Player/PlayerDashboard.jsx#1-1), lines 1 to 260
Read [](file:///Users/yagni/Geek/vs_code/continue/rpgcomp/src/components/CharacterWizard/steps/StatsStep.jsx#1-1), lines 1 to 240
Read [](file:///Users/yagni/Geek/vs_code/continue/rpgcomp/src/components/CharacterWizard/steps/EquipmentStep.jsx#1-1), lines 1 to 260
Read [](file:///Users/yagni/Geek/vs_code/continue/rpgcomp/src/components/CharacterWizard/steps/CreationSummaryStep.jsx#1-1), lines 1 to 260
Read [](file:///Users/yagni/Geek/vs_code/continue/rpgcomp/src/components/Player/PlayerCharacterSheet.jsx)

Searched for regex `<PlayerDashboard|<PlayerManager|<CompanyManager|<CampaignManager|<CharacterWizard|<EquipmentCatalogManager|<CombatCalculator|<FumbleResolver|<MovementManoeuvreResolver|<StaticManoeuvreResolver|<CsvExportManager` (`**/src/App.jsx`), 11 results
Read [](file:///Users/yagni/Geek/vs_code/continue/rpgcomp/src/App.jsx#220-220), lines 220 to 480
Read [](file:///Users/yagni/Geek/vs_code/continue/rpgcomp/src/App.jsx#480-480), lines 480 to 749

## 1. Componenti del sistema

### Autenticazione
- AuthContext.jsx
  - gestisce login/logout Firebase Auth
  - legge/scrive il documento `users/{uid}`
  - assegna `role: "GM"` per il primo login diretto
  - abilita `isGM` / `isPlayer`

- LoginPage.jsx
  - form email/password
  - error handling su credenziali invalide

- ProtectedRoute.jsx
  - presente ma non necessario in questo flusso principale

### Interfaccia GM
- App.jsx
  - navigazione GM con tab:
    - `Creazione PG`
    - `Roster PG / PNG`
    - `Giocatori`
    - `Compagnie`
    - `Campagne`
    - `Risoluzione azioni`
    - `Impostazioni`

- PlayerManager.jsx
  - crea/edita/disabilita giocatori
  - assegna PG ai giocatori
  - usa Cloud Functions: `createPlayer`, `updatePlayer`, `togglePlayerStatus`

- CompanyManager.jsx
  - crea/modifica/elimina compagnie
  - associa PG alle compagnie

- CampaignManager.jsx
  - crea/modifica/elimina campagne
  - associa compagnie alle campagne

- EquipmentCatalogManager.jsx
  - gestione catalogo equipaggiamento GM
  - salvataggio su Firestore tramite `settingsService`

### Creazione e gestione PG
- CharacterWizard.jsx
  - wizard principale con 10 step
  - validazione step-by-step
  - salvataggio finale verso `saveCharacter`

- Step wizard principali:
  - RaceStep.jsx
  - ProfessionStep.jsx
  - StatsStep.jsx
  - AdolescenceStep.jsx
  - ApprenticeshipLevel1Step.jsx
  - BackgroundStep.jsx
  - EquipmentStep.jsx
  - CreationSummaryStep.jsx
  - LearningStep.jsx
  - CharacterSheetStep.jsx

### Player side
- PlayerDashboard.jsx
  - visualizza i workspace dei GM a cui il player è stato invitato
  - sottoscrive i personaggi assegnati
  - mostra compagnie e campagne rilevanti

- PlayerCharacterSheet.jsx
  - visualizza la scheda PG in sola lettura

### Risoluzione Azioni
- CombatCalculator.jsx
- MovementManoeuvreResolver.jsx
- StaticManoeuvreResolver.jsx
- FumbleResolver.jsx

### Servizi / Persistenza
- characterService.js
  - CRUD personaggi GM->Firestore
  - sottoscrizione realtime
  - HP/parata/duplicate/export/import

- playerService.js
  - workspace player
  - sottoscrizione PG assegnati
  - note personaggio

- companyService.js
  - CRUD compagnie

- campaignService.js
  - CRUD campagne

- settingsService.js
  - gestione catalogo equipaggiamento

- firebase.js
  - config Firebase / Firestore / Auth / Functions

### Utility
- skillHelpers.js
- magicHelpers.js
- moneyHelpers.js

---

## 2. Principali entità e relazioni

### Entità
- `User`
  - `users/{uid}`
  - campi: `role`, `displayName`, `enabled`, `createdAt`

- `GM workspace`
  - `gms/{gmId}`
  - include collezioni:
    - `characters`
    - `players`
    - `companies`
    - `campaigns`
    - `settings/equipmentCatalog`

- `Character` (PG)
  - `gms/{gmId}/characters/{charId}`
  - dati: `race`, `profession`, `stats`, `background`, `equipment`, `level1HpRoll`, `aspetto`, `hpSubiti`, `boSpesoParata`, `gmId`, ecc.

- `Player`
  - `gms/{gmId}/players/{playerId}`
  - campi: `email`, `displayName`, `enabled`, `characterIds`

- `Company`
  - `gms/{gmId}/companies/{companyId}`
  - campi: `name`, `description`, `characterIds`

- `Campaign`
  - `gms/{gmId}/campaigns/{campaignId}`
  - campi: `name`, `description`, `companyIds`, `npcIds`

- `Equipment catalog`
  - `gms/{gmId}/settings/equipmentCatalog`
  - fallback su TS_4-equipaggiamento.json

### Relazioni
- GM → Characters: uno a molti
- GM → Players: uno a molti
- GM → Companies: uno a molti
- GM → Campaigns: uno a molti
- Player → Character: molti a molti tramite `characterIds` su `players`
- Company → Characters: molti a molti tramite `characterIds`
- Campaign → Companies: molti a molti tramite `companyIds`
- Campaign attiva filtra i personaggi visibili nelle azioni

---

## 3. Funzionalità implementate

### Utenti e autenticazione
- login con email/password
- logout
- riconoscimento ruolo GM / player
- creazione GM al primo login diretto
- gestione giocatori GM
- assegnazione PG ai giocatori
- gestione abilitazione/disabilitazione giocatori

### Gestione GM
- dashboard GM con tab funzionali
- creazione / modifica / eliminazione PG
- duplicazione ed esportazione/importazione PG
- gestione compagnie
- gestione campagne
- gestione catalogo equipaggiamento
- selezione campagna attiva
- visualizzazione/gestione roster PG
- risoluzione azioni di movimento, statiche, combattimento, colpi maldestri

### Creazione personaggio
- wizard 10 step
- scelta popolo
- scelta professione
- generazione caratteristiche (classico / punti / manuale)
- adolescentza
- sviluppo livello 1
- background e lingue
- equipaggiamento con calcolo costi/peso/penalità
- riepilogo creazione con calcolo statistiche finali
- learning step
- scheda finale

### Player
- dashboard player
- visualizzazione PG assegnati
- visualizzazione scheda personaggio in sola lettura
- sincronizzazione in tempo reale dai workspace GM

### Azioni
- risoluzione usando:
  - statiche
  - movimento
  - combattimento
  - colpi maldestri

- placeholder per:
  - colpi critici
  - incantesimi base
  - incantesimi diretti

---

## 4. Stato della documentazione

### Documentazione corretta
- merp_compainion-initial_requirements-v2.md
  - descrive bene il dominio, gli obiettivi del sistema e le entità principali
- riepilogo_attivita.md
  - è più aderente allo stato di avanzamento reale del wizard
- merp_compainion-pg_creation_workflow-v1.md
  - buona descrizione dei flussi di creazione personaggio e delle regole MERP

### Documentazione da aggiornare
- implementation_plan-20260521.md
  - contenuti ancora riflettono parzialmente uno stato precedente
  - molte feature oggi esistenti sono descritte come “da completare”
  - in particolare:
    - `Equipaggiamento Iniziale` è già implementato in EquipmentStep.jsx
    - `Calcolo Finale LVL 1` ha un supporto già attivo in CreationSummaryStep.jsx
    - `Scheda Finale` esiste in CharacterSheetStep.jsx
    - la gestione GM di giocatori, compagnie, campagne è già presente
    - l’azione “colpi critici / incantesimi” è correttamente ancora to-do

Quindi:
- il documento concettuale è affidabile
- il piano di implementazione deve essere riallineato allo stato reale

---

## 5. Consiglio per i test della creazione personaggio

### Cosa testare prioritariamente
1. flusso completo del wizard
   - passo 1 → 10
   - ogni step valida correttamente prima di avanzare
   - passo finale salva un oggetto `characterData` completo
2. validazione step
   - `RaceStep` richiede popolo + nome
   - `ProfessionStep` richiede professione
   - `CreationSummaryStep` richiede `aspetto` e `level1HpRoll`
3. calcoli chiave
   - `StatsStep`:
     - assegnazione tiri classici
     - minima primaria/secondaria corretta
     - punto buy e manuale
   - `EquipmentStep`:
     - costo totale MB
     - peso `caricoKg`
     - penalità `penalitaCarico`
     - salvataggio equipaggiamento in `characterData`
   - `CreationSummaryStep`:
     - calcolo `finalStats`
     - bonus skill e TR
     - HP totale con `getCharacterHpTot`
     - spell list accumulation / crediti
4. persistenza / salvataggio
   - `handleSaveCharacter` invoca `saveCharacter`
   - dopo salvataggio il personaggio compare nel roster

### Come strutturare i test
#### Unit test
- `CharacterWizard.validateStep`
- `skillHelpers`:
  - `getFinalStats`
  - `calculateCargoPenalty`
  - `getCharacterHpTot`
  - `getRanksBonus`
  - `getIngombroBonus`
- `EquipmentStep` summary builder
- `CreationSummaryStep` final skill aggregation
- `StatsStep` generazione tiri / calcolo costi

#### Component test
- con `@testing-library/react`
- render `CharacterWizard` e
  - compilare i campi
  - cliccare `Successivo`
  - verificare che il prossimo step appaia
  - simulare `Salva`
- render `EquipmentStep` con `characterData`
  - modificare quantità e acquisto
  - verificare `characterData` aggiornato via callback

#### Integrazione / end-to-end
- testare il flusso:
  - login GM
  - avvia wizard
  - crea personaggio
  - salva
  - verifica comparsa nel roster
- testare assegnazione PG a giocatore e visualizzazione player

### Suggerimento di test specifico
- usare `vitest` + `@testing-library/react`
- mockare Firestore / servizi `saveCharacter`/`getEquipmentCatalog`
- stubbare `Math.random` per rendere deterministico:
  - tiri statistiche
  - `Roll Aspetto`
  - `Roll HP`

### Test critici da inserire subito
- `wizard quando manca info blocca avanzamento`
- `equipment step calcola carico e blocca se NA`
- `creation summary non consente salto senza aspetto e hp`
- `salvataggio personaggio crea oggetto con`
  - `race`
  - `profession`
  - `stats`
  - `background`
  - `equipment`
  - `aspetto`
  - `level1HpRoll`

---

## 6. Sintesi di gap / priorità

### Stato attuale
- login user/pass: operativo
- GM e Player: supportati
- gestione user/player: implementata
- gestione compagnie/campagne: implementata
- scheda PG player: implementata
- generazione/modifica PG GM: implementata
- catalogo equipaggiamento GM: implementato
- risoluzione azioni GM: parzialmente implementata

### Mancanze reali
- `Colpi critici`
- `Incantesimi base`
- `Incantesimi diretti`
- test automatici del flusso di creazione
- piano di implementazione aggiornato

Se vuoi, posso ora darti:
1. una bozza di piano di test dettagliata per la creazione del personaggio,
2. un elenco di file/documenti da correggere nel piano di implementazione.