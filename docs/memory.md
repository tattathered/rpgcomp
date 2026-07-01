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

## 3. Indice dei Requisiti e delle Funzionalità (Mappa degli Spokes)
Per evitare la saturazione del contesto di Antigravity, i dettagli delle funzionalità e lo stato di implementazione sono mappati nei seguenti moduli dedicati:

- 📂 **[req_01_core_system.md](file:///Users/yagni/Geek/antigravity/merpcomp/docs/requirements/req_01_core_system.md)** — Autenticazione, Ruoli, Gestione GM e Dashboard Player.
- 📂 **[req_02_character_wizard.md](file:///Users/yagni/Geek/antigravity/merpcomp/docs/requirements/req_02_character_wizard.md)** — Il flusso di creazione del Personaggio in 10 Step e logiche di sviluppo.
- 📂 **[req_03_action_resolver.md](file:///Users/yagni/Geek/antigravity/merpcomp/docs/requirements/req_03_action_resolver.md)** — Risolutori di manovre, tabelle di attacco, calcolo del combattimento e maldestri.
- 📂 **[req_04_data_layer.md](file:///Users/yagni/Geek/antigravity/merpcomp/docs/requirements/req_04_data_layer.md)** — Mappa dei file JSON delle tabelle MERP, pipeline di build e cataloghi personalizzati.
- 📂 **[req_05_critical_hits.md](file:///Users/yagni/Geek/antigravity/merpcomp/docs/requirements/req_05_critical_hits.md)** — Risoluzione colpi critici (TC-1..TC-9) ed integrazione combattimento.
- 📂 **[req_06_spells_resolution.md](file:///Users/yagni/Geek/antigravity/merpcomp/docs/requirements/req_06_spells_resolution.md)** — Risoluzione lancio incantesimi (TA-7..TA-9), dardi, sfere ed incantesimi base.
- 📂 **[req_07_creatures_npc.md](file:///Users/yagni/Geek/antigravity/merpcomp/docs/requirements/req_07_creatures_npc.md)** — PNG e Mostri/Creature: cataloghi, roster campagna, integrazione calcolatori.
- 📂 **[req_08_codex_tooltips.md](file:///Users/yagni/Geek/antigravity/merpcomp/docs/requirements/req_08_codex_tooltips.md)** — Codex & Tooltips: dizionario termini di gioco, console GM e posizionamento dinamico.
- 📂 **[req_09_languages_codex.md](file:///Users/yagni/Geek/antigravity/merpcomp/docs/requirements/req_09_languages_codex.md)** — Codex Lingue e Gradi: integrazione di lingue e gradi di conoscenza nel Codex.

## 4. Stato Globale Avanzamento

- **Funzionalità Implementate:** 48 (REQ-01 → REQ-09 completati al 100%).
- **In Corso / In Revisione:** 0.
- **In Backlog (analizzati, non implementati):** 0.
- **CR aperte:** 1 — CR-001 (Combat Calculator v2 — attacchi multipli per round).

> Per il dettaglio di tutti i task aperti, CR e fix: **[docs/backlog.md](file:///Users/yagni/Geek/antigravity/merpcomp/docs/backlog.md)**
> Per la pianificazione a lungo termine: **[docs/roadmap.md](file:///Users/yagni/Geek/antigravity/merpcomp/docs/roadmap.md)**

## 5. Backlog — Analizzato / In Attesa

Feature analizzate o discusse ma non ancora implementate. Aggiornare contestualmente a `docs/backlog.md`.

- 📋 **CR-001 (Combat Calculator v2 — attacchi multipli per round):** `⏳ In Attesa` — Gestione automatica della sequenza di attacchi multipli (es. Morso + Artigli) per round per mostri/animali.

---

*Regole di processo: [.agents/AGENTS.md](file:///Users/yagni/Geek/antigravity/merpcomp/.agents/AGENTS.md) | Protocollo memoria: [.agents/skills/memory-guardian/memory_guardian.md](file:///Users/yagni/Geek/antigravity/merpcomp/.agents/skills/memory-guardian/memory_guardian.md)*