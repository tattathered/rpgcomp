# [REQ-06] Risoluzione Lancio Incantesimi (Tabelle TA-7..TA-9)

## Stato: [Approvato]
**Ultimo aggiornamento:** 2026-06-24 da Antigravity

---

## Descrizione e Criteri di Accettazione (DoD)

Questo modulo consente al GM di gestire e risolvere il lancio degli incantesimi da parte dei personaggi (PG o PNG), calcolando la riuscita, gli effetti (danni/critici per incantesimi d'attacco) e i modificatori ai Tiri di Resistenza (per gli incantesimi ad effetto) sulla base delle regole ufficiali di MERP.

### 1. Gestione Tabelle e Pipeline Dati
- [x] **Conversione e Pulizia dei File CSV:**
  - Importazione ed elaborazione dei file CSV `TA-7-incantesimi-dardo.csv`, `TA-8-incantesimi_sfera.csv` e `TA-9-incantesimi_base.csv` aggiunti in `data/`.
  - Correzione sistematica delle anomalie di data indotte da Excel per i range di tiro:
    - **TA-7 (Dardo):** `46091` ➔ `"03-10"`, `46346` ➔ `"11-20"`
    - **TA-8 (Sfera):** `46150` ➔ `"05-08"`, `46277` ➔ `"09-12"`
    - **TA-9 (Base):** `46085` ➔ `"03-05"`, `46150` ➔ `"06-08"`, `46277` ➔ `"09-12"`
  - Aggiornamento della pipeline in `scripts/csvToJson.js` per includere queste tabelle e scriverle in formato JSON in `src/data/`.
- [x] **Mappatura delle Colonne della Tabella Incantesimi Base (TA-9):**
  - La tabella `TA-9` deve essere interrogata in base all'ambito della magia (*Essenza*, *Flusso/Canalizzazione*, *Mentalismo*) e all'armatura del bersaglio (*Generale*, *Armatura di metallo*, *Armatura di cuoio*).
  - La mappatura delle armature deve seguire queste regole:
    - **Generale:** se il bersaglio non indossa armatura corporea.
    - **Armatura di cuoio:** se il bersaglio indossa *cuoio grezzo* o *cuoio rinforzato*.
    - **Armatura di metallo:** se il bersaglio indossa *corazza di maglia* o *corazza di piastre*.

### 2. Algoritmo di Risoluzione del Lancio
- [x] **Calcolo del Tiro per Colpire (Lancio):**
  - Il tiro finale per colpire è calcolato come: `Risultato = Tiro Dado (1d100) + BO Incantesimo + Modificatori Attaccante + Modificatori Distanza - Modificatori Difensore + Modificatori Speciali`.
  - **Modificatori per il Tempo di Preparazione (Round):**
    - `4 round`: `+20`
    - `3 round`: `+10`
    - `2 round`: `+0`
    - `1 round`: `-15`
    - `0 round`: `-30`
  - **Modificatori per la Distanza (Sfera - TA-8):**
    - `0m - 3m`: `+35`
    - `3m - 16m`: `0`
    - `16m - 33m`: `-25`
    - `33m - 66m`: `-40`
    - `66m - 100m`: `-55`
    - `oltre 100m`: `-75`
  - **Modificatori per la Distanza (Base - TA-9):**
    - `A contatto`: `+30`
    - `0m - 3m`: `+10`
    - `3m - 16m`: `0`
    - `16m - 33m`: `-10`
    - `33m - 100m`: `-20`
    - `oltre 100m`: `-30`
  - **Modificatori per lo Stato di Salute dell'Attaccante:**
    - `-10` se l'attaccante ha perso più del 50% dei suoi PF.
  - **Modificatori del Difensore (Bersaglio):**
    - Detrazione del bonus di agilità (con le specifiche della tabella: sempre detratto per dardi; detratto solo se consapevole per sfere).
    - Copertura del bersaglio (es. da `-10` a `-60` per dardi, da `-10` a `-80` per sfere).
    - Scudo in direzione dell'attacco (`-20` per dardi).
    - Bersaglio statico (`+10` per incantesimi base se sorpreso/prono senza riparo).

- [x] **Interpretazione dei Risultati (Esiti):**
  - **Fallimento Incantesimo (Fumble):** Il fallimento si verifica quando il **tiro di dado pulito (naturale d100)** è compreso tra **01 e 02** (quindi <= 2), indipendentemente da modificatori o BO del lanciatore. In questo caso il lancio fallisce catastroficamente e viene attivato il risolutore dei fallimenti magici sulla tabella `TTM-3`.
  - **Incantesimi d'Attacco (TA-7, TA-8):** L'esito indica i PF di danno inflitti e la severità dell'eventuale colpo critico associato (es. `12B` = 12 PF e colpo critico B di tipo Calore, Freddo o Elettricità a seconda del tipo di incantesimo). Consente l'apertura del `CriticalResolver` per determinare l'effetto del critico.
  - **Incantesimi Base (TA-9):** L'esito indica il **modificatore al Tiro di Resistenza (TR)** del bersaglio (es. `-15`). Se il bersaglio effettua un tiro di resistenza, il suo bonus di TR subirà questo modificatore.

### 3. Componenti UI ed Integrazione
- [x] **Nuovo Componente `SpellResolver.jsx` (Modalità GM Stand-alone):**
  - Tab autonoma nella dashboard GM che si adatta a seconda della vista attiva:
    - **Incantesimi Base**: Mostra solo la risoluzione di `TA-9` (senza pulsanti switcher).
    - **Incantesimi Diretti**: Mostra solo la scelta tra `Dardo (TA-7)` e `Sfera (TA-8)`.
  - Configurazione dei modificatori con controlli ad hoc:
    - **Round di Preparazione**: 5 pulsanti selezionabili piccoli (0 R, 1 R, 2 R, 3 R, 4 R) invece di un dropdown.
    - **Elemento del Dardo/Sfera**: 4 pulsanti selezionabili piccoli (Fuoco, Ghiaccio, Fulmine, Impatto) invece di un dropdown.
    - BO lanciatore, ferite, distanza, modificatori difensore (BD, copertura, scudo, staticità).
  - Effettuare il tiro (pulsante "Tira" d100 + input manuale).
  - Visualizzare il calcolo matematico del tiro modificato.
  - Visualizzare l'esito finale: danni/critici (con scorciatoia "Risolvi Critico") o il modificatore TR del bersaglio, o un fallimento con scorciatoia "Risolvi Fallimento Magico".
  - Mostrare in una box a fine scheda le note descrittive della tabella selezionata, che includano espressamente la nota:
    `"NOTA: Un risultato (F) indica che l'incantesimo è fallito e richiede un tiro sulla tabella TTM-3 (Fallimenti degli Incantesimi)."`
- [x] **Integrazione in CombatCalculator:**
  - Espandere la selezione dell'arma dell'attaccante per consentire il lancio di incantesimi d'attacco (Dardo o Sfera).
  - Selezionando un incantesimo d'attacco come arma, il calcolatore mostrerà i campi per configurare i round di preparazione e la distanza, e interrogherà le tabelle `TA-7` o `TA-8` anziché quelle delle armi fisiche.

---

## Impatti sul Codice / Architettura

*   **Tabelle Dati:**
    *   [NEW] [TA-7-incantesimi-dardo.json](file:///Users/yagni/Geek/antigravity/merpcomp/src/data/TA-7-incantesimi-dardo.json) (Tabella Dardi)
    *   [NEW] [TA-8-incantesimi_sfera.json](file:///Users/yagni/Geek/antigravity/merpcomp/src/data/TA-8-incantesimi_sfera.json) (Tabella Sfere)
    *   [NEW] [TA-9-incantesimi_base.json](file:///Users/yagni/Geek/antigravity/merpcomp/src/data/TA-9-incantesimi_base.json) (Tabella Incantesimi Base)
*   **Pipeline di Build:**
    *   [MODIFY] [csvToJson.js](file:///Users/yagni/Geek/antigravity/merpcomp/scripts/csvToJson.js) (Aggiunta gestione delle nuove tabelle e correzione anomalie Excel)
*   **Componenti UI:**
    *   [NEW] [SpellResolver.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/components/SpellResolver.jsx) (Risolutore autonomo incantesimi)
    *   [MODIFY] [CombatCalculator.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/components/CombatCalculator.jsx) (Integrazione incantesimi d'attacco)
    *   [MODIFY] [App.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/App.jsx) (Integrazione della tab SpellResolver)
