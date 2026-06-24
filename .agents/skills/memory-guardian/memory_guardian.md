# Skill: Requirements Memory Guardian (Local Project Scope)

## Obiettivo
Il tuo compito principale è prevenire il "context drift" mantenendo la documentazione tecnica e i requisiti del progetto costantemente aggiornati in base alle conversazioni e alle modifiche introdotte.

## Struttura della Memoria (Modello Hub & Spoke)
La memoria è frammentata per evitare file troppo lunghi e saturazione del contesto:
- **`docs/memory.md` (Hub):** File centrale contenente Tech Stack, Regole Globali del Progetto e l'Indice (Mappa) dei Requisiti.
- **`docs/requirements/` (Spokes):** Cartella contenente file Markdown separati *per ogni macro-funzionalità* (es. `auth.md`, `payments.md`, `dashboard.md`).

## Protocollo di Aggiornamento Obbligatorio (Il Trigger)
Ogni volta che l'utente esprime un nuovo requisito, una modifica strutturale o un cambio di logica di business (es. *"voglio aggiungere...", "cambiamo il modo in cui...", "il cliente chiede di..."*):

1. **Intercettazione e Blocco:** Interrompi qualsiasi generazione di codice. Il tuo primo dovere è la documentazione.
2. **Richiesta di Approvazione (Checkpoint):** Formula una proposta esplicita in chat prima di procedere.
   * *Esempio di formato richiesto:* "Ho rilevato un cambio di requisito relativo a [Feature]. Desideri che aggiorni la memoria del progetto prima di procedere con il codice? Aggiornerò il file `docs/requirements/[nome-file].md`."
3. **Scrittura della Memoria:** Una volta ricevuto il "Sì", modifica o crea il file markdown pertinente nella cartella `docs/requirements/` e aggiorna l'indice in `docs/memory.md`.
4. **Procedura di Codice:** Solo dopo che la documentazione è allineata, puoi iniziare a scrivere, testare o modificare il codice dell'applicazione.

## Standard di Scrittura del Requisito (.md)
Ogni file in `docs/requirements/` deve seguire tassativamente questa struttura:
- `# [REQ-XXX] Titolo della Funzionalità`
- `## Stato: [In Corso / Approvato / Obsoleto]` (Usa 'Obsoleto' invece di cancellare vecchie logiche, mantieni lo storico spostandole in fondo).
- `## Ultimo Aggiornamento:` Data corrente e autore (Antigravity).
- `## Descrizione e Criteri di Accettazione (DoD):` Elenco puntato con checkbox `[ ]`.
- `## Impatti sul Codice / Architettura:` Quali file/cartelle vengono influenzati.