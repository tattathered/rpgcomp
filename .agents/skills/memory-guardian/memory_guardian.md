# Skill: Requirements Memory Guardian (Local Project Scope)

## Obiettivo
Prevenire il "context drift" mantenendo la documentazione tecnica, i requisiti e il backlog del progetto costantemente aggiornati. Questo file è **complementare** a `AGENTS.md` che gestisce l'onboarding di sessione.

## Struttura della Memoria (Modello Hub & Spoke + Backlog)

```
docs/
├── memory.md           ← Hub: tech stack, architettura, indice spoke, roadmap
├── backlog.md          ← Backlog unico: FEAT / CR / FIX aperti o in attesa
└── requirements/
    ├── req_01_*.md     ← Spoke per ogni macro-funzionalità completata/approvata
    ├── req_02_*.md
    └── ...
```

- **`docs/memory.md` (Hub):** Tech Stack, Regole Globali del Progetto, Indice degli Spoke e puntatore al backlog.
- **`docs/backlog.md` (Backlog):** Unico punto di verità per task aperti. Ogni task ha ID, tipo, priorità, stato.
- **`docs/requirements/` (Spokes):** File Markdown separati *per ogni macro-funzionalità*, sia completata che in analisi.

---

## Ciclo di Vita di un Requisito

```
Segnalazione utente
      ↓
  docs/backlog.md  (Coda CR/Fix o Backlog Attivo)
      ↓ approvazione analisi
  docs/requirements/req_XX.md  (stato: In Analisi)
      ↓ approvazione design
  docs/requirements/req_XX.md  (stato: In Corso)
      ↓ implementazione + verifica
  docs/requirements/req_XX.md  (stato: Approvato)
  docs/backlog.md              (spostato in Completati)
```

---

## Stati dei File Spoke (req_XX.md)

| Stato | Quando usarlo |
|-------|---------------|
| `[In Attesa / Backlog]` | Analizzato o discusso, ma implementazione non ancora iniziata |
| `[In Analisi]` | Design/specifica in corso, nessun codice scritto |
| `[In Corso]` | Implementazione avviata |
| `[Approvato]` | Completato e verificato dall'utente |
| `[Obsoleto]` | Requisito rimosso o superato — NON cancellare, spostare in fondo allo spoke |

---

## Protocollo di Aggiornamento Obbligatorio (Il Trigger)

Ogni volta che l'utente esprime un nuovo requisito, una modifica strutturale o un cambio di logica:

1. **Intercettazione e Blocco:** Interrompi la generazione di codice.
2. **Registrazione in Backlog:** Aggiungi la riga in `docs/backlog.md` → sezione "Coda CR e Fix".
3. **Richiesta di Approvazione (Checkpoint):** Proposta esplicita in chat:
   > *"Ho rilevato un cambio di requisito relativo a [Feature]. Aggiorno `docs/backlog.md` e creo/modifico `docs/requirements/[nome-file].md` prima di procedere con il codice?"*
4. **Scrittura della Memoria:** Con approvazione → crea/modifica lo spoke e aggiorna hub + backlog.
5. **Procedura di Codice:** Solo dopo l'allineamento documentazione.

---

## Standard di Scrittura del Requisito (Spoke .md)

```markdown
# [REQ-XXX] Titolo della Funzionalità

## Stato: [In Attesa / Backlog | In Analisi | In Corso | Approvato | Obsoleto]
**Ultimo aggiornamento:** YYYY-MM-DD da Antigravity

---

## Descrizione e Criteri di Accettazione (DoD)
- [ ] Criterio 1
- [ ] Criterio 2

## Impatti sul Codice / Architettura
- Quali file/cartelle vengono influenzati.
```