// ─── Costanti per le categorie di liste incantesimi ─────────────────────────
// Nomi canonici delle categorie (valore persistito in `tipo_lista` su Firestore).
// Condivisi da SpellCatalogManager e SpellCatalogViewer.

export const CATEGORIA_ESSENZA = "Liste aperte di incantesimi dell'Essenza";
export const CATEGORIA_FLUSSO = 'Liste aperte di incantesimi del Flusso';
export const CATEGORIA_MAGHI = 'Liste di incantesimi dei Maghi';
export const CATEGORIA_BARDI = 'Liste di incantesimi dei Bardi';
export const CATEGORIA_RANGER = 'Liste di incantesimi dei Ranger';
export const CATEGORIA_ANIMISTI = 'Liste di incantesimi degli Animisti';

// Categoria predefinita per le nuove liste
export const DEFAULT_CATEGORIA = CATEGORIA_MAGHI;

// Ordine canonico delle categorie per la visualizzazione
export const CATEGORY_ORDER = [
  CATEGORIA_ESSENZA,
  CATEGORIA_MAGHI,
  CATEGORIA_BARDI,
  CATEGORIA_RANGER,
  CATEGORIA_FLUSSO,
  CATEGORIA_ANIMISTI,
];

// Opzioni per i menu a tendina (value = nome canonico, label = etichetta breve)
export const CATEGORY_OPTIONS = [
  { value: CATEGORIA_MAGHI, label: 'Maghi' },
  { value: CATEGORIA_BARDI, label: 'Bardi' },
  { value: CATEGORIA_ANIMISTI, label: 'Animisti' },
  { value: CATEGORIA_RANGER, label: 'Ranger' },
  { value: CATEGORIA_ESSENZA, label: 'Liste Aperte Essenza' },
  { value: CATEGORIA_FLUSSO, label: 'Liste Aperte Flusso' },
];

// Ordine canonico delle liste all'interno di ciascuna categoria
export const LIST_ORDER_BY_CATEGORY = {
  [CATEGORIA_ESSENZA]: [
    'SVILUPPO FISICO', 'MANIPOLAZIONE', 'ILLUSIONI',
    'FORMULE DI PASSAGGIO', "FORMULE D'INCANTESIMO", "FORMULE DELL'ESSENZA",
    'CONTROLLO SPIRITUALE', "PERCEZIONE DELL'ESSENZA",
  ],
  [CATEGORIA_MAGHI]: [
    'GEOMANZIA', 'CRIOMANZIA', 'FOTOMANZIA', 'PIROMANZIA',
    'PONTE ARCANO', 'IDROMANZIA', 'ADATTAMENTO', 'AEROMANZIA',
  ],
  [CATEGORIA_BARDI]: [
    'CANTI DEL POTERE', 'CONOSCENZA', 'SAPIENZA', 'CONTROLLO SONICO',
  ],
  [CATEGORIA_RANGER]: [
    'TOPOMANZIA', 'FORMULE DI MOVIMENTO', 'ASPETTI NATURALI', 'ARTI NATURALI',
  ],
  [CATEGORIA_FLUSSO]: [
    'INDAGINE', 'FORMULE SENSORIE', 'PACIFICAZIONE', 'ARTI DELLA GUARIGIONE',
    'PROTEZIONI', 'DIFESA MAGICA', 'MOTI NATURALI', 'ECOMANZIA',
  ],
  [CATEGORIA_ANIMISTI]: [
    'BOTANOMANZIA', 'FLUSSO DIRETTO', 'CONTROLLO ANIMALE',
    'FISIORIGENERAZIONE', 'EMORIGENERAZIONE', 'RIGENERAZIONE ORGANICA',
    'PURIFICAZIONI', 'CREAZIONI',
  ],
};
