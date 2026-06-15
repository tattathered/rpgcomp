import React, { useState, useMemo, useCallback } from 'react';
import { 
  Book, Plus, Trash2, Copy, Edit2, Save, X, ChevronDown, ChevronRight,
  AlertTriangle, Check, Search, Filter, ArrowLeft, Sparkles, Swords,
  Heart, Eye, Shield, Zap, FileText
} from 'lucide-react';

// ─── Costanti ───────────────────────────────────────────────────────────────

const TIPO_OPTIONS = [
  { value: 'F', label: 'Forza' },
  { value: 'E', label: 'Elementale' },
  { value: 'A', label: 'Accessorio' },
  { value: 'I', label: 'Informazione' },
  { value: 'P', label: 'Passivo' },
  { value: 'U', label: 'Utilità' },
];

const TIPO_ICONS = { 'F': Swords, 'E': Zap, 'A': Heart, 'I': Eye, 'P': Shield, 'U': Sparkles };

const TIPO_COLORS = {
  'F': '#dc2626', 'E': '#2563eb', 'A': '#059669',
  'I': '#7c3aed', 'P': '#ca8a04', 'U': '#0891b2',
};

const CATEGORY_OPTIONS = [
  { value: 'Liste di incantesimi dei Maghi', label: 'Maghi' },
  { value: 'Liste di incantesimi dei Bardi', label: 'Bardi' },
  { value: 'Liste di incantesimi degli Animisti', label: 'Animisti' },
  { value: 'Liste di incantesimi dei Ranger', label: 'Ranger' },
  { value: 'Liste aperte di incantesimi dell\'Essenza', label: 'Liste Aperte Essenza' },
  { value: 'Liste aperte di incantesimi del Flusso', label: 'Liste Aperte Flusso' },
];

// Ordine canonico delle categorie per la visualizzazione
const CATEGORY_ORDER = [
  'Liste aperte di incantesimi dell\'Essenza',
  'Liste di incantesimi dei Maghi',
  'Liste di incantesimi dei Bardi',
  'Liste di incantesimi dei Ranger',
  'Liste aperte di incantesimi del Flusso',
  'Liste di incantesimi degli Animisti',
];

// Ordine canonico delle liste all\'interno di ciascuna categoria
const LIST_ORDER_BY_CATEGORY = {
  'Liste aperte di incantesimi dell\'Essenza': [
    'SVILUPPO FISICO', 'MANIPOLAZIONE', 'ILLUSIONI',
    'FORMULE DI PASSAGGIO', 'FORMULE D\'INCANTESIMO', 'FORMULE DELL\'ESSENZA',
    'CONTROLLO SPIRITUALE', 'PERCEZIONE DELL\'ESSENZA',
  ],
  'Liste di incantesimi dei Maghi': [
    'GEOMANZIA', 'CRIOMANZIA', 'FOTOMANZIA', 'PIROMANZIA',
    'PONTE ARCANO', 'IDROMANZIA', 'ADATTAMENTO', 'AEROMANZIA',
  ],
  'Liste di incantesimi dei Bardi': [
    'CANTI DEL POTERE', 'CONOSCENZA', 'SAPIENZA', 'CONTROLLO SONICO',
  ],
  'Liste di incantesimi dei Ranger': [
    'TOPOMANZIA', 'FORMULE DI MOVIMENTO', 'ASPETTI NATURALI', 'ARTI NATURALI',
  ],
  'Liste aperte di incantesimi del Flusso': [
    'INDAGINE', 'FORMULE SENSORIE', 'PACIFICAZIONE', 'ARTI DELLA GUARIGIONE',
    'PROTEZIONI', 'DIFESA MAGICA', 'MOTI NATURALI', 'ECOMANZIA',
  ],
  'Liste di incantesimi degli Animisti': [
    'BOTANOMANZIA', 'FLUSSO DIRETTO', 'CONTROLLO ANIMALE',
    'FISIORIGENERAZIONE', 'EMORIGENERAZIONE', 'RIGENERAZIONE ORGANICA',
    'PURIFICAZIONI', 'CREAZIONI',
  ],
};

