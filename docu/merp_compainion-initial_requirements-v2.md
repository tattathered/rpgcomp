# **rpg companion \- initial requirements**

aiutami a realizzare una web app che sia un sistema di supporto a Game Master (GM) per il gioco di ruolo (GDR) MERP/GIRSA (MERP) middle earth role playing/gioco di ruolo del signore degli anelli di ICE/Stratelibri seconda edizione.

## **concept**

il concetto è dare al GM un sistema che abbia le seguenti caratteristiche e funzioni:

1. archivio dei dati dei Personaggi Giocatori (PG), si tratta di informazioni descrittive e dati statistici usate per la risoluzione di azioni e combattimenti relative ai personaggi dei giocatori umani  
2. archivio dei dati dei Personaggi Non Giocanti (PNG), si tratta di informazioni descrittive e dati statistici relative a personaggi, avversari e mostri gestiti dal GM durante le avventure  
3. schede caratteri PG/NPG per il tracciamento delle statistiche che possono variare (es. punti ferita) e degli equipaggiamenti accessibili sia al GM sia ai PG durante il gioco  
4. calcolatori per la risoluzione delle azioni di PG e PNG  
   1. manovre di movimento e manovre di movimento  
   2. manovre statiche  
   3. combattimento  
   4. incantesimi  
5. generatore delle statistiche di PG e PNG, sulla base di una serie di selezioni di elementi che definiscono il personaggio \- ad esempio popolo di appartenenza, professione, particolari del background, etc

## **ambientazione, lore, sistema di gioco**

il GDR MERP è ambientato nella Terra di Mezzo, cioè nell'universo high fantasy definito dall'opera di JRR Tolkien.

Il GDR basa la risoluzione delle azioni su una serie di statistiche che definiscono la complessità dell'azione che il PG vuole effettuare, le caratteristiche, abilità e capacità del PG rispetto a quella azione definendo una serie di BONUS/MALUS determinati dal contesto e il tiro di un dado da 100 (D100) \- con risultato da 1 a 100 quindi \- che determina la parte casuale della risoluzione dell'azione.

Per esempio se un PG volesse scalare un ripido crinale il GM determina quale sia la difficoltà dell'azione richiesta, e dunque un malus da applicare al risultato della risoluzione, il PG dichiara il suo bonus per quel tipo di azione basato sulle caratteristiche presenti sulla sua scheda personaggio, tira poi un D100.

Il risultato del tiro più i bonus meno i malus viene poi verificato su specifiche tabelle che indicano il risultato \- successo o fallimento ed eventuali conseguenze \- ed esito dell'azione stessa.

## **architettura**

Il punto chiave del sistema sarà la scheda PG/PNG.

Lato basi dati ci saranno: 

1. le schede PG e PNG con una serie di caratteristiche (attributi/dati)  
2. le tabelle di risoluzione di azioni  
3. le tabelle di risoluzione di combattimenti  
4. le tabelle dei bonus/malus per i diversi popoli dei PG/PNG  
5. le tabelle dei bonus/malus per le diverse professioni dei PG/PNG  
6. varie tabelle che determinano le statistiche di armi, armature, incantesimi, etc

Questo un primo elenco delle tabelle per la gestione/risoluzione:

1. tabelle di attacco con armi e con incantesimi (danno esito in termini di "punti ferita")  
2. tabelle dei bonus (in base a caratteristiche, abilità, per popolo e cultura, per livello abilità, per professione...)  
3. tabelle dei colpi critici (attacchi con esito della risoluzione particolarmente alto  
4. tabelle dei colpi maldestri (attacchi con esito della risoluzione particolarmente basso generano conseguenze negative)  
5. tabelle per la generazione del personaggio  
6. tabelle delle manovre in movimento e statiche  
7. tabelle dei tiri resistenza  
8. tabelle degli incantesimi  
9. altre tabelle strategiche e generali

Le varie tabelle non cambiano.

Le schede e le statistiche PG/PNG possono variare con l'evoluzione del gioco.

Dal punto di vista "applicativo", ci sono da fare solo somme/sottrazioni di bonus/malus e aggiunta di uno o più tiri di D100, quindi nulla di sofisticato.

## **analisi inziale**

Prima analizza con attenzione contesto e requisiti indicati.

Poi definisci una prima versione di: 

1. architettura del sistema con attori, ruoli, componenti e funzionalità  
2. piano di implementazione

Procediamo in modo iterativo e incrementale.

Partiamo dal cuore del sistema, la generazione e la gestione delle schede personaggio PG e PNG.

Creazione e formazione dei PG prevede le seguenti fasi:

1. generazione delle caratteristiche  
2. scelta della popolazione e della cultura  
3. sviluppo abilità nell'adolescenza  
4. scelta professione  
5. opzioni background  
6. sviluppo delle abilità con l'apprendimento  
7. equipaggiamento e penalità di carico ai movimenti  
8. somma dei bonus derivanti dai punti precedenti  
9. eventuali aggiornamenti delle caratteristiche e dei bonus per crescita del livello del PG

Fai un bel respiro e inizia.