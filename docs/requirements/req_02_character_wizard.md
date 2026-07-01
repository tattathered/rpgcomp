# [REQ-02] Character Wizard (Creazione Personaggio)

## Stato: [Approvato]
**Ultimo aggiornamento:** 2026-06-30 da Antigravity

---

## Descrizione e Criteri di Accettazione (DoD)

Il sistema guida il GM o il Giocatore nella creazione completa di un personaggio MERP attraverso un wizard interattivo con menu orizzontale in alto (griglia 5+5 su 2 righe, occupazione schermo 95%, padding orizzontale di 8px/0.5rem per pulsanti e tab).

### I 10 Step del Wizard:

- [x] **Step 1: RaceStep (Popolo e Cultura)**
  - [x] Scelta del popolo/cultura del PG.
  - [x] Applicazione automatica dei bonus alle caratteristiche e ai Tiri Resistenza (TR) estratti da `TB-3-modifiche_speciali_popolo.json`.
  - [x] Assegnazione del PG a un giocatore umano tramite una `<select>` a discesa dinamica che recupera in tempo reale i giocatori associati al GM da Firestore (`gms/{gmId}/players`), sostituendo il precedente campo di testo libero.

- [x] **Step 2: ProfessionStep (Professione)**
  - [x] Scelta della professione del PG con verifica dei requisiti di caratteristica (primari e secondari) da `Tabella-professioni_caratteristica_fondamentale.json`.
  - [x] Visualizzazione dei requisiti tramite badge uniformati (bordo grigio, testo grigio, sfondo trasparente).
  - [x] Rimozione di diciture ridondanti (es. "per livello del PG" rimosso dai box professione).

- [x] **Step 3: StatsStep (Generazione Caratteristiche)**
  - [x] Generazione delle caratteristiche del PG usando 3 metodi supportati: Classico (tiri casuali), Punti (allocazione da un pool) o Manuale (inserimento libero).
  - [x] Calcolo automatico dei bonus delle caratteristiche in base ai punteggi estratti da `TB-1-caratteristiche_bonus.json`.

- [x] **Step 4: AdolescenceStep (Sviluppo Adolescenza)**
  - [x] Assegnazione dei gradi di abilità fissi per popolo prescritti da `TGP-5-sviluppo_abilita_adolescenza.json`.
  - [x] **Box Lingue Conosciute:**
    - [x] Selezione lingue basata su `TGP-1-gradi_conoscenze_lingue.json`.
    - [x] Regolazione dei controlli di allocazione con pulsanti posizionati come `[-] numero [+]`.
    - [x] Label dei punti rimanenti impostata a "Da assegnare".
    - [x] Uniformato il font-size delle stringhe di stato ("+# Adolescenza", "Base (#)") a quello della lingua.
    - [x] Sfondo trasparente (eliminato il colore di background) sotto le scritte "Base (#)" e corretta spaziatura rispetto al nome della lingua.
  - [x] **Box Reame Magico:**
    - [x] Posizionamento del banner di avviso sul Reame Magico mancante sopra il box delle Caratteristiche.
    - [x] Rimosso il testo ridondante "Liste: ESSENZA o FLUSSO".
    - [x] Selezione attiva del reame impostata su colore rosso (invece di verde).
    - [x] Visibilità del limite del livello degli incantesimi garantita per Guerrieri e Scout anche quando la scelta del reame magico è nascosta.
  - [x] **Box Apprendimento Liste Incantesimi:**
    - [x] Calcoli di apprendimento con tiro di 1d100, crediti % e accumulo.
    - [x] Coerenza dimensionale dei pulsanti e del box con bordo in tutte le fasi di tiro/conferma/rimozione.
    - [x] Pulsante "Conferma" dopo un tiro di successo colorato con sfondo verde e testo bianco per massimizzare la leggibilità.

- [x] **Step 5: ApprenticeshipLevel1Step (Apprendistato Livello 1)**
  - [x] Distribuzione dei gradi di abilità per le professioni basata sui bonus di `TB-6-professioni_bonus_abilita-3.json`.
  - [x] Allocazione dei Punti Sviluppo (PS) ricavati da `TGP-4-sviluppo_abilita.json`.
  - [x] Regole di avanzamento abilità (1° grado = 1 PS, 2° grado = +2 PS, max 2 gradi per livello, tranne Manovre in Movimento).
  - [x] Regole di trasferimento pool PS (2:1 per categorie con base > 0, 4:1 per categorie con base = 0, 1:1 per Percezione).

