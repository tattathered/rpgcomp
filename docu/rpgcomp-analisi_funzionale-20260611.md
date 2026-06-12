# MERP Companion — Analisi Funzionale e Stato del Sistema
**Data:** 12 Giugno 2026  
**Versione:** v2.1.0 (UI & UX Refinement)


---

## 1. Attori del Sistema

| Attore | Ruolo |
|---|---|
| **GM (Custode)** | Gestisce il gioco: crea PG/PNG, gestisce roster, compagnie, campagne, risolve azioni, amministra il catalogo |
| **Giocatore (Player)** | Visualizza le schede dei PG a lui assegnati, in sola lettura |

Entrambi accedono con **email/password** tramite Firebase Authentication.  
Il primo login crea automaticamente un utente con ruolo `GM`.  
I Player vengono invitati dal GM tramite `PlayerManager`.

---

## 2. Architettura del Sistema

### 2.1 Tecnologie

- **Frontend:** React 18 + Vite
- **Backend:** Firebase (Firestore, Auth, Cloud Functions)
- **Dati statici:** JSON locali (`src/data/`) per tabelle di gioco MERP
- **Dati dinamici:** Firestore (`gms/{gmId}/...`) per PG, giocatori, compagnie, campagne, cataloghi personalizzati

### 2.2 Struttura del progetto

```
src/
├── components/
│   ├── Auth/                    # LoginPage
│   ├── CharacterWizard/         # Wizard creazione PG (10 step)
│   │   └── steps/               # RaceStep, ProfessionStep, StatsStep, ...
│   ├── GM/                      # PlayerManager, CompanyManager, CampaignManager
│   ├── Player/                  # PlayerDashboard, PlayerCharacterSheet
│   ├── CombatCalculator.jsx     # Risoluzione combattimenti
│   ├── MovementManoeuvreResolver.jsx
│   ├── StaticManoeuvreResolver.jsx
│   ├── FumbleResolver.jsx
│   ├── EquipmentCatalogManager.jsx
│   ├── SpellCatalogManager.jsx
│   ├── SpellCatalogViewer.jsx
│   └── CsvExportManager.jsx
├── services/                    # Firebase CRUD e sottoscrizioni
│   ├── characterService.js
│   ├── playerService.js
│   ├── companyService.js
│   ├── campaignService.js
│   ├── settingsService.js
│   └── spellCatalogService.js
├── data/                        # Tabelle di gioco MERP in JSON
│   ├── TB-*.json                # Tabelle bonus
│   ├── TGP-*.json               # Tabelle sviluppo abilità
│   ├── TM-*.json                # Tabelle manovre
│   ├── TS-*.json                # Tabelle equipaggiamento
│   ├── Tabelle-Attacco-*.json   # Tabelle d'attacco (TA-1..TA-4)
│   ├── Tabella-Colpi_Maldestri-*.json
│   ├── Tabella-elenco_incantesimi.json
│   ├── Tabella-liste_incantesimi.json
│   └── ...
├── utils/
│   ├── skillHelpers.js          # Calcolo bonus, gradi, penalità, HP
│   ├── magicHelpers.js          # Sistema incantesimi (reami, apprendimento)
│   └── moneyHelpers.js          # Conversione MB ↔ monete
├── contexts/
│   └── AuthContext.jsx           # Stato autenticazione globale
└── App.jsx                      # Routing GM/player, navigazione principale
```

### 2.3 Schema Firestore

```
gms/{gmId}/
├── characters/{charId}          # PG/PNG
│   ├── name, race, profession, stats, background, equipment
│   ├── hpSubiti, boSpesoParata, caricoKg, penalitaCarico
│   ├── equippedArmor, equippedShield
│   └── levelDevelopments[], ...
├── players/{playerId}           # Giocatori umani
│   ├── email, displayName, enabled, characterIds[]
├── companies/{companyId}        # Compagnie
│   ├── name, description, characterIds[]
├── campaigns/{campaignId}       # Campagne
│   ├── name, description, companyIds[], npcIds[]
└── settings/
    ├── equipmentCatalog          # Catalogo equipaggiamento personalizzato
    └── spellCatalog              # Catalogo incantesimi personalizzato
```

---

## 3. Funzionalità — Stato di Implementazione

### ✅ IMPLEMENTATE (34)

