# [REQ-07] PNG e Mostri/Creature — Catalogo e Schede

## Stato: [Approvato]
**Ultimo aggiornamento:** 2026-07-01 da Antigravity

---

## Contesto e Motivazione

Il sistema attuale gestisce i PG tramite il Character Wizard e il roster del GM. I PNG (Personaggi Non Giocanti) generici e i Mostri/Creature hanno esigenze diverse.
In base alle specifiche chiarite, avremo due cataloghi distinti ("Catalogo PNG" e "Catalogo Creature/Mostri") a causa delle differenti strutture dei dati di partenza.
Il GM potrà duplicare e personalizzare questi template associandoli a una specifica Campagna, rendendoli utilizzabili come attori attivi (Attaccanti o Difensore) nei calcolatori di risoluzione azioni.

---

## Descrizione e Criteri di Accettazione (DoD)

### 1. Catalogo e Gestione PNG (NPC)
- [x] **Data Source Standard (`TS-3-personaggi_standard.csv` e `ST-3`):**
  - Caricamento dei dati di base per livello (1-10) e professione (Mago, Bardo, Animista, Ranger, Guerriero, Scout) delle abilità primarie/secondarie e dei parametri fisici.
  - **ST-3 TABELLA GENERALE DEI PERSONAGGI (Bonus Caratteristiche PNG):**
    - Contiene i riepiloghi dei vari bonus per ciascuna delle sei professioni. Si tratta dei bonus medi basati sul livello del personaggio. Questi riepiloghi sono utili per determinare le capacità dei personaggi non giocanti (PNG). Il Master potrebbe volerli utilizzare anche per i personaggi giocanti, qualora i giocatori preferissero saltare il processo di sviluppo delle abilità.
    - Mappatura sigle caratteristiche: `ST` = `FR` (Forza), `AG` = `AG` (Agilità), `CO` = `CO` (Costituzione), `IG` = `IN` (Intelligenza), `IT` = `IT` (Intuizione), `PR` = `PR` (Presenza).
    - *Guerriero*: ST/FR (+15), AG (+10), CO (+5), restanti (+0)
    - *Scout*: ST/FR (+10), AG (+15), CO (+5), restanti (+0)
    - *Ranger*: ST/FR (+10), AG (+5), CO (+10), IT (+5), restanti (+0)
    - *Bardo*: AG (+5), IG/IN (+10), IT (+5), PR (+10), restanti (+0)
    - *Mago*: AG (+5), IG/IN (+15), IT (+5), PR (+5), restanti (+0)
    - *Animista*: ST/FR (+5), AG (+5), IG/IN (+5), IT (+15), restanti (+0)
  - **PREMESSE (Culture e Ambientazione):**
    - I bonus delle caratteristiche indicati sopra si basano sulle seguenti premesse:
      - *Guerrieri, Scout, Ranger e Animisti* appartengono all'**Umanità Rurale**.
      - *Bardi e Magi* appartengono all'**Umanità Urbana**.
    - I bonus totali delle caratteristiche per ogni professione sono quelli indicati in ST-3.
  - **Opzioni di Background (Dati Integrativi PNG):**
    - Le opzioni di Background per **Guerrieri, Scout e Ranger** sono:
      1. È stata ottenuta un'arma primaria +10.
      2. È stata ottenuta l'abilità speciale "Riflessi Fulminei".
      3. Sono state ottenute 30 monete d'oro.
      4. Un'abilità secondaria è stata sviluppata fino a un rango di abilità pari a 5.
      5. Una caratteristica è stata aumentata di 2.
    - Le opzioni di Background per **Magi, Animisti e Bardi** sono:
      1. È stato ottenuto un moltiplicatore di incantesimi +2 (*spell adder*).
      2. È stata appresa una lista di incantesimi extra.
      3. Sono state ottenute 30 monete d'oro.
      4. Un'abilità secondaria è stata sviluppata fino a un rango di abilità pari a 5.
      5. Una caratteristica è stata aumentata di 2.
    - *Nota di Flessibilità:* Il processo di sviluppo è estremamente flessibile e, per ciascuna professione, i bonus indicano soltanto uno dei modi possibili in cui sviluppare le abilità.
