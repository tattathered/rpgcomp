# MERP Companion — Piano di Implementazione

## Stato del Progetto

Il wizard di creazione personaggio è parzialmente implementato. Gli step completati coprono le fasi 1–6 del workflow originale (più il Riepilogo Creazione aggiunto come step intermedio).

---

## Step Completati ✅

| Step Wizard | Workflow | Descrizione |
|---|---|---|
| 1. Popolo e Cultura | 1) scelta popolo | Selezione razza con bonus caratteristiche da TB_3 |
| 2. Professione | 2) scelta professione | Selezione con requisiti caratteristica primaria/secondaria |
| 3. Caratteristiche | 3) generazione caratteristiche | Tiri 1d100, metodo classico, bonus razza automatici |
| 4. Adolescenza | 4.1) sviluppo adolescenza | Gradi fissi da TGP_5 per popolo |
| 5. Sviluppo Liv. 1 (Da Rivedere ⚠️) | 4.2) sviluppo lvl 1 | Distribuzione TB_6 (1:1) + spesa TGP_4 (costi 1/3) - *Nota: richiede riscrittura completa per l'apprendistato e i livelli* |
| 6. Background | 5.1) lingue + 5.2) background | Lingue addizionali + 7 categorie opzioni background |
| 7. Riepilogo Creazione | — | Scheda intermedia con tutte le sezioni aggiornate dal BG |

> [!WARNING]
> **Sviluppo Liv. 1 & Apprendistato (Livelli)**
> Lo Step 5 (Sviluppo Liv. 1) e l'intera gestione dello sviluppo in funzione dei livelli non sono ancora completati/corretti e dovranno essere completamente rivisti e riscritti in futuro.

---

## Task Aperti

### 🔴 Alta Priorità — Completamento del Workflow di Creazione

---

#### Task 2 — Step: Equipaggiamento Iniziale
**Workflow:** passo *7) scelta equipaggiamento*

Visualizza il catalogo dalla tabella `TS_4-equipaggiamento.json`, filtrabile per tipo (armi, armature, oggetti vari). Il budget disponibile è il totale MO accumulato dal Background (`compiledModifiers.gold`). L'utente seleziona gli oggetti, il sistema calcola il costo residuo e applica le penalità di ingombro dell'armatura scelta.

**Dati necessari:** `src/data/TS_4-equipaggiamento.json` (già presente)

**File da creare:**
- `src/components/CharacterWizard/steps/EquipmentStep.jsx`

---

#### Task 3 — Step: Calcolo Finale LVL 1
**Workflow:** passo *8) calcolo finale statistiche bonus e penalità LVL 1*

Schermata di riepilogo statistiche derivate per il personaggio di livello 1, calcolate in automatico:
- **BO (Bonus Offensivo):** bonus gradi arma + bonus caratt. + bonus prof. + bonus oggetto
- **DB (Difesa Base):** bonus AG + bonus scudo + penalità ingombro armatura
- **PF (Punti Ferita):** base CO + bonus graduali per livello
- **PM (Punti Magia):** derivati da professione e caratteristica (IN o IT)
- **TR (Tiri Resistenza):** valori finali per Essenza, Flusso, Veleno, Malattia
- **Penalità Ingombro:** dal tipo di armatura equipaggiata

**File da creare:**
- `src/components/CharacterWizard/steps/FinalStatsLevel1Step.jsx`

---

#### Task 7 — Step 9: Riepilogo Scheda Finale (Finalizzazione)
**Workflow:** passo *12) finalizzazione scheda personaggio*

La scheda completa e definitiva del personaggio, organizzata in sezioni stampabili:
- Anagrafica (nome, razza, professione, livello, reame)
- Caratteristiche & Bonus
- Statistiche di combattimento (BO, DB, PF, PM, TR)
- Abilità primarie (tabella completa)
- Abilità secondarie (da background)
- Lingue conosciute
- Liste incantesimi (con % apprendimento)
- Inventario & Equipaggiamento
- Note e storia del personaggio

**File da creare:**
- `src/components/CharacterWizard/steps/FinalSheetStep.jsx`

---

### 🟡 Media Priorità — Funzionalità Mancanti in Step Già Implementati

---

#### Task 8 — Liste Incantesimi (rimozione placeholder)
**Step coinvolti:** 5 (Sviluppo Liv. 1), 6 (Background), 7 (Riepilogo)

Attualmente tutti i riferimenti alle liste incantesimi mostrano un placeholder. Per implementare la selezione reale servono i dati organizzati per:
- **Reame** (Essenza / Flusso)
- **Professione** (liste native vs liste accessibili con limitazioni)
- **Livello massimo** degli incantesimi (es. Guerriero: max lv.3)

✅ FATTO TASK 8 at 22-05-2026 (implementato con tiro 1d100, logica credito %, gestione reami/professioni e visualizzazione completa degli incantesimi).

---

#### Task 9 — Abilità Secondarie nel Riepilogo
**Step coinvolto:** 7 (Riepilogo Creazione)

