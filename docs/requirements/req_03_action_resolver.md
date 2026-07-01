# [REQ-03] Action Resolver & Combattimento

## Stato: [Parzialmente Approvato]
**Ultimo aggiornamento:** 2026-06-30 da Antigravity

---

## Descrizione e Criteri di Accettazione (DoD)

Questo modulo raccoglie le regole di gioco e le formule matematiche necessarie a risolvere le azioni dei personaggi in gioco, incluse manovre fisiche, lanci di incantesimi, combattimenti all'arma bianca e a distanza, colpi maldestri e parate.

### 1. Risoluzione Manovre
- [x] **Manovre Statiche:**
  - [x] Calcolatore dedicato in `StaticManoeuvreResolver.jsx`.
  - [x] Risoluzione del tiro di dado d100 (aperto) sommato al bonus abilità del PG, confrontato con la tabella `TM-2-manovre_statiche.json`.
- [x] **Manovre di Movimento:**
  - [x] Calcolatore dedicato in `MovementManoeuvreResolver.jsx`.
  - [x] Calcolo basato sul tiro d100 modificato dal bonus di manovra (inclusa la penalità d'armatura e carico) mappato sulla tabella `TM-1-manovre_in_movimento.json`.

### 2. Calcolo Combattimento e Parate
- [x] **Calcolatore Combattimenti:**
  - [x] Pannello centralizzato `CombatCalculator.jsx` per calcolare gli attacchi portati dai PG o PNG contro un difensore specifico.
  - [x] Risoluzione basata sulle Tabelle d'Attacco JSON (`Tabelle-Attacco-TA-1_TA-2_TA-3_TA-4.json`), considerando il Bonus Offensivo (BO) dell'attaccante, il tiro d100 e la Classe d'Armatura (CA) del difensore.
  - [x] **Correzione BO Taglio 1 Mano:** Calcolo del BO per "Taglio a 1 mano" basato sul modificatore di Forza (FR) invece che di Agilità.
  - [x] **Uniformità dei Bonus:** Integrazione della funzione centralizzata `getCharacterSkillBonus` per calcolare coerentemente i modificatori abilità del PG ereditati dalla creazione.
  - [x] **Risoluzione Case-Sensitivity:** Risolto il problema di case-sensitivity sui nomi delle abilità che azzerava i gradi nel calcolatore.
- [x] **Gestione della Parata:**
  - [x] Possibilità per l'attaccante di allocare una parte del proprio BO alla parata (`boSpesoParata`), riducendo il proprio attacco per aumentare la difesa.
  - [x] Sincronizzazione in tempo reale del BO speso in parata con il database e il roster.
  - [x] **Azzeramento Parate (Nuovo Round):** Funzione batch via `writeBatch` in Firestore per resettare il BO speso in parata per tutti i personaggi all'inizio di un nuovo round di combattimento.
- [x] **Gestione delle Protezioni Aggiuntive (Nuovo):**
  - [x] Rilevamento automatico degli oggetti equipaggiati in inventario (con quantità > 0).
  - [x] **Scudo (+25 BD):** Aggiunta automatica del bonus di +25 al BD se equipaggiato (con opzione di disattivazione manuale in UI). Il bonus viene disattivato in caso di attacco alle spalle (`backAttack`).
  - [x] **Bracciali di Metallo (-5 BO):** Rilevamento e applicazione del malus di -5 al BO dell'attaccante.
  - [x] **Schinieri di Metallo (-5 MM):** Rilevamento e applicazione del malus di -5 a tutte le manovre di movimento nel resolver MM.
  - [x] **Elmo di Metallo (-5 Percezione):** Rilevamento e applicazione del malus di -5 alle abilità sensoriali (Percezione, Cercare tracce, Osservare) nel resolver MS.

### 3. Colpi Maldestri (Fumbles)
- [x] **Fumble Resolver:**
  - [x] Calcolatore dedicato in `FumbleResolver.jsx`.
  - [x] Risoluzione automatica dei tiri maldestri in base ai risultati d'attacco o di manovra falliti.
  - [x] Mappatura delle conseguenze tramite le tabelle `Tabella-Colpi_Maldestri-TTM-1-TTM-2.json` (armi e incantesimi) e `Tabella-Colpi_Maldestri-TTM-3-TTM-4.json` (manovre).

### 4. Risoluzioni da Sviluppare (Backlog / In Corso)
- [x] **Risolutore Colpi Critici (TC-1..TC-9):** Spostato e gestito nel modulo dedicato [req_05_critical_hits.md](file:///Users/yagni/Geek/antigravity/merpcomp/docs/requirements/req_05_critical_hits.md).
- [x] **Risoluzione Incantesimi Base — Completato**
  - [x] Risolutore stand-alone `SpellResolver.jsx` (tab "Incantesimi Base") con tabella `TA-9`. Dettagli in [req_06_spells_resolution.md](file:///Users/yagni/Geek/antigravity/merpcomp/docs/requirements/req_06_spells_resolution.md).
- [x] **Risoluzione Incantesimi Diretti — Completato**
  - [x] Risolutore stand-alone `SpellResolver.jsx` (tab "Incantesimi Diretti") + integrazione in `CombatCalculator.jsx` con tabelle `TA-7` e `TA-8`. Dettagli in [req_06_spells_resolution.md](file:///Users/yagni/Geek/antigravity/merpcomp/docs/requirements/req_06_spells_resolution.md).

---

## Impatti sul Codice / Architettura

Le logiche di calcolo e risoluzione risiedono nei seguenti moduli:
*   **Componenti di Risoluzione:**
    *   [CombatCalculator.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/components/CombatCalculator.jsx) (calcolo attacchi, gestione parate, azzeramento round)
    *   [StaticManoeuvreResolver.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/components/StaticManoeuvreResolver.jsx) (risolutore manovre statiche)
    *   [MovementManoeuvreResolver.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/components/MovementManoeuvreResolver.jsx) (risolutore manovre di movimento)
    *   [FumbleResolver.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/components/FumbleResolver.jsx) (risolutore dei colpi maldestri)
*   **Servizi e Helper:**
    *   [characterService.js](file:///Users/yagni/Geek/antigravity/merpcomp/src/services/characterService.js) (batch reset di parata)
    *   [skillHelpers.js](file:///Users/yagni/Geek/antigravity/merpcomp/src/utils/skillHelpers.js) (funzione `getCharacterSkillBonus` per i calcoli centralizzati)
