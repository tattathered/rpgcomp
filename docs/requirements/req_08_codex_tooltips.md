# [REQ-08] Codex Tooltips Trasversali

## Stato: [Approvato]
**Ultimo aggiornamento:** 2026-07-01 da Antigravity

---

## Contesto e Motivazione

Nelle varie fasi dell'applicazione (creazione personaggio, calcolo combattimento, roster e schede PG/PNG), vengono visualizzati molti termini specifici del regolamento MERP/GirSA (nomi di abilità, caratteristiche fisiche, razze/popoli, categorie di armi ed armature, o creature).
L'obiettivo è implementare un sistema di **Codex & Tooltips** trasversale. Questo sistema consente di mostrare un'icona di aiuto (`?`) o una sottolineatura tratteggiata a fianco delle parole chiave abilitate dal GM. Al mouseover (o tocco su mobile), viene mostrato un tooltip con la descrizione o l'elenco degli elementi (es: le armi incluse in una determinata abilità).
Il GM deve poter configurare globalmente quali categorie di tooltip attivare nelle diverse sezioni dell'app tramite una console amministrativa.

---

## Descrizione e Criteri di Accettazione (DoD)

### 1. Sistema di Tooltip Trasversale (React Context & Componenti)
- [x] **Codex Provider (`CodexContext`):**
  - Gestione centralizzata del dizionario delle definizioni (Codex) e delle configurazioni di visibilità per pagina.
  - Caricamento sincrono delle impostazioni da Firestore (`gms/{gmId}/codex_config` e `gms/{gmId}/codex_items`) con fallback locale pre-caricato per l'uso offline/immediato.
- [x] **Componente `<CodexLabel>`:**
  - Unico componente da utilizzare per renderizzare parole chiave nella UI.
  - Riceve come prop: `term` (la parola chiave da cercare), `category` (es: `abilita`, `caratteristiche`, `popoli`, `professioni`, `oggetti`, `creature`) e `page` (la pagina corrente dell'app, es: `creazione_adolescenza`, `combattimento`, `roster`).
  - Controlla dinamicamente le preferenze del GM: se la visualizzazione per quella combinazione di pagina e categoria è attiva e la definizione esiste, renderizza il testo con sottolineatura tratteggiata con tooltip al mouseover; altrimenti, renderizza solo il testo semplice.
- [x] **Normalizzazione delle Chiavi:**
  - Il sistema deve normalizzare la ricerca dei termini per evitare problemi di maiuscole/minuscole o spazi (es: `"Cotta di Maglia"` deve corrispondere a `"cotta di maglia"`).

### 2. Ambito e Dizionario del Codex (Fase 1)
Il Codex deve comprendere e pre-caricare definizioni utili per i seguenti ambiti:
- [x] **Caratteristiche:** Forza (FR), Agilità (AG), Costituzione (CO), Intelligenza (IN), Intuizione (IT), Presenza (PR) con relativa descrizione regolistica.
- [x] **Abilità:** Spiegazione e modificatori delle abilità primarie e secondarie del regolamento.
- [x] **Popoli:** Tratti distintivi, bonus e caratteristiche di partenza per ciascun popolo (Nani, Elfi, Hobbit, ecc.).
- [x] **Professioni:** Focus e ruoli delle classi di MERP (Bardo, Mago, Guerriero, Scout, ecc.).
- [x] **Oggetti (Armi/Armature):** Categoria dell'arma, colonna di danno e tabelle di riferimento per le armature.
- [x] **Animali e Creature:** Dettagli descrittivi brevi o note speciali ricavate dal bestiario.

### 3. Console di Amministrazione Codex & Tooltips (GM Panel)
- [x] **Editor delle Definizioni:**
  - Interfaccia per aggiungere, modificare o eliminare voci del Codex divise per categoria.
  - Pulsante per caricare/ripristinare il set di definizioni predefinite del regolamento.
- [x] **Console di Configurazione Posizionamento (Attivazione):**
  - Albero riepilogativo delle pagine principali del sistema (Creazione PG, Scheda PG, Calcolatore Combattimento, Roster).
  - Switch/Toggle per attivare o disattivare la visualizzazione dei tooltip per singola categoria in quella specifica schermata.

---

## Impatti sul Codice / Architettura

- **`src/context/CodexContext.jsx` [NEW]:** Provider React per la gestione del Codex.
- **`src/components/Shared/CodexLabel.jsx` [NEW]:** Componente label universale con portale per il tooltip.
- **`src/components/GM/CodexAdminTab.jsx` [NEW]:** Pannello di amministrazione e configurazione visibilità.
- **Integrazione nelle UI:** Sostituzione mirata dei testi delle caratteristiche, abilità, popolazioni ecc. con `<CodexLabel>` in `AdolescenceStep.jsx`, `CombatCalculator.jsx`, `CampaignRosterManager.jsx`, ecc.
