import React, { useState, useMemo } from 'react';

import { Book, ChevronDown, ChevronRight, Search, Filter, Sparkles, Swords, Heart, Eye, Shield, Zap, HelpCircle } from 'lucide-react';
import elencoIncantesimi from '../data/Tabella-elenco_incantesimi.json';
import listRegistry from '../data/Tabella-liste_incantesimi.json';

// Ordine canonico delle categorie
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

const TIPO_LABELS = {
  'F': { label: 'Forza', color: '#dc2626' },
  'E': { label: 'Elementale', color: '#2563eb' },
  'A': { label: 'Accessorio', color: '#059669' },
  'I': { label: 'Informazione', color: '#7c3aed' },
  'P': { label: 'Passivo', color: '#ca8a04' },
  'U': { label: 'Utilità', color: '#0891b2' },
};

const TIPO_ICONS = {
  'F': Swords,
  'E': Zap,
  'A': Heart,
  'I': Eye,
  'P': Shield,
  'U': Sparkles,
};

function TipoBadge({ tipo }) {
  const info = TIPO_LABELS[tipo] || { label: tipo || '—', color: '#6b7280' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: '0.7rem',
        fontWeight: 700,
        color: info.color,
        backgroundColor: `${info.color}12`,
        padding: '0.15rem 0.45rem',
        borderRadius: '4px',
      }}
      title={info.label}
    >
      {info.label}
    </span>
  );
}

function InstantBadge({ istantaneo }) {
  if (!istantaneo) return null;
  return (
    <span style={{ color: '#dc2626', fontWeight: 800, fontSize: '0.85rem' }} title="Istantaneo">
      *
    </span>
  );
}

