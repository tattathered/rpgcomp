import { useState } from 'react'
import './CharacterGenerator.css'

const STATS = [
  { id: 'ST', name: 'Forza (ST)', icon: '⚔️' },
  { id: 'AG', name: 'Agilità (AG)', icon: '🤸' },
  { id: 'CO', name: 'Costituzione (CO)', icon: '🛡️' },
  { id: 'IG', name: 'Intelligenza (IG)', icon: '🧠' },
  { id: 'IT', name: 'Intuizione (IT)', icon: '👁️' },
  { id: 'PR', name: 'Presenza (PR)', icon: '👑' }
]

const CharacterGenerator = () => {
  const [step, setStep] = useState(1)
  const [character, setCharacter] = useState({
    name: '',
    stats: {
      ST: 0,
      AG: 0,
      CO: 0,
      IG: 0,
      IT: 0,
      PR: 0
    },
    race: '',
    culture: '',
    profession: ''
  })

  const rollStat = (statId) => {
    const roll = Math.floor(Math.random() * 100) + 1
    setCharacter(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        [statId]: roll
      }
    }))
  }

  const rollAllStats = () => {
    const newStats = {}
    STATS.forEach(stat => {
      newStats[stat.id] = Math.floor(Math.random() * 100) + 1
    })
    setCharacter(prev => ({
      ...prev,
      stats: newStats
    }))
  }

  return (
    <div className="generator-container">
      <div className="generator-steps">
        <div className={`step-indicator ${step >= 1 ? 'active' : ''}`}>1. Statistiche</div>
        <div className={`step-indicator ${step >= 2 ? 'active' : ''}`}>2. Popolo & Cultura</div>
        <div className={`step-indicator ${step >= 3 ? 'active' : ''}`}>3. Professione</div>
        <div className={`step-indicator ${step >= 4 ? 'active' : ''}`}>4. Competenze</div>
      </div>

      <div className="generator-card">
        {step === 1 && (
          <div className="step-content">
            <h3>Fase 1: Generazione Caratteristiche</h3>
            <p className="step-desc">Tira i dadi per determinare le potenzialità naturali del tuo personaggio.</p>
            
            <div className="stats-grid">
              {STATS.map(stat => (
                <div key={stat.id} className="stat-row">
                  <div className="stat-info">
                    <span className="stat-icon">{stat.icon}</span>
                    <span className="stat-name">{stat.name}</span>
                  </div>
                  <div className="stat-action">
                    <input 
                      type="number" 
                      min="1" 
                      max="100" 
                      value={character.stats[stat.id] || ''} 
                      onChange={(e) => setCharacter(prev => ({
                        ...prev,
                        stats: { ...prev.stats, [stat.id]: parseInt(e.target.value) || 0 }
                      }))}
                    />
                    <button className="btn-roll" onClick={() => rollStat(stat.id)}>Tira D100</button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="step-actions">
              <button className="btn-secondary" onClick={rollAllStats}>Tira Tutto</button>
              <button 
                className="btn-primary" 
                disabled={Object.values(character.stats).some(v => v === 0)}
                onClick={() => setStep(2)}
              >
                Prossimo: Popolo & Cultura
              </button>
            </div>
          </div>
        )}
        
        {step === 2 && (
          <div className="step-content">
            <h3>Fase 2: Popolo & Cultura</h3>
            <p>Seleziona le origini del tuo personaggio.</p>
            {/* Placeholder per ora */}
            <div className="placeholder-content">
              Sezione in arrivo...
            </div>
            <div className="step-actions">
              <button className="btn-secondary" onClick={() => setStep(1)}>Indietro</button>
              <button className="btn-primary" onClick={() => setStep(3)}>Prossimo</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CharacterGenerator
