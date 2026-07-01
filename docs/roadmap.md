# MERP Companion — Roadmap Evolutiva

Questo documento delinea la pianificazione delle prossime funzionalità e dei miglioramenti tecnici del sistema, classificati per **Urgenza** (impatto sulle sessioni di gioco dell'utente) e **Criticità** (complessità architetturale e impatto sul codice preesistente).

---

## 🚦 Criteri di Valutazione

*   **Urgenza (U):**
    *   🔴 **Alta:** Necessario per sbloccare o rendere fluida la conduzione dei combattimenti e delle sessioni.
    *   🟡 **Media:** Utile per espandere le capacità e la ricchezza del sistema in tempi brevi.
    *   🟢 **Bassa (Low):** Miglioramento della qualità della vita (QoL) implementabile in fasi successive.
*   **Criticità Tecnica (C):**
    *   🔴 **Alta:** Impatta molteplici moduli core (DB Firestore, logiche di sviluppo, calcoli in tempo reale) e richiede attenta sincronizzazione multi-utente.
    *   🟡 **Media:** Richiede nuovi componenti e modifiche circoscritte a servizi esistenti.
    *   🟢 **Bassa (Low):** Moduli isolati e indipendenti, nessun rischio di regressione.

---

## 🗺️ Roadmap delle Funzionalità

### 1. Supporto Attacchi Multipli Creature (CR-001)
*   **Descrizione:** Mostri e animali hanno spesso 2 attacchi nello stesso round (es: *Morso* + *Artigli*). L'interfaccia del `CombatCalculator` deve poter selezionare ed eseguire in sequenza attacchi multipli in un solo round senza dover resettare le impostazioni ad ogni tiro.
*   **Urgenza:** 🔴 **Alta** (Indispensabile per gestire gli scontri con bestie e mostri in modo naturale).
*   **Criticità:** 🟡 **Media** (Richiede modifiche alla UI del calcolatore e alla gestione dello storico danni, ma non tocca la struttura del PG).
*   **Impatto sul codice:** [CombatCalculator.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/components/CombatCalculator.jsx).

### 2. Gestione Inventario Dinamico & Equipaggiamento PG
*   **Descrizione:** Abilitare la modifica dell'equipaggiamento direttamente dalla scheda personaggio attiva (compravendita, usura, loot), con ricalcolo in tempo reale di: ingombro totale, penalità al movimento (MM), penalità al lancio incantesimi, B.O. delle armi impugnate e B.D. derivante dalle armature.
*   **Urgenza:** 🟡 **Media** (I PG evolvono e cambiano armi/armature durante la campagna).
*   **Criticità:** 🔴 **Alta** (Impatta pesantemente la logica di calcolo del bonus in [skillHelpers.js](file:///Users/yagni/Geek/antigravity/merpcomp/src/utils/skillHelpers.js) e richiede l'aggiornamento dei nodi in Firestore).
*   **Impatto sul codice:** `CharacterSheetStep.jsx`, `skillHelpers.js`, `characterService.js`.

### 3. Combat Tracker & Gestione Iniziativa (Roster Turni)
*   **Descrizione:** Un tab dedicato per la gestione del combattimento a turni:
    *   Calcolo automatico dell'Iniziativa per tutti i partecipanti (PG, PNG, mostri) attivi nella campagna.
    *   Ordinamento automatico e avanzamento dei round.
    *   Tracciamento dei modificatori temporanei ed effetti dei colpi critici (es: *Stordito per 2 round*, *-10 al B.O. per 1 round*).
*   **Urgenza:** 🟡 **Media** (Rende il compagno un vero assistente per il combattimento).
*   **Criticità:** 🔴 **Alta** (Richiede la sincronizzazione di uno stato di "combattimento attivo" in tempo reale su Firestore in modo che sia visibile in tempo reale anche sul portale dei giocatori).
*   **Impatto sul codice:** Nuovi componenti `CombatTracker.jsx` e servizi correlati.

### 4. Parser Automatico dei Testi Codex (`<CodexText>`)
*   **Descrizione:** Creazione di un componente wrapper `<CodexText>` che riceve un testo descrittivo lungo (come la descrizione di una professione o di un popolo) ed evidenzia/sottolinea in automatico tramite Regex tutte le parole chiave e i sinonimi presenti nel testo, collegandole ai relativi tooltip del Codex.
*   **Urgenza:** 🟡 **Media** (Estende enormemente l'utilità del Codex appena implementato).
*   **Criticità:** 🟢 **Bassa** (Modulo UI puramente locale ed isolato, nessun impatto sul database).
*   **Impatto sul codice:** Nuovo componente in `Shared/` ed integrazione nei testi descrittivi della scheda.

### 5. Glossario Ricercabile (Full-Text Search)
*   **Descrizione:** Un'interfaccia dedicata per consentire al GM e ai giocatori di sfogliare ed effettuare ricerche testuali nell'intero database del Codex (caratteristiche, popoli, regole, ecc.), trasformandolo in un compendio di gioco interattivo consultabile on-demand.
*   **Urgenza:** 🟢 **Bassa** (I tooltip contestuali coprono già il 90% delle esigenze rapide).
*   **Criticità:** 🟢 **Bassa** (Nuovo componente indipendente di sola lettura).
*   **Impatto sul codice:** `CodexAdminTab.jsx` (nuova vista) o pannello Glossario autonomo.