#### Autenticazione e Utenti
| Funzionalità | Componente | Note |
|---|---|---|
| Login email/password | `LoginPage.jsx` + `AuthContext.jsx` | Firebase Auth |
| Logout | `App.jsx` | |
| Riconoscimento ruolo GM/Player | `AuthContext.jsx` | Basato su `users/{uid}.role` |
| Creazione GM al primo login | `AuthContext.jsx` | Assegnazione automatica |
| Gestione giocatori (CRUD) | `PlayerManager.jsx` | Con Cloud Functions |
| Assegnazione PG ai giocatori | `PlayerManager.jsx` | |
| Abilitazione/disabilitazione giocatori | `PlayerManager.jsx` | |

#### Creazione Personaggio (Wizard 10 Step)
| Funzionalità | Step | Note |
|---|---|---|
| Scelta popolo/cultura | `RaceStep.jsx` | Bonus caratteristiche e TR da TB-3 |
| Scelta professione | `ProfessionStep.jsx` | Con requisiti primaria/secondaria |
| Generazione caratteristiche | `StatsStep.jsx` | 3 metodi: classico, punti, manuale |
| Calcolo bonus caratteristiche | `StatsStep.jsx` | Da TB-1 |
| Sviluppo adolescenza | `AdolescenceStep.jsx` | Gradi fissi per popolo (TGP-5) |
| Sviluppo Livello 1 | `ApprenticeshipLevel1Step.jsx` | Gradi TB-6 + Punti Sviluppo TGP-4 |
| Background e lingue | `BackgroundStep.jsx` | 7 categorie opzioni (TGP-2) |
| Liste incantesimi | `BackgroundStep.jsx` + `ApprenticeshipLevel1Step.jsx` | Tiro 1d100, credito %, accumulo |
| Equipaggiamento iniziale | `EquipmentStep.jsx` | Catalogo, quantità, carico, costo, acquisto |
| Calcolo penalità carico | `EquipmentStep.jsx` | Da TB-5 |
| Riepilogo creazione | `CreationSummaryStep.jsx` | Statistiche finali, bonus skill, HP, TR |
| Apprendimento (livelli) | `LearningStep.jsx` | Sviluppo livelli consecutivi |
| Scheda personaggio finale | `CharacterSheetStep.jsx` | Vista completa |

#### Gestione GM (Roster e Organizzazione)
| Funzionalità | Componente | Note |
|---|---|---|
| Roster PG/PNG | Vista roster in `App.jsx` | CRUD completo |
| Duplicazione PG | `App.jsx` | |
| Esportazione JSON | `App.jsx` | Download singolo PG |
| Importazione JSON | `App.jsx` | Upload con controllo duplicati |
| Gestione compagnie (CRUD) | `CompanyManager.jsx` | |
| Gestione campagne (CRUD) | `CampaignManager.jsx` | |
| Campagna attiva | `App.jsx` | Filtra roster visibile nelle azioni |
| Catalogo equipaggiamento GM | `EquipmentCatalogManager.jsx` | CRUD, Firestore persistenza |
| Catalogo incantesimi GM | `SpellCatalogManager.jsx` | CRUD, Firestore persistenza |
| Visualizzazione incantesimi | `SpellCatalogViewer.jsx` | Ordinamento canonico |

#### Risoluzione Azioni
| Funzionalità | Componente | Note |
|---|---|---|
| Manovre statiche | `StaticManoeuvreResolver.jsx` | |
| Manovre di movimento | `MovementManoeuvreResolver.jsx` | |
| Combattimento | `CombatCalculator.jsx` | Calcolatore attacchi completo |
| Colpi maldestri (fumble) | `FumbleResolver.jsx` | Tabelle TTM-1..TTM-4 |
| Azzeramento parate (Nuovo Round) | `CombatCalculator.jsx` + `characterService.js` | Batch Firestore |

#### Player Side
| Funzionalità | Componente | Note |
|---|---|---|
| Dashboard giocatore | `PlayerDashboard.jsx` | Workspace GM |
| Scheda PG in sola lettura | `PlayerCharacterSheet.jsx` | |

#### Esportazione
| Funzionalità | Componente | Note |
|---|---|---|
| Export CSV dati di gioco | `CsvExportManager.jsx` | |

### 🔄 DA RIVEDERE / MIGLIORARE (4)

| Funzionalità | Problema | Priorità |
|---|---|---|
| **ApprenticeshipLevel1Step** | Logica di distribuzione gradi TB-6 e Punti Sviluppo TGP-4 da riesaminare per correttezza regolistica | Alta |
| **LearningStep** | Sviluppo livelli successivi: validazione regole e test | Media |
| **CombatCalculator** | Integrazione colpi critici dopo il tiro (attualmente solo notifica del tipo) | Media |
| **SpellCatalogManager note** | Visualizzazione note liste incantesimi (rifatta recentemente, da testare) | Bassa |

