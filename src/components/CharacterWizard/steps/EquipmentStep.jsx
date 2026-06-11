import { useState, useEffect, useMemo, Fragment } from 'react';
import { Shield, Heart, HelpCircle, Save, Info, AlertTriangle, AlertCircle, Search } from 'lucide-react';
import catalogData from '../../../data/TS-4-equipaggiamento.json';
import WalletBox from '../shared/WalletBox';
import AnagraficaReadOnlyBox from '../shared/AnagraficaReadOnlyBox';
import { formatMBToCoins, formatCoinsToString } from '../../../utils/moneyHelpers';
import { calculateCargoPenalty } from '../../../utils/skillHelpers';

const getWeaponGroup = (item) => {
  const nome = (item.nome || '').toLowerCase();
  const note = (item.note || '').toLowerCase();
  
  if (note.includes('da taglio') && (note.includes('1 mano') || note.includes('una mano'))) {
    return 'da taglio a 1 mano';
  }
  if (note.includes('contundente') && (note.includes('1 mano') || note.includes('una mano'))) {
    return 'contundenti a una mano';
  }
  if (note.includes('2 mani') || nome.includes('a 2 mani') || nome.includes('a due mani')) {
    return 'a 2 mani';
  }
  if (note.includes('tiro')) {
    return 'da tiro';
  }
  if (note.includes('lancio') || nome.includes('giavellotto') || nome.includes('lancia') || note.includes('da lancio')) {
    return 'da lancio';
  }
  
  // Fallbacks per sicurezza basati sui nomi tipici delle armi di MERP
  if (nome.includes('spada') || nome.includes('pugnale') || nome.includes('accetta') || nome.includes('scimitarra') || nome.includes('frusta')) {
    return 'da taglio a 1 mano';
  }
  if (nome.includes('randello') || nome.includes('mazzafrusto') || nome.includes('rete') || nome.includes('martello')) {
    return 'contundenti a una mano';
  }
  if (nome.includes('ascia da battaglia') || nome.includes('flagello') || nome.includes('alabarda') || nome.includes('bastone')) {
    return 'a 2 mani';
  }
  if (nome.includes('arco') || nome.includes('balestra') || nome.includes('fionda')) {
    return 'da tiro';
  }
  if (nome.includes('bolas') || nome.includes('giavellotto') || nome.includes('lancia')) {
    return 'da lancio';
  }
  
  return 'da taglio a 1 mano';
};

const WEAPON_GROUPS = [
  'da taglio a 1 mano',
  'contundenti a una mano',
  'a 2 mani',
  'da tiro',
  'da lancio'
];

