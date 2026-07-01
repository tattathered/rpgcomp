# [REQ-04] Data Layer, Tabelle MERP e Cataloghi Custom

## Stato: [Approvato]
**Ultimo aggiornamento:** 2026-06-26 da Antigravity

---

## Descrizione e Criteri di Accettazione (DoD)

Questo modulo definisce la struttura e la gestione dei dati del sistema, dividendo le risorse tra file JSON statici contenenti le tabelle di riferimento del regolamento ufficiale MERP/GirSA e le raccolte dinamiche personalizzabili salvate in Firestore per ciascun Game Master (GM).

### 1. File JSON Statici (Tabelle Ufficiali MERP)
I dati di gioco statici sono posizionati all'interno di `src/data/` e vengono caricati per i calcoli e i controlli automatici:
- [x] **Tabelle Bonus e Caratteristiche:**
  - `TB-1-caratteristiche_bonus.json` (modificatori basati sul valore statistico).
  - `TB-2-abilita_caratteristiche.json` (associazione caratteristiche chiave per ciascuna abilità).
  - `TB-3-modifiche_speciali_popolo.json` (bonus alle statistiche e modificatori TR razziali).
  - `TB-4-bonus_grado_abilita.json` (bonus incrementale dato dai gradi acquisiti).
  - `TB-5-penalita_carico.json` (calcolo del carico e malus di movimento associati).
  - `TB-6-professioni_bonus_abilita-3.json` (bonus professionali pregressi).