function SpellRow({ inc, index, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetails = inc.descrizione || inc.efficacia || inc.durata || inc.raggio_azione;

  return (
    <>
      <tr
        onClick={() => hasDetails && setExpanded(!expanded)}
        style={{
          cursor: hasDetails ? 'pointer' : 'default',
          backgroundColor: expanded ? '#f8fafc' : 'transparent',
          transition: 'background-color 0.15s',
        }}
        className="hover:bg-gray-50"
      >
        <td style={{ padding: '0.35rem 0.4rem', textAlign: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#475569', width: '40px' }}>
          {inc.numero}
        </td>
        <td style={{ padding: '0.35rem 0.4rem', fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
          {inc.nome}
        </td>
        <td style={{ padding: '0.35rem 0.4rem', whiteSpace: 'nowrap' }}>
          <TipoBadge tipo={inc.tipologia} />
        </td>
        <td style={{ padding: '0.35rem 0.4rem', textAlign: 'center', width: '28px' }}>
          <InstantBadge istantaneo={inc.istantaneo} />
        </td>
        <td style={{ padding: '0.35rem 0.4rem', fontSize: '0.75rem', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {inc.efficacia || '—'}
        </td>
        <td style={{ padding: '0.35rem 0.4rem', fontSize: '0.75rem', color: '#64748b', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {inc.durata || '—'}
        </td>
        <td style={{ padding: '0.35rem 0.4rem', fontSize: '0.75rem', color: '#64748b', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {inc.raggio_azione || '—'}
        </td>
        <td style={{ padding: '0.35rem 0.4rem', textAlign: 'right', width: '28px' }}>
          {hasDetails && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                padding: '0.1rem',
              }}
            >
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          )}
        </td>
      </tr>
      {expanded && hasDetails && (
        <tr>
          <td colSpan={8} style={{ padding: '0 0.75rem 0.6rem 0.75rem', fontSize: '0.78rem', color: '#475569', lineHeight: 1.6 }}>
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '6px',
                padding: '0.6rem 0.8rem',
                border: '1px solid #e2e8f0',
              }}
            >
              {inc.descrizione && (
                <div style={{ marginBottom: '0.4rem', whiteSpace: 'pre-wrap' }}>
                  <strong style={{ color: '#1e293b' }}>Descrizione:</strong> {inc.descrizione}
                </div>
              )}
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                {inc.efficacia && <span><strong>Efficacia:</strong> {inc.efficacia}</span>}
                {inc.durata && <span><strong>Durata:</strong> {inc.durata}</span>}
                {inc.raggio_azione && <span><strong>Raggio:</strong> {inc.raggio_azione}</span>}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function SpellListAccordion({ lista, defaultExpanded }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const count = (lista.incantesimi || []).length;
  const hasContent = count > 0;

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          padding: '0.65rem 1rem',
          backgroundColor: expanded ? '#f1f5f9' : '#fafafa',
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: 700,
          color: '#1e293b',
          textAlign: 'left',
          transition: 'background-color 0.15s',
          borderBottom: expanded ? '1px solid #e2e8f0' : 'none',
        }}
        className="hover:bg-gray-100"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Book className="w-4 h-4" style={{ color: '#6366f1' }} />
          <span>{lista.nome_lista}</span>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>
            {count} incantesimi
          </span>
          {lista.note && (
            <span style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 600, backgroundColor: '#fef3c7', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
              NOTA
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div style={{ padding: '0.25rem' }}>
          {hasContent ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '0.4rem 0.4rem', textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', width: '40px' }}>#</th>
                  <th style={{ padding: '0.4rem 0.4rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Incantesimo</th>
                  <th style={{ padding: '0.4rem 0.4rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', width: '110px' }}>Classe</th>
                  <th style={{ padding: '0.4rem 0.4rem', textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', width: '28px' }} title="Istantaneo">*</th>
                  <th style={{ padding: '0.4rem 0.4rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', width: '140px' }}>Efficacia</th>
                  <th style={{ padding: '0.4rem 0.4rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', width: '100px' }}>Durata</th>
                  <th style={{ padding: '0.4rem 0.4rem', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', width: '90px' }}>Raggio</th>
                  <th style={{ padding: '0.4rem 0.4rem', textAlign: 'right', width: '28px' }}></th>
                </tr>
              </thead>
              <tbody>
                {lista.incantesimi.map((inc, idx) => (
                  <SpellRow key={inc.numero} inc={inc} index={idx} isLast={idx === count - 1} />
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
              Nessun incantesimo registrato in questa lista.
            </div>
          )}

          {lista.note && expanded && (
            <div style={{ margin: '0.5rem 0.75rem', padding: '0.5rem 0.75rem', backgroundColor: '#fefce8', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '0.75rem', color: '#92400e', lineHeight: 1.5 }}>
              <strong style={{ display: 'block', marginBottom: '0.15rem' }}>📝 Note:</strong>
              {lista.note}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ListGroup({ tipoLista, lists }) {
  const [collapsed, setCollapsed] = useState(false);

  // Color by type
  const groupColors = {
    'Liste di incantesimi dei Maghi': { bg: '#eef2ff', border: '#a5b4fc', text: '#4338ca', label: 'Maghi' },
    'Liste di incantesimi dei Bardi': { bg: '#fdf4ff', border: '#d8b4fe', text: '#9333ea', label: 'Bardi' },
    'Liste di incantesimi degli Animisti': { bg: '#ecfdf5', border: '#6ee7b7', text: '#047857', label: 'Animisti' },
    'Liste di incantesimi dei Ranger': { bg: '#fff7ed', border: '#fdba74', text: '#c2410c', label: 'Ranger' },
    'Liste aperte di incantesimi dell\'Essenza': { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8', label: 'Essenza' },
    'Liste aperte di incantesimi del Flusso': { bg: '#f0fdfa', border: '#5eead4', text: '#0d9488', label: 'Flusso' },
  };

  const colors = groupColors[tipoLista] || { bg: '#f8fafc', border: '#cbd5e1', text: '#475569', label: tipoLista };
  const totalSpells = lists.reduce((sum, l) => sum + (l.incantesimi || []).length, 0);

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.6rem 1rem',
          width: '100%',
          backgroundColor: colors.bg,
          border: `1px solid ${colors.border}`,
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.9rem',
          fontWeight: 800,
          color: colors.text,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          textAlign: 'left',
          transition: 'all 0.15s',
        }}
        className="hover:brightness-95"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        <span>{colors.label}</span>
        <span style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.7 }}>
          ({lists.length} liste, {totalSpells} incantesimi)
        </span>
      </button>

      {!collapsed && (
        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingLeft: '0.5rem' }}>
          {lists.map(lista => (
            <SpellListAccordion
              key={lista.nome_lista}
              lista={lista}
              defaultExpanded={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SpellCatalogViewer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const lists = elencoIncantesimi.liste_incantesimi || [];

  // Compute grouped and filtered lists
  const filteredData = useMemo(() => {
    // Group by tipo_lista preserving original order
    const groups = new Map();
    lists.forEach(lista => {
      const tipo = lista.tipo_lista;
      if (!groups.has(tipo)) groups.set(tipo, []);
      groups.get(tipo).push(lista);
    });

    // Apply filters
    const filtered = new Map();
    for (const [tipo, groupLists] of groups) {
      let filteredGroup = groupLists;

      // Filter by search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        filteredGroup = groupLists.filter(lista => {
          const nameMatch = (lista.nome_lista || '').toLowerCase().includes(term);
          const spellMatch = (lista.incantesimi || []).some(inc =>
            (inc.nome || '').toLowerCase().includes(term) ||
            (inc.descrizione || '').toLowerCase().includes(term)
          );
          return nameMatch || spellMatch;
        });
      }

      // Filter by tipo type
      if (filterType !== 'all') {
        const realmMap = {
          'essence': 'Liste aperte di incantesimi dell\'Essenza',
          'channeling': 'Liste aperte di incantesimi del Flusso',
          'mage': 'Liste di incantesimi dei Maghi',
          'bard': 'Liste di incantesimi dei Bardi',
          'animist': 'Liste di incantesimi degli Animisti',
          'ranger': 'Liste di incantesimi dei Ranger',
        };
        const targetTipo = realmMap[filterType];
        if (targetTipo) {
          if (tipo !== targetTipo) continue;
        }
      }

      if (filteredGroup.length > 0) {
        filtered.set(tipo, filteredGroup);
      }
    }

    return filtered;
  }, [lists, searchTerm, filterType]);

  const totalSpells = lists.reduce((sum, l) => sum + (l.incantesimi || []).length, 0);
  const filteredTotal = Array.from(filteredData.values()).reduce(
    (sum, group) => sum + group.reduce((s, l) => s + (l.incantesimi || []).length, 0),
    0
  );

  return (
    <div className="card" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
      <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Book className="w-5 h-5 text-indigo-500" />
              Catalogo Incantesimi
            </h2>
            <p className="card-description" style={{ margin: '0.2rem 0 0 0' }}>
              Consultazione completa di {totalSpells} incantesimi in {lists.length} liste.
            </p>
          </div>
        </div>

        {/* Filtri */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '400px' }}>
            <Search className="w-4 h-4" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Cerca incantesimo o lista..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.5rem 0.5rem 2rem',
                fontSize: '0.85rem',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                backgroundColor: '#f8fafc',
                outline: 'none',
              }}
              className="focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
            />
          </div>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.85rem',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              backgroundColor: '#f8fafc',
              outline: 'none',
              color: '#475569',
            }}
            className="focus:ring-2 focus:ring-indigo-300"
          >
            <option value="all">Tutti i regni</option>
            <option value="essence">Essenza (Aperte)</option>
            <option value="channeling">Flusso (Aperte)</option>
            <option value="mage">Maghi</option>
            <option value="bard">Bardi</option>
            <option value="animist">Animisti</option>
            <option value="ranger">Ranger</option>
          </select>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.75rem', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '0.75rem', color: '#64748b' }}>
            <Filter className="w-3.5 h-3.5" />
            {(searchTerm || filterType !== 'all') ? `${filteredTotal} risultati` : `${totalSpells} totali`}
          </div>
        </div>

        {/* Legenda tipi */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap', fontSize: '0.7rem', color: '#64748b' }}>
          {Object.entries(TIPO_LABELS).map(([code, info]) => (
            <span key={code} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
              <TipoBadge tipo={code} />
            </span>
          ))}
        </div>
      </div>

      <div className="card-body" style={{ paddingTop: '1rem' }}>
        {filteredData.size === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
            <Search className="w-12 h-12" style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Nessun risultato trovato</p>
            <p style={{ fontSize: '0.85rem' }}>Prova a modificare i criteri di ricerca o filtraggio.</p>
          </div>
        ) : (
          Array.from(filteredData.entries())
            .sort((a, b) => {
              const ai = CATEGORY_ORDER.indexOf(a[0]);
              const bi = CATEGORY_ORDER.indexOf(b[0]);
              return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
            })
            .map(([tipo, groupLists]) => (
            <ListGroup key={tipo} tipoLista={tipo} lists={sortListsByCanonicalOrder(groupLists, tipo)} />
          ))
        )}
      </div>
    </div>
  );
}
