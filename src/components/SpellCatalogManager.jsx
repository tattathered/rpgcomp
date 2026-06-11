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

// ─── Form Incantesimo ───────────────────────────────────────────────────────

function SpellForm({ spell, onSave, onCancel }) {
  const [form, setForm] = useState({
    numero: spell?.numero || 1,
    nome: spell?.nome || '',
    tipologia: spell?.tipologia || 'F',
    istantaneo: spell?.istantaneo || false,
    descrizione: spell?.descrizione || '',
    efficacia: spell?.efficacia || '',
    durata: spell?.durata || '',
    raggio_azione: spell?.raggio_azione || '',
  });

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      alert('Il nome dell\'incantesimo è obbligatorio.');
      return;
    }
    onSave({
      ...form,
      numero: parseInt(form.numero, 10) || 1,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 140px', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>N° Livello</label>
          <input type="number" min={1} max={50} value={form.numero} onChange={e => handleChange('numero', e.target.value)}
            style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.85rem', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: 'white' }} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Nome Incantesimo *</label>
          <input type="text" value={form.nome} onChange={e => handleChange('nome', e.target.value)}
            style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.85rem', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: 'white' }} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Classe</label>
          <select value={form.tipologia} onChange={e => handleChange('tipologia', e.target.value)}
            style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.85rem', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: 'white' }}>
            {TIPO_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label} ({opt.value})</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <input type="checkbox" id="istantaneo" checked={form.istantaneo} onChange={e => handleChange('istantaneo', e.target.checked)}
          style={{ width: '1rem', height: '1rem', cursor: 'pointer' }} />
        <label htmlFor="istantaneo" style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}>Istantaneo *</label>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Descrizione</label>
        <textarea value={form.descrizione} onChange={e => handleChange('descrizione', e.target.value)} rows={3}
          style={{ width: '100%', padding: '0.5rem', fontSize: '0.82rem', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: 'white', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Efficacia</label>
          <input type="text" value={form.efficacia} onChange={e => handleChange('efficacia', e.target.value)} placeholder="es: +10, 1d10+5"
            style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.85rem', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: 'white' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Durata</label>
          <input type="text" value={form.durata} onChange={e => handleChange('durata', e.target.value)} placeholder="es: 1 rnd/liv, 1 min/liv"
            style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.85rem', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: 'white' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Raggio d'azione</label>
          <input type="text" value={form.raggio_azione} onChange={e => handleChange('raggio_azione', e.target.value)} placeholder="es: 30m, contatto"
            style={{ width: '100%', padding: '0.4rem 0.5rem', fontSize: '0.85rem', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: 'white' }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} className="btn btn-outline" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <X className="w-3.5 h-3.5" /> Annulla
        </button>
        <button type="submit" className="btn btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Save className="w-3.5 h-3.5" /> Salva
        </button>
      </div>
    </form>
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

// ─── SpellList Editor ───────────────────────────────────────────────────────

function SpellListEditor({ lista, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [editingSpell, setEditingSpell] = useState(null); // null | 'new' | spell-object
  const [editingList, setEditingList] = useState(false);

  const spells = lista.incantesimi || [];
  const sortedSpells = [...spells].sort((a, b) => a.numero - b.numero);

  const handleSaveSpell = useCallback((spellData) => {
    let newSpells;
    if (editingSpell === 'new') {
      // Check for duplicate number
      const exists = spells.some(s => s.numero === spellData.numero);
      if (exists && !window.confirm(`Esiste già un incantesimo di livello ${spellData.numero}. Vuoi sovrascriverlo?`)) {
        return;
      }
      newSpells = [...spells.filter(s => s.numero !== spellData.numero), spellData];
    } else if (editingSpell) {
      // Editing existing
      newSpells = spells.map(s => 
        s.numero === editingSpell.numero ? spellData : s
      );
    } else {
      return;
    }

    onUpdate({
      ...lista,
      incantesimi: newSpells.sort((a, b) => a.numero - b.numero),
    });
    setEditingSpell(null);
  }, [editingSpell, lista, spells, onUpdate]);

  const handleDeleteSpell = useCallback((numero) => {
    if (!window.confirm(`Eliminare l'incantesimo di livello ${numero}?`)) return;
    onUpdate({
      ...lista,
      incantesimi: spells.filter(s => s.numero !== numero),
    });
  }, [lista, spells, onUpdate]);

  const handleDuplicateSpell = useCallback((spell) => {
    // Find next available number
    const usedNumbers = new Set(spells.map(s => s.numero));
    let newNum = spell.numero + 1;
    while (usedNumbers.has(newNum)) newNum++;
    
    const newSpell = { ...spell, numero: newNum, nome: `${spell.nome} (Copia)` };
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
        newSpells.push({ numero: i, nome: '', tipologia: 'F', istantaneo: false, descrizione: '', efficacia: '', durata: '', raggio_azione: '' });
      }
    }
    newSpells.sort((a, b) => a.numero - b.numero);
    onUpdate({ ...lista, incantesimi: newSpells });
  }, [lista, spells, onUpdate]);

  const countEmpty = 10 - spells.length;

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
      {/* Header lista */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 1rem', backgroundColor: expanded ? '#f1f5f9' : '#fafafa', borderBottom: expanded ? '1px solid #e2e8f0' : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.15rem', color: '#94a3b8' }}>
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>{lista.nome_lista}</span>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>
            ({spells.length} incantesimi)
          </span>
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
          
          {/* Editing list form */}
          {editingList && (
            <div style={{ marginBottom: '0.75rem' }}>
              <ListForm list={lista} onSave={handleSaveList} onCancel={() => setEditingList(false)} />
            </div>
          )}

          {/* Spells table */}
          {sortedSpells.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0.5rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '0.35rem 0.4rem', textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', width: '36px' }}>#</th>
                  <th style={{ padding: '0.35rem 0.4rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Incantesimo</th>
                  <th style={{ padding: '0.35rem 0.4rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', width: '100px' }}>Classe</th>
                  <th style={{ padding: '0.35rem 0.4rem', textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', width: '24px' }} title="Istantaneo">*</th>
                  <th style={{ padding: '0.35rem 0.4rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', width: '100px' }}>Efficacia</th>
                  <th style={{ padding: '0.35rem 0.4rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', width: '80px' }}>Durata</th>
                  <th style={{ padding: '0.35rem 0.4rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', width: '80px' }}>Raggio</th>
                  <th style={{ padding: '0.35rem 0.4rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Descrizione</th>
                  <th style={{ padding: '0.35rem 0.4rem', textAlign: 'right', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', width: '110px' }}>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {sortedSpells.map((spell) => (
                  <tr key={spell.numero} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.3rem 0.4rem', textAlign: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#475569' }}>{spell.numero}</td>
                    <td style={{ padding: '0.3rem 0.4rem', fontSize: '0.82rem', color: '#1e293b', fontWeight: spell.nome ? 500 : 400, fontStyle: spell.nome ? 'normal' : 'italic', opacity: spell.nome ? 1 : 0.5 }}>
                      {spell.nome || '— vuoto —'}
                    </td>
                    <td style={{ padding: '0.3rem 0.4rem' }}>
                      <TipoBadge tipo={spell.tipologia} />
                    </td>
                    <td style={{ padding: '0.3rem 0.4rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 800, color: '#dc2626' }}>
                      {spell.istantaneo ? '*' : ''}
                    </td>
                    <td style={{ padding: '0.3rem 0.4rem', fontSize: '0.75rem', color: '#64748b', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {spell.efficacia || '—'}
                    </td>
                    <td style={{ padding: '0.3rem 0.4rem', fontSize: '0.75rem', color: '#64748b', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {spell.durata || '—'}
                    </td>
                    <td style={{ padding: '0.3rem 0.4rem', fontSize: '0.75rem', color: '#64748b', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {spell.raggio_azione || '—'}
                    </td>
                    <td style={{ padding: '0.3rem 0.4rem', fontSize: '0.75rem', color: '#64748b', wordBreak: 'break-word', lineHeight: '1.4' }}>
                      {spell.descrizione || '—'}
                    </td>
                    <td style={{ padding: '0.3rem 0.4rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => setEditingSpell(spell)} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer', padding: '0.2rem', color: '#64748b', display: 'inline-flex' }} title="Modifica">
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleDuplicateSpell(spell)} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer', padding: '0.2rem', color: '#64748b', display: 'inline-flex' }} title="Duplica">
                          <Copy className="w-3 h-3" />
                        </button>
                        <button onClick={() => handleDeleteSpell(spell.numero)} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer', padding: '0.2rem', color: '#dc2626', display: 'inline-flex' }} title="Elimina">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Editing spell form */}
          {editingSpell && (
            <div style={{ marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', margin: '0 0 0.5rem 0' }}>
                {editingSpell === 'new' ? 'Nuovo Incantesimo' : `Modifica: ${editingSpell.nome || `Liv. ${editingSpell.numero}`}`}
              </h4>
              <SpellForm spell={editingSpell === 'new' ? null : editingSpell} onSave={handleSaveSpell} onCancel={() => setEditingSpell(null)} />
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
              <button onClick={() => setEditingSpell('new')} className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}>
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
        numero: i + 1,
        nome: '',
        tipologia: 'F',
        istantaneo: false,
        descrizione: '',
        efficacia: '',
        durata: '',
        raggio_azione: '',
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
      nome: spell.nome ? `${spell.nome}` : '',
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
