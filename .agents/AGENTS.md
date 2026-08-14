# MERP Companion — Regole Locali Agente (Project Scope)

## ⚡ Onboarding Obbligatorio — Da Eseguire SEMPRE All'Inizio di Ogni Sessione

Prima di rispondere a qualsiasi richiesta dell'utente, l'agente DEVE:

1. **Leggere [`docs/memory.md`](./docs/memory.md)** — Hub centrale con tech stack, architettura e mappa degli spoke dei requisiti.
2. **Leggere [`docs/backlog.md`](./docs/backlog.md)** — Lista unica di FEAT/CR/FIX aperti, in analisi o in attesa. Questo file contiene task che potrebbero non essere menzionati esplicitamente dall'utente ma sono già stati analizzati e schedati.
3. **Identificare task aperti** — Verificare se la richiesta dell'utente è già registrata nel backlog o se è nuova e va aggiunta.

> ⚠️ **NON saltare questo step anche se la sessione sembra una continuazione.** Il contesto viene troncato tra sessioni e senza questa lettura si perde traccia del lavoro pianificato.

---

## 🧭 Regole Base / Generali (Comportamento)

Queste regole valgono sempre, in ogni sessione e per qualsiasi richiesta.

### Niente Sì-Sì Complicente (Anti-Sycophancy)
- **Non adulare e non compiacere:** niente "perfetto!", "ottimo lavoro!", "ottima domanda!", "hai ragione!" a vuoto.
- **Di' la verità, anche se sgradita:** se una scelta è rischiosa, sbagliata o controproducente, dillo chiaramente, con il perché e una proposta alternativa.
- **Non confermare per cortesia:** un "sì" o un'approvazione devono essere motivati. Se non sei d'accordo, motiva il disaccordo.
- **Niente certezze finte:** se non sai, dici "non lo so"; se non puoi, dici "non posso"; se è ambiguo, chiedi chiarimenti.

### Comunicazione
- Risposte **dirette, concise e operative**: prima la sostanza, poi i dettagli.
- Niente riempitivi, ringraziamenti rituali o autocelebrazione.
- Quando correggi un errore, indica causa e soluzione, senza cerimonie.

---

## Regole di Processo

### Gestione Requisiti
- Ogni nuova FEAT, CR o FIX espressa dall'utente viene **prima registrata in `docs/backlog.md`**, poi analizzata, poi implementata. Mai il contrario.
- Prima di scrivere codice: documentare in `docs/requirements/req_XX.md` e aggiornare `docs/memory.md`.
- Le regole dettagliate del protocollo di aggiornamento sono in [`.agents/skills/memory-guardian/memory_guardian.md`](./.agents/skills/memory-guardian/memory_guardian.md).

### Aggiornamento Backlog
L'agente aggiorna `docs/backlog.md` quando:
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

---

## 🚀 Workflow Deploy (Git + Firebase)

> ⚠️ **Deploy Firebase = operazione utente:** `firebase deploy` usa il CLI autenticato dell'utente (login Firebase), quindi resta manuale. **`git push` invece può eseguirlo l'agente** (ambiente VS Code Copilot), ma **solo con approvazione esplicita dell'utente**.

### Cosa fa l'agente
1. `npm run build` — genera `dist/` aggiornato
2. `git add <file>` — staging dei file modificati
3. `git commit -m "..."` — commit con messaggio descrittivo
4. `git push origin main` — push su GitHub (solo dopo approvazione esplicita)
5. Verifica `firebase.json` — deve avere `"site": "merp-companion-yagni"` nella sezione hosting

### Cosa fa l'utente (deploy su Firebase)
```bash
# Deploy su Firebase Hosting (dist/ già buildato dall'agente)
firebase deploy --only hosting
```

### Note
- Il `dist/` viene generato dall'agente con `npm run build` **prima** del commit.
- Il `firebase deploy` legge il `dist/` già presente — non serve rebuildare.
- Firebase Auth e Firestore **non richiedono deploy** — le regole e le config sono gestite via Console Firebase o script separati.
- Progetto Firebase: `merp-companion-yagni` | Repo GitHub: `tattathered/rpgcomp`
- Il commit può essere eseguito autonomamente; il **push richiede conferma** dell'utente.

---

## 🧹 Fine Sessione — Checklist Obbligatoria (Consolidamento)

Prima di concludere la sessione, assicurarsi che lo stato sia salvato:

1. **`docs/memory.md`** — aggiornare avanzamento, bug fix, stato globale.
2. **`docs/backlog.md`** — spostare i task completati in "Completati", aggiornare gli stati.
3. **Spoke `docs/requirements/req_XX.md`** — aggiornare lo stato (→ Approvato) se rilevante.
4. **Commit** di codice e docs con messaggio descrittivo.
5. **Riepilogo finale all'utente** di cosa resta aperto (CR/FIX/backlog) per la prossima sessione.

> La prossima sessione riparte dall'onboarding: lettura di `docs/memory.md` + `docs/backlog.md`.

# Agent Execution Rules
- NEVER repeat phrases of hesitation or intent (e.g., "I am ready", "Let's do this").
- Once a plan is approved or a parameter is validated, execute the corresponding tool IMMEDIATELY.
- Minimize text explanations in the thought process. If a tool call is required, transition to the tool invoke state within a single turn.
- If you detect yourself repeating a phrase or an intent more than twice, trigger a fallback mechanism, state the blocker clearly, and stop execution until human intervention.
