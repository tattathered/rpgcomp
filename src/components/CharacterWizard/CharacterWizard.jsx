import { useState } from 'react';
import { ChevronRight, ChevronLeft, Check, Target, User, Shield, BookOpen, Clock, Activity, List } from 'lucide-react';

import RaceStep from './steps/RaceStep';
import ProfessionStep from './steps/ProfessionStep';
import StatsStep from './steps/StatsStep';
import AdolescenceStep from './steps/AdolescenceStep';
import ApprenticeshipLevel1Step from './steps/ApprenticeshipLevel1Step';
import BackgroundStep from './steps/BackgroundStep';
import CreationSummaryStep from './steps/CreationSummaryStep';

const WIZARD_STEPS = [
  { id: 'race',       title: '1. Popolo e Cultura',    icon: User },
  { id: 'profession', title: '2. Professione',          icon: Target },
  { id: 'stats',      title: '3. Caratteristiche',      icon: Activity },
  { id: 'adolescence',title: '4. Adolescenza',          icon: Clock },
  { id: 'level1',     title: '5. Sviluppo Liv. 1',     icon: BookOpen },
  { id: 'background', title: '6. Background',           icon: BookOpen },
  { id: 'creation_summary', title: '7. Riepilogo Creazione', icon: List },
  { id: 'learning',   title: '8. Apprendimento',       icon: BookOpen },
  { id: 'summary',    title: '9. Riepilogo Scheda',    icon: List },
];

export default function CharacterWizard() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [characterData, setCharacterData] = useState({
    race: null,
    profession: null,
    stats: {},
    adolescenceSkills: {},
    backgroundOptions: [],
    learningSkills: {},
  });

  const currentStep = WIZARD_STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < WIZARD_STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  return (
    <div className="wizard-layout">
      {/* Sidebar with Steps */}
      <div className="wizard-sidebar card">
        <div className="card-header">
          <h3 className="card-title" style={{fontSize: '1rem'}}>Fasi di Creazione</h3>
        </div>
        <div className="card-body wizard-steps">
          {WIZARD_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = index < currentStepIndex;
            const isActive = index === currentStepIndex;
            
            return (
              <div 
                key={step.id} 
                className={`wizard-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                <span style={{ fontSize: '0.875rem' }}>{step.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="wizard-content card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="card-title">{currentStep.title}</h2>
            <p className="card-description">Completa questa fase per proseguire.</p>
          </div>
          <div className="flex gap-2">
            <button 
              className={`btn btn-outline ${currentStepIndex === 0 ? 'btn-disabled' : ''}`}
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
            >
              <ChevronLeft className="w-4 h-4" />
              Precedente
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleNext}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
            >
              {currentStepIndex === WIZARD_STEPS.length - 1 ? 'Salva' : 'Successivo'}
              {currentStepIndex !== WIZARD_STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        <div className="card-body">
          {/* STEP CONTENTS */}
          {currentStep.id === 'race' && (
            <RaceStep characterData={characterData} setCharacterData={setCharacterData} />
          )}

          {currentStep.id === 'profession' && (
            <ProfessionStep characterData={characterData} setCharacterData={setCharacterData} />
          )}

          {currentStep.id === 'stats' && (
            <StatsStep characterData={characterData} setCharacterData={setCharacterData} />
          )}

          {currentStep.id === 'adolescence' && (
            <AdolescenceStep characterData={characterData} setCharacterData={setCharacterData} />
          )}

          {currentStep.id === 'level1' && (
            <ApprenticeshipLevel1Step characterData={characterData} setCharacterData={setCharacterData} />
          )}

          {currentStep.id === 'background' && (
            <BackgroundStep characterData={characterData} setCharacterData={setCharacterData} />
          )}

          {currentStep.id === 'creation_summary' && (
            <CreationSummaryStep characterData={characterData} />
          )}

          {currentStep.id !== 'race' && currentStep.id !== 'profession' && currentStep.id !== 'stats' && currentStep.id !== 'adolescence' && currentStep.id !== 'level1' && currentStep.id !== 'background' && currentStep.id !== 'creation_summary' && (
            <div className="p-8 border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-500 bg-gray-50" style={{minHeight: '300px'}}>
              Contenuto per: {currentStep.title}
            </div>
          )}

          {/* Wizard Navigation Footer */}
          <div className="wizard-footer">
            <button 
              className={`btn btn-outline ${currentStepIndex === 0 ? 'btn-disabled' : ''}`}
              onClick={handlePrev}
              disabled={currentStepIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              Precedente
            </button>
            <button 
              className="btn btn-primary"
              onClick={handleNext}
            >
              {currentStepIndex === WIZARD_STEPS.length - 1 ? 'Salva Personaggio' : 'Successivo'}
              {currentStepIndex !== WIZARD_STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
