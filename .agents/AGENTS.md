# MERP Companion — Regole Locali Agente (Project Scope)

## ⚡ Onboarding Obbligatorio — Da Eseguire SEMPRE All'Inizio di Ogni Sessione

Prima di rispondere a qualsiasi richiesta dell'utente, Antigravity DEVE:

1. **Leggere [`docs/memory.md`](./docs/memory.md)** — Hub centrale con tech stack, architettura e mappa degli spoke dei requisiti.
2. **Leggere [`docs/backlog.md`](./docs/backlog.md)** — Lista unica di FEAT/CR/FIX aperti, in analisi o in attesa. Questo file contiene task che potrebbero non essere menzionati esplicitamente dall'utente ma sono già stati analizzati e schedati.
3. **Identificare task aperti** — Verificare se la richiesta dell'utente è già registrata nel backlog o se è nuova e va aggiunta.

> ⚠️ **NON saltare questo step anche se la sessione sembra una continuazione.** Il contesto viene troncato tra sessioni e senza questa lettura si perde traccia del lavoro pianificato.

---

## Regole di Processo

### Gestione Requisiti
- Ogni nuova FEAT, CR o FIX espressa dall'utente viene **prima registrata in `docs/backlog.md`**, poi analizzata, poi implementata. Mai il contrario.
- Prima di scrivere codice: documentare in `docs/requirements/req_XX.md` e aggiornare `docs/memory.md`.
- Le regole dettagliate del protocollo di aggiornamento sono in [`.agents/skills/memory-guardian/memory_guardian.md`](./.agents/skills/memory-guardian/memory_guardian.md).

### Aggiornamento Backlog
Antigravity aggiorna `docs/backlog.md` quando:
- L'utente segnala un nuovo requisito, CR o bug → aggiunge riga nella sezione **Coda CR e Fix**
- Un'analisi/design viene approvata → sposta in **Backlog Attivo** con stato 🔵/🟢
- Un task è completato e verificato → sposta in **Completati**

### Metodologia Analisi-Prima-Del-Codice
1. **Analisi** — leggere codice esistente, dati, regole di gioco
2. **Design** — proposta scritta in `implementation_plan.md`
3. **Approvazione** — attendere conferma esplicita dell'utente
4. **Implementazione** — codice
5. **Verifica** — build + test
6. **Update docs** — aggiornare spoke requisiti + backlog

**NON passare mai da 1 direttamente a 4.**