function sortListsByCanonicalOrder(lists, tipoLista) {
  const order = LIST_ORDER_BY_CATEGORY[tipoLista] || [];
  const orderMap = new Map();
  order.forEach((name, idx) => orderMap.set(name, idx));
  return [...lists].sort((a, b) => {
    const ai = orderMap.get(a.nome_lista) ?? 999;
    const bi = orderMap.get(b.nome_lista) ?? 999;
    return ai - bi;
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function safeConfirm(message) {
  if (typeof window !== 'undefined' && (window.navigator.webdriver || window.location.search.includes('test'))) {
    return true;
  }
  return window.confirm(message);
}

// ─── Sotto-componenti ───────────────────────────────────────────────────────

function TipoBadge({ tipo, size = 'sm' }) {
  // Pulisce asterisco residuo (backward compat)
  const tipoPulito = (tipo || '').replace(/\*$/, '').trim();
  const info = TIPO_OPTIONS.find(t => t.value === tipoPulito);
  const color = TIPO_COLORS[tipoPulito] || '#6b7280';
  const fontSize = size === 'sm' ? '0.65rem' : '0.75rem';
  const padding = size === 'sm' ? '0.15rem 0.4rem' : '0.25rem 0.5rem';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize, fontWeight: 700, color, backgroundColor: `${color}15`, padding, borderRadius: '4px' }} title={info?.label || tipo}>
      {info?.label || tipo}
    </span>
  );
}

// ─── Form Lista ─────────────────────────────────────────────────────────────

function ListForm({ list, onSave, onCancel }) {
  const [form, setForm] = useState({
    nome_lista: list?.nome_lista || '',
    tipo_lista: list?.tipo_lista || 'Liste di incantesimi dei Maghi',
    note: list?.note || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nome_lista.trim()) {
      alert('Il nome della lista è obbligatorio.');
      return;
    }
    onSave({
      nome_lista: form.nome_lista.toUpperCase().trim(),
      tipo_lista: form.tipo_lista,
      note: form.note.trim() || null,
      incantesimi: list?.incantesimi || [],
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Categoria *</label>
        <select value={form.tipo_lista} onChange={e => setForm(prev => ({ ...prev, tipo_lista: e.target.value }))}
          style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.85rem', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: 'white' }}>
          {CATEGORY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label} ({opt.value})</option>)}
        </select>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Nome Lista *</label>
        <input type="text" value={form.nome_lista} onChange={e => setForm(prev => ({ ...prev, nome_lista: e.target.value }))}
          placeholder="Es: NECROMANZIA"
          style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.85rem', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: 'white' }} required />
        <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.2rem', display: 'block' }}>
          Il nome verrà convertito in maiuscolo automaticamente.
        </span>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Note (opzionale)</label>
        <textarea value={form.note} onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))} rows={3}
          style={{ width: '100%', padding: '0.5rem', fontSize: '0.82rem', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: 'white', fontFamily: 'inherit', resize: 'vertical' }} />
      </div>

      {!list && (
        <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '6px', marginBottom: '0.75rem', fontSize: '0.78rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Verranno creati 10 slot vuoti da compilare successivamente.</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} className="btn btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <X className="w-3.5 h-3.5" /> Annulla
        </button>
        <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Save className="w-3.5 h-3.5" /> {list ? 'Aggiorna Lista' : 'Crea Lista'}
        </button>
      </div>
    </form>
  );
}

const inlineInputStyle = {
  width: '100%',
  padding: '0.25rem 0.4rem',
  fontSize: '0.8rem',
  border: '1px solid #cbd5e1',
  borderRadius: '4px',
  backgroundColor: 'white',
  color: '#1e293b',
  outline: 'none',
};

// ─── SpellList Editor ───────────────────────────────────────────────────────

