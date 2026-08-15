# MERP Companion — Backlog & Issue Tracker

Questo file è il punto unico di verità per tutte le attività **non ancora completate**:
nuove funzionalità (FEAT), change request UX/UI (CR) e bug/fix tecnici (FIX).

> **Regola:** Ogni task viene inserito qui prima di essere analizzato o implementato.
> L'agente AI deve leggere questo file all'inizio di ogni sessione e aggiornarlo ad ogni avanzamento.

---

## Confine con la Roadmap

- **Questo file (Backlog)** = task operativi (FEAT/CR/FIX) emersi durante l'implementazione e **posticipati** → non pianificati come macro.
- **Roadmap** (`docs/roadmap.md`) = piano ad alto livello delle macro funzionalità.
- Un task del backlog può **riferirsi** a una macro della roadmap (cross-reference, es. `→ CR-001`), ma ogni voce vive in **un solo** documento: niente duplicazioni.

---

## Legenda

| Tipo | Significato |
|------|-------------|
| `FEAT` | Nuova funzionalità |
| `CR`   | Change Request (UX/UI/comportamento) |
| `FIX`  | Bug o correzione tecnica |

| Stato | Significato |
|-------|-------------|
| ⏳ In Attesa | Registrato, non ancora analizzato |
| 🔵 In Analisi | Analisi/design in corso, nessun codice scritto |
| 🟢 In Sviluppo | Implementazione avviata |
| 🔴 Bloccato | Dipende da altro task o da input utente |
| ✅ Fatto | Completato e verificato |

---

## Backlog Attivo

| ID | Tipo | Descrizione | Priorità | Stato | Note / Spoke |
|----|------|-------------|----------|-------|--------------|
| REQ-10-04 | FEAT | Comando 4 — Scarica inventario CSV | Bassa | 🔵 In Analisi | req_10 |
| CR-002 | CR | Scheda Personaggio Standalone — CharacterSheetStep diventa un tab autonomo 'sheet' in AppTabs. Carica PG dal roster apre la scheda, non il wizard. 4 pulsanti contestuali per modifiche mirate. Vedi req_10_character_sheet_standalone.md | Alta | 🟢 In Sviluppo (implementato, in attesa di verifica utente) | req_10 |

---

## Coda CR e Fix (segnalati dall'utente — da analizzare)

*Questa sezione raccoglie CR e fix segnalati durante i test. Vengono promossi nel Backlog Attivo una volta analizzati.*

