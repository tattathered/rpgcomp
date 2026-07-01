# [REQ-01] Core System (Autenticazione, Ruoli e Gestione GM/Player)

## Stato: [Approvato]
**Ultimo aggiornamento:** 2026-06-24 da Antigravity

---

## Descrizione e Criteri di Accettazione (DoD)

Questo modulo gestisce le funzionalità fondamentali del sistema relative alla sicurezza, alla persistenza multi-utente, alla gestione dei flussi organizzativi per il Game Master (GM) e all'interfaccia riservata ai Giocatori (Player).

### 1. Autenticazione e Sicurezza
- [x] **Login multi-tenant:** Accesso sicuro con indirizzo email e password gestito tramite Firebase Authentication.
- [x] **Logout:** Disconnessione sicura e pulizia dello stato locale dell'applicazione.
- [x] **Gestione dei Ruoli:**
  - [x] Riconoscimento automatico e autorizzazione delle viste in base al ruolo dell'utente (`GM` o `Player`) salvato su Firestore (`users/{uid}.role`).
  - [x] Il primo utente che si registra o effettua il login riceve automaticamente il ruolo di `GM` tramite logica integrata nell'inizializzazione del contesto d'autenticazione.

### 2. Gestione Giocatori (GM Side)
- [x] **Player Manager:**
  - [x] Pannello per invitare nuovi giocatori reali nel workspace del GM.
  - [x] Abilitazione e disabilitazione dello stato di un giocatore (permette o blocca l'accesso).
  - [x] Assegnazione di uno o più Personaggi Giocanti (PG) dal roster del GM al giocatore specifico per la visualizzazione.

### 3. Gestione Campagna e Roster (GM Dashboard)
- [x] **Roster PG/PNG:**
  - [x] Elenco completo e centralizzato dei personaggi creati dal GM o importati.
  - [x] Operazioni CRUD (Creazione, Lettura, Modifica, Cancellazione) sui PG.
  - [x] **Duplicazione PG:** Possibilità di clonare un PG per creare rapidamente varianti o PNG simili.
  - [x] **Backup e Scambio:** Esportazione e importazione dei PG in formato JSON con validazione e prevenzione di caricamento duplicati.
- [x] **Compagnie:** Gestione (CRUD) di gruppi di personaggi (Compagnie) per semplificare l'organizzazione del party.
- [x] **Campagne:**
  - [x] Gestione (CRUD) di campagne che includono una o più compagnie ed elenchi di PNG dedicati.
  - [x] **Filtro Campagna Attiva:** Permette al GM di selezionare una campagna attiva per filtrare automaticamente il roster dei personaggi visualizzato nelle schermate di azione rapida e combattimento.

### 4. Interfaccia Player (Player Side)
- [x] **Player Dashboard:**
  - [x] Portale di atterraggio per gli utenti con ruolo `Player`.
  - [x] Mostra l'elenco dei personaggi a loro esplicitamente assegnati dal GM.
- [x] **Player Character Sheet:**
  - [x] Schermata di visualizzazione della scheda del personaggio assegnato.
  - [x] Presentazione in modalità di sola lettura per evitare modifiche accidentali da parte dei giocatori durante le sessioni.

---

## Impatti sul Codice / Architettura

Le funzionalità del core system sono distribuite nei seguenti moduli:
*   **Componenti UI:**
    *   [LoginPage.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/components/Auth/LoginPage.jsx) (interfaccia di login/registrazione)
    *   [PlayerManager.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/components/GM/PlayerManager.jsx) (gestione giocatori e abilitazioni)
    *   [CompanyManager.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/components/GM/CompanyManager.jsx) (gestione compagnie)
    *   [CampaignManager.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/components/GM/CampaignManager.jsx) (gestione campagne)
    *   [PlayerDashboard.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/components/Player/PlayerDashboard.jsx) (dashboard dei giocatori)
    *   [PlayerCharacterSheet.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/components/Player/PlayerCharacterSheet.jsx) (scheda PG sola lettura)
    *   [App.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/App.jsx) (routing principale, gestione roster, duplicazione e import/export)
*   **Servizi e Stato Globale:**
    *   [AuthContext.jsx](file:///Users/yagni/Geek/antigravity/merpcomp/src/contexts/AuthContext.jsx) (stato utente, persistenza della sessione, auto-GM al primo login)
    *   [playerService.js](file:///Users/yagni/Geek/antigravity/merpcomp/src/services/playerService.js) (integrazione Firestore/Cloud Functions per i giocatori)
    *   [characterService.js](file:///Users/yagni/Geek/antigravity/merpcomp/src/services/characterService.js) (persistenza PG e roster)
    *   [companyService.js](file:///Users/yagni/Geek/antigravity/merpcomp/src/services/companyService.js) (CRUD compagnie)
    *   [campaignService.js](file:///Users/yagni/Geek/antigravity/merpcomp/src/services/campaignService.js) (CRUD campagne)