- [x] **Risoluzione dei Bonus Abilità e Caratteristiche:**
  - I bonus in `TS-3-personaggi_standard.csv` rappresentano i **bonus totali risolti** delle abilità (compresi i modificatori di caratteristica di ST-3, professione e background).
  - **NOTA:** I bonus delle abilità non elencati nella tabella hanno un valore pari a zero (0).
  - Se non elencata, un'abilità primaria riceve come bonus il relativo Bonus Caratteristica di ST-3. Un'abilità secondaria non elencata riceve la penalità di `-25` + il relativo Bonus Caratteristica di ST-3.
- [x] **Flusso di Creazione PNG:**
  1. Il GM seleziona Professione e Livello desiderato.
  2. Il sistema mostra una scheda semplificata con i bonus statistici pre-caricati da `TS-3` e i bonus caratteristica da `ST-3`.
  3. Il GM può ritoccare qualsiasi bonus o caratteristica tramite pulsanti rapidi `+` e `-` posizionati a fianco del valore.
  4. Il GM assegna un nome al PNG, seleziona la Campagna attiva e lo salva nel database.
- [x] **Roster Campagna**:
  - I PNG salvati sono associati alla specifica campagna e non compaiono nel roster dei PG dei giocatori.

### 2. Catalogo e Gestione Animali e Mostri
- [x] **Data Source Standard (`TS-2-animali_TdM.csv` e `TSC-2-statistiche_degli_animali.csv`):**
  - Importazione delle 260 creature con i parametri di movimento, iniziativa, PF, CA/Armatura, BD, e i due attacchi predefiniti (`Attacco_uno` / `Attacco_due`).
  - Correzione automatica dei range di quantità Excel corrotti in date seriali (es. `46027` ➔ `1-5`).
- [x] **Flusso di Associazione a Campagna:**
  - Il GM può duplicare e salvare una creatura dal catalogo generale associandola a una Campagna per poterla evocare in combattimento.
  - [x] Consentita la personalizzazione del nome della creatura prima dell'associazione per distinguerla all'interno del roster attivo della campagna (es. "Ragno gigante minore (A)").

### 3. Risoluzione Azioni in Combattimento (Combat Calculator)
- [x] **Attori Liberi in Combattimento:**
  - Il `CombatCalculator` permette di selezionare qualsiasi combinazione di Attaccante e Difensore (PG vs PG, PG vs PNG, PNG vs PG, PNG vs PNG, Creatura vs PG, ecc.) attivi per la Campagna selezionata.