| ID | Tipo | Descrizione | Segnalato il | Stato |
|----|------|-------------|--------------|-------|
| CR-001 | CR | Combat Calculator v2 — Supporto attacchi multipli per round (Mostri/Animali hanno spesso 2 attacchi nello stesso round, PG e PNG ne fanno uno alla volta). Rivedere il flusso di risoluzione per gestire sequenza di attacchi multipli. | 2026-06-26 | ⏳ In Attesa |
| CR-003 | CR | Analisi UI/UX completa e armonizzazione (tutta l'app): rendere omogenee e coerenti le viste GM/Player e alzare la QoL percepita (al momento bassina). Richiede test approfonditi per individuare le modifiche da fare; da pianificare. | 2026-08-14 | ⏳ In Attesa |

---

## Completati (Archivio)

*Task spostati qui quando lo stato diventa ✅ Fatto. Non cancellare, solo spostare.*

| ID | Tipo | Descrizione | Completato il |
|----|------|-------------|---------------|
| CR-004 | CR | EquipmentEditor "Aggiungi oggetto": colonna INV prima di Peso con conteggio degli oggetti già in inventario. | 2026-08-15 |
| CR-005 | CR | Wizard step 7 (Equipaggiamento): filtro "IN INVENTARIO" tra i filtri categoria. | 2026-08-15 |
| REQ-10-02 | FEAT | Aggiunta rapida oggetto — assorbita da FIX-011: tab "Aggiungi Oggetto" dell'`EquipmentEditor`. | 2026-08-15 |
| REQ-10-03 | FEAT | Modifica portafoglio — assorbita da FIX-011: input portafoglio + delta ACQUISTO nell'`EquipmentEditor`, salvato via `onSave`. | 2026-08-15 |
| REQ-10-06 | FEAT | Note modificabili sugli oggetti — assorbita da FIX-011: campo `note` per item nell'`EquipmentEditor` (editabile anche in modalità player). | 2026-08-15 |
| FIX-011 | FIX | Equipment Editor — Refactoring: estratto `CharacterSheetStep.jsx` l'editor equip inline in componente condiviso `Shared/EquipmentEditor` (modale GM+Player, flag ACQUISTO esposto, onSave full-spread). Rimosso `Shared/InventoryEditor`. Bug sintassi (extra `}`) non riproducibile (build ✅ lint ✅). Verificato via smoke test utente. | 2026-08-15 |
| REQ-10-05 | FEAT | Editor equip unico `Shared/EquipmentEditor` (GM+Player) — flag ACQUISTO e gestione delta costo su portafoglio | 2026-08-15 |
| REQ-10-01 | FEAT | Comando 1 — Modifica Inventario (pulsante → InventoryEditor) | 2026-08-14 |
| FIX-012 | FIX | Roster PNG/Creature sempre aggiornato: attivate le sottoscrizioni real-time `subscribeToCampaignNpcs`/`subscribeToCreatures` in `App.jsx` sulla campagna attiva (cleanup al cambio campagna). Il Roster Attivo mostra subito PNG/creature appena salvati, senza uscire/rientrare. Nota: ora il roster mostra solo gli attori della campagna attiva. | 2026-08-14 |
| BL-003 | FEAT | Codex Lingue e Gradi — Integrazione delle definizioni di lingue e gradi di conoscenza nel Codex con attivazione dei tooltips nella scheda PG | 2026-07-01 |
| FIX-010 | FIX | Spell List Category Mapping — `categoryMap` in `magicHelpers.js` allineata ai valori reali del JSON `Tabella-liste_incantesimi.json`. | 2026-07-13 |
| FIX-009 | FIX | Importazione PG — Risolto bug di sovrascrittura accidentale per PG con ID identici e nome modificato, mappando l'ID come 'pgId' nel JSON per chiarezza e inserendo la scelta utente (sovrascrittura vs nuovo PG). | 2026-07-01 |
| BL-002 | FEAT | Codex Tooltips Trasversali — Dizionario termini di gioco, console GM e attivazione dinamica per categoria/pagina | 2026-07-01 |
| BL-001 | FEAT | PNG e Mostri/Creature — Catalogo e gestione schede | 2026-07-01 |
| FIX-008 | FIX | Combat Calculator — Aggiunta l'indicazione della percentuale di BO allocato per parare di fianco alla quota BO spesa dal difensore. | 2026-06-30 |
| FEAT-007 | DATA | Importazione orchi nel catalogo creature: integrati Orco guerriero debole/medio/forte da CSV e rigenerato database JSON. | 2026-06-30 |
| FIX-006 | FIX | CreatureCatalogTab — Aggiunto campo di testo per personalizzare il nome del mostro/creatura prima di associarlo alla Campagna Attiva (proponendo come default il nome standard, es. "Ragno gigante minore"). | 2026-06-30 |
| FIX-005 | FIX | MovementManoeuvreResolver — Risolto bug visibilità testi (Tiro Aperto e Risultato Finale invisibili) rimuovendo la classe .card che forzava lo sfondo a bianco. Sistemato il layout del cerchio esiti per affiancare il simbolo percentuale ed aumentato il font a 3xl. | 2026-06-30 |
| FIX-004 | FIX | Combat Calculator — Abilitata la parata per le creature difensori, caricando i loro attacchi come armi difensive e permettendo di spendere il BO (fino al limite dell'attacco attivo) per ridurre il tiro. | 2026-06-30 |
| FIX-003 | FIX | Combat Calculator & Resolvers — Risolto mancato passaggio delle armi per il PG difensore (sbloccando la parata). Localizzate le label in PG/PNG. Aggiunto supporto automatico e manuale per Scudo (+25 BD), Bracciali metallici (-5 BO), Schinieri metallici (-5 MM), Elmo metallico (-5 Percezione). | 2026-06-30 |
| FIX-002 | FIX | Character Wizard Step 6 Background — Opzione 4 "Denaro extra": risolto lookup errato sulla tipologia del dataset JSON, abilitando la corretta conversione d100 ➔ MO. | 2026-06-30 |
| FIX-001 | FIX | Creazione PG: scomparsa la sezione per la selezione di popolo e cultura dopo l'Anagrafica personaggio | 2026-06-24 |
