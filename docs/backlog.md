# MERP Companion — Backlog & Issue Tracker

Questo file è il punto unico di verità per tutte le attività **non ancora completate**:
nuove funzionalità (FEAT), change request UX/UI (CR) e bug/fix tecnici (FIX).

> **Regola:** Ogni task viene inserito qui prima di essere analizzato o implementato.
> Antigravity deve leggere questo file all'inizio di ogni sessione e aggiornarlo ad ogni avanzamento.

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
| - | - | Nessun task attivo nel backlog | - | - | - |

---

## Coda CR e Fix (segnalati dall'utente — da analizzare)

*Questa sezione raccoglie CR e fix segnalati durante i test. Vengono promossi nel Backlog Attivo una volta analizzati.*

| ID | Tipo | Descrizione | Segnalato il | Stato |
|----|------|-------------|--------------|-------|
| CR-001 | CR | Combat Calculator v2 — Supporto attacchi multipli per round (Mostri/Animali hanno spesso 2 attacchi nello stesso round, PG e PNG ne fanno uno alla volta). Rivedere il flusso di risoluzione per gestire sequenza di attacchi multipli. | 2026-06-26 | ⏳ In Attesa |

---

## Completati (Archivio)

*Task spostati qui quando lo stato diventa ✅ Fatto. Non cancellare, solo spostare.*

| ID | Tipo | Descrizione | Completato il |
|----|------|-------------|---------------|
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