- [x] **Integrazione Tabelle `TA-5` (Zanne e Artigli) e `TA-6` (Immobilizz. e Sbilanciamento):**
  - Integrazione di [TA-5](file:///Users/yagni/Geek/antigravity/merpcomp/data/TA-5-zanne_e_artigli.csv) e [TA-6](file:///Users/yagni/Geek/antigravity/merpcomp/data/TA-6-immobilizzazione_sbilanciamento.csv) per la risoluzione degli attacchi delle creature.
  - Applicazione automatica dei moltiplicatori di danno PF ricavati da `TSC-2`:
    - Danno **Doppio** (`§`) per attacchi come *Morso*, *Calpestare*, *Caduta/Stritolamento*.
    - Danno **Dimezzato** (`$$`) per attacchi come *Pungiglioni*, *Piccoli Animali*.
  - **Capping della Taglia (Risultati Massimi)**:
    - Se l'attacco della creatura ha una dimensione specificata (Minuscolo, Piccolo, Medio, Grande, Enorme), il risultato finale del tiro (modificato) viene limitato al valore massimo previsto per quella taglia nella tabella (`TA-5` o `TA-6`).
- [x] **Risoluzione Critici**:
  - Critico Primario: mappatura automatica del tipo di critico dalla colonna `Critico Primario` di TSC-2 alle tabelle TC-1..TC-9 del CriticalResolver integrato.
  - Critico Secondario: se la severità del critico primario è > A (cioè B..E), viene generato un critico secondario di un grado inferiore. Se la nota TSC-2 contiene `*`, il secondario si applica solo se la taglia dell'attaccante è `grande` o `enorme`.
  - Pulsanti "Carica Primario" e "Carica Secondario" nel pannello risultato per caricare rapidamente il CriticalResolver integrato.
- [x] **Applica Danni:**
  - Il pulsante "Applica Danni" aggiorna direttamente gli HP del difensore (PG, PNG o Creatura) in Firestore.

### 4. Risoluzione delle Manovre (Movimento e Statiche)
- [x] **Manovre di Movimento (MM):**
  - **Per i PNG**: Risoluzione nel pannello MM applicando i relativi bonus abilità salvati sulla loro scheda (es. *Arrampicarsi*, *Nuotare*, *Cavalcare*).
  - **Per gli Animali/Mostri**: Risoluzione applicando il valore fisso di `VM_bonus_MM` del template (es. `+40`).
- [x] **Manovre Statiche (MS):**
  - **Per i PNG**: Risoluzione utilizzando i bonus abilità specifici salvati sulla scheda.
  - **Per gli Animali/Mostri**: Esclusi dal selettore attore (le creature non eseguono Manovre Statiche).

### 5. Backlog Evolutivo (CR aperte)
- [ ] **CR-001 — Attacchi Multipli per Round:** Animali e Mostri hanno spesso 2 attacchi nello stesso round (es. Morso + Artigli). Attualmente il CombatCalculator risolve un singolo attacco per volta. Una v2 dovrà gestire la sequenza automatica di attacchi multipli. Stato: ⏳ In Attesa.

---

## Impatti sul Codice / Architettura

- **Modifiche Parser (`csvToJson.js`):**
  - Aggiunta delle pipeline per compilare `TA-5`, `TA-6`, `TS-2-animali_TdM` (con decodifica date Excel in stringhe range quantità), `TS-3-personaggi_standard`, `TSC-1-statistiche_delle_armi`, `TSC-2-statistiche_degli_animali`, `TSC-3-statistiche_degli_incantesimi`.
- **Nuovi Componenti UI (Cataloghi Admin):**
  - [NpcCatalogTab.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/components/GM/NpcCatalogTab.jsx) — Creazione e configurazione schede PNG.
  - [CreatureCatalogTab.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/components/GM/CreatureCatalogTab.jsx) — Catalogo bestiario con ricerca, filtri per categoria e associazione a campagna.
  - [CampaignRosterManager.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/components/GM/CampaignRosterManager.jsx) — Gestione roster PNG e Creature della campagna attiva con gestione HP live.
- **Nuovo Servizio Firestore:**
  - [npcService.js](file:///Users/yagni/Geek/antigravity/merpcomp/src/services/npcService.js) — CRUD e sottoscrizioni Firestore per `campaign_npcs` e `campaign_creatures` sotto `gms/{gmId}/`.
- **Modifiche a Componenti Esistenti:**
  - [CombatCalculator.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/components/CombatCalculator.jsx) — Selettore attori (PG/PNG/Creature), lookup TA-5/TA-6 con `findRangeRow`, capping taglia, moltiplicatori §/$$, critico primario/secondario creature, Applica Danni.
  - [MovementManoeuvreResolver.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/components/MovementManoeuvreResolver.jsx) — Selettore creature con bonus fisso `VM_bonus_MM`.
  - [StaticManoeuvreResolver.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/components/StaticManoeuvreResolver.jsx) — Selettore solo PNG (creature escluse).
  - [App.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/App.jsx) — Tab "NPG & Mostri" con sotto-tab, passaggio props `campaignNpcs` e `campaignCreatures` ai resolver.
