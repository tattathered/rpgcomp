import { useState } from 'react';
import {
  Upload, Plus, Users, FolderOpen, Download, Copy, Trash2,
  Compass, Swords
} from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';
import CharacterWizard from './CharacterWizard/CharacterWizard';
import PlayerManager from './GM/PlayerManager';
import CompanyManager from './GM/CompanyManager';
import CampaignManager from './GM/CampaignManager';
import CombatCalculator from './CombatCalculator';
import MovementManoeuvreResolver from './MovementManoeuvreResolver';
import FumbleResolver from './FumbleResolver';
import StaticManoeuvreResolver from './StaticManoeuvreResolver';
import CriticalResolver from './CriticalResolver';
import SpellResolver from './SpellResolver';
import EquipmentCatalogManager from './EquipmentCatalogManager';
import SpellCatalogManager from './SpellCatalogManager';
import CodexAdminTab from './GM/CodexAdminTab';
import CsvExportManager from './CsvExportManager';
import NpcCatalogTab from './GM/NpcCatalogTab';
import CreatureCatalogTab from './GM/CreatureCatalogTab';
import CampaignRosterManager from './GM/CampaignRosterManager';
import { getCharacterHpTot } from '../utils/skillHelpers';

const ACTION_SUB_TABS = [
  { id: 'static', label: 'Manovre Statiche', icon: Swords },
  { id: 'movement', label: 'Manovre Movimento', icon: Swords },
  { id: 'combat', label: 'Combattimento', icon: Swords },
  { id: 'criticals', label: 'Colpi Critici', icon: Swords },
  { id: 'fumbles', label: 'Colpi Maldestri', icon: Swords },
  { id: 'spells_base', label: 'Incantesimi Base', icon: Swords },
  { id: 'spells_direct', label: 'Incantesimi Dardo', icon: Swords },
];