- [x] **Tabelle Sviluppo:**
  - `TGP-1-gradi_conoscenze_lingue.json` (gradi delle lingue per popolo).
  - `TGP-2-opzioni_background.json` (opzioni e tabelle per i tiri/scelte di background).
  - `TGP-4-sviluppo_abilita.json` (costo in Punti Sviluppo per professione).
  - `TGP-5-sviluppo_abilita_adolescenza.json` (gradi fissi pre-assegnati per l'adolescenza).
- [x] **Tabelle Risoluzione Gioco:**
  - `TM-1-manovre_in_movimento.json` (griglia esiti delle manovre di movimento).
  - `TM-2-manovre_statiche.json` (griglia esiti delle manovre statiche).
  - `Tabelle-Attacco-TA-1_TA-2_TA-3_TA-4.json` (tabella degli attacchi con armi e dardi magici).
  - `Tabella-Colpi_Maldestri-TTM-1-TTM-2.json` e `Tabella-Colpi_Maldestri-TTM-3-TTM-4.json` (tabelle maldestri).
  - `TR-tiri_resistenza.json` (griglia per tiri resistenza contro veleni, malattie ed incantesimi).
  - `Tabella-elenco_incantesimi.json` (indice e dettagli dei singoli incantesimi).
  - `Tabella-liste_incantesimi.json` (liste per professione e apprendimento).
  - `TS-4-equipaggiamento.json` (catalogo di base delle armi e oggetti commerciali).
  - `Tabella-professioni_caratteristica_fondamentale.json` (statistiche chiave per professione).
- [x] **Tabelle Creature, NPC e Attacchi Animali (REQ-07):**
  - `TA-5-zanne_e_artigli.json` (tabella d'attacco Zanne e Artigli per creature, lookup per range).
  - `TA-6-immobilizzazione_sbilanciamento.json` (tabella d'attacco Immobilizzazione e Sbilanciamento per creature, lookup per range).
  - `TS-2-animali_TdM.json` (bestiario: ~260 creature con statistiche, attacchi, taglia, armatura).
  - `TS-3-personaggi_standard.json` (PNG standard: bonus abilità per professione e livello 1-10).
  - `TSC-1-statistiche_delle_armi.json` (statistiche dettagliate delle armi).
  - `TSC-2-statistiche_degli_animali.json` (dettagli attacchi creature: tabella, critico, moltiplicatore danno §/$$).
  - `TSC-3-statistiche_degli_incantesimi.json` (statistiche degli incantesimi).

### 2. Cataloghi Custom (GM Side in Firestore)
Il GM può personalizzare gli oggetti e gli incantesimi disponibili nel suo workspace, salvando le modifiche nella radice Firestore `gms/{gmId}/settings/`:
- [x] **Catalogo Equipaggiamento Custom:**
  - [x] Gestione CRUD (creazione, visualizzazione, modifica, eliminazione) di armi, armature ed oggetti personalizzati.
  - [x] Salvataggio e caricamento dinamico su Firestore nel documento `gms/{gmId}/settings/equipmentCatalog`.
  - [x] Interfaccia GM migliorata con pulsanti categoria orizzontali e ricerca cross-categoria.
- [x] **Catalogo Incantesimi Custom:**
  - [x] Gestione CRUD per incantesimi e liste personalizzate per il gioco.
  - [x] Salvataggio su Firestore nel documento `gms/{gmId}/settings/spellCatalog`.
  - [x] Visualizzazione con **ordinamento canonico** per categorie e liste nel visualizzatore pubblico `SpellCatalogViewer.jsx`.
  - [x] Visualizzazione dettagliata delle note delle liste degli incantesimi (es. descrizioni o eccezioni).

### 3. Pipeline di Conversione e Validazione (CSV ➔ JSON)
I dati regolistici e le tabelle di gioco ufficiali hanno come sorgente originaria i file CSV posizionati nella cartella `data/`. Tali file vengono allineati, ripuliti e convertiti in file JSON per l'applicazione web:
- [x] **Script di Conversione (`csvToJson.js`):** Legge i file CSV sorgente da `data/` ed esporta i JSON corrispondenti in `src/data/`. Gestisce le esclusioni dei file legacy non utilizzati, la denormalizzazione flat per la tabella dei gradi adolescenza (`TGP-5`), e la decodifica automatica delle date Excel corrotte nei campi quantità di `TS-2-animali_TdM`.
- [x] **Script di Verifica Allineamento (`verify_csv_json_alignment.cjs`):** Script di controllo automatico che confronta i dati del CSV sorgente con il JSON generato per assicurare che non vi siano disallineamenti di cifre o gradi abilità (es. per `TGP-5` e `TB-6`).
- [x] **File helper JSON dell'app:** File denormalizzati o ottimizzati per lo stato del wizard di creazione (`languages.json`, `race_languages.json`, `skills.json`, `professions.json`, `spell_lists.json`, `profession_level_bonuses.json`).

### 4. Esportazione Dati (CSV Export Manager)
- [x] **CsvExportManager:** Componente UI che permette di esportare nuovamente in formato CSV tutti i dati statici di gioco e del regolamento MERP, consentendo un flusso bidirezionale pulito e consultabile esternamente.

---

## Impatti sul Codice / Architettura

La gestione dei dati statici, dinamici e della pipeline è distribuita in:
*   **Directory Dati Statici e Sorgenti:**
    *   Cartella [data/](file:///Users/yagni/Geek/antigravity/merpcomp/data/) contenente le tabelle regolamento originali in formato CSV (Source of Truth).
    *   Cartella [src/data/](file:///Users/yagni/Geek/antigravity/merpcomp/src/data/) contenente i file JSON importati dal frontend.
*   **Script di Pipeline e Build:**
    *   [csvToJson.js](file:///Users/yagni/Geek/antigravity/merpcomp/scripts/csvToJson.js) (script di conversione PapaParse)
    *   [verify_csv_json_alignment.cjs](file:///Users/yagni/Geek/antigravity/merpcomp/scripts/verify_csv_json_alignment.cjs) (script di validazione consistenza)
*   **Componenti Gestionali e di Export UI:**
    *   [CsvExportManager.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/components/CsvExportManager.jsx) (esportatore CSV dati di gioco)
    *   [EquipmentCatalogManager.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/components/EquipmentCatalogManager.jsx) (gestione catalogo oggetti)
    *   [SpellCatalogManager.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/components/SpellCatalogManager.jsx) (gestione catalogo incantesimi)
    *   [SpellCatalogViewer.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/components/SpellCatalogViewer.jsx) (visualizzatore ordinato incantesimi)
*   **Servizi di Persistenza:**
    *   [spellCatalogService.js](file:///Users/yagni/Geek/antigravity/merpcomp/src/services/spellCatalogService.js) (persistenza catalogo incantesimi)
    *   [settingsService.js](file:///Users/yagni/Geek/antigravity/merpcomp/src/services/settingsService.js) (persistenza impostazioni ed equipaggiamento GM)
    *   [npcService.js](file:///Users/yagni/Geek/antigravity/merpcomp/src/services/npcService.js) (CRUD e sottoscrizioni Firestore per PNG e Creature di campagna)
