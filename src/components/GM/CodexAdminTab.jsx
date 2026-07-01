import React, { useState } from 'react';
import { useCodex } from '../../contexts/CodexContext';
import { Search, Plus, Trash2, Edit2, Check, AlertCircle, RefreshCw, Eye, Settings, HelpCircle, Save } from 'lucide-react';

export default function CodexAdminTab() {
  const {
    items,
    config,
    loading,
    saveCodexItem,
    deleteCodexItem,
    updateConfig,
    importDefaultsToFirestore
  } = useCodex();

  // Tab locale per dividere impostazioni e dizionario
  const [activeSubTab, setActiveSubTab] = useState('settings');

  // Stato per la ricerca e filtri dizionario
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Stato per la creazione/modifica voce
  const [editingItem, setEditingItem] = useState(null); // null per nuovo
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('caratteristiche');
  const [synonymsText, setSynonymsText] = useState('');
  const [description, setDescription] = useState('');

  const [formError, setFormError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [importing, setImporting] = useState(false);

  // Categorie supportate
  const CATEGORIES = [
    { id: 'caratteristiche', label: 'Caratteristiche (es: Forza, AG)' },
    { id: 'abilita', label: 'Abilità (es: Nuotare, Percezione)' },
    { id: 'popoli', label: 'Popoli (es: Nani, Elfi)' },
    { id: 'professioni', label: 'Professioni (es: Guerriero, Mago)' },
    { id: 'oggetti', label: 'Oggetti (es: Cotta di maglia, Armi)' },
    { id: 'creature', label: 'Animali e Creature' }
  ];

  // Pagine/Sezioni supportate (Fase 1: solo scheda_riepilogo)
  const PAGES = [
    { id: 'scheda_riepilogo', label: 'Scheda Personaggio (Riepilogo Creazione & Portale Giocatore)' }
  ];

  // Filtra gli elementi del dizionario
  const filteredItems = items.filter(item => {
    const matchesSearch = item.keyword.toLowerCase().includes(search.toLowerCase()) ||
                          (item.description || '').toLowerCase().includes(search.toLowerCase()) ||
                          (item.synonyms || []).some(s => s.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Gestione salvataggio form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setActionSuccess('');

    if (!keyword.trim()) {
      setFormError('La parola chiave principale è obbligatoria.');
      return;
    }
    if (!description.trim()) {
      setFormError('La descrizione è obbligatoria.');
      return;
    }

    // Splitta i sinonimi per virgola
    const synonyms = synonymsText
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    try {
      const itemData = {
        keyword: keyword.trim(),
        category,
        synonyms,
        description: description.trim()
      };

      if (editingItem) {
        itemData.id = editingItem.id;
      }

      await saveCodexItem(itemData);
      setActionSuccess(editingItem ? 'Voce modificata con successo!' : 'Nuova voce aggiunta con successo!');
      resetForm();
      
      // Auto clear success
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setFormError('Errore durante il salvataggio su Firestore.');
    }
  };

  // Carica elemento per modifica
  const startEdit = (item) => {
    setEditingItem(item);
    setKeyword(item.keyword);
    setCategory(item.category);
    setSynonymsText((item.synonyms || []).join(', '));
    setDescription(item.description);
    setFormError('');
  };

  const resetForm = () => {
    setEditingItem(null);
    setKeyword('');
    setCategory('caratteristiche');
    setSynonymsText('');
    setDescription('');
    setFormError('');
  };

  // Caricamento dei defaults
  const handleImportDefaults = async () => {
    if (!window.confirm("Sei sicuro di voler importare le definizioni regolamentari predefinite? Eventuali voci con lo stesso nome verranno sovrascritte.")) {
      return;
    }
    setImporting(true);
    try {
      await importDefaultsToFirestore();
      setActionSuccess("Definizioni predefinite importate con successo su Firestore!");
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      alert("Errore durante l'importazione dei defaults.");
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteItem = async (id, name) => {
    if (!window.confirm(`Sei sicuro di voler eliminare la voce "${name}" dal Codex?`)) {
      return;
    }
    try {
      await deleteCodexItem(id);
      setActionSuccess("Voce eliminata con successo.");
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      alert("Errore durante l'eliminazione.");
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
      {/* Sotto-tab Navigazione */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex flex-wrap justify-between items-center gap-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab('settings')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Configura Visibilità
          </button>
          <button
            onClick={() => setActiveSubTab('dictionary')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeSubTab === 'dictionary'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Dizionario Codex ({items.length} voci)
          </button>
        </div>

        <button
          onClick={handleImportDefaults}
          disabled={importing}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${importing ? 'animate-spin' : ''}`} />
          Carica Definizioni Standard
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-gray-400">
          <RefreshCw className="w-8 h-8 animate-spin mb-2 text-indigo-500" />
          <span className="text-sm">Caricamento configurazione Codex...</span>
        </div>
      ) : (
        <div className="flex-1 p-6">
          {actionSuccess && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 text-xs font-semibold rounded-lg flex items-center gap-1.5">
              <Check className="w-4 h-4 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* TAB 1: CONFIGURAZIONE VISIBILITA */}
          {activeSubTab === 'settings' && (
            <div className="space-y-6">
              <div className="border-b border-gray-150 pb-3">
                <h3 className="text-base font-extrabold text-gray-800">Console di Posizionamento Tooltip</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Seleziona quali categorie di definizioni mostrare (con la sottolineatura tratteggiata) in ciascuna pagina del sistema.
                </p>
              </div>

              <div className="space-y-4">
                {PAGES.map(page => (
                  <div key={page.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50/30">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-indigo-600" />
                      {page.label}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pl-6">
                      {CATEGORIES.map(cat => {
                        const isEnabled = config[page.id]?.[cat.id] ?? defaultConfig[page.id]?.[cat.id] ?? false;
                        return (
                          <label
                            key={cat.id}
                            className="flex items-center gap-2.5 p-2.5 bg-white border border-gray-250 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={(e) => updateConfig(page.id, cat.id, e.target.checked)}
                              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                            />
                            <div>
                              <span className="text-xs font-bold text-gray-800 block capitalize">{cat.id}</span>
                              <span className="text-[10px] text-gray-400">{cat.label}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: DIZIONARIO CODEX */}
          {activeSubTab === 'dictionary' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Form Creazione/Modifica */}
              <div className="lg:col-span-1 bg-gray-50/50 p-4 rounded-xl border border-gray-250 flex flex-col gap-4 self-start">
                <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider border-b border-gray-200 pb-2 flex items-center gap-1">
                  {editingItem ? <Edit2 className="w-3.5 h-3.5 text-amber-500" /> : <Plus className="w-3.5 h-3.5 text-indigo-600" />}
                  {editingItem ? 'Modifica Voce' : 'Nuova Voce Codex'}
                </h4>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {formError && (
                    <div className="p-2.5 bg-red-50 text-red-700 text-[11px] rounded-md flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Parola Chiave:</label>
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder="es. Forza"
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold bg-white text-gray-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Categoria:</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-semibold text-gray-700"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.id.toUpperCase()} ({cat.label.split(' ')[0]})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Sinonimi / Sigle:</label>
                      <span className="text-[9px] text-gray-400">Separati da virgola</span>
                    </div>
                    <input
                      type="text"
                      value={synonymsText}
                      onChange={(e) => setSynonymsText(e.target.value)}
                      placeholder="es. FR, fr, forza fisica"
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">Descrizione:</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Scrivi la descrizione che comparirà nel tooltip..."
                      rows={4}
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-800 leading-normal"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-1 text-xs transition-colors shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Salva Voce
                    </button>
                    {editingItem && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-3 py-2 rounded-lg text-xs transition-colors"
                      >
                        Annulla
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Lista Elementi */}
              <div className="lg:col-span-2 flex flex-col h-[550px] overflow-hidden">
                {/* Search & Filter Header */}
                <div className="flex gap-3 mb-3">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Cerca parole chiave, sinonimi, testi..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-800"
                    />
                  </div>
                  
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-semibold text-gray-700"
                  >
                    <option value="all">Tutte le categorie</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.id.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                {/* Lista Scrollabile */}
                <div className="flex-1 overflow-y-auto space-y-2 border border-gray-200 rounded-xl p-3 bg-gray-50/20 pr-1.5">
                  {filteredItems.length === 0 ? (
                    <div className="text-center py-12 text-xs text-gray-400">Nessuna voce trovata nel Codex.</div>
                  ) : (
                    filteredItems.map(item => (
                      <div
                        key={item.id}
                        className={`p-3.5 bg-white border rounded-xl shadow-xs flex justify-between gap-4 transition-all hover:border-indigo-300 ${
                          editingItem?.id === item.id ? 'ring-2 ring-indigo-500/30 border-indigo-500' : 'border-gray-200'
                        }`}
                      >
                        <div className="space-y-1.5 text-left flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="text-xs font-black text-slate-800 truncate">{item.keyword}</span>
                            <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                              {item.category}
                            </span>
                            {item.synonyms && item.synonyms.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {item.synonyms.map(syn => (
                                  <span key={syn} className="text-[8px] font-bold bg-gray-150 text-gray-500 px-1 rounded">
                                    {syn}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-600 leading-normal">{item.description}</p>
                        </div>

                        <div className="flex items-start gap-1 shrink-0">
                          <button
                            onClick={() => startEdit(item)}
                            title="Modifica voce"
                            className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id, item.keyword)}
                            title="Elimina voce"
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
