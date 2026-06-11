import { useState, useMemo } from 'react';


import { Plus, Trash2, Copy, Edit, ArrowLeft, Save, Search } from 'lucide-react';

export default function EquipmentCatalogManager({ catalog, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // null per nuovo, numero per modifica
  const [formState, setFormState] = useState({
    categoria: 'armi',
    nome: '',
    costo_MB: 0,
    "peso in kg": 0,
    abbreviazione: '',
    note: '',
    dotazione_iniziale: null,
    carico: null
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const categories = ['armi', 'armatura', 'abbigliamento', 'proiettili', 'contenitori', 'campo', 'strumenti', 'vitto', 'alloggio'];

  const filteredItems = useMemo(() => {
    return catalog.map((item, index) => ({ ...item, originalIndex: index }))
      .filter(item => {
        const matchesSearch = !searchQuery.trim() || 
          item.nome.toLowerCase().includes(searchQuery.toLowerCase()) || 
          (item.note && item.note.toLowerCase().includes(searchQuery.toLowerCase()));
        // Se c'è una ricerca testuale, ignora il filtro categoria
        const matchesCategory = searchQuery.trim() ? true : (filterCategory === 'all' || item.categoria === filterCategory);
        return matchesSearch && matchesCategory;
      });
  }, [catalog, searchQuery, filterCategory]);

  // Ordina le categorie secondo un ordine predefinito
  const categoryOrder = ['armi', 'armatura', 'abbigliamento', 'proiettili', 'contenitori', 'campo', 'strumenti', 'vitto', 'alloggio'];
  const sortedCategories = [...categoryOrder].sort((a, b) => {
    const ai = categoryOrder.indexOf(a);
    const bi = categoryOrder.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  const handleOpenNew = () => {
    setFormState({
      categoria: 'armi',
      nome: '',
      costo_MB: 0,
      "peso in kg": 0,
      abbreviazione: '',
      note: '',
      dotazione_iniziale: null,
      carico: null
    });
    setEditingIndex(null);
    setIsEditing(true);
  };

  const handleOpenEdit = (item) => {
    setFormState({
      categoria: item.categoria || 'armi',
      nome: item.nome || '',
      costo_MB: item.costo_MB || 0,
      "peso in kg": item["peso in kg"] || 0,
      abbreviazione: item.abbreviazione || '',
      note: item.note || '',
      dotazione_iniziale: item.dotazione_iniziale || null,
      carico: item.carico || null
    });
    setEditingIndex(item.originalIndex);
    setIsEditing(true);
  };

  const handleDuplicate = (item) => {
    const nextCatalog = [...catalog];
    const baseName = item.nome;
    const duplicated = {
      ...item,
      nome: `${baseName}_copia`
    };
    // Rimuoviamo index originale
    delete duplicated.originalIndex;
    
    nextCatalog.push(duplicated);
    onUpdate(nextCatalog);
    alert(`Oggetto "${baseName}" duplicato come "${duplicated.nome}"!`);
  };

  const handleDelete = (index) => {
    const item = catalog[index];
    if (confirm(`Sei sicuro di voler eliminare permanentemente "${item.nome}" dal catalogo?`)) {
      const nextCatalog = catalog.filter((_, idx) => idx !== index);
      onUpdate(nextCatalog);
    }
  };

  const handleSaveForm = (e) => {
    e.preventDefault();
    if (!formState.nome.trim()) {
      alert("Il nome dell'oggetto è obbligatorio!");
      return;
    }

    const savedItem = {
      categoria: formState.categoria,
      nome: formState.nome.trim(),
      costo_MB: parseFloat(formState.costo_MB) || 0,
      "peso in kg": formState["peso in kg"] !== '' ? parseFloat(formState["peso in kg"]) : null,
      abbreviazione: formState.abbreviazione.trim() || null,
      note: formState.note.trim() || null,
      dotazione_iniziale: formState.dotazione_iniziale || null,
      carico: formState.carico || null
    };

    const nextCatalog = [...catalog];
    if (editingIndex === null) {
      // Nuovo oggetto
      nextCatalog.push(savedItem);
      alert(`Oggetto "${savedItem.nome}" aggiunto con successo!`);
    } else {
      // Modifica esistente
      nextCatalog[editingIndex] = savedItem;
      alert(`Oggetto "${savedItem.nome}" modificato con successo!`);
    }

    onUpdate(nextCatalog);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="card">
        <div className="card-header flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={() => setIsEditing(false)} style={{ padding: '0.35rem 0.5rem' }}>
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="card-title" style={{ margin: 0 }}>
              {editingIndex === null ? 'Aggiungi Oggetto al Catalogo' : 'Modifica Oggetto'}
            </h2>
          </div>
        </div>
        <div className="card-body">
          <form onSubmit={handleSaveForm} className="space-y-4" style={{ maxWidth: '500px' }}>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Categoria (obbligatorio):</label>
              <select 
                className="w-full p-2 border rounded text-sm bg-white"
                value={formState.categoria}
                onChange={e => setFormState(prev => ({ ...prev, categoria: e.target.value }))}
              >
                {categories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Nome Oggetto (obbligatorio):</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded text-sm"
                value={formState.nome}
                onChange={e => setFormState(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Es: Spada Lunga"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Costo in MB (obbligatorio):</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  className="w-full p-2 border rounded text-sm"
                  value={formState.costo_MB}
                  onChange={e => setFormState(prev => ({ ...prev, costo_MB: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Peso in kg (obbligatorio/indicativo):</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  className="w-full p-2 border rounded text-sm"
                  value={formState["peso in kg"] === null ? '' : formState["peso in kg"]}
                  onChange={e => setFormState(prev => ({ ...prev, "peso in kg": e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Abbreviazione (opzionale):</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded text-sm"
                  value={formState.abbreviazione}
                  onChange={e => setFormState(prev => ({ ...prev, abbreviazione: e.target.value }))}
                  placeholder="Es: (sp)"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Note (opzionale):</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded text-sm"
                value={formState.note}
                onChange={e => setFormState(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Es: A due mani, da taglio..."
              />
            </div>

            <div className="grid grid-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Dotazione Iniziale:</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '38px' }}>
                  <input 
                    type="checkbox" 
                    id="dotazione_iniziale"
                    className="w-4 h-4 rounded text-primary-color focus:ring-primary-color"
                    style={{ cursor: 'pointer' }}
                    checked={formState.dotazione_iniziale === 'sì'}
                    onChange={e => setFormState(prev => ({ ...prev, dotazione_iniziale: e.target.checked ? 'sì' : null }))}
                  />
                  <label htmlFor="dotazione_iniziale" style={{ fontSize: '0.8rem', color: '#4b5563', cursor: 'pointer', fontWeight: 600 }}>
                    Fornito alla creazione
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Posizionamento Carico:</label>
                <select 
                  className="w-full p-2 border rounded text-sm bg-white"
                  value={formState.carico || ''}
                  onChange={e => setFormState(prev => ({ ...prev, carico: e.target.value || null }))}
                >
                  <option value="">Nessuno (Usa default)</option>
                  <option value="sì">Sì (Colonna CARICO, genera peso)</option>
                  <option value="no">No (Colonna EQUIP, indossato/pronto)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Save className="w-4 h-4" />
                Salva Oggetto
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setIsEditing(false)}>
                Annulla
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <div>
          <h2 className="card-title" style={{ margin: 0 }}>Gestione Catalogo Equipaggiamento</h2>
          <p className="card-description" style={{ margin: '0.2rem 0 0 0' }}>Visualizza, aggiungi o modifica gli oggetti disponibili per l'acquisto nel wizard.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenNew} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}>
          <Plus className="w-4 h-4" />
          Aggiungi Oggetto
        </button>
      </div>

      <div className="card-body">
        {/* Categorie: pulsanti orizzontali */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
          {sortedCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`btn ${filterCategory === cat ? 'btn-primary' : 'btn-outline'}`}
              style={{ 
                padding: '0.35rem 0.7rem', 
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                fontWeight: 700,
                backgroundColor: filterCategory === cat ? 'var(--primary-color)' : 'transparent',
                borderColor: filterCategory === cat ? 'var(--primary-color)' : '#cbd5e1',
                color: filterCategory === cat ? '#fff' : '#475569'
              }}
            >
              {cat}
            </button>
          ))}
          <button
            onClick={() => setFilterCategory('all')}
            className={`btn ${filterCategory === 'all' ? 'btn-primary' : 'btn-outline'}`}
            style={{ 
              padding: '0.35rem 0.7rem', 
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              fontWeight: 700,
              backgroundColor: filterCategory === 'all' ? 'var(--primary-color)' : 'transparent',
              borderColor: filterCategory === 'all' ? 'var(--primary-color)' : '#cbd5e1',
              color: filterCategory === 'all' ? '#fff' : '#475569'
            }}
          >
            TUTTI
          </button>
        </div>

        {/* Ricerca testuale */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search className="w-4 h-4 text-gray-400" style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Cerca oggetto..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full p-2 border rounded text-sm"
              style={{ paddingLeft: '2rem', paddingRight: '2rem' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '0.4rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  fontSize: '1.1rem',
                  padding: '0.2rem',
                  lineHeight: 1
                }}
                title="Cancella ricerca"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Tabella */}
        <div style={{ overflowX: 'auto' }}>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-[10px] text-gray-500 font-bold uppercase">
                <th className="px-3 py-2">Categoria</th>
                <th className="px-3 py-2">Nome</th>
                <th className="px-2 py-2 text-center" style={{ width: '80px' }}>Costo (MB)</th>
                <th className="px-2 py-2 text-center" style={{ width: '80px' }}>Peso (kg)</th>
                <th className="px-3 py-2">Note</th>
                <th className="px-3 py-2 text-center" style={{ width: '130px' }}>Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Nessun oggetto corrisponde ai filtri impostati.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.originalIndex} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2 font-semibold text-gray-500 uppercase text-[9px] tracking-wider">
                      {item.categoria}
                    </td>
                    <td className="px-3 py-2 font-bold text-gray-800">
                      {item.nome} {item.abbreviazione && <span className="text-gray-400 font-normal">{item.abbreviazione}</span>}
                      <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.2rem' }}>
                        {item.dotazione_iniziale === 'sì' && (
                          <span style={{ fontSize: '9px', background: '#dcfce7', color: '#166534', padding: '0.1rem 0.3rem', borderRadius: '4px', fontWeight: 'bold' }}>
                            DOTAZ. INIZIALE
                          </span>
                        )}
                        {item.carico && (
                          <span style={{ fontSize: '9px', background: item.carico === 'sì' ? '#eff6ff' : '#f3f4f6', color: item.carico === 'sì' ? '#1e40af' : '#374151', padding: '0.1rem 0.3rem', borderRadius: '4px', fontWeight: 'bold' }}>
                            CARICO: {item.carico.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center font-bold text-amber-800">
                      {item.costo_MB.toFixed(2)}
                    </td>
                    <td className="px-2 py-2 text-center text-gray-600 font-medium">
                      {item["peso in kg"] !== null ? `${item["peso in kg"]} kg` : '—'}
                    </td>
                    <td className="px-3 py-2 text-gray-500">
                      {item.note || '—'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                        <button 
                          className="btn btn-outline" 
                          onClick={() => handleOpenEdit(item)}
                          style={{ padding: '0.25rem', height: '26px' }}
                          title="Modifica"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          className="btn btn-outline" 
                          onClick={() => handleDuplicate(item)}
                          style={{ padding: '0.25rem', height: '26px' }}
                          title="Duplica"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          className="btn btn-outline text-red-600 hover:bg-red-50" 
                          onClick={() => handleDelete(item.originalIndex)}
                          style={{ padding: '0.25rem', height: '26px', borderColor: 'rgba(220, 38, 38, 0.2)' }}
                          title="Elimina"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
