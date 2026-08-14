# MERP Companion — Project Memory Hub

## 1. Visione del Sistema & Attori
- **GM (Custode):** Gestione PG/PNG, roster, compagnie, campagne, risoluzione azioni, amministrazione cataloghi.
- **Giocatore (Player):** Visualizzazione schede PG assegnati in sola lettura.
- **Autenticazione:** Firebase Auth (Email/Password). Il primo login assegna il ruolo GM.

## 2. Architettura Tecnologica (Baseline v2.3.0)
- **Frontend:** React 18 + Vite.
- **Backend:** Firebase (Firestore, Auth, Cloud Functions).
- **Dati statici:** JSON locali (`src/data/`) per tabelle regolamento MERP/GirSA.
- **Persistenza Dinamica:** Struttura Firestore sotto la radice `gms/{gmId}/`.

## 2.1 Regole di Processo (Come Lavoriamo)
Le regole operative per l'agente (onboarding obbligatorio, comportamento, workflow git/deploy, checklist fine sessione) sono in:

- 📄 **[`.agents/AGENTS.md`](.agents/AGENTS.md)** — auto-caricato a inizio sessione (standard AGENTS.md): onboarding, regole anti-sicofantia, analisi-prima-del-codice, workflow Git/Firebase, fine sessione.
- 📄 **[`.agents/skills/memory-guardian/memory_guardian.md`](.agents/skills/memory-guardian/memory_guardian.md)** — protocollo Hub & Spoke + Backlog: ogni FEAT/CR/FIX va prima registrata in `docs/backlog.md`, poi analizzata, poi approvata, poi implementata.

**Regola d'oro:** mai codice prima della documentazione. Analisi → design → approvazione → codice → verifica → update docs.

## 3. Indice dei Requisiti e delle Funzionalità (Mappa degli Spokes)
Per evitare la saturazione del contesto, i dettagli delle funzionalità e lo stato di implementazione sono mappati nei seguenti moduli dedicati:

- 📂 **[req_01_core_system.md](docs/requirements/req_01_core_system.md)** — Autenticazione, Ruoli, Gestione GM e Dashboard Player.
- 📂 **[req_02_character_wizard.md](docs/requirements/req_02_character_wizard.md)** — Il flusso di creazione del Personaggio in 10 Step e logiche di sviluppo.
- 📂 **[req_03_action_resolver.md](docs/requirements/req_03_action_resolver.md)** — Risolutori di manovre, tabelle di attacco, calcolo del combattimento e maldestri.
- 📂 **[req_04_data_layer.md](docs/requirements/req_04_data_layer.md)** — Mappa dei file JSON delle tabelle MERP, pipeline di build e cataloghi personalizzati.
- 📂 **[req_05_critical_hits.md](docs/requirements/req_05_critical_hits.md)** — Risoluzione colpi critici (TC-1..TC-9) ed integrazione combattimento.
- 📂 **[req_06_spells_resolution.md](docs/requirements/req_06_spells_resolution.md)** — Risoluzione lancio incantesimi (TA-7..TA-9), dardi, sfere ed incantesimi base.
- 📂 **[req_07_creatures_npc.md](docs/requirements/req_07_creatures_npc.md)** — PNG e Mostri/Creature: cataloghi, roster campagna, integrazione calcolatori.
- 📂 **[req_08_codex_tooltips.md](docs/requirements/req_08_codex_tooltips.md)** — Codex & Tooltips: dizionario termini di gioco, console GM e posizionamento dinamico.
- 📂 **[req_09_languages_codex.md](docs/requirements/req_09_languages_codex.md)** — Codex Lingue e Gradi: integrazione di lingue e gradi di conoscenza nel Codex.
- 📂 **[req_10_character_sheet_standalone.md](docs/requirements/req_10_character_sheet_standalone.md)** — CharacterSheetStep come tab autonomo 'sheet', 4 pulsanti contestuali per modifiche mirate (creazione, upgrade, equip, liste).

## 4. Stato Globale Avanzamento

- **Funzionalità Implementate:** 49 (REQ-01 → REQ-09 completati al 100%, REQ-10 in verifica).
- **In Corso / In Revisione:** 2 — REQ-10 (CharacterSheet standalone, 4 pulsanti contestuali), FIX-011 (Equipment Editor).
- **In Backlog (analizzati, non implementati):** 0.
- **CR aperte:** 2 — CR-001 (Combat Calculator v2 — attacchi multipli per round), CR-002 (REQ-10 in verifica).
- **2026-08-14 — Processo & Cleanup:** rimosso `src/App.css` (file morto, non referenziato da nessuna parte); aggiornate le regole agente in `.agents/AGENTS.md` (sezione anti-sicofantia, workflow git/deploy corretto, checklist fine sessione).

> Per il dettaglio di tutti i task aperti, CR e fix: **[docs/backlog.md](docs/backlog.md)**
> Per la pianificazione a lungo termine: **[docs/roadmap.md](docs/roadmap.md)**

## 5. Bug Fix Recenti

### FIX-010 (2026-07-13): Spell List Category Mapping
- **File:** `src/utils/magicHelpers.js`
- **Problema:** `getAvailableSpellLists()` usava `categoryMap` con valori errati (`'Mago'`, `'Ranger'`, `'Bardo'`, `'Animista'`) rispetto ai dati reali in `Tabella-liste_incantesimi.json` (`'Maghi Maghi'`, `'Ranger Ranger'`, `'Bardi Bardi'`, `'Animisti Animisti'`).
- **Effetto:** Es. Mago vedeva solo 8 liste Essenza anziché 8 Essenza + 8 Maghi.
- **Fix:** Allineati i valori della `categoryMap` ai dati reali.
- **Regole (da `data/professioni-descrizione.txt`):**
  - Mago: Essenza aperte + Liste dei Maghi
  - Animista: Flusso aperte + Liste degli Animisti
  - Ranger: Flusso aperte + Liste dei Ranger
  - Bardo: Essenza aperte + Liste dei Bardi
  - Scout: Essenza **oppure** Flusso aperte (a scelta)
  - Guerriero: Essenza **oppure** Flusso aperte (a scelta)

### FIX-011 (2026-07-13): Equipment Editor — Refactoring Necessario
- **File:** `src/components/CharacterWizard/steps/CharacterSheetStep.jsx`
- **Problema:** Il componente ha superato 2000 righe, diventando difficilmente manutenibile. Le modifiche all'equipment editor (EQUIP +/- inline, doppi pulsanti catalogo, unified state via `equipItemsState`) hanno introdotto errori di sintassi.
- **Necessario:** Estrarre la logica dell'equipment editor in un componente separato (`InventoryEditorInline.jsx`).

---

## 6. Backlog — Analizzato / In Attesa

Feature analizzate o discusse ma non ancora implementate. Aggiornare contestualmente a `docs/backlog.md`.

- 📋 **CR-001 (Combat Calculator v2 — attacchi multipli per round):** `⏳ In Attesa` — Gestione automatica della sequenza di attacchi multipli (es. Morso + Artigli) per round per mostri/animali.

---

