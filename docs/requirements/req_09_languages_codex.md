# [REQ-09] Codex Lingue e Gradi

## Stato: [Approvato]
**Ultimo aggiornamento:** 2026-07-01 da Antigravity

---

## Contesto e Motivazione

Attualmente la sezione "Gradi di Lingue" all'interno della scheda riepilogativa del personaggio mostra l'elenco delle lingue conosciute affiancate dal relativo Grado (es. *Grado 3*) e da un testo descrittivo che dettaglia le abilità di comprensione, lettura e scrittura per quel livello di sviluppo.
Questo blocco di testo appesantisce la visualizzazione della scheda e rende la UI caotica.
L'obiettivo è nascondere la descrizione testuale diretta e integrarla all'interno del sistema di **Codex & Tooltips**, consentendo all'utente di visualizzarla contestualmente al mouseover (sia per il grado di conoscenza che per la lingua stessa).

---

## Descrizione e Criteri di Accettazione (DoD)

### 1. Ristrutturazione Interfaccia Riquadro Lingue
- [x] **Modifica Label Riquadro:** Cambiare il titolo del box lingue da `"Gradi di Lingue"` a `"Gradi di conoscenza delle lingue"`.
- [x] **Semplificazione Elenco:** Rimuovere il blocco descrittivo statico visualizzato sotto il nome della lingua. La riga mostrerà soltanto:
  - Il Nome della Lingua a sinistra.
  - L'etichetta del Grado (es: `Grado 3`) a destra.
- [x] **Prevenzione A capo (Wrap):** Ridurre la dimensione del font dell'etichetta del grado in modo da garantire che non vada mai a capo o su due righe.

### 2. Integrazione Gradi di Conoscenza nel Codex
- [x] **Nuova Categoria Codex (`gradi_lingue`):**
  - Creare e mappare una nuova categoria nel dizionario del Codex denominata `gradi_lingue`.
  - Inserire le definizioni dei 5 gradi di conoscenza basandosi sul file `src/data/TGP-1-gradi_conoscenze_lingue.json`.
- [x] **Mappatura Sinonimi Gradi:** Mappare ciascun grado con sinonimi numerici e testuali (es: `"Grado 1"` deve corrispondere anche a `"1"` o `"grado1"`).
- [x] **Attivazione Tooltip Gradi:** Applicare il componente `<CodexLabel>` sull'etichetta `"Grado #"` per visualizzare al mouseover la descrizione dettagliata dell'abilità linguistica associata a quel grado.

### 3. Integrazione Descrizioni Lingue nel Codex
- [x] **Nuova Categoria Codex (`lingue`):**
  - Creare e mappare una nuova categoria nel dizionario del Codex denominata `lingue`.
  - Inserire le definizioni storiche e regolistiche di tutte le 21 lingue estratte dal file `data/Tabella_codex_descrizione_lingue.csv`.
- [x] **Mappatura Sinonimi Lingue:** Configurare sinonimi per le lingue con denominazioni multiple o varianti (es: `"Sindarin"` -> `"grigio elfico"`; `"Quenya"` -> `"alto elfico"`, ecc.).
- [x] **Attivazione Tooltip Lingue:** Applicare il componente `<CodexLabel>` sopra il nome di ciascuna lingua nell'elenco per mostrare al mouseover la descrizione culturale e l'elenco dei popoli che la parlano correntemente.

---

## Impatti sul Codice / Architettura

- **`src/data/codex_defaults.json` [MODIFY]:** Inserimento in blocco delle nuove voci per i gradi (`gradi_lingue`) e per le lingue (`lingue`).
- **`src/components/CharacterWizard/steps/CharacterSheetStep.jsx` [MODIFY]:** 
  - Modifica label titolo in `"Gradi di conoscenza delle lingue"`.
  - Rimozione del tag di descrizione statica.
  - Sostituzione dell'etichetta del grado con `<CodexLabel>` specificando `category="gradi_lingue"`.
  - Sostituzione del nome della lingua con `<CodexLabel>` specificando `category="lingue"`.
- **`src/components/CharacterWizard/steps/CreationSummaryStep.jsx` [MODIFY]:**
  - Modifica label titolo in `"Gradi di conoscenza delle lingue"`.
  - Rimozione del tag di descrizione statica.
  - Integrazione di `<CodexLabel>` con tooltip al mouseover sia sulle lingue che sui gradi.