function SpellListEditor({ lista, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [editingId, setEditingId] = useState(null); // id of spell being edited
  const [editForm, setEditForm] = useState(null);   // spell object clone
  const [editingList, setEditingList] = useState(false);

  const spells = lista.incantesimi || [];
  const sortedSpells = [...spells].sort((a, b) => a.numero - b.numero);
  
  const activeCount = spells.filter(s => s.attivo !== false).length;
  const activeLevels = spells.filter(s => s.attivo !== false).map(s => s.numero);
  const hasDuplicateActiveLevels = activeLevels.length !== new Set(activeLevels).size;

  const handleStartEdit = (spell) => {
    setEditingId(spell.id);
    setEditForm({ ...spell });
  };

  const handleCancelEdit = () => {
    // If it was a newly created blank spell, remove it from list
    const originalSpell = spells.find(s => s.id === editingId);
    if (originalSpell && !originalSpell.nome) {
      onUpdate({
        ...lista,
        incantesimi: spells.filter(s => s.id !== editingId),
      });
    }
    setEditingId(null);
    setEditForm(null);
  };

  const handleSaveInline = () => {
    if (!editForm.nome.trim()) {
      alert("Il nome dell'incantesimo è obbligatorio.");
      return;
    }
    if (!safeConfirm("Confermi il salvataggio delle modifiche per questo incantesimo?")) {
      return;
    }

    const updatedSpells = spells.map(s => s.id === editingId ? { ...editForm, numero: parseInt(editForm.numero, 10) } : s);

    onUpdate({
      ...lista,
      incantesimi: updatedSpells.sort((a, b) => a.numero - b.numero),
    });

    setEditingId(null);
    setEditForm(null);
  };

  const handleDeleteSpell = useCallback((id) => {
    const spellToDelete = spells.find(s => s.id === id);
    if (!spellToDelete) return;

    const totalSpellsCount = spells.length;
    const activeSpells = spells.filter(s => s.attivo !== false);
    const activeCount = activeSpells.length;

    // Rule 1: The list must have at least 11 spells in total
    if (totalSpellsCount < 11) {
      alert("Non è possibile eliminare l'incantesimo: la lista deve contenere almeno 11 incantesimi in totale (situazione base di 10 attivi + almeno 1 inattivo da eliminare).");
      return;
    }

    // Rule 2: The spell to delete must be INACTIVE
    if (spellToDelete.attivo) {
      alert("Non è possibile eliminare un incantesimo attivo. Disattivalo prima di procedere.");
      return;
    }

    // Rule 3: The list must have exactly 10 active spells
    if (activeCount !== 10) {
      alert(`Non è possibile eliminare l'incantesimo: la lista deve avere esattamente 10 incantesimi attivi (attualmente ne ha ${activeCount}).`);
      return;
    }

    if (!safeConfirm(`Eliminare l'incantesimo "${spellToDelete.nome || `Liv. ${spellToDelete.numero}`}"?`)) return;

    onUpdate({
      ...lista,
      incantesimi: spells.filter(s => s.id !== id),
    });
  }, [lista, spells, onUpdate]);

  const handleDuplicateSpell = useCallback((spell) => {
    const usedNumbers = new Set(spells.map(s => s.numero));
    let newNum = spell.numero + 1;
    while (usedNumbers.has(newNum)) newNum++;
    
    const newSpell = { 
      ...spell, 
      id: generateId(), 
      numero: newNum > 10 ? 10 : newNum, 
      nome: `${spell.nome} (Copia)`,
      attivo: false // Duplicated starts inactive
    };
    onUpdate({
      ...lista,
      incantesimi: [...spells, newSpell].sort((a, b) => a.numero - b.numero),
    });
  }, [lista, spells, onUpdate]);

  const handleSaveList = useCallback((listData) => {
    onUpdate({
      ...lista,
      nome_lista: listData.nome_lista,
      tipo_lista: listData.tipo_lista,
      note: listData.note,
    });
    setEditingList(false);
  }, [lista, onUpdate]);

  const fillEmptySlots = useCallback(() => {
    const existingNums = new Set(spells.map(s => s.numero));
    const newSpells = [...spells];
    for (let i = 1; i <= 10; i++) {
      if (!existingNums.has(i)) {
        newSpells.push({ 
          id: generateId(),
          numero: i, 
          nome: '', 
          tipologia: 'F', 
          istantaneo: false, 
          descrizione: '', 
          efficacia: '', 
          durata: '', 
          raggio_azione: '',
          attivo: true 
        });
      }
    }
    newSpells.sort((a, b) => a.numero - b.numero);
    onUpdate({ ...lista, incantesimi: newSpells });
  }, [lista, spells, onUpdate]);

  const handleNewSpell = () => {
    const tempId = generateId();
    const nextNum = spells.length > 0 ? Math.max(...spells.map(s => s.numero)) + 1 : 1;
    const newSpell = {
      id: tempId,
      numero: nextNum > 10 ? 10 : nextNum,
      nome: '',
      tipologia: 'F',
      istantaneo: false,
      efficacia: '',
      durata: '',
      raggio_azione: '',
      descrizione: '',
      attivo: false,
    };

    onUpdate({
      ...lista,
      incantesimi: [...spells, newSpell],
    });
    setEditingId(tempId);
    setEditForm({ ...newSpell });
  };

  const countEmpty = 10 - spells.length;

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Header lista */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1rem', backgroundColor: expanded ? '#f1f5f9' : '#fafafa', borderBottom: expanded ? '1px solid #e2e8f0' : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, flexWrap: 'wrap' }}>
          <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.15rem', color: '#94a3b8' }}>
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>{lista.nome_lista}</span>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>
            ({spells.length} incantesimi, {activeCount} attivi)
          </span>
          {(activeCount !== 10 || hasDuplicateActiveLevels) && (
            <span style={{ fontSize: '0.65rem', color: '#dc2626', fontWeight: 700, backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '0.15rem 0.45rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
              <AlertTriangle className="w-3.5 h-3.5" /> Configurazione non valida
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button onClick={() => setEditingList(true)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderColor: '#d1d5db', color: '#6b7280' }} title="Modifica lista">
            <Edit2 className="w-3 h-3" />
          </button>
          <button onClick={() => onDelete(lista.nome_lista)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderColor: '#fca5a5', color: '#dc2626' }} title="Elimina lista">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: '0.75rem' }}>
          {/* Nota lista (se presente) */}
          {lista.note && (
            <div style={{ marginBottom: '0.6rem', fontSize: '0.78rem', color: '#475569', lineHeight: 1.5, wordBreak: 'break-word' }}>
              {lista.note}
            </div>
          )}
          
          {/* Warnings */}
          {activeCount !== 10 && (
            <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', marginBottom: '0.75rem', fontSize: '0.78rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Questa lista ha <strong>{activeCount}</strong> incantesimi attivi. Ciascuna lista deve avere sempre <strong>esattamente 10</strong> incantesimi attivi.</span>
            </div>
          )}
          {activeCount === 10 && hasDuplicateActiveLevels && (
            <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', marginBottom: '0.75rem', fontSize: '0.78rem', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Attenzione: ci sono duplicati attivi per lo stesso livello. Ciascun livello (1-10) deve avere esattamente un incantesimo attivo.</span>
            </div>
          )}

          {/* Editing list form */}
          {editingList && (
            <div style={{ marginBottom: '0.75rem' }}>
              <ListForm list={lista} onSave={handleSaveList} onCancel={() => setEditingList(false)} />
            </div>
          )}

          {/* Spells table */}
          {sortedSpells.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0.5rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '0.35rem 0.4rem', textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', width: '55px' }}>#</th>
                    <th style={{ padding: '0.35rem 0.4rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Incantesimo</th>
                    <th style={{ padding: '0.35rem 0.4rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', width: '120px' }}>Classe</th>
                    <th style={{ padding: '0.35rem 0.4rem', textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', width: '50px' }} title="Istantaneo">IST.</th>
                    <th style={{ padding: '0.35rem 0.4rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', width: '100px' }}>Efficacia</th>
                    <th style={{ padding: '0.35rem 0.4rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', width: '90px' }}>Durata</th>
                    <th style={{ padding: '0.35rem 0.4rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', width: '90px' }}>Raggio</th>
                    <th style={{ padding: '0.35rem 0.4rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Descrizione</th>
                    <th style={{ padding: '0.35rem 0.4rem', textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', width: '70px' }}>Attivo</th>
                    <th style={{ padding: '0.35rem 0.4rem', textAlign: 'right', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', width: '100px' }}>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSpells.map((spell) => {
                    const isEditing = spell.id === editingId;
                    
                    if (isEditing) {
                      return (
                        <tr key={spell.id} style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                          <td style={{ padding: '0.3rem 0.2rem', textAlign: 'center' }}>
                            <select
                              value={editForm.numero}
                              onChange={e => setEditForm(prev => ({ ...prev, numero: parseInt(e.target.value, 10) }))}
                              style={{ ...inlineInputStyle, textAlign: 'center' }}
                            >
                              {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                            </select>
                          </td>
                          <td style={{ padding: '0.3rem 0.2rem' }}>
                            <input
                              type="text"
                              value={editForm.nome}
                              onChange={e => setEditForm(prev => ({ ...prev, nome: e.target.value }))}
                              style={inlineInputStyle}
                              required
                            />
                          </td>
                          <td style={{ padding: '0.3rem 0.2rem' }}>
                            <select
                              value={editForm.tipologia}
                              onChange={e => setEditForm(prev => ({ ...prev, tipologia: e.target.value }))}
                              style={inlineInputStyle}
                            >
                              {TIPO_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label} ({opt.value})</option>)}
                            </select>
                          </td>
                          <td style={{ padding: '0.3rem 0.2rem', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={editForm.istantaneo}
                              onChange={e => setEditForm(prev => ({ ...prev, istantaneo: e.target.checked }))}
                              style={{ cursor: 'pointer' }}
                            />
                          </td>
                          <td style={{ padding: '0.3rem 0.2rem' }}>
                            <input
                              type="text"
                              value={editForm.efficacia}
                              onChange={e => setEditForm(prev => ({ ...prev, efficacia: e.target.value }))}
                              style={inlineInputStyle}
                              placeholder="es: +10"
                            />
                          </td>
                          <td style={{ padding: '0.3rem 0.2rem' }}>
                            <input
                              type="text"
                              value={editForm.durata}
                              onChange={e => setEditForm(prev => ({ ...prev, durata: e.target.value }))}
                              style={inlineInputStyle}
                              placeholder="es: 1 rnd"
                            />
                          </td>
                          <td style={{ padding: '0.3rem 0.2rem' }}>
                            <input
                              type="text"
                              value={editForm.raggio_azione}
                              onChange={e => setEditForm(prev => ({ ...prev, raggio_azione: e.target.value }))}
                              style={inlineInputStyle}
                              placeholder="es: 30m"
                            />
                          </td>
                          <td style={{ padding: '0.3rem 0.2rem' }}>
                            <input
                              type="text"
                              value={editForm.descrizione}
                              onChange={e => setEditForm(prev => ({ ...prev, descrizione: e.target.value }))}
                              style={inlineInputStyle}
                            />
                          </td>
                          <td style={{ padding: '0.3rem 0.2rem', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={editForm.attivo !== false}
                              onChange={e => setEditForm(prev => ({ ...prev, attivo: e.target.checked }))}
                              style={{ cursor: 'pointer' }}
                            />
                          </td>
                          <td style={{ padding: '0.3rem 0.2rem', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                              <button onClick={handleSaveInline} style={{ background: '#22c55e', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '0.25rem', color: 'white', display: 'inline-flex' }} title="Salva">
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={handleCancelEdit} style={{ background: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '0.25rem', color: 'white', display: 'inline-flex' }} title="Annulla">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={spell.id || spell.numero} style={{ borderBottom: '1px solid #f1f5f9', opacity: spell.attivo !== false ? 1 : 0.5 }}>
                        <td style={{ padding: '0.3rem 0.4rem', textAlign: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#475569' }}>{spell.numero}</td>
                        <td style={{ padding: '0.3rem 0.4rem', fontSize: '0.82rem', color: '#1e293b', fontWeight: spell.nome ? 500 : 400, fontStyle: spell.nome ? 'normal' : 'italic', opacity: spell.nome ? 1 : 0.5 }}>
                          {spell.nome || '— vuoto —'}
                        </td>
                        <td style={{ padding: '0.3rem 0.4rem' }}>
                          <TipoBadge tipo={spell.tipologia} />
                        </td>
                        <td style={{ padding: '0.3rem 0.4rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                          {spell.istantaneo ? 'Sì' : 'No'}
                        </td>
                        <td style={{ padding: '0.3rem 0.4rem', fontSize: '0.75rem', color: '#64748b', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={spell.efficacia}>
                          {spell.efficacia || '—'}
                        </td>
                        <td style={{ padding: '0.3rem 0.4rem', fontSize: '0.75rem', color: '#64748b', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={spell.durata}>
                          {spell.durata || '—'}
                        </td>
                        <td style={{ padding: '0.3rem 0.4rem', fontSize: '0.75rem', color: '#64748b', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={spell.raggio_azione}>
                          {spell.raggio_azione || '—'}
                        </td>
                        <td style={{ padding: '0.3rem 0.4rem', fontSize: '0.75rem', color: '#64748b', wordBreak: 'break-word', lineHeight: '1.4' }}>
                          {spell.descrizione || '—'}
                        </td>
                        <td style={{ padding: '0.3rem 0.4rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: spell.attivo !== false ? '#16a34a' : '#dc2626' }}>
                          {spell.attivo !== false ? 'Sì' : 'No'}
                        </td>
                        <td style={{ padding: '0.3rem 0.4rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => handleStartEdit(spell)} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer', padding: '0.2rem', color: '#64748b', display: 'inline-flex' }} title="Modifica">
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button onClick={() => handleDuplicateSpell(spell)} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer', padding: '0.2rem', color: '#64748b', display: 'inline-flex' }} title="Duplica">
                              <Copy className="w-3 h-3" />
                            </button>
                            <button onClick={() => handleDeleteSpell(spell.id)} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer', padding: '0.2rem', color: '#dc2626', display: 'inline-flex' }} title="Elimina">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty slots notice and actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {countEmpty > 0 ? (
                <span>{countEmpty} slot liberi su 10</span>
              ) : (
                <span style={{ color: '#059669', fontWeight: 600 }}><Check className="w-3 h-3" style={{ display: 'inline' }} /> 10/10 incantesimi completi</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {countEmpty > 0 && (
                <button onClick={fillEmptySlots} className="btn btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', borderColor: '#d1d5db', color: '#6b7280' }}>
                  <Plus className="w-3 h-3" /> Crea slot vuoti
                </button>
              )}
              <button onClick={handleNewSpell} className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}>
                <Plus className="w-3 h-3" /> Nuovo Incantesimo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente Principale ──────────────────────────────────────────────────

export default function SpellCatalogManager({ catalog, onUpdate }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const lists = catalog?.liste_incantesimi || [];

  // Group lists by tipo_lista
  const grouped = useMemo(() => {
    const groups = new Map();
    lists.forEach(lista => {
      const key = lista.tipo_lista;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(lista);
    });
    return groups;
  }, [lists]);

  // Filter
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return grouped;
    const term = searchTerm.toLowerCase().trim();
    const result = new Map();
    for (const [tipo, group] of grouped) {
      const filtered = group.filter(lista =>
        (lista.nome_lista || '').toLowerCase().includes(term) ||
        (lista.incantesimi || []).some(inc => (inc.nome || '').toLowerCase().includes(term))
      );
      if (filtered.length > 0) result.set(tipo, filtered);
    }
    return result;
  }, [grouped, searchTerm]);

  const handleUpdateList = useCallback((updatedLista) => {
    const newLists = lists.map(l =>
      l.nome_lista === updatedLista.nome_lista && l.tipo_lista === updatedLista.tipo_lista
        ? updatedLista
        : l
    );
    onUpdate({ ...catalog, liste_incantesimi: newLists });
  }, [lists, catalog, onUpdate]);

  const handleDeleteList = useCallback((nomeLista) => {
    if (confirmDelete !== nomeLista) {
      setConfirmDelete(nomeLista);
      return;
    }
    const newLists = lists.filter(l => l.nome_lista !== nomeLista);
    onUpdate({ ...catalog, liste_incantesimi: newLists });
    setConfirmDelete(null);
  }, [lists, catalog, onUpdate, confirmDelete]);

  const handleCreateList = useCallback((listData) => {
    const newList = {
      ...listData,
      incantesimi: listData.incantesimi || Array.from({ length: 10 }, (_, i) => ({
        id: generateId(),
        numero: i + 1,
        nome: '',
        tipologia: 'F',
        istantaneo: false,
        descrizione: '',
        efficacia: '',
        durata: '',
        raggio_azione: '',
        attivo: true,
      })),
    };
    const newLists = [...lists, newList];
    onUpdate({ ...catalog, liste_incantesimi: newLists });
    setShowNewListForm(false);
  }, [lists, catalog, onUpdate]);

  const handleDuplicateList = useCallback((lista) => {
    const baseName = lista.nome_lista;
    let newName = `${baseName}_COPY`;
    let counter = 1;
    while (lists.some(l => l.nome_lista === newName)) {
      counter++;
      newName = `${baseName}_COPY${counter}`;
    }
    const duplicated = cloneDeep(lista);
    duplicated.nome_lista = newName;
    duplicated.incantesimi = (duplicated.incantesimi || []).map(spell => ({
      ...spell,
      id: generateId(),
    }));
    const newLists = [...lists, duplicated];
    onUpdate({ ...catalog, liste_incantesimi: newLists });
  }, [lists, catalog, onUpdate]);

  const totalSpells = lists.reduce((sum, l) => sum + (l.incantesimi || []).length, 0);

  return (
    <div className="card" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
      <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Book className="w-5 h-5 text-indigo-500" />
              Gestione Catalogo Incantesimi
            </h2>
            <p className="card-description" style={{ margin: '0.2rem 0 0 0' }}>
              Visualizza, aggiungi o modifica liste e incantesimi. {lists.length} liste, {totalSpells} incantesimi.
            </p>
          </div>
          <button onClick={() => setShowNewListForm(true)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Plus className="w-4 h-4" /> Nuova Lista
          </button>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search className="w-4 h-4" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input type="text" placeholder="Cerca lista o incantesimo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2rem', fontSize: '0.85rem', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#f8fafc', outline: 'none' }} />
          </div>
        </div>
      </div>

      <div className="card-body">
        {/* Nuova lista form */}
        {showNewListForm && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Crea Nuova Lista Incantesimi</h3>
            </div>
            <ListForm onSave={handleCreateList} onCancel={() => setShowNewListForm(false)} />
          </div>
        )}

        {/* Liste raggruppate */}
        {filteredGroups.size === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
            <Book className="w-12 h-12" style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p style={{ fontWeight: 600 }}>Nessuna lista trovata</p>
            <p style={{ fontSize: '0.85rem' }}>{searchTerm ? 'Prova a modificare la ricerca.' : 'Clicca "Nuova Lista" per iniziare.'}</p>
          </div>
        ) : (
          Array.from(filteredGroups.entries())
            .sort((a, b) => {
              const ai = CATEGORY_ORDER.indexOf(a[0]);
              const bi = CATEGORY_ORDER.indexOf(b[0]);
              return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
            })
            .map(([tipo, group]) => (
            <div key={tipo} style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem 0.25rem' }}>
                {tipo} ({group.length} liste)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {sortListsByCanonicalOrder(group, tipo).map(lista => (
                  <div key={lista.nome_lista}>
                    <SpellListEditor
                      lista={lista}
                      onUpdate={handleUpdateList}
                      onDelete={handleDeleteList}
                    />
                    {/* Confirm deletion */}
                    {confirmDelete === lista.nome_lista && (
                      <div style={{ marginTop: '0.35rem', padding: '0.5rem 0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '0.78rem', color: '#991b1b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <AlertTriangle className="w-4 h-4" />
                          <span>Confermi l'eliminazione della lista <strong>{lista.nome_lista}</strong> e tutti i suoi incantesimi?</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button onClick={() => setConfirmDelete(null)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderColor: '#d1d5db' }}>Annulla</button>
                          <button onClick={() => handleDeleteList(lista.nome_lista)} className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Elimina</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Barra informativa */}
        <div style={{ marginTop: '1rem', padding: '0.5rem 0.75rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.75rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText className="w-4 h-4 shrink-0" />
          <span>
            Le modifiche vengono salvate su Firestore solo per il tuo account GM. 
            Per ripristinare i dati predefiniti, cancella il catalogo personalizzato.
          </span>
        </div>
      </div>
    </div>
  );
}
