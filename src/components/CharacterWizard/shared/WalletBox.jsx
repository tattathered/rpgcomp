import { Plus, Minus, Wallet } from 'lucide-react';
import { formatMBToCoins, formatCoinsToString } from '../../../utils/moneyHelpers';

export default function WalletBox({ portafoglioMB = 0, onChange }) {
  const coins = formatMBToCoins(portafoglioMB);
  const coinsStr = formatCoinsToString(coins);

  const handleUpdate = (delta) => {
    const nextVal = Math.round((portafoglioMB + delta) * 100) / 100;
    if (onChange) {
      onChange(nextVal);
    }
  };

  const COIN_TYPES = [
    { sigla: 'MO', name: 'Oro', delta: 100, color: '#eab308', bg: '#fef9c3', text: '#854d0e' },
    { sigla: 'MA', name: 'Argento', delta: 10, color: '#94a3b8', bg: '#f1f5f9', text: '#334155' },
    { sigla: 'MB', name: 'Bronzo', delta: 1, color: '#b45309', bg: '#ffedd5', text: '#7c2d12' },
    { sigla: 'MR', name: 'Rame', delta: 0.1, color: '#ea580c', bg: '#fff7ed', text: '#9a3412' },
    { sigla: 'MS', name: 'Stagno', delta: 0.01, color: '#6b7280', bg: '#f3f4f6', text: '#374151' }
  ];

  return (
    <div className="card" style={{ borderColor: '#fcd34d', backgroundColor: '#fffbeb', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderRadius: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #fef3c7', paddingBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Wallet className="w-5 h-5" style={{ color: '#b45309' }} />
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#7c2d12', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Portafoglio Personaggio
          </h4>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: portafoglioMB < 0 ? '#b91c1c' : '#15803d' }}>
            {portafoglioMB.toFixed(2)} MB
          </div>
          <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>
            ({coinsStr})
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
        {COIN_TYPES.map(c => {
          let count = 0;
          if (c.sigla === 'MO') count = coins.MO;
          else if (c.sigla === 'MA') count = coins.MA;
          else if (c.sigla === 'MB') count = coins.MB;
          else if (c.sigla === 'MR') count = coins.MR;
          else if (c.sigla === 'MS') count = coins.MS;

          return (
            <div 
              key={c.sigla} 
              style={{ 
                background: '#fff', 
                border: '1px solid #fef3c7', 
                borderRadius: '0.5rem', 
                padding: '0.4rem', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
            >
              <span 
                style={{ 
                  fontSize: '0.65rem', 
                  fontWeight: 900, 
                  padding: '0.1rem 0.35rem', 
                  borderRadius: '99px', 
                  background: c.bg, 
                  color: c.text,
                  marginBottom: '0.25rem'
                }}
              >
                {c.sigla}
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#374151', margin: '0.2rem 0' }}>
                {count}
              </span>
              <div style={{ display: 'flex', gap: '0.25rem', width: '100%', marginTop: '0.25rem' }}>
                <button 
                  className="btn btn-outline" 
                  onClick={() => handleUpdate(-c.delta)}
                  style={{ 
                    padding: '0.2rem', 
                    flex: 1, 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    border: '1px solid #e2e8f0',
                    height: '24px'
                  }}
                >
                  <Minus className="w-3 h-3 text-red-600" />
                </button>
                <button 
                  className="btn btn-outline" 
                  onClick={() => handleUpdate(c.delta)}
                  style={{ 
                    padding: '0.2rem', 
                    flex: 1, 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    border: '1px solid #e2e8f0',
                    height: '24px'
                  }}
                >
                  <Plus className="w-3 h-3 text-green-600" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
