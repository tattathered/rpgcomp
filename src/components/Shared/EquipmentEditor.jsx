import { useState, useMemo, Fragment } from 'react';

import { Search, X, Save, AlertTriangle, ArrowLeftRight } from 'lucide-react';
import defaultCatalog from '../../data/TS-4-equipaggiamento.json';
import { calculateCargoPenalty } from '../../utils/skillCalculators';

const getWeaponGroup = (item) => {
  const nome = (item.nome || '').toLowerCase();
  const note = (item.note || '').toLowerCase();
  if (note.includes('da taglio') && (note.includes('1 mano') || note.includes('una mano'))) return 'da taglio a 1 mano';
  if (note.includes('contundente') && (note.includes('1 mano') || note.includes('una mano'))) return 'contundenti a una mano';
  if (note.includes('2 mani') || nome.includes('a 2 mani') || nome.includes('a due mani')) return 'a 2 mani';
  if (note.includes('tiro')) return 'da tiro';
  if (note.includes('lancio') || nome.includes('giavellotto') || nome.includes('lancia') || note.includes('da lancio')) return 'da lancio';
  if (nome.includes('spada') || nome.includes('pugnale') || nome.includes('accetta') || nome.includes('scimitarra') || nome.includes('frusta')) return 'da taglio a 1 mano';
  if (nome.includes('randello') || nome.includes('mazzafrusto') || nome.includes('rete') || nome.includes('martello')) return 'contundenti a una mano';
  if (nome.includes('ascia da battaglia') || nome.includes('flagello') || nome.includes('alabarda') || nome.includes('bastone')) return 'a 2 mani';
  if (nome.includes('arco') || nome.includes('balestra') || nome.includes('fionda')) return 'da tiro';
  if (nome.includes('bolas') || nome.includes('giavellotto') || nome.includes('lancia')) return 'da lancio';
  return 'da taglio a 1 mano';
};

const WEAPON_GROUPS = ['da taglio a 1 mano', 'contundenti a una mano', 'a 2 mani', 'da tiro', 'da lancio'];

const btnSmall = {
  width: '24px', height: '24px', padding: 0, border: '1px solid #cbd5e1', borderRadius: '4px',
  backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '0.75rem', color: '#475569', lineHeight: 1
};