- [x] **Step 6: BackgroundStep (Opzioni di Background)**
  - [x] Gestione delle opzioni di background basate su `TGP-2-opzioni_background.json` (strutturate in 7 categorie).
  - [x] Dropdown delle categorie ordinate sequenzialmente (es. "1. Miglioramento caratteristiche", "2. Miglioramento abilità", ecc.).
  - [x] Filtro per scelta singola: ciascuna categoria di background può essere scelta una sola volta (le categorie già selezionate spariscono dalla dropdown).
  - [x] **Esenzione Malus Abilità Secondarie:** Rimosso il malus di `-25` per tutte le abilità secondarie acquisite tramite opzioni di Background (sia per "+5 Gradi" che per "+15 Bonus Speciale").
  - [x] **Calcolo Denaro Extra:**
    - [x] Risolto il lookup d100 associato alla tipologia `"denaro: monete d'oro"`, garantendo l'assegnazione corretta delle MO nel portafoglio.
  - [x] **Calcolo Abilità Speciali:**
    - [x] *Riflessi fulminei (as9):* Applica `+5` BO a tutte le armi e a "Incantesimi diretti".
    - [x] *Abile nelle Manovre in Movimento (as7):* Applica `+10` speciale a tutte le 5 abilità di armatura, 3 abilità di movimento generiche e alle abilità secondarie idonee se presenti.
    - [x] *Carismatico (as10):* Applica `+10` speciale a "Leadership e influenza".
    - [x] *Resistente al dolore (as11):* Applica `+3` per ogni D10 di roll HP (al 1° livello e successivi).

- [x] **Step 7: EquipmentStep (Equipaggiamento Iniziale)**
  - [x] Visualizzazione del catalogo dell'equipaggiamento da `TS-4-equipaggiamento.json`.
  - [x] Gestione di quantità, costo, peso, acquisto e valuta.
  - [x] Calcolo del carico totale in kg e delle relative penalità di movimento basato su `TB-5-penalita_carico.json`.
  - [x] Barra di ricerca cross-categoria (ignora il filtro categoria attivo se viene inserito del testo) con pulsante rapido `×` per svuotare il campo.

- [x] **Step 8: LearningStep (Passaggio di Livello)**
  - [x] Gestione dello sviluppo del personaggio per i livelli successivi al primo.
  - [x] Consolidamento dei Punti Sviluppo (TGP-4) spesi e trasferimento pool per livelli successivi con le stesse tariffe.
  - [x] Ricalcolo dinamico delle abilità e dei bonus finali del personaggio ad ogni livello aggiuntivo.

- [x] **Step 9: CreationSummaryStep (Riepilogo)**
  - [x] Vista riepilogativa con statistiche finali del personaggio, modificatori TR, calcolo HP finali e bonus skill complessivi.
  - [x] Nomi e descrizioni esplicite ed estese per ciascuna opzione di background aggiunta.
  - [x] Corretto calcolo e visualizzazione del bonus speciale ai TR.

- [x] **Step 10: CharacterSheetStep (Scheda Personaggio)**
  - [x] Visualizzazione della scheda personaggio definitiva in sola lettura per i Player, o modificabile/interattiva per il GM.
  - [x] **Inventario Raggruppato:** Riorganizzazione dell'inventario (colonne EQUIP e CARICO) raggruppando gli oggetti per tipologia (Armi, Armature, Abbigliamento, ecc.) ordinati logicamente.
  - [x] **Evidenziazione Armi/Armature:** Sfondo verde chiaro (`bg-green-50`) sulle righe delle abilità primarie collegate ad armi e armature effettivamente possedute dal personaggio (quantità > 0).
  - [x] **Sigle Abilità:** Colonna a destra del "Bonus Totale" che mostra la sigla identificativa del tipo di abilità (MM = Manovra Movimento, MS = Manovra Statica, BO = Bonus Offensivo, AS = Abilità Speciale/Secondaria) per armi, abilità primarie e secondarie.

---

## Impatti sul Codice / Architettura

Le logiche e l'interfaccia del wizard risiedono nei seguenti moduli:
*   **Componenti UI:**
    *   [CharacterWizard.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/components/CharacterWizard/CharacterWizard.jsx) (struttura a griglia 5+5 e layout)
    *   Cartella [steps/](file:///Users/yagni/Geek/antigravity/merpcomp/src/components/CharacterWizard/steps/) contenente i singoli file dei passaggi (`RaceStep.jsx`, `ProfessionStep.jsx`, `StatsStep.jsx`, `AdolescenceStep.jsx`, `ApprenticeshipLevel1Step.jsx`, `BackgroundStep.jsx`, `EquipmentStep.jsx`, `LearningStep.jsx`, `CreationSummaryStep.jsx`, `CharacterSheetStep.jsx`).
*   **Helper e Utility di Calcolo:**
    *   [skillHelpers.js](file:///Users/yagni/Geek/antigravity/merpcomp/src/utils/skillHelpers.js) (calcolo gradi, bonus, penalità armatura/carico, HP).
    *   [magicHelpers.js](file:///Users/yagni/Geek/antigravity/merpcomp/src/utils/magicHelpers.js) (calcoli per reami magici, apprendimento liste incantesimi).
    *   [moneyHelpers.js](file:///Users/yagni/Geek/antigravity/merpcomp/src/utils/moneyHelpers.js) (conversioni monetarie).