### ❌ DA SVILUPPARE (3)

| Funzionalità | Note | Priorità |
|---|---|---|
| **Colpi Critici (TC-1..TC-9)** | Risolutore dedicato con tabelle complete. Placeholder attuale | Alta |
| **Incantesimi Base (risoluzione)** | Risoluzione incantesimi base con tabelle | Media |
| **Incantesimi Diretti (risoluzione)** | Risoluzione incantesimi diretti con tabelle | Media |

---

## 4. Modifiche del Refactoring v2.0.0

### 4.1 Nuovi Componenti
- **`SpellCatalogManager.jsx`** — Gestione CRUD catalogo incantesimi (come per equipaggiamento)
- **`SpellCatalogViewer.jsx`** — Vista pubblica incantesimi con ordinamento canonico per categorie
- **`spellCatalogService.js`** — Persistenza Firestore per catalogo incantesimi

### 4.2 Refactoring Data Layer
- File JSON rinominati da `TB_*` a `TB-*` per coerenza
- Rimossi duplicati e file legacy (`TB_3-popoli_bonus-v2.json`, `TB_6-professioni_bonus_abilita-2.json`, ecc.)
- Rimosso `web-app/` (progetto standalone assorbito)
- Rimosso `data/reconstructed_csv/` (dati ricostruiti non più necessari)
- Rimosso `CharacterGenerator.jsx` / `CharacterGenerator.css` (sostituito dal Wizard)

### 4.3 Miglioramenti UI/UX
- **Ordinamento canonico** per categorie e liste incantesimi (Manager e Viewer)
- **Pulsanti categoria orizzontali** in `EquipmentCatalogManager` (sostituito dropdown)
- **Barra di ricerca** aggiunta in `EquipmentStep` + pulsante "TUTTI"
- **Ricerca cross-categoria**: la ricerca testuale ignora il filtro categoria
- **Pulsante `×`** per cancellare la ricerca in entrambi gli input
- **Descrizione incantesimi** a capo (text-wrap) invece di troncata con tooltip
- **Icone classe rimosse** dai badge (solo testo colorato)

### 4.4 Correzioni
- `resetAllParries` implementato via `writeBatch` Firestore
- `boSpesoParata` sincronizzato correttamente tra CombatCalculator e roster
- Rimosso dropdown filtro categoria in favore di pulsanti in EquipmentCatalogManager
- Ricerca funziona su tutto il catalogo indipendentemente dal filtro categoria attivo

### 4.5 UI/UX Refinement & Bugfix (12 Giugno 2026)
- **RaceStep**:
  - Sostituito il campo di testo libero per "Nome giocatore" con una `<select>` a discesa dinamica che recupera in tempo reale i giocatori associati al GM da Firestore (`gms/{gmId}/players`).
- **ProfessionStep**:
  - Rimossa la dicitura ridondante "per livello del PG" nei box delle professioni.
  - Uniformati i badge dei requisiti caratteristica ("Primaria" / "Secondaria") con bordo grigio, testo grigio e sfondo trasparente.
- **AdolescenceStep**:
  - Spostato il banner di avviso sul Reame Magico mancante sopra il box delle Caratteristiche.
  - Rinominati e semplificati i titoli delle sezioni (es. "Apprendimento Lista Incantesimi").
  - **Box Lingue Conosciute**:
    - Cambiata la label "Rimasti" in "Da assegnare".
    - Riorganizzati i controlli di allocazione con i pulsanti posizionati come `[-] numero [+]`.
    - Allineato il font-size delle stringhe di stato ("+# Adolescenza", "Base (#)") a quello della lingua.
    - Eliminato il background colorato sotto le scritte "Base (#)" e garantita la corretta spaziatura rispetto al nome della lingua.
  - **Box Apprendimento Liste Incantesimi**:
    - Garantita la coerenza delle dimensioni dei pulsanti e del box con bordo in tutte le fasi di tiro/conferma/rimozione.
    - Pulsante "Conferma" dopo un tiro di successo corretto con sfondo verde e testo bianco per migliorarne la leggibilità.
    - Mantenuto visibile il limite del livello degli incantesimi per Guerrieri e Scout anche quando la scelta del Reame Magico è nascosta.
  - **Box Reame Magico**:
    - Rimosso il testo ridondante "Liste: ESSENZA o FLUSSO".
    - Cambiato il colore di selezione del reame attivo da verde a rosso.