export default function EquipmentEditor({ characterData, equipmentCatalog, onSave, onClose, mode = 'gm' }) {
  const pesoPG = characterData.peso || 70;
  const isReadOnly = mode === 'player';

  // Catalogo: usa quello passato dal chiamante (es. catalogo custom del GM), altrimenti il default
  const catalog = equipmentCatalog && equipmentCatalog.length > 0 ? equipmentCatalog : defaultCatalog;

  const [itemsMap, setItemsMap] = useState(() => {
    const map = {};
    (characterData.equipment || []).forEach(item => {
      const key = `${item.categoria}_${item.nome}`;
      if (!map[key]) {
        map[key] = { ...item, qtyEquip: item.qtyEquip || 0, qtyCarico: item.qtyCarico || 0, note: item.note || '' };
      } else {
        map[key].qtyEquip += item.qtyEquip || 0;
        map[key].qtyCarico += item.qtyCarico || 0;
      }
    });
    return map;
  });

  // Snapshot iniziale per calcolare delta (oggetti nuovi = acquisto)
  const initialItemsMap = useMemo(() => {
    const map = {};
    (characterData.equipment || []).forEach(item => {
      const key = `${item.categoria}_${item.nome}`;
      if (!map[key]) {
        map[key] = { ...item, qtyEquip: item.qtyEquip || 0, qtyCarico: item.qtyCarico || 0 };
      } else {
        map[key].qtyEquip += item.qtyEquip || 0;
        map[key].qtyCarico += item.qtyCarico || 0;
      }
    });
    return map;
  }, [characterData.equipment]);

  const [portafoglioMB, setPortafoglioMB] = useState(characterData.portafoglioMB || 0);
  const [equippedArmor, setEquippedArmor] = useState(characterData.equippedArmor || null);
  const [equippedShield, setEquippedShield] = useState(characterData.equippedShield || false);
  const [activeTab, setActiveTab] = useState('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [error, setError] = useState(null);
  // Flag acquisto: oggetti nuovi (non presenti nello snapshot iniziale)
  const [acquistoFlags, setAcquistoFlags] = useState({});

  const summary = useMemo(() => {
    let pesoCaricoKg = 0;
    let costoTotaleAcquisti = 0;
    const initialMap = initialItemsMap;
    Object.entries(itemsMap).forEach(([key, item]) => {
      pesoCaricoKg += (item.qtyCarico || 0) * (item["peso in kg"] || 0);

      // Calcolo delta per acquisto
      const initial = initialMap[key];
      const oldTotal = initial ? (initial.qtyEquip || 0) + (initial.qtyCarico || 0) : 0;
      const newTotal = (item.qtyEquip || 0) + (item.qtyCarico || 0);
      const delta = newTotal - oldTotal;
      if (delta > 0 && acquistoFlags[key]) {
        costoTotaleAcquisti += delta * (item.costo_MB || 0);
      }
    });
    const caricoArrotondato = Math.floor(pesoCaricoKg);
    const { penalita, caricoBloccato } = calculateCargoPenalty(pesoPG, pesoCaricoKg);
    const portafoglioDopoAcquisti = portafoglioMB - costoTotaleAcquisti;
    return { pesoCaricoKg, caricoArrotondato, penalita, caricoBloccato, costoTotaleAcquisti, portafoglioDopoAcquisti };
  }, [itemsMap, pesoPG, acquistoFlags, portafoglioMB, initialItemsMap]);

  const ownedArmors = useMemo(() => {
    return Object.values(itemsMap).filter(item =>
      item.categoria === 'armatura' &&
      !item.nome.toLowerCase().includes('scudo') &&
      (item.qtyEquip > 0 || item.qtyCarico > 0)
    );
  }, [itemsMap]);

  const hasShield = useMemo(() => {
    return Object.values(itemsMap).some(item =>
      item.nome.toLowerCase().includes('scudo') &&
      (item.qtyEquip > 0 || item.qtyCarico > 0)
    );
  }, [itemsMap]);

  const handleAddItem = (catalogItem) => {
    const key = `${catalogItem.categoria}_${catalogItem.nome}`;
    setItemsMap(prev => {
      const existing = prev[key];
      if (existing) {
        return { ...prev, [key]: { ...existing, qtyEquip: existing.qtyEquip + 1 } };
      }
      return {
        ...prev,
        [key]: {
          nome: catalogItem.nome, categoria: catalogItem.categoria,
          abbreviazione: catalogItem.abbreviazione, costo_MB: catalogItem.costo_MB,
          "peso in kg": catalogItem["peso in kg"], note_base: catalogItem.note,
          qtyEquip: 1, qtyCarico: 0, note: ''
        }
      };
    });
    // Auto-flag acquisto per oggetti nuovi
    setAcquistoFlags(prev => ({ ...prev, [key]: true }));
  };

  const handleToggleAcquisto = (key) => {
    setAcquistoFlags(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleQtyChange = (key, field, delta) => {
    setItemsMap(prev => {
      const item = prev[key];
      if (!item) return prev;
      const next = Math.max(0, (item[field] || 0) + delta);
      return { ...prev, [key]: { ...item, [field]: next } };
    });
  };

  const handleTransfer = (key, from, to) => {
    setItemsMap(prev => {
      const item = prev[key];
      if (!item || (item[from] || 0) <= 0) return prev;
      return {
        ...prev, [key]: {
          ...item, [from]: (item[from] || 0) - 1, [to]: (item[to] || 0) + 1
        }
      };
    });
  };

  const handleRemoveItem = (key) => {
    setItemsMap(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleNoteChange = (key, val) => {
    setItemsMap(prev => ({ ...prev, [key]: { ...prev[key], note: val } }));
  };

  const handleSave = () => {
    if (summary.caricoBloccato) {
      setError(`Carico eccessivo (${summary.caricoArrotondato} kg): riduci gli oggetti in CARICO.`);
      return;
    }
    if (summary.costoTotaleAcquisti > 0 && portafoglioMB < summary.costoTotaleAcquisti) {
      const proceed = window.confirm(
        `Attenzione: la spesa totale (${summary.costoTotaleAcquisti.toFixed(2)} MB) supera il portafoglio corrente (${portafoglioMB.toFixed(2)} MB).\nIl portafoglio andrà in negativo (${(portafoglioMB - summary.costoTotaleAcquisti).toFixed(2)} MB). Vuoi procedere?`
      );
      if (!proceed) return;
    }
    setError(null);

    const equipmentList = Object.values(itemsMap).filter(item => item.qtyEquip > 0 || item.qtyCarico > 0);
    const portafoglioFinale = portafoglioMB - summary.costoTotaleAcquisti;
    const updatedData = {
      ...characterData,
      equipment: equipmentList,
      caricoKg: summary.pesoCaricoKg,
      penalitaCarico: summary.penalita,
      equippedArmor,
      equippedShield,
      portafoglioMB: portafoglioFinale
    };
    onSave(updatedData);
  };

  const catalogItems = useMemo(() => {
    return catalog
      .map((item, index) => ({ item, index }))
      .filter(x => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          return (x.item.nome || '').toLowerCase().includes(q) || (x.item.note || '').toLowerCase().includes(q);
        }
        return activeCategory === 'all' || x.item.categoria === activeCategory;
      });
  }, [catalog, activeCategory, searchQuery]);

  const categories = useMemo(() => [...new Set(catalog.map(item => item.categoria))], [catalog]);

  const groupedWeapons = useMemo(() => {
    if (activeCategory !== 'armi') return null;
    const groups = {};
    WEAPON_GROUPS.forEach(g => groups[g] = []);
    catalogItems.forEach(x => {
      const grp = getWeaponGroup(x.item);
      if (groups[grp]) groups[grp].push(x);
      else groups['da taglio a 1 mano'].push(x);
    });
    Object.keys(groups).forEach(key => groups[key].sort((a, b) => a.item.nome.localeCompare(b.item.nome)));
    return groups;
  }, [activeCategory, catalogItems]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width: '90%', maxWidth: '1100px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '2px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#1e293b' }}>
            {isReadOnly ? 'Inventario — ' : 'Gestione Inventario — '}{characterData.name}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.3rem', color: '#94a3b8' }}><X size={24} /></button>
        </div>

        {!isReadOnly && (
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
            <button onClick={() => setActiveTab('current')} style={{
              flex: 1, padding: '0.7rem', fontWeight: 700, fontSize: '0.85rem', border: 'none',
              backgroundColor: activeTab === 'current' ? '#f1f5f9' : '#fff',
              borderBottom: activeTab === 'current' ? '2px solid #3b82f6' : '2px solid transparent',
              cursor: 'pointer', color: activeTab === 'current' ? '#1e40af' : '#64748b'
            }}>Inventario Corrente</button>
            <button onClick={() => setActiveTab('add')} style={{
              flex: 1, padding: '0.7rem', fontWeight: 700, fontSize: '0.85rem', border: 'none',
              backgroundColor: activeTab === 'add' ? '#f1f5f9' : '#fff',
              borderBottom: activeTab === 'add' ? '2px solid #3b82f6' : '2px solid transparent',
              cursor: 'pointer', color: activeTab === 'add' ? '#1e40af' : '#64748b'
            }}>Aggiungi Oggetto</button>
          </div>
        )}

        {isReadOnly && <div style={{ borderBottom: '1px solid #e2e8f0' }} />}

        {error && (
          <div style={{ margin: '0.75rem 1.5rem', padding: '0.6rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={16} />{error}
          </div>
        )}

        <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
          {activeTab === 'current' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase' }}>Carico</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e3a8a' }}>{summary.caricoArrotondato} kg</div>
                </div>
                <div style={{ padding: '0.75rem', backgroundColor: summary.caricoBloccato ? '#fef2f2' : '#f0fdf4', borderRadius: '8px', border: `1px solid ${summary.caricoBloccato ? '#fecaca' : '#bbf7d0'}` }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: summary.caricoBloccato ? '#b91c1c' : '#15803d', textTransform: 'uppercase' }}>Penalità</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: summary.caricoBloccato ? '#7f1d1d' : '#14532d' }}>
                    {summary.caricoBloccato ? 'NA' : `-${summary.penalita}`}
                  </div>
                </div>
                {!isReadOnly && (
                  <div style={{ padding: '0.75rem', backgroundColor: '#fefce8', borderRadius: '8px', border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#a16207', textTransform: 'uppercase' }}>Portafoglio</div>
                    <input type="number" step="0.01" value={portafoglioMB}
                      onChange={e => setPortafoglioMB(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', fontSize: '1rem', fontWeight: 900, color: '#713f12', border: 'none', background: 'transparent', outline: 'none' }} />
                  </div>
                )}
                {isReadOnly && (
                  <div style={{ padding: '0.75rem', backgroundColor: '#fefce8', borderRadius: '8px', border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#a16207', textTransform: 'uppercase' }}>Portafoglio</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#713f12' }}>{portafoglioMB.toFixed(2)} MB</div>
                  </div>
                )}
                {!isReadOnly && summary.costoTotaleAcquisti > 0 && (
                  <div style={{ padding: '0.75rem', backgroundColor: summary.portafoglioDopoAcquisti < 0 ? '#fef2f2' : '#f0fdf4', borderRadius: '8px', border: `1px solid ${summary.portafoglioDopoAcquisti < 0 ? '#fecaca' : '#bbf7d0'}` }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: summary.portafoglioDopoAcquisti < 0 ? '#b91c1c' : '#15803d', textTransform: 'uppercase' }}>Costo Acquisti</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 900, color: summary.portafoglioDopoAcquisti < 0 ? '#7f1d1d' : '#14532d' }}>
                      -{summary.costoTotaleAcquisti.toFixed(2)} MB
                    </div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: summary.portafoglioDopoAcquisti < 0 ? '#b91c1c' : '#15803d' }}>
                      Residuo: {summary.portafoglioDopoAcquisti.toFixed(2)} MB
                      {summary.portafoglioDopoAcquisti < 0 && ' ⚠️ Negativo'}
                    </div>
                  </div>
                )}
              </div>

              {!isReadOnly && (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Armatura Attiva:</label>
                    <select value={equippedArmor || ''} onChange={e => setEquippedArmor(e.target.value || null)}
                      style={{ width: '100%', padding: '0.4rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      <option value="">— Nessuna —</option>
                      {ownedArmors.map((a, i) => (
                        <option key={i} value={a.nome}>{a.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1.2rem' }}>
                    <input type="checkbox" checked={equippedShield && hasShield}
                      onChange={e => setEquippedShield(e.target.checked)} disabled={!hasShield}
                      style={{ width: '18px', height: '18px' }} />
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: hasShield ? '#1e293b' : '#94a3b8' }}>
                      Scudo{!hasShield ? ' (non posseduto)' : ''}
                    </label>
                  </div>
                </div>
              )}

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase' }}>Oggetto</th>
                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', width: '100px' }}>EQUIP</th>
                      <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', width: '100px' }}>CARICO</th>
                      {!isReadOnly && <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', width: '70px' }}>Acqu.</th>}
                      {!isReadOnly && <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', width: '60px' }}>Az.</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(itemsMap).length === 0 ? (
                      <tr><td colSpan={isReadOnly ? 3 : 5} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>Inventario vuoto.</td></tr>
                    ) : (
                      Object.entries(itemsMap)
                        .sort((a, b) => a[1].categoria.localeCompare(b[1].categoria) || a[1].nome.localeCompare(b[1].nome))
                        .map(([key, item]) => (
                          <tr key={key} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.5rem 0.75rem' }}>
                              <div style={{ fontWeight: 700, color: '#1e293b' }}>{item.nome}</div>
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.categoria} — {(item["peso in kg"] || 0).toFixed(1)} kg</div>
                              <input type="text" value={item.note} placeholder="Note..." onChange={e => handleNoteChange(key, e.target.value)}
                                style={{ marginTop: '0.2rem', width: '100%', padding: '0.2rem 0.4rem', fontSize: '0.7rem', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                                <button onClick={() => handleQtyChange(key, 'qtyEquip', -1)} style={btnSmall}>-</button>
                                <span style={{ fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>{item.qtyEquip}</span>
                                <button onClick={() => handleQtyChange(key, 'qtyEquip', 1)} style={btnSmall}>+</button>
                                {item.qtyEquip > 0 && <button onClick={() => handleTransfer(key, 'qtyEquip', 'qtyCarico')} style={{ ...btnSmall, color: '#2563eb' }} title="Sposta in CARICO"><ArrowLeftRight size={12} /></button>}
                              </div>
                            </td>
                            <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                                <button onClick={() => handleQtyChange(key, 'qtyCarico', -1)} style={btnSmall}>-</button>
                                <span style={{ fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>{item.qtyCarico}</span>
                                <button onClick={() => handleQtyChange(key, 'qtyCarico', 1)} style={btnSmall}>+</button>
                                {item.qtyCarico > 0 && <button onClick={() => handleTransfer(key, 'qtyCarico', 'qtyEquip')} style={{ ...btnSmall, color: '#059669' }} title="Sposta in EQUIP"><ArrowLeftRight size={12} /></button>}
                              </div>
                            </td>
                            {!isReadOnly && (
                              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                                {(() => {
                                  const initial = initialItemsMap[key];
                                  const oldTotal = initial ? (initial.qtyEquip || 0) + (initial.qtyCarico || 0) : 0;
                                  const newTotal = (item.qtyEquip || 0) + (item.qtyCarico || 0);
                                  const isNew = newTotal > oldTotal;
                                  return isNew ? (
                                    <input type="checkbox" checked={!!acquistoFlags[key]}
                                      onChange={() => handleToggleAcquisto(key)}
                                      style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                                  ) : (
                                    <span style={{ color: '#cbd5e1', fontSize: '0.7rem' }}>—</span>
                                  );
                                })()}
                              </td>
                            )}
                            {!isReadOnly && (
                              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                                <button onClick={() => handleRemoveItem(key)} style={{ ...btnSmall, color: '#dc2626' }} title="Rimuovi"><X size={14} /></button>
                              </td>
                            )}
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'add' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input type="text" placeholder="Cerca oggetto per nome o note..." value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2rem', fontSize: '0.85rem', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#f8fafc', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                {categories.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                    padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #cbd5e1', borderRadius: '6px',
                    backgroundColor: activeCategory === cat ? '#3b82f6' : 'transparent', color: activeCategory === cat ? '#fff' : '#475569', cursor: 'pointer'
                  }}>{cat}</button>
                ))}
                <button onClick={() => setActiveCategory('all')} style={{
                  padding: '0.3rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #cbd5e1', borderRadius: '6px',
                  backgroundColor: activeCategory === 'all' ? '#3b82f6' : 'transparent', color: activeCategory === 'all' ? '#fff' : '#475569', cursor: 'pointer'
                }}>Tutti</button>
              </div>
              <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '0.4rem 0.75rem', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase' }}>Oggetto</th>
                      <th style={{ padding: '0.4rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', width: '60px' }}>Peso</th>
                      <th style={{ padding: '0.4rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', width: '60px' }}>Costo</th>
                      <th style={{ padding: '0.4rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', width: '70px' }}>+</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeCategory === 'armi' && groupedWeapons ? (
                      WEAPON_GROUPS.map(groupName => {
                        const items = groupedWeapons[groupName] || [];
                        if (items.length === 0) return null;
                        return (
                          <Fragment key={groupName}>
                            <tr style={{ backgroundColor: '#f1f5f9', borderTop: '1px solid #cbd5e1' }}>
                              <td colSpan="4" style={{ padding: '0.3rem 0.75rem', fontWeight: 700, color: '#475569', fontSize: '0.7rem', textTransform: 'uppercase' }}>{groupName}</td>
                            </tr>
                            {items.map(({ item, index }) => (
                              <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '0.4rem 0.75rem' }}>
                                  <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.nome}</div>
                                  {item.note && <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.note}</div>}
                                </td>
                                <td style={{ padding: '0.4rem 0.75rem', textAlign: 'center', color: '#64748b' }}>{(item["peso in kg"] || 0).toFixed(1)}</td>
                                <td style={{ padding: '0.4rem 0.75rem', textAlign: 'center', color: '#a16207', fontWeight: 600 }}>{(item.costo_MB || 0).toFixed(1)}</td>
                                <td style={{ padding: '0.4rem 0.75rem', textAlign: 'center' }}>
                                  <button onClick={() => handleAddItem(item)} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>+1</button>
                                </td>
                              </tr>
                            ))}
                          </Fragment>
                        );
                      })
                    ) : (
                      catalogItems.map(({ item, index }) => (
                        <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '0.4rem 0.75rem' }}>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{item.nome}</div>
                            {item.note && <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.note}</div>}
                          </td>
                          <td style={{ padding: '0.4rem 0.75rem', textAlign: 'center', color: '#64748b' }}>{(item["peso in kg"] || 0).toFixed(1)}</td>
                          <td style={{ padding: '0.4rem 0.75rem', textAlign: 'center', color: '#a16207', fontWeight: 600 }}>{(item.costo_MB || 0).toFixed(1)}</td>
                          <td style={{ padding: '0.4rem 0.75rem', textAlign: 'center' }}>
                            <button onClick={() => handleAddItem(item)} style={{ padding: '0.25rem 0.5rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>+1</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button onClick={onClose} style={{ padding: '0.5rem 1.5rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, color: '#475569', cursor: 'pointer', fontSize: '0.85rem' }}>
            {isReadOnly ? 'Chiudi' : 'Annulla'}
          </button>
          <button onClick={handleSave} disabled={summary.caricoBloccato} style={{
            padding: '0.5rem 1.5rem', backgroundColor: summary.caricoBloccato ? '#94a3b8' : '#2563eb', color: '#fff', border: 'none', borderRadius: '8px',
            fontWeight: 700, cursor: summary.caricoBloccato ? 'not-allowed' : 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem'
          }}>
            <Save size={16} />Salva
          </button>
        </div>
      </div>
    </div>
  );
}
