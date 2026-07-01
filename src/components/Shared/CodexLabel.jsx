import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useCodex } from '../../contexts/CodexContext';

export default function CodexLabel({ term, category, page, fallbackText }) {
  const { isTooltipEnabled, getTooltipText } = useCodex();
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);

  const displayLabel = term || fallbackText || '';
  
  if (!displayLabel) return null;

  // Verifica se i tooltip per questa categoria in questa pagina sono attivi
  const enabled = isTooltipEnabled(page, category);
  if (!enabled) {
    return <span>{displayLabel}</span>;
  }

  // Ottiene la descrizione dal Codex (usando lookup normalizzato)
  const description = getTooltipText(category, displayLabel);
  if (!description) {
    return <span>{displayLabel}</span>;
  }

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Calcola coordinate assolute rispetto al body della pagina
      setCoords({
        top: rect.top + window.scrollY - 8,
        left: rect.left + window.scrollX + rect.width / 2
      });
      setVisible(true);
    }
  };

  const handleMouseLeave = () => {
    setVisible(false);
  };

  // Tooltip fluttuante lazy-renderizzato in absolute position rispetto al document body
  const tooltipContent = (
    <div
      style={{
        position: 'absolute',
        top: coords.top,
        left: coords.left,
        transform: 'translate(-50%, -100%)',
        zIndex: 99999,
        backgroundColor: '#1e293b', // slate-800
        color: '#f8fafc', // slate-50
        padding: '0.6rem 0.8rem',
        borderRadius: '0.375rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
        fontSize: '0.75rem',
        pointerEvents: 'none',
        maxWidth: '280px',
        width: 'max-content',
        minWidth: '150px',
        whiteSpace: 'normal',
        wordWrap: 'break-word',
        lineHeight: '1.4',
        border: '1px solid #334155',
        fontWeight: 'normal',
        textAlign: 'left'
      }}
    >
      <div style={{ fontWeight: '800', marginBottom: '0.25rem', borderBottom: '1px solid #475569', paddingBottom: '0.15rem', color: '#38bdf8', fontSize: '0.7rem', textTransform: 'uppercase', tracking: '0.05em' }}>
        Codex: {displayLabel}
      </div>
      <div style={{ color: '#e2e8f0' }}>{description}</div>
      {/* Freccia tooltip */}
      <div
        style={{
          position: 'absolute',
          bottom: '-4px',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          width: '8px',
          height: '8px',
          backgroundColor: '#1e293b',
          borderRight: '1px solid #334155',
          borderBottom: '1px solid #334155'
        }}
      />
    </div>
  );

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="border-b border-dashed border-slate-400 dark:border-slate-500 cursor-help inline-block"
      >
        {displayLabel}
      </span>
      {visible && createPortal(tooltipContent, document.body)}
    </>
  );
}