- **BackgroundStep (Fase 6)**:
  - Rinominate e numerate le 7 categorie di opzioni di background in base dati (`TGP-2-opzioni_background.json`) e nel codice (es. "1. Miglioramento caratteristiche", "2. Miglioramento abilità", ecc.).
  - Ordinate le categorie nella dropdown in modo sequenziale.
  - Implementato il filtro per **scelta singola**: ciascuna categoria può essere selezionata solo una volta; quelle già scelte vengono nascoste dalla dropdown di scelta.
  - **Esenzione Malus Abilità Secondarie**: Rimosso il malus di `-25` per *tutte le abilità secondarie* acquisite tramite Background (sia con "+5 Gradi" che con "+15 Bonus Speciale").
  - **Calcolo Abilità Speciali**:
    - *Riflessi fulminei (as9)*: Applica `+5` BO a tutte le armi e a "Incantesimi diretti".
    - *Abile nelle Manovre in Movimento (as7)*: Applica `+10` speciale a tutte le 5 abilità di armatura, 3 abilità di movimento generiche, e alle abilità secondarie idonee se presenti.
    - *Carismatico (as10)*: Applica `+10` speciale a "Leadership e influenza".
    - *Resistente al dolore (as11)*: Applica `+3` per ogni D10 di roll HP (al 1° livello e successivi).
  - **Riepilogo e Scheda Personaggio**:
    - Uniformata la visualizzazione con nomi e descrizioni esplicite ed estese per ciascuna opzione di background aggiunta.
    - Corretto un bug nella visualizzazione del bonus speciale ai TR.

---

## 5. Dati di Gioco (Tabelle MERP)

### 5.1 Tabelle Bonus e Caratteristiche
| File | Contenuto |
|---|---|
| `TB-1-caratteristiche_bonus.json` | Bonus caratteristiche per punteggio |
| `TB-2-abilita_caratteristiche.json` | Associazione abilità ↔ caratteristiche |
| `TB-3-modifiche_speciali_popolo.json` | Bonus razziali a caratteristiche e TR |
| `TB-4-bonus_grado_abilita.json` | Bonus per grado abilità |
| `TB-5-penalita_carico.json` | Penalità carico trasportato |
| `TB-6-professioni_bonus_abilita-3.json` | Bonus professione per categoria |

### 5.2 Tabelle Sviluppo
| File | Contenuto |
|---|---|
| `TGP-1-gradi_conoscenze_lingue.json` | Gradi conoscenza lingue |
| `TGP-2-opzioni_background.json` | Opzioni background (7 categorie) |
| `TGP-4-sviluppo_abilita.json` | Punti sviluppo per professione |
| `TGP-5-sviluppo_abilita_adolescenza.json` | Gradi adolescenza per popolo |

### 5.3 Tabelle di Gioco
| File | Contenuto |
|---|---|
| `TM-1-manovre_in_movimento.json` | Tabella manovre movimento |
| `TM-2-manovre_statiche.json` | Tabella manovre statiche |
| `Tabelle-Attacco-TA-1_TA-2_TA-3_TA-4.json` | Tabelle attacco (armi) |
| `Tabella-Colpi_Maldestri-TTM-1-TTM-2.json` | Colpi maldestri armi/incantesimi |
| `Tabella-Colpi_Maldestri-TTM-3-TTM-4.json` | Colpi maldestri manovre |
| `TR-tiri_resistenza.json` | Tiri resistenza |
| `Tabella-elenco_incantesimi.json` | Tutti gli incantesimi |
| `Tabella-liste_incantesimi.json` | Liste incantesimi per professione |
| `TS-4-equipaggiamento.json` | Catalogo equipaggiamento |
| `Tabella-professioni_caratteristica_fondamentale.json` | Requisiti caratteristiche per professione |

---

## 6. Raccomandazioni per Prossimi Sviluppi

### 6.1 Priorità Alta
1. **Risoluzione colpi critici** — Implementare risolutore basato su `data/TC-*.csv` (già presenti nel progetto)
2. **Revisione ApprenticeshipLevel1Step** — Verifica distribuzione gradi e costi PS

### 6.2 Priorità Media
3. **LearningStep** — Validazione regole crescita multi-livello
4. **Integrazione colpi critici** nel flusso CombatCalculator
5. **Test automatici** — Vitest + Testing Library per flusso creazione PG

### 6.3 Priorità Bassa
6. **Incantesimi base/diretti** — Risolutori dedicati
7. **Export PDF** dalla scheda personaggio
8. **localStorage** backup automatico creazione PG
