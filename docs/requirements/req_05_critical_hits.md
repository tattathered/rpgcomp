# [REQ-05] Risoluzione Colpi Critici (Tabelle TC-1..TC-9)

## Stato: [Approvato — Completato]
**Ultimo aggiornamento:** 2026-06-24 da Antigravity

---

## Descrizione e Criteri di Accettazione (DoD)

Questo modulo gestisce la risoluzione automatica e l'interpretazione dei Colpi Critici inflitti durante i combattimenti. La gravità e gli effetti dei critici dipendono dal tipo di arma, dal tiro d'attacco e da un secondo tiro di dado modificato.

### 1. Gestione Tabelle dei Critici
- [x] **Importazione Tabelle Critici:**
  - Caricamento in formato JSON dei file `TC-1`..`TC-9` dal data layer (`src/data/`).
  - Caricamento delle modifiche al tiro per severità da `TC-modifiche_al_tiro.json`.
  - _Implementato in `CriticalResolver.jsx` (righe 4-13): importazione diretta di tutti i 9 file TC + il file di modifiche al tiro._
- [x] **Mappatura Tabelle per Categoria Arma:**
  - Associazione automatica dell'arma utilizzata alla tabella critici corretta:
    - *Taglio a 1 mano (es. spade, asce)* ➔ `TC-2-colpi_critici_taglio` o `TC-3` per stocchi/dagne.
    - *Contundente (es. mazze, randelli)* ➔ `TC-1-colpi_critici_impatto`.
    - *A 2 mani (es. spade a 2 mani)* ➔ `TC-2-colpi_critici_taglio` (o `TC-1` per martelli).
    - *Con asta (es. lance)* ➔ `TC-3-colpi_critici_punta`.
    - *Tiro/Lancio (es. archi, balestre)* ➔ `TC-3-colpi_critici_punta` (o `TC-4` per bolas, `TC-1` per fionde).
  - _Implementato nella funzione `getCriticalTableForWeapon()` in `CombatCalculator.jsx` (righe 101-126)._

### 2. Algoritmo di Calcolo del Critico
- [x] **Tiro Modificato del Critico:**
  - Calcolo del risultato finale del tiro sul critico: `Risultato = Tiro Dado (1d100) + Modificatore Severità (TC-modifiche_al_tiro) + Modificatore GM`.
  - Applicazione dei modificatori basati sulla lettera di severità del critico:
    - `T` ➔ `-50`
    - `A` ➔ `-20`
    - `B` ➔ `-10`
    - `C` ➔ `+0`
    - `D` ➔ `+10`
    - `E` ➔ `+20`
  - Capping del risultato finale nell'intervallo `[1, 120]`.
  - _Implementato nei memo `severityModifier` e `computedResult` in `CriticalResolver.jsx` (righe 86-106). Lookup dinamico su `TC-modifiche_al_tiro.json` con fallback ai valori standard._
- [x] **Risoluzione per Range:**
  - Parsing del range di tiro (es. `17-27`, `80`, `117-119`) per estrarre la riga corrispondente e mostrare la descrizione e gli effetti corretti del critico.
  - _Implementato nella funzione `isInRange()` e nel memo `outcome` in `CriticalResolver.jsx` (righe 44-128)._

### 3. Componente UI Risoluzione Critici
- [x] **Interfaccia Interattiva (`CriticalResolver.jsx`):**
  - Finestra/Modal simile al Fumble Resolver che mostra:
    - Selezione manuale della tabella critico e della severità (A-E).
    - Riga per il tiro del dado (pulsante "Tira" + input manuale).
    - Campo per inserire un modificatore speciale del GM.
    - Visualizzazione matematica del calcolo (`Tiro + Mod. Severità + Mod. GM = Risultato`).
    - Esito testuale descrittivo del critico con pulsanti di navigazione `[<< Precedente]` e `[Successivo >>]`.
  - _Implementato come componente completo in `CriticalResolver.jsx` (419 righe). Include griglia di selezione tabelle TC-1..TC-9, pulsanti severità con modificatore visibile, lancio dado d100 con input manuale, campo modificatore GM, barra di calcolo matematica, e box esito con navigazione Precedente/Successivo._
- [x] **Integrazione in CombatCalculator:**
  - Quando il risultato d'attacco genera un critico (es. `14D`), mostrare un pulsante/link diretto `"Risolvi Critico di tipo D"`.
  - Cliccando sul pulsante, aprire la schermata del `CriticalResolver` inizializzata con i parametri corretti (severità D, modificatore +10, tabella adatta per l'arma dell'attaccante).
  - _Implementato in `CombatCalculator.jsx` (righe 487-496, 1168-1191, 1250-1277). Il pulsante "Risolvi Critico" appare automaticamente quando il risultato include un critico e passa tableCode, severity e diceRoll calcolati._
- [x] **Modalità GM Stand-alone:**
  - Accesso diretto al `CriticalResolver` dalla dashboard del GM per tiri di critico rapidi e manuali non legati ad attacchi calcolati.
  - _Implementato in `App.jsx` (righe 821-829) come sotto-tab "criticals" nella sezione Azioni del GM._

---

## Impatti sul Codice / Architettura

*   **Tabelle Dati:**
    *   I file JSON `TC-1-colpi_critici_impatto.json` fino a `TC-9-colpi_critici_impatto_magico.json` e `TC-modifiche_al_tiro.json` in `src/data/`.
*   **Componenti UI:**
    *   [CriticalResolver.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/components/CriticalResolver.jsx) (Componente di risoluzione — Completato)
    *   [CombatCalculator.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/components/CombatCalculator.jsx) (Integrazione pulsante e logica di attivazione — Completato)
    *   [App.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/App.jsx) (Integrazione nel menu principale del GM — Completato)
