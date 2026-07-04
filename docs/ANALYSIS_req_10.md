# Analisi — REQ-10: Gestione Inventario Dinamico

> **Scopo:** Raccolta delle informazioni esistenti, analisi del codice,
> e domande per definire il perimetro del requisito formale.
> Data analisi: 2026-07-04

---

## 1. Cosa esiste già nel codice

### 1.1 InventoryEditor.jsx
**Percorso:** `src/components/Shared/InventoryEditor.jsx`
**Stato:** ✅ COMPLETO e integrato

Componente modale che consente:
- **Tab "Inventario Corrente"** — lista oggetti con quantità in EQUIP e CARICO,
  pulsanti +/- , spostamento tra i due stati, rimozione, note per oggetto.
- **Tab "Aggiungi Oggetto"** — catalogo dal JSON `TS-4-equipaggiamento.json`,
  raggruppamento armi per gruppo, ricerca testuale, filtro per categoria.
- **Riepilogo carico** — peso totale, penalità (da TB-5), blocco se eccesso.
- **Gestione armatura attiva** (select) e **scudo** (checkbox).
- **Portafoglio** modificabile (in MB).
- **Salvataggio** su Firestore via `characterService.updateCharacterEquipment()`.
- **Modalità sola lettura** (`mode='player'`) per i Player.

### 1.2 Integrazione nella Scheda PG
**Percorso:** `src/components/CharacterWizard/steps/CharacterSheetStep.jsx`

- Pulsante **"Gestione Inventario"** che apre InventoryEditor in modalità GM.
- Alla chiusura, i dati aggiornati vengono passati a `setCharacterData()`.
- Inventario visualizzato in colonne separate **EQUIP** / **CARICO**,
  raggruppato per categoria (Armi, Armature, Abbigliamento, ecc.).

### 1.3 Servizi correlati
- `characterService.updateCharacterEquipment()` — salva su Firestore
  i campi `equipment`, `caricoKg`, `penalitaCarico`, `equippedArmor`,
  `equippedShield`, `portafoglioMB`.
- `skillHelpers.calculateCargoPenalty()` — calcola penalità e blocco
  a partire dal peso del PG e dal carico in kg.
- `moneyHelpers.formatMBToCoins()` / `formatCoinsToString()` —
  conversione MB → monete fisiche (MO, MA, MB, MR, MS).

### 1.4 Schema Firestore (nodes coinvolti)

```
gms/{gmId}/characters/{charId}
├── equipment: [
│     { nome, categoria, abbreviazione, costo_MB, "peso in kg",
│       note_base, qtyEquip, qtyCarico, note }
│   ]
├── caricoKg: number
├── penalitaCarico: number
├── equippedArmor: string | null
├── equippedShield: boolean
├── portafoglioMB: number
└── peso: number (del PG, usato per calcolo penalità)
```

---

## 2. Gap analysis: cosa potrebbe mancare

Dalla documentazione (analisi funzionale §6.1, roadmap §2)
e dal codice, emergono questi possibili ampliamenti:

| Funzionalità | Stato | Note |
|---|---|---|
| Modifica equip dalla scheda PG | ✅ Fatto | InventoryEditor già integrato |
| Ricalcolo ingombro | ✅ Fatto | Calcolato in tempo reale |
| Ricalcolo penalità MM | ✅ Fatto | Applicato alle abilità primarie |
| Ricalcolo penalità incantesimi | ✅ Fatto | Penalità carico visibile |
| B.O. armi impugnate | ✅ Fatto | `getSkillForWeapon()` nella scheda |
| B.D. da armature | ✅ Fatto | Armatura attiva e scudo |
| Gestione portafoglio | ✅ Fatto | Modificabile in MB |
| **Usura/deterioramento** | ❌ Assente | Non implementato |
| **Compravendita** | ❌ Assente | Catalogo mostra costo ma nessuna transazione |
| **Loot da creature** | ❌ Assente | Non integrato con creature catalog |
| **Drop/saccheggio** | ❌ Assente | Non implementato |
| **Drag & drop interfaccia** | ❌ Assente | Solo pulsanti +/- |
| **Ricerca nel catalogo** | ✅ Fatto | Con filtro categoria |
| **Note per oggetto** | ✅ Fatto | Campo testo per riga |
| **Modalità player sola lettura** | ✅ Fatto | `mode='player'` |

