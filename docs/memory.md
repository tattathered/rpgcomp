# MERP Companion — Memory Hub (Stato & Changelog)

> **Fonti di verità:** task → [`docs/backlog.md`](docs/backlog.md) · requisiti → [`docs/requirements/`](docs/requirements/) · piano → [`docs/roadmap.md`](docs/roadmap.md). Questo file è un **riepilogo navigazionale** (stato + changelog), non la fonte dei dettagli.

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
- **In Corso / In Revisione:** REQ-10 (CharacterSheet standalone).
- **In Backlog (analizzati, non implementati):** 0.
- **CR aperte:** CR-001 (attacchi multipli), CR-002 (REQ-10 in verifica) — dettaglio in `docs/backlog.md`.

> Dettaglio task aperti: **[docs/backlog.md](docs/backlog.md)** · Piano a lungo termine: **[docs/roadmap.md](docs/roadmap.md)**

## 5. Changelog Recenti

Sintesi cronologica delle modifiche; il dettaglio operativo vive in `docs/backlog.md` e negli spoke dei requisiti.

- **2026-08-15 — FIX-011 (verificato — chiuso):** smoke test manuale superato dall'utente sull'editor equip condiviso (GM + Player). Task spostato in archivio (`✅ Fatto`). REQ-10-05 chiusa (coperta da FIX-011). REQ-10 resta in verifica per gli altri pulsanti (Creazione, Upgrade, Liste).
- **2026-08-14 — FIX-011 (Equipment Editor implementato):** creato `src/components/Shared/EquipmentEditor.jsx` — unico editor equip modale per GM+Player (`mode='gm'|'player'`), basato sul pattern collaudato di `InventoryEditor` arricchito con le funzionalità dell'inline GM. Non scrive direttamente su Firestore: chiama `onSave(updatedData)` con il characterData completo (full-spread), il chiamante decide il contesto di salvataggio. Esposto il flag ACQUISTO (chiude REQ-10-05). Rimosso da `CharacterSheetStep.jsx` l'editor inline equip (~350 righe: `equipItemsState`, `equipSummary`, `equipHandleSave`, `equipFilteredItems`, `equipCategories`, blocco JSX editMode='equipment'); il box Inventario è ora read-only e il pulsante apre la modale. `PlayerCharacterSheet.jsx` migrato a `EquipmentEditor` mode='player' con fix della chiamata `updateCharacterEquipment(gmId, charId, data)` (prima 2 argomenti). Eliminato `Shared/InventoryEditor.jsx`. Bug sintassi (extra `}`) non riproducibile (build ✅ lint ✅, 0 errori / 48 warning documentati).
- **2026-08-14 — FIX-011 (analisi scope avviata):** analisi architetturale per il refactoring di `CharacterSheetStep.jsx`. Esito: God component (~2000 righe) con doppio ruolo (step 10 wizard + tab `sheet`); doppio editor equip (modale `Shared/InventoryEditor` per Player + inline per GM); **2.3.3 "forzatura statistiche GM" assente** (caratteristiche read-only, editabili solo HP/PF). Proposta target: `CharacterSheetView` + editor estratti (`InventoryEditorInline`, `SpellListsEditor`, `StatsOverrideEditor`) + orchestratore sottile. **3 decisioni pendenti dall'utente:** (1) 2.3.3 come FEAT separata o inclusa nel refactoring, (2) consolidare o meno i due editor equip, (3) partire dall'estrazione dell'editor equip (consigliato, incrementale).
- **2026-08-14 — Docs & Processo:** rimosso `src/App.css` (file morto); regole agente in `.agents/AGENTS.md` (anti-sicofantia, workflow git/deploy, fine sessione); separazione scope `backlog.md` / `roadmap.md`; generalizzazione "Antigravity" → "agente AI"; path relativi; `memory.md` ristrutturato come stato & changelog; `analisi_funzionale` archiviato in `docs/archive/`.
- **2026-08-14 — FIX-012 (roster PNG):** attivate le sottoscrizioni real-time `subscribeToCampaignNpcs`/`subscribeToCreatures` in `App.jsx` (campagna attiva) → il Roster Attivo si aggiorna subito dopo il salvataggio di un PNG/creatura, senza uscire/rientrare. **Completato e verificato dall'utente**; registrata anche CR-003 (review UI/UX trasversale).
- **2026-07-13 — FIX-010 (liste incantesimi):** `categoryMap` in `magicHelpers.js` allineata ai dati reali; regole liste per professione → [`req_06`](docs/requirements/req_06_spells_resolution.md).

---