Le abilità secondarie acquisite tramite Background (`bgModifiers.secondarySkills`) non sono visualizzate nel riepilogo. Aggiungere una sezione dedicata dopo quella delle abilità primarie.

✅ FATTO TASK 9 at 21-05-2026

---

#### Task 10 — Percentuale di Imparare una Lista di Incantesimi
**Step coinvolto:** 5 (Sviluppo Liv. 1), 7 (Riepilogo)

Dal `TGP_5` viene estratta la "Percentuale di Probabilità di Imparare una Lista di Incantesimi" per ogni popolo. Questo valore va mostrato accanto alla selezione della lista e usato per calcolare la probabilità base.

✅ FATTO TASK 10 at 22-05-2026 (integrata nel flusso ad accumulo percentuale per Adolescenza e Sviluppo Liv. 1).

---

### 🟢 Bassa Priorità — Qualità, UX e Infrastruttura

---

#### Task 11 — Persistenza Locale (localStorage)
Salvare il `characterData` in `localStorage` ad ogni aggiornamento per evitare la perdita di lavoro in caso di refresh. Aggiungere un pulsante "Nuovo Personaggio" che resetta lo stato.

---

#### Task 12 — Esportazione / Stampa Scheda
Dalla scheda finale, generare:
- **Vista stampa** ottimizzata con CSS `@media print`
- **Export JSON** del `characterData` per salvare/caricare il personaggio
- **Export PDF** (valutare libreria, es. `jsPDF` o soluzione server-side)

---

#### Task 13 — Identità Git
Il committer è configurato automaticamente dal sistema. Impostare l'identità corretta:
```bash
git config --global user.name "Nome Cognome"
git config --global user.email "email@esempio.com"
```

---

### ❌ Posticipati / Non Inclusi in v1 (Progressione Livelli Superiori a 1)

> [!NOTE]
> Questi task relativi allo sviluppo per crescita multi-livello consecutiva (Sviluppo Livello N) sono stati posticipati e non saranno inclusi nella v1.
> 
> **Motivazione:**
> 1. Al momento la fase di sviluppo consente di iterare e far progredire il personaggio un livello alla volta.
> 2. Sommare assieme più passaggi di livello consecutivi (es. dal livello 1 al livello N in un unico blocco) comporterebbe una complessità elevata per la gestione e la spesa dei punti sviluppo (TGP_4) da parte dell'utente, richiedendo una profonda revisione delle meccaniche di sviluppo.

#### Task 1 — Step 8: Apprendimento (Sviluppo Livello N)
**Workflow:** passo *6) sviluppo abilità lvl N (apprendistato)*
L'utente specifica il livello target del PG (es. livello 3). Il sistema propone N round di distribuzione TGP_4 consecutivi (uno per ogni livello dal 2 al target). Le regole di spesa sono identiche allo Step 5 (1° grado = 1 PS, 2° grado = 3 PS totali, max +2 gradi per livello eccetto MM).

#### Task 4 — Step: Sviluppo LVL N (Esperienza)
**Workflow:** passo *9) sviluppo abilità per apprendistato/esperienza LVL N*
Analogo al Task 1 ma applicato dopo l'equipaggiamento. Permette ulteriori round di TGP_4 per portare il PG a livelli superiori. Da valutare se unificare con Task 1 o mantenere separato.

#### Task 5 — Step: Modifica Equipaggiamento LVL N
**Workflow:** passo *10) eventuali modifiche a equipaggiamento*
Aggiornamento dell'inventario per PG di livello superiore: sostituire armi/armature, aggiungere oggetti avanzati, aggiornare il budget MO con eventuali premi d'esperienza.

#### Task 6 — Step: Calcolo Finale LVL N
**Workflow:** passo *11) calcolo finale statistiche bonus e penalità LVL N*
Ricalcolo completo di tutte le statistiche derivate (come Task 3) applicato al livello finale del PG. Mostra il delta rispetto al LVL 1 per evidenziare la crescita del personaggio.

---

## Dipendenze e Ordine Consigliato (Revisionato)

Con il completamento del sistema delle liste incantesimi (Task 8 e 10), l'ordine delle dipendenze per completare il flusso di creazione v1 è il seguente:

```
Task 2 (Equipaggiamento Iniziale) ← indipendente, necessario per calcoli finali
Task 3 (Calcolo Finale LVL 1) ← dipende da: Task 2 (per BO, DB, ingombro armatura)
Task 7 (Scheda Finale) ← dipende da: Task 3
Task 11 (localStorage) ← indipendente, in qualsiasi momento
Task 12 (Stampa/Esportazione) ← dipende da: Task 7
```

## Prossimo Step Consigliato

Si consiglia di procedere con **Task 2 (Equipaggiamento Iniziale)** e **Task 3 (Calcolo Finale LVL 1)**. Questo permetterà di chiudere e testare il flusso completo di un personaggio di livello 1 con tutte le sue statistiche di gioco reali (BO, DB, PF, TR, ecc.).