export default function AppTabs({
  activeTab,
  activeCharacter,
  activeStepIndex,
  savedCharacters,
  equipmentCatalog,
  spellCatalog,
  campaignNpcs,
  campaignCreatures,
  currentActiveCampaign,
  activeCampaignCharacters,
  fumbleRedirectData,
  handleStartNewCharacter,
  handleLoadCharacter,
  handleExportCharacter,
  handleDuplicateCharacter,
  handleDeleteCharacter,
  handleImportCharacterClick,
  handleSetActiveCampaign,
  handleUpdateActorHp,
  handleUpdateCharacterHpSubiti,
  handleUpdateCharacterBoSpesoParata,
  handleResetAllParries,
  handleRedirectToFumble,
  handleUpdateCatalog,
  handleUpdateSpellCatalog,
  handleDeleteNpc,
  handleDeleteCreature,
  user,
}) {
  const [activeActionSubTab, setActiveActionSubTab] = useState('combat');
  const [activeSettingsSubTab, setActiveSettingsSubTab] = useState('equipment');
  const [activeCreaturesSubTab, setActiveCreaturesSubTab] = useState('campaignroster');

  return (
    <main className="main-content">
      {/* TAB: CREAZIONE PG */}
      {activeTab === 'creation' && (
        <ErrorBoundary>
          <CharacterWizard
            key={activeCharacter?.id || 'new'}
            initialData={activeCharacter}
            initialStepIndex={activeStepIndex}
            onSave={handleStartNewCharacter}
            equipmentCatalog={equipmentCatalog}
            spellCatalog={spellCatalog}
          />
        </ErrorBoundary>
      )}

      {/* TAB: ROSTER */}
      {activeTab === 'roster' && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="card-title">Roster Personaggi</h2>
              <p className="card-description">Gestione delle schede personaggio create.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-outline" onClick={handleImportCharacterClick}
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Upload className="w-4 h-4" /> Importa PG
              </button>
              <button className="btn btn-primary" onClick={handleStartNewCharacter}
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Plus className="w-4 h-4" /> Nuovo Personaggio
              </button>
            </div>
          </div>
          <div className="card-body">
            {savedCharacters.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <Users className="w-12 h-12" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
                <p className="mb-4">Nessun personaggio salvato. Inizia a crearne uno ora!</p>
                <button className="btn btn-primary" onClick={handleStartNewCharacter}>Crea Personaggio</button>
              </div>
            ) : (
              <div className="grid-3">
                {savedCharacters.map(char => {
                  const level = 1 + (char.levelDevelopments || []).length;
                  return (
                    <div key={char.id} className="card"
                      style={{ border: '1px solid var(--border-color)', padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{char.name}</h3>
                          <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary-color)', fontWeight: 700, borderRadius: '4px' }}>
                            Liv. {level}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                          <p style={{ margin: '0.2rem 0' }}><strong>Popolo:</strong> {char.race?.nome || char.race?.popolo || '—'}</p>
                          <p style={{ margin: '0.2rem 0' }}><strong>Professione:</strong> {char.profession?.professione || '—'}</p>
                          {char.stats && (
                            <div style={{ marginTop: '0.75rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem' }}>
                              {(() => {
                                const hpTot = getCharacterHpTot(char);
                                const hpSub = char.hpSubiti || 0;
                                const hpRem = Math.max(0, hpTot - hpSub);
                                const isGrave = hpSub > (hpTot / 2);
                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 650 }}>
                                      <span>Punti Ferita (PF):</span>
                                      <span style={{ color: isGrave ? '#b91c1c' : '#15803d', fontWeight: 'bold' }}>
                                        {hpRem} / {hpTot} {hpSub > 0 && `(${hpSub} sub.)`}
                                      </span>
                                    </div>
                                    <div style={{ height: '6px', width: '100%', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                                      <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, (hpRem / hpTot) * 100))}%`, backgroundColor: isGrave ? '#ef4444' : '#22c55e', transition: 'width 0.3s ease' }} />
                                    </div>
                                    {isGrave && (
                                      <span style={{ fontSize: '0.65rem', color: '#b91c1c', fontWeight: 'bold', display: 'block', marginTop: '0.1rem' }}>
                                        ⚠️ Gravemente Ferito (-20 BO)
                                      </span>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                        <button className="btn btn-primary" onClick={() => handleLoadCharacter(char)}
                          style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem', gap: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FolderOpen className="w-3.5 h-3.5" /> Carica
                        </button>
                        <button className="btn btn-outline" onClick={() => handleExportCharacter(char)}
                          style={{ padding: '0.4rem', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button className="btn btn-outline" onClick={() => handleDuplicateCharacter(char)}
                          style={{ padding: '0.4rem', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button className="btn btn-outline" onClick={() => handleDeleteCharacter(char.id)}
                          style={{ padding: '0.4rem', color: 'var(--danger-color)', borderColor: 'rgba(220, 38, 38, 0.2)' }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: GIOCATORI */}
      {activeTab === 'players' && (
        <ErrorBoundary>
          <PlayerManager savedCharacters={savedCharacters} />
        </ErrorBoundary>
      )}

      {/* TAB: COMPAGNIE */}
      {activeTab === 'companies' && (
        <ErrorBoundary>
          <CompanyManager savedCharacters={savedCharacters} />
        </ErrorBoundary>
      )}

      {/* TAB: CAMPAGNE */}
      {activeTab === 'campaigns' && (
        <ErrorBoundary>
          <CampaignManager activeCampaign={currentActiveCampaign} onSetActiveCampaign={handleSetActiveCampaign} />
        </ErrorBoundary>
      )}

      {/* TAB: RISOLUZIONE AZIONI */}
      {activeTab === 'actions' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {ACTION_SUB_TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveActionSubTab(tab.id); }}
                  style={{
                    padding: '0.6rem 0.5rem', fontSize: '0.8rem',
                    fontWeight: activeActionSubTab === tab.id ? 800 : 600,
                    textAlign: 'center',
                    border: `2px solid ${activeActionSubTab === tab.id ? 'var(--primary-color)' : 'var(--border-color)'}`,
                    borderRadius: '8px',
                    backgroundColor: activeActionSubTab === tab.id ? 'var(--primary-light)' : '#fafafa',
                    color: activeActionSubTab === tab.id ? 'var(--primary-color)' : 'var(--text-muted)',
                    cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                  }}
                  className="hover:brightness-95"
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {activeActionSubTab === 'combat' && (
            <ErrorBoundary>
              <CombatCalculator
                savedCharacters={activeCampaignCharacters}
                campaignNpcs={campaignNpcs}
                campaignCreatures={campaignCreatures}
                onUpdateActorHp={handleUpdateActorHp}
                equipmentCatalog={equipmentCatalog}
                onUpdateHpSubiti={handleUpdateCharacterHpSubiti}
                onUpdateBoSpesoParata={handleUpdateCharacterBoSpesoParata}
                onResetAllParries={handleResetAllParries}
              />
            </ErrorBoundary>
          )}
          {activeActionSubTab === 'movement' && (
            <ErrorBoundary>
              <MovementManoeuvreResolver
                savedCharacters={activeCampaignCharacters}
                campaignNpcs={campaignNpcs}
                campaignCreatures={campaignCreatures}
                onRedirectToFumble={handleRedirectToFumble}
              />
            </ErrorBoundary>
          )}
          {activeActionSubTab === 'fumbles' && (
            <ErrorBoundary>
              <FumbleResolver
                key={fumbleRedirectData ? `${fumbleRedirectData.tableCode}-${fumbleRedirectData.difficulty}-${fumbleRedirectData.diceRoll}` : 'fumble-resolver-standalone'}
                initialTableCode={fumbleRedirectData?.tableCode || 'TTM-1'}
                initialManoeuvreDifficulty={fumbleRedirectData?.difficulty || 'Normale'}
                initialDiceRoll={fumbleRedirectData?.diceRoll || 50}
                initialModifierCustom={fumbleRedirectData?.modifierCustom || 0}
                showTitle={true}
              />
            </ErrorBoundary>
          )}
          {activeActionSubTab === 'static' && (
            <ErrorBoundary>
              <StaticManoeuvreResolver savedCharacters={activeCampaignCharacters} campaignNpcs={campaignNpcs} />
            </ErrorBoundary>
          )}
          {activeActionSubTab === 'criticals' && (
            <ErrorBoundary>
              <CriticalResolver initialTableCode="TC-2" initialSeverity="C" initialDiceRoll={50} showTitle={true} />
            </ErrorBoundary>
          )}
          {activeActionSubTab === 'spells_base' && (
            <ErrorBoundary>
              <SpellResolver initialType="base" showTitle={true} />
            </ErrorBoundary>
          )}
          {activeActionSubTab === 'spells_direct' && (
            <ErrorBoundary>
              <SpellResolver initialType="dardo" showTitle={true} />
            </ErrorBoundary>
          )}
        </div>
      )}

      {/* TAB: IMPOSTAZIONI */}
      {activeTab === 'settings' && (
        <div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {[
              { id: 'equipment', label: 'Equipaggiamento' },
              { id: 'spells', label: 'Incantesimi' },
              { id: 'codex', label: 'Codex & Tooltips' },
              { id: 'export', label: 'Esportazione (CSV)' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSettingsSubTab(tab.id)}
                style={{
                  padding: '0.6rem 1.25rem', fontSize: '0.85rem',
                  fontWeight: activeSettingsSubTab === tab.id ? 800 : 600,
                  textAlign: 'center',
                  border: `2px solid ${activeSettingsSubTab === tab.id ? 'var(--primary-color)' : 'var(--border-color)'}`,
                  borderRadius: '8px',
                  backgroundColor: activeSettingsSubTab === tab.id ? 'var(--primary-light)' : '#fafafa',
                  color: activeSettingsSubTab === tab.id ? 'var(--primary-color)' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 0.15s', flex: 1, maxWidth: '240px',
                }}
                className="hover:brightness-95"
              >
                {tab.label}
              </button>
            ))}
          </div>
          <ErrorBoundary>
            {activeSettingsSubTab === 'equipment' && (
              <EquipmentCatalogManager catalog={equipmentCatalog} onUpdate={handleUpdateCatalog} />
            )}
            {activeSettingsSubTab === 'spells' && spellCatalog && (
              <SpellCatalogManager catalog={spellCatalog} onUpdate={handleUpdateSpellCatalog} />
            )}
            {activeSettingsSubTab === 'codex' && <CodexAdminTab />}
            {activeSettingsSubTab === 'export' && <CsvExportManager />}
          </ErrorBoundary>
        </div>
      )}

      {/* TAB: PNG & MOSTRI */}
      {activeTab === 'creatures' && (
        <div>
          {!currentActiveCampaign ? (
            <div className="card p-8 text-center" style={{ color: 'var(--text-muted)' }}>
              <Compass className="w-12 h-12" style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
              <h3 className="text-lg font-bold mb-2">Nessuna Campagna Attiva</h3>
              <p className="max-w-md mx-auto text-sm">
                Devi prima selezionare o creare una Campagna attiva dal menu <strong>Campagne</strong> per poter gestire, creare ed associare PNG o Mostri.
              </p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {[
                  { id: 'npccatalog', label: 'Crea PNG Standard (ST-3)' },
                  { id: 'creaturecatalog', label: 'Catalogo Creature & Mostri' },
                  { id: 'campaignroster', label: `Roster Attivo (${campaignNpcs.length + campaignCreatures.length} Attori)` },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCreaturesSubTab(tab.id)}
                    style={{
                      padding: '0.6rem 1.25rem', fontSize: '0.85rem',
                      fontWeight: activeCreaturesSubTab === tab.id ? 800 : 600,
                      textAlign: 'center',
                      border: `2px solid ${activeCreaturesSubTab === tab.id ? 'var(--primary-color)' : 'var(--border-color)'}`,
                      borderRadius: '8px',
                      backgroundColor: activeCreaturesSubTab === tab.id ? 'var(--primary-light)' : '#fafafa',
                      color: activeCreaturesSubTab === tab.id ? 'var(--primary-color)' : 'var(--text-muted)',
                      cursor: 'pointer', transition: 'all 0.15s', flex: 1, maxWidth: '280px',
                    }}
                    className="hover:brightness-95"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <ErrorBoundary>
                {activeCreaturesSubTab === 'npccatalog' && (
                  <NpcCatalogTab gmId={user.uid} campaignId={currentActiveCampaign.id}
                    onSaveSuccess={() => setActiveCreaturesSubTab('campaignroster')} />
                )}
                {activeCreaturesSubTab === 'creaturecatalog' && (
                  <CreatureCatalogTab gmId={user.uid} campaignId={currentActiveCampaign.id}
                    onSaveSuccess={() => setActiveCreaturesSubTab('campaignroster')} />
                )}
                {activeCreaturesSubTab === 'campaignroster' && (
                  <CampaignRosterManager activeNpcs={campaignNpcs} activeCreatures={campaignCreatures}
                    onDeleteNpc={handleDeleteNpc} onDeleteCreature={handleDeleteCreature}
                    onUpdateHp={handleUpdateActorHp} />
                )}
              </ErrorBoundary>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