export default function EquipmentStep({ characterData, setCharacterData, equipmentCatalog }) {
  const pesoPG = characterData.peso || 70; // fallback se non inserito (ma validato a step 3)
  const catalog = equipmentCatalog || catalogData;

  // Categorie uniche presenti nel catalogo
  const categories = [...new Set(catalog.map(item => item.categoria))];
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Inizializza lo stato locale degli oggetti con i valori già salvati nel personaggio
  const initialEquipment = useMemo(() => {
    if (characterData.equipment) return characterData.equipment;

    // Se è la creazione di un nuovo personaggio, pre-popoliamo la dotazione iniziale
    const startingGear = [];
    catalog.forEach(item => {
      if (item.dotazione_iniziale === 'sì') {
        startingGear.push({
          nome: item.nome,
          categoria: item.categoria,
          abbreviazione: item.abbreviazione,
          costo_MB: item.costo_MB,
          "peso in kg": item["peso in kg"],
          note_base: item.note,
          qtyEquip: item.carico === 'no' ? 1 : 0,
          qtyCarico: item.carico === 'sì' ? 1 : 0,
          note: ''
        });
      }
    });
    return startingGear;
  }, [characterData.equipment, catalog]);

  // Mappa locale per tenere traccia delle quantità inserite e note
  const [itemsState, setItemsState] = useState(() => {
    const state = {};
    catalog.forEach((item, index) => {
      const key = `${item.categoria}_${item.nome}_${index}`;
      const saved = initialEquipment.find(x => x.nome === item.nome && x.categoria === item.categoria);
      state[key] = {
        qtyEquip: saved ? (saved.qtyEquip || 0) : 0,
        qtyCarico: saved ? (saved.qtyCarico || 0) : 0,
        acquisto: false,
        note: saved ? (saved.note || '') : ''
      };
    });
    return state;
  });

  // Calcolo del costo, del peso e delle penalità in tempo reale
  const summary = useMemo(() => {
    let costoTotaleMB = 0;
    let pesoCaricoKg = 0;
    
    catalog.forEach((item, index) => {
      const key = `${item.categoria}_${item.nome}_${index}`;
      const state = itemsState[key] || { qtyEquip: 0, qtyCarico: 0, acquisto: false, note: '' };
      
      const newTotal = state.qtyEquip + state.qtyCarico;
      
      const saved = initialEquipment.find(x => x.nome === item.nome && x.categoria === item.categoria);
      const oldTotal = saved ? ((saved.qtyEquip || 0) + (saved.qtyCarico || 0)) : 0;
      
      // Costo incrementale solo sulla differenza se ACQUISTO è spuntata
      if (state.acquisto && newTotal > oldTotal) {
        const delta = newTotal - oldTotal;
        costoTotaleMB += delta * (item.costo_MB || 0);
      }

      // Peso di carico (generato solo dagli oggetti in colonna CARICO)
      const pesoUnitario = item["peso in kg"] || 0;
      pesoCaricoKg += state.qtyCarico * pesoUnitario;
    });

    // Arrotondamento peso per difetto
    const caricoArrotondato = Math.floor(pesoCaricoKg);
    
    // Calcolo penalità da tabella TB_5
    const { penalita, caricoBloccato } = calculateCargoPenalty(pesoPG, pesoCaricoKg);

    return {
      costoTotaleMB,
      pesoCaricoKg,
      caricoArrotondato,
      penalita,
      caricoBloccato
    };
  }, [itemsState, initialEquipment, pesoPG]);

  // Validazione step
  useEffect(() => {
    let err = null;
    if (summary.caricoBloccato) {
      err = `Carico Eccessivo (${summary.caricoArrotondato} kg): Il personaggio non è in grado di trasportare questo peso. Riduci gli oggetti nella colonna CARICO.`;
    } else if (characterData.equipment === undefined) {
      err = "Devi salvare e consolidare l'equipaggiamento iniziale premendo il pulsante 'Salva e Consolida Equipaggiamento' prima di poter procedere.";
    }

    if (characterData.stepErrors?.equipment !== err) {
      setCharacterData(prev => ({
        ...prev,
        stepErrors: {
          ...(prev.stepErrors || {}),
          equipment: err
        }
      }));
    }
  }, [summary.caricoBloccato, summary.caricoArrotondato, characterData.equipment, characterData.stepErrors, setCharacterData]);

  const handleQtyChange = (key, field, val) => {
    setItemsState(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: Math.max(0, parseInt(val) || 0)
      }
    }));
  };

  const handleAcquistoChange = (key, val) => {
    setItemsState(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        acquisto: val
      }
    }));
  };

  const handleNoteChange = (key, val) => {
    setItemsState(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        note: val
      }
    }));
  };

  // Salvataggio dell'equipaggiamento e aggiornamento del portafoglio
  const handleSave = () => {
    if (summary.caricoBloccato) {
      alert("Impossibile salvare: il carico del personaggio è insostenibile (NA).");
      return;
    }

    const currentPortafoglio = characterData.portafoglioMB || 0;
    const nextPortafoglio = Math.round((currentPortafoglio - summary.costoTotaleMB) * 100) / 100;

    if (nextPortafoglio < 0) {
      const confirmProceed = window.confirm(
        `Attenzione: la spesa totale (${summary.costoTotaleMB.toFixed(2)} MB) supera il denaro posseduto (${currentPortafoglio.toFixed(2)} MB).\nIl portafoglio andrà in negativo (${nextPortafoglio.toFixed(2)} MB). Vuoi procedere?`
      );
      if (!confirmProceed) return;
    }

    // Costruiamo la lista degli oggetti salvati con quantità > 0
    const equipmentList = [];
    let armorEquipped = characterData.equippedArmor || null;
    let shieldEquipped = characterData.equippedShield || false;

    catalog.forEach((item, index) => {
      const key = `${item.categoria}_${item.nome}_${index}`;
      const state = itemsState[key];
      if (state && (state.qtyEquip > 0 || state.qtyCarico > 0)) {
        equipmentList.push({
          nome: item.nome,
          categoria: item.categoria,
          abbreviazione: item.abbreviazione,
          costo_MB: item.costo_MB,
          "peso in kg": item["peso in kg"],
          note_base: item.note,
          qtyEquip: state.qtyEquip,
          qtyCarico: state.qtyCarico,
          note: state.note.trim()
        });

        // Riconoscimento automatico per equipaggiare scudo o armatura
        if (item.categoria === 'armatura') {
          if (item.nome.toLowerCase().includes('scudo')) {
            shieldEquipped = true;
          } else if (item.note && item.note.toLowerCase().includes('armatura')) {
            // È un'armatura completa corporea
            armorEquipped = item.nome;
          }
        }
      }
    });

    setCharacterData(prev => ({
      ...prev,
      portafoglioMB: nextPortafoglio,
      equipment: equipmentList,
      caricoKg: summary.pesoCaricoKg,
      penalitaCarico: summary.penalita,
      equippedArmor: armorEquipped,
      equippedShield: shieldEquipped
    }));

    // Resettiamo le checkbox di acquisto dopo il salvataggio consolidato
    setItemsState(prev => {
      const nextState = { ...prev };
      Object.keys(nextState).forEach(k => {
        nextState[k] = {
          ...nextState[k],
          acquisto: false
        };
      });
      return nextState;
    });

    alert("Equipaggiamento salvato con successo!");
  };

  const activeItems = useMemo(() => {
    return catalog
      .map((item, index) => ({ item, index, key: `${item.categoria}_${item.nome}_${index}` }))
      .filter(x => {
        // Se c'è ricerca testuale, ignora il filtro categoria
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          return (x.item.nome || '').toLowerCase().includes(q) ||
                 (x.item.note || '').toLowerCase().includes(q);
        }
        // Altrimenti filtra per categoria
        return activeCategory === 'all' || x.item.categoria === activeCategory;
      });
  }, [activeCategory, catalog, searchQuery]);

  const groupedWeapons = useMemo(() => {
    if (activeCategory !== 'armi') return null;

    const groups = {
      'da taglio a 1 mano': [],
      'contundenti a una mano': [],
      'a 2 mani': [],
      'da tiro': [],
      'da lancio': []
    };

    activeItems.forEach(x => {
      const grp = getWeaponGroup(x.item);
      if (groups[grp]) {
        groups[grp].push(x);
      } else {
        groups['da taglio a 1 mano'].push(x);
      }
    });

    // Ordina alfabeticamente all'interno di ciascun gruppo
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.item.nome.localeCompare(b.item.nome));
    });

    return groups;
  }, [activeCategory, activeItems]);

  const getMagicRealmSummaryStep7 = () => {
    const spellListAllocations = characterData.spellListAllocations || {};
    const bgSpellLists = characterData.background?.compiledModifiers?.bgSpellLists || [];
    const allLists = [...new Set([...Object.keys(spellListAllocations), ...bgSpellLists])];
    
    if (allLists.length > 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {allLists.map((name, i) => (
            <div key={i}>Lista incantesimi {name} appresa.</div>
          ))}
        </div>
      );
    }
    
    const inheritedChance = characterData.spellListChanceAccumulated !== undefined 
      ? characterData.spellListChanceAccumulated 
      : 0;
    return <div>Nessuna lista incantesimi appresa - Credito ereditato: {inheritedChance}%</div>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <AnagraficaReadOnlyBox characterData={characterData} />
      
      {/* ── HEADER BANNER ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '0.25rem' }}>
        <div style={{ padding: '1rem', border: '1px solid var(--theme-race-border)', borderRadius: '0.6rem', background: 'var(--theme-race-bg)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--theme-race-text)' }}>Popolo</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--theme-race-text)', marginTop: '0.2rem' }}>{characterData.race?.nome || characterData.race?.popolo}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--theme-race-text)', opacity: 0.85, marginTop: '0.15rem' }}>{characterData.race?.categoria || characterData.race?.['note (umani/non umani)']}</div>
        </div>
        <div style={{ padding: '1rem', border: '1px solid var(--theme-profession-border)', borderRadius: '0.6rem', background: 'var(--theme-profession-bg)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--theme-profession-text)' }}>Professione</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--theme-profession-text)', marginTop: '0.2rem' }}>{characterData.profession?.professione}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--theme-profession-text)', opacity: 0.85, marginTop: '0.15rem' }}>
            {characterData.profession && `Primaria: ${characterData.profession.primaria} | Secondaria: ${characterData.profession.secondaria}`}
          </div>
        </div>
        <div style={{ padding: '1rem', border: '1px solid var(--theme-spell-lists-border)', borderRadius: '0.6rem', background: 'var(--theme-spell-lists-bg)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--theme-spell-lists-text)' }}>Reame Magico</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--theme-spell-lists-text)', marginTop: '0.2rem' }}>{characterData.magicRealm || 'Nessuno'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--theme-spell-lists-text)', opacity: 0.85, marginTop: '0.15rem', fontWeight: 500 }}>
            {getMagicRealmSummaryStep7()}
          </div>
        </div>
      </div>

      {/* Portafoglio */}
      <WalletBox 
        portafoglioMB={characterData.portafoglioMB || 0} 
        onChange={(newVal) => setCharacterData(prev => ({ ...prev, portafoglioMB: newVal }))}
      />

      {/* Riassunto Spesa e Carico in alto, affiancati su 3 colonne */}
      <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        
        {/* Costo Speso */}
        <div className="card" style={{ borderLeft: '4px solid #d97706', backgroundColor: '#fefaf0', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: '#b45309', letterSpacing: '0.05em' }}>Costo Acquisti Correnti</div>
            <div className="font-black mt-1" style={{ fontSize: '1.25rem', color: '#78350f', marginTop: '0.25rem' }}>
              {summary.costoTotaleMB.toFixed(2)} MB
            </div>
            <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: '500' }}>
              ({formatCoinsToString(formatMBToCoins(summary.costoTotaleMB))})
            </div>
          </div>
          <p style={{ fontSize: '10px', color: '#b45309', marginTop: '0.5rem', opacity: 0.8 }}>
            Addebitato solo per gli oggetti contrassegnati con "ACQUISTO".
          </p>
        </div>

        {/* Peso Trasportato */}
        <div className="card" style={{ borderLeft: '4px solid #2563eb', backgroundColor: '#eff6ff', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: '#1d4ed8', letterSpacing: '0.05em' }}>Carico Trasportato</div>
            <div className="font-black mt-1" style={{ fontSize: '1.25rem', color: '#1e3a8a', marginTop: '0.25rem' }}>
              {summary.pesoCaricoKg.toFixed(2)} kg
            </div>
            <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: '500' }}>
              Arrotondato: {summary.caricoArrotondato} kg
            </div>
          </div>
          <p style={{ fontSize: '10px', color: '#1d4ed8', marginTop: '0.5rem', opacity: 0.8 }}>
            Gli oggetti nella colonna EQUIP non generano carico.
          </p>
        </div>

        {/* Penalità Risultante */}
        <div className="card" style={{ 
          borderLeft: `4px solid ${summary.caricoBloccato ? '#dc2626' : '#16a34a'}`, 
          backgroundColor: summary.caricoBloccato ? '#fef2f2' : '#f0fdf4',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: summary.caricoBloccato ? '#b91c1c' : '#15803d', letterSpacing: '0.05em' }}>
              Penalità di Carico
            </div>
            <div className="font-black mt-1" style={{ fontSize: '1.25rem', color: summary.caricoBloccato ? '#7f1d1d' : '#14532d', marginTop: '0.25rem' }}>
              {summary.caricoBloccato ? 'NA (ECCESSO)' : `-${summary.penalita}`}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '500', color: summary.caricoBloccato ? '#b91c1c' : '#15803d' }}>
              {summary.caricoBloccato ? 'Peso insostenibile per la corporatura' : 'Malus alle Manovre in Movimento'}
            </div>
          </div>
          <p style={{ fontSize: '10px', color: summary.caricoBloccato ? '#991b1b' : '#166534', marginTop: '0.5rem', opacity: 0.8 }}>
            Riferimento peso corporeo PG: {pesoPG} kg.
          </p>
        </div>

      </div>

      {/* Ricerca testuale */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search className="w-4 h-4" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input 
            type="text" 
            placeholder="Cerca oggetto per nome o note..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 2rem 0.5rem 2rem',
              fontSize: '0.85rem',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              backgroundColor: '#f8fafc',
              outline: 'none'
            }}
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

      {/* Tabs Categorie */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`btn ${activeCategory === cat ? 'btn-primary' : 'btn-outline'}`}
            style={{ 
              padding: '0.4rem 0.8rem', 
              fontSize: '0.8rem',
              textTransform: 'uppercase',
              fontWeight: 700,
              backgroundColor: activeCategory === cat ? 'var(--primary-color)' : 'transparent',
              borderColor: activeCategory === cat ? 'var(--primary-color)' : '#cbd5e1',
              color: activeCategory === cat ? '#fff' : '#475569'
            }}
          >
            {cat}
          </button>
        ))}
        <button
          onClick={() => setActiveCategory('all')}
          className={`btn ${activeCategory === 'all' ? 'btn-primary' : 'btn-outline'}`}
          style={{ 
            padding: '0.4rem 0.8rem', 
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            fontWeight: 700,
            backgroundColor: activeCategory === 'all' ? 'var(--primary-color)' : 'transparent',
            borderColor: activeCategory === 'all' ? 'var(--primary-color)' : '#cbd5e1',
            color: activeCategory === 'all' ? '#fff' : '#475569'
          }}
        >
          TUTTI
        </button>
      </div>

      {/* Tabella Equipaggiamento */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-[10px] text-gray-500 font-bold uppercase">
              <th className="px-3 py-2">Oggetto / Dettagli</th>
              <th className="px-2 py-2 text-center" style={{ width: '70px' }}>Peso (kg)</th>
              <th className="px-2 py-2 text-center" style={{ width: '75px' }}>Costo (MB)</th>
              <th className="px-2 py-2 text-center" style={{ width: '100px' }}>EQUIP</th>
              <th className="px-2 py-2 text-center" style={{ width: '100px' }}>CARICO</th>
              <th className="px-2 py-2 text-center" style={{ width: '70px' }}>ACQUISTO</th>
              <th className="px-3 py-2">Note Utente</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {activeCategory === 'armi' && groupedWeapons ? (
              WEAPON_GROUPS.map(groupName => {
                const items = groupedWeapons[groupName] || [];
                if (items.length === 0) return null;
                return (
                  <Fragment key={groupName}>
                    {/* Header di sezione per la tipologia di arma */}
                    <tr style={{ backgroundColor: '#f1f5f9', borderTop: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                      <td colSpan="7" className="px-3 py-1.5 font-bold text-slate-700 uppercase tracking-wider text-[9px]">
                        {groupName}
                      </td>
                    </tr>
                    {items.map(({ item, index, key }) => {
                      const state = itemsState[key] || { qtyEquip: 0, qtyCarico: 0, acquisto: false, note: '' };
                      const saved = initialEquipment.find(x => x.nome === item.nome && x.categoria === item.categoria);
                      const oldTotal = saved ? ((saved.qtyEquip || 0) + (saved.qtyCarico || 0)) : 0;
                      const newTotal = state.qtyEquip + state.qtyCarico;
                      const isIncremented = newTotal > oldTotal;

                      const rowClass = state.qtyEquip > 0 ? 'row-equipped' : (state.qtyCarico > 0 ? 'row-carried' : '');

                      return (
                        <tr key={key} className={`hover:bg-gray-50/50 ${rowClass}`}>
                          <td className="px-3 py-2">
                            <div className="font-bold text-gray-800">{item.nome}</div>
                            {item.note && <div className="text-[10px] text-gray-500">{item.note}</div>}
                          </td>
                          <td className="px-2 py-2 text-center text-gray-600 font-medium">
                            {item["peso in kg"] !== null ? `${item["peso in kg"]} kg` : '—'}
                          </td>
                          <td className="px-2 py-2 text-center text-amber-800 font-semibold">
                            {item.costo_MB !== null ? `${item.costo_MB.toFixed(2)}` : '—'}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                              <button 
                                type="button"
                                className="btn btn-outline"
                                onClick={() => handleQtyChange(key, 'qtyEquip', Math.max(0, (state.qtyEquip || 0) - 1))}
                                style={{ padding: 0, fontSize: '0.75rem', height: '24px', width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: '#cbd5e1' }}
                              >
                                -
                              </button>
                              <input 
                                type="number"
                                min="0"
                                className="border rounded text-center text-xs"
                                style={{ width: '32px', padding: '0.1rem', height: '24px' }}
                                value={state.qtyEquip || 0}
                                onChange={e => handleQtyChange(key, 'qtyEquip', e.target.value)}
                              />
                              <button 
                                type="button"
                                className="btn btn-outline"
                                onClick={() => handleQtyChange(key, 'qtyEquip', (state.qtyEquip || 0) + 1)}
                                style={{ padding: 0, fontSize: '0.75rem', height: '24px', width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: '#cbd5e1' }}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                              <button 
                                type="button"
                                className="btn btn-outline"
                                onClick={() => handleQtyChange(key, 'qtyCarico', Math.max(0, (state.qtyCarico || 0) - 1))}
                                style={{ padding: 0, fontSize: '0.75rem', height: '24px', width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: '#cbd5e1' }}
                              >
                                -
                              </button>
                              <input 
                                type="number"
                                min="0"
                                className="border rounded text-center text-xs"
                                style={{ width: '32px', padding: '0.1rem', height: '24px' }}
                                value={state.qtyCarico || 0}
                                onChange={e => handleQtyChange(key, 'qtyCarico', e.target.value)}
                              />
                              <button 
                                type="button"
                                className="btn btn-outline"
                                onClick={() => handleQtyChange(key, 'qtyCarico', (state.qtyCarico || 0) + 1)}
                                style={{ padding: 0, fontSize: '0.75rem', height: '24px', width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: '#cbd5e1' }}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <input 
                              type="checkbox"
                              className="w-4 h-4 rounded text-primary-color focus:ring-primary-color"
                              disabled={!isIncremented}
                              checked={state.acquisto && isIncremented}
                              onChange={e => handleAcquistoChange(key, e.target.checked)}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input 
                              type="text"
                              placeholder="Note..."
                              className="w-full p-1 border rounded text-xs"
                              value={state.note}
                              onChange={e => handleNoteChange(key, e.target.value)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                );
              })
            ) : (
              activeItems.map(({ item, index, key }) => {
                const state = itemsState[key] || { qtyEquip: 0, qtyCarico: 0, acquisto: false, note: '' };
                const saved = initialEquipment.find(x => x.nome === item.nome && x.categoria === item.categoria);
                const oldTotal = saved ? ((saved.qtyEquip || 0) + (saved.qtyCarico || 0)) : 0;
                const newTotal = state.qtyEquip + state.qtyCarico;
                const isIncremented = newTotal > oldTotal;

                const rowClass = state.qtyEquip > 0 ? 'row-equipped' : (state.qtyCarico > 0 ? 'row-carried' : '');

                return (
                  <tr key={key} className={`hover:bg-gray-50/50 ${rowClass}`}>
                    <td className="px-3 py-2">
                      <div className="font-bold text-gray-800">{item.nome}</div>
                      {item.note && <div className="text-[10px] text-gray-500">{item.note}</div>}
                    </td>
                    <td className="px-2 py-2 text-center text-gray-600 font-medium">
                      {item["peso in kg"] !== null ? `${item["peso in kg"]} kg` : '—'}
                    </td>
                    <td className="px-2 py-2 text-center text-amber-800 font-semibold">
                      {item.costo_MB !== null ? `${item.costo_MB.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                        <button 
                          type="button"
                          className="btn btn-outline"
                          onClick={() => handleQtyChange(key, 'qtyEquip', Math.max(0, (state.qtyEquip || 0) - 1))}
                          style={{ padding: 0, fontSize: '0.75rem', height: '24px', width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: '#cbd5e1' }}
                        >
                          -
                        </button>
                        <input 
                          type="number"
                          min="0"
                          className="border rounded text-center text-xs"
                          style={{ width: '32px', padding: '0.1rem', height: '24px' }}
                          value={state.qtyEquip || 0}
                          onChange={e => handleQtyChange(key, 'qtyEquip', e.target.value)}
                        />
                        <button 
                          type="button"
                          className="btn btn-outline"
                          onClick={() => handleQtyChange(key, 'qtyEquip', (state.qtyEquip || 0) + 1)}
                          style={{ padding: 0, fontSize: '0.75rem', height: '24px', width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: '#cbd5e1' }}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
                        <button 
                          type="button"
                          className="btn btn-outline"
                          onClick={() => handleQtyChange(key, 'qtyCarico', Math.max(0, (state.qtyCarico || 0) - 1))}
                          style={{ padding: 0, fontSize: '0.75rem', height: '24px', width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: '#cbd5e1' }}
                        >
                          -
                        </button>
                        <input 
                          type="number"
                          min="0"
                          className="border rounded text-center text-xs"
                          style={{ width: '32px', padding: '0.1rem', height: '24px' }}
                          value={state.qtyCarico || 0}
                          onChange={e => handleQtyChange(key, 'qtyCarico', e.target.value)}
                        />
                        <button 
                          type="button"
                          className="btn btn-outline"
                          onClick={() => handleQtyChange(key, 'qtyCarico', (state.qtyCarico || 0) + 1)}
                          style={{ padding: 0, fontSize: '0.75rem', height: '24px', width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderColor: '#cbd5e1' }}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <input 
                        type="checkbox"
                        className="w-4 h-4 rounded text-primary-color focus:ring-primary-color"
                        disabled={!isIncremented}
                        checked={state.acquisto && isIncremented}
                        onChange={e => handleAcquistoChange(key, e.target.checked)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input 
                        type="text"
                        placeholder="Note..."
                        className="w-full p-1 border rounded text-xs"
                        value={state.note}
                        onChange={e => handleNoteChange(key, e.target.value)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>



      {/* Messaggi e Azioni */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-t border-gray-200 pt-4">
        <div className="flex-1">
          {summary.caricoBloccato && (
            <div className="flex items-center gap-2 text-red-700 bg-red-50 p-3 rounded-lg border border-red-200 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>CARICO ECCESSIVO (NA): Il peso trasportato supera i limiti fisici del personaggio. Riduci la quantità in CARICO per poter procedere.</span>
            </div>
          )}
          {characterData.portafoglioMB - summary.costoTotaleMB < 0 && !summary.caricoBloccato && (
            <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Il saldo finale andrà in negativo. Il regolamento lo consente, ma verifica con il Master.</span>
            </div>
          )}
        </div>
        <button
          className="btn btn-primary w-full md:w-auto"
          style={{ 
            backgroundColor: summary.caricoBloccato ? '#ef4444' : 'var(--primary-color)',
            borderColor: summary.caricoBloccato ? '#ef4444' : 'var(--primary-color)',
            opacity: summary.caricoBloccato ? 0.5 : 1,
            cursor: summary.caricoBloccato ? 'not-allowed' : 'pointer'
          }}
          disabled={summary.caricoBloccato}
          onClick={handleSave}
        >
          <Save className="w-4 h-4" />
          Salva e Consolida Equipaggiamento
        </button>
      </div>

    </div>
  );
}