---

## 3. Domande per definire il perimetro del REQ-10

### 3.1 Perimetro minimo (solo documentare l'esistente)

Il requisito deve semplicemente **documentare formalmente** la funzionalità
esistente, con criteri di accettazione che certificate ciò che già
funziona? Oppure vuoi **estendere** la funzionalità?

**Risposta:**
obiettivo estendere funzionalità attuale
al momento la creaziuone del PG - e l'eventuale upgrade di livello - consentono di tornare alla fase di inventario e di modificarlo
è stata aggiunta la possibilità, nella scheda personaggio di selezionare una gestione inventario, non docummentata, che pare consentire di visualizzare attuale inventario, modificarlo e aggiungere oggetti tramite form, ma senza documentazione non è chiaro il funzionamento

lo scope era:
una volta creato un PG:
1) il GM deve poter modificare inventario - e già lo può fare selezionando PG nel roster, andando nella fase 7. equipaggiamento e poi salvando nuovamente
ma mi pare di aver capito che in quella fase non ci sia salvataggio su firestore
la nuova funzionalità sembra invece accessibile da 10. riepilogo scheda e ha comando salva su firestore
da chiarire quel che c'è e se effettivamente assolve a scope
2) il PG deve semplicemente visualizzare l'inventario e questo già mi pare fosse possibile perché la scheda PG vista PG mostra anche l'equipaggiameno


### 3.2 Usura e manutenzione

MERP/GirSA prevede che armi e armature si deteriorino con l'uso
(es. tiro di "Colpo Critico" può danneggiare l'arma, armature perdono
bonus dopo molti colpi). Vuoi includere un sistema di **usura**?

**Risposta:**
no, sistema usura/manutenzione non prevista

### 3.3 Compravendita

L'EquipmentStep iniziale ha un budget per l'acquisto. Nell'inventario
dinamico vuoi poter:
- **Acquistare** oggetti (scalando il portafoglio)?
- **Vendere** oggetti (accrescendo il portafoglio)?
- Un prezzo di vendita (es. 50% del costo base)?

**Risposta:**
così come oggi avviene nella fase 7. equipaggiamento, quando il GM modifica l'inventario deve poter indicare se i nuovi oggetti sono acquistati, quindi spende dal portafoglio PG o meno, e se questi rientrano tra equipaggiati - non generano ingombro - o trasportati - generano ingombro 

### 3.4 Loot e integrazione creature

Quando una creatura viene sconfitta in combattimento, vorresti poter
**trasferire** il suo equipaggiamento nell'inventario del PG?

**Risposta:**
no

### 3.5 Multi-personaggio

La modifica dell'inventario deve riflettersi solo sul PG attivo,
o ci sono operazioni "di gruppo" (es. dividere monete tra compagni)?

**Risposta:**
va bene fnzione singola per pg attivo

### 3.6 Modalità Player

Oggi il Player vede solo la scheda in sola lettura. Vorresti:
- Solo **lettura** inventario (come ora)?
- **Modifica** del taccuino note (già implementato)?
- **Modifica** limitata dell'inventario (es. spostare oggetti tra EQUIP e CARICO)?
- **Richiesta di acquisto** al GM (es. flag "approvazione necessaria")?

**Risposta:**
inventario è in sola lettura
note devono essere modificabili, cancellabili, aggiunte

---

## Istruzioni

Per rispondere, modifica direttamente questo file nel tuo editor
accanto alle domande, oppure dimmi in chat cosa aggiungere/cambiare.
Quando siamo allineati, produrrò il documento formale `req_10_dynamic_inventory.md`.
