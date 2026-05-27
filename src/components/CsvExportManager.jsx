import { Download, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import racesData from '../data/races.json';
import professionsData from '../data/professions.json';
import skillsPrimaryData from '../data/skills_primary.json';
import skillsSecondaryData from '../data/skills_secondary.json';
import languagesData from '../data/languages.json';
import spellListsData from '../data/spell_lists.json';
import spellsData from '../data/spells.json';
import equipmentData from '../data/equipment.json';

export default function CsvExportManager() {
  const downloadCSV = (filename, headers, rows) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(val => {
          if (val === null || val === undefined) return '';
          const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
          const escaped = str.replace(/"/g, '""');
          if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
            return `"${escaped}"`;
          }
          return escaped;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportRaces = () => {
    const headers = [
      'id', 'name_it', 'name_en', 'category_it', 'category_en', 'is_human',
      'mod_FR', 'mod_AG', 'mod_CO', 'mod_IN', 'mod_IT', 'mod_PR',
      'mod_tr_ESS', 'mod_tr_FLS', 'mod_tr_VEL', 'mod_tr_MAL',
      'starting_languages', 'description_it', 'description_en'
    ];
    const rows = racesData.map(r => [
      r.id, r.name.it, r.name.en, r.category.it, r.category.en, r.is_human,
      r.stats_modifiers.FR, r.stats_modifiers.AG, r.stats_modifiers.CO,
      r.stats_modifiers.IN, r.stats_modifiers.IT, r.stats_modifiers.PR,
      r.resistance_modifiers.ESS, r.resistance_modifiers.FLS, r.resistance_modifiers.VEL, r.resistance_modifiers.MAL,
      r.starting_languages.map(l => `${l.language_id}:${l.is_native ? 'native' : 'second'}:${l.level}`).join(' | '),
      r.description.it, r.description.en
    ]);
    downloadCSV('races.csv', headers, rows);
  };

  const exportProfessions = () => {
    const headers = [
      'id', 'name_it', 'name_en', 'primary_stat', 'secondary_stat',
      'bonus_physical_resistance', 'bonus_weapons_skills', 'bonus_general_skills', 'bonus_subterfuge_skills', 'bonus_magic_skills',
      'bonus_runes_reading', 'bonus_items_use', 'bonus_directed_spells', 'bonus_base_spells', 'bonus_perception',
      'cost_movement_maneuvers', 'cost_weapons_skills', 'cost_general_skills', 'cost_subterfuge_skills', 'cost_magic_skills',
      'cost_physical_resistance', 'cost_languages', 'cost_spell_lists',
      'spell_realms', 'spell_max_level', 'spell_notes_it', 'spell_notes_en',
      'description_it', 'description_en'
    ];
    const rows = professionsData.map(p => [
      p.id, p.name.it, p.name.en, p.primary_stat, p.secondary_stat,
      p.level_bonuses.physical_resistance, p.level_bonuses.weapons_skills, p.level_bonuses.general_skills, p.level_bonuses.subterfuge_skills, p.level_bonuses.magic_skills,
      p.level_bonuses.runes_reading, p.level_bonuses.items_use, p.level_bonuses.directed_spells, p.level_bonuses.base_spells, p.level_bonuses.perception,
      p.development_costs.movement_maneuvers, p.development_costs.weapons_skills, p.development_costs.general_skills, p.development_costs.subterfuge_skills, p.development_costs.magic_skills,
      p.development_costs.physical_resistance, p.development_costs.languages, p.development_costs.spell_lists,
      p.spell_requirements.realms.join(' | '), p.spell_requirements.max_spell_level, p.spell_requirements.notes.it, p.spell_requirements.notes.en,
      p.description.it, p.description.en
    ]);
    downloadCSV('professions.csv', headers, rows);
  };

  const exportSkillsPrimary = () => {
    const headers = ['id', 'name_it', 'name_en', 'category_it', 'category_en', 'type', 'associated_stat', 'description_it', 'description_en', 'is_primary'];
    const rows = skillsPrimaryData.map(s => [
      s.id, s.name.it, s.name.en, s.category.it, s.category.en, s.type, s.associated_stat || '', s.description.it, s.description.en, s.is_primary
    ]);
    downloadCSV('skills_primary.csv', headers, rows);
  };

  const exportSkillsSecondary = () => {
    const headers = ['id', 'name_it', 'name_en', 'category_it', 'category_en', 'type', 'associated_stat', 'description_it', 'description_en', 'is_primary'];
    const rows = skillsSecondaryData.map(s => [
      s.id, s.name.it, s.name.en, s.category.it, s.category.en, s.type, s.associated_stat || '', s.description.it, s.description.en, s.is_primary
    ]);
    downloadCSV('skills_secondary.csv', headers, rows);
  };

  const exportLanguages = () => {
    const headers = ['id', 'name_it', 'name_en', 'description_it', 'description_en'];
    const rows = languagesData.map(l => [
      l.id, l.name.it, l.name.en, l.description.it, l.description.en
    ]);
    downloadCSV('languages.csv', headers, rows);
  };

  const exportSpellLists = () => {
    const headers = ['id', 'name_it', 'name_en', 'realm', 'category', 'profession_id', 'description_it', 'description_en'];
    const rows = spellListsData.map(sl => [
      sl.id, sl.name.it, sl.name.en, sl.realm, sl.category, sl.profession_id || '', sl.description.it, sl.description.en
    ]);
    downloadCSV('spell_lists.csv', headers, rows);
  };

  const exportSpells = () => {
    const headers = ['id', 'spell_list_id', 'level', 'name_it', 'name_en', 'type_it', 'type_en', 'preparation_it', 'preparation_en', 'description_it', 'description_en'];
    const rows = spellsData.map(s => [
      s.id, s.spell_list_id, s.level, s.name.it, s.name.en,
      s.type ? s.type.it : '', s.type ? s.type.en : '',
      s.preparation ? s.preparation.it : '', s.preparation ? s.preparation.en : '',
      s.description.it, s.description.en
    ]);
    downloadCSV('spells.csv', headers, rows);
  };

  const exportEquipment = () => {
    const headers = ['id', 'name_it', 'name_en', 'category', 'abbreviation', 'cost_mb', 'weight_kg', 'notes_it', 'notes_en', 'initial_kit', 'loadable', 'description_it', 'description_en'];
    const rows = equipmentData.map(item => [
      item.id, item.name.it, item.name.en, item.category, item.abbreviation || '', item.cost_mb,
      item.weight_kg !== null ? item.weight_kg : '',
      item.notes ? item.notes.it : '', item.notes ? item.notes.en : '',
      item.initial_kit, item.loadable !== null ? item.loadable : '',
      item.description.it, item.description.en
    ]);
    downloadCSV('equipment.csv', headers, rows);
  };

  const exports = [
    { label: 'Popoli e Culture (races.csv)', count: racesData.length, action: exportRaces },
    { label: 'Professioni di Gioco (professions.csv)', count: professionsData.length, action: exportProfessions },
    { label: 'Abilità Primarie (skills_primary.csv)', count: skillsPrimaryData.length, action: exportSkillsPrimary },
    { label: 'Abilità Secondarie (skills_secondary.csv)', count: skillsSecondaryData.length, action: exportSkillsSecondary },
    { label: 'Lingue Parlate (languages.csv)', count: languagesData.length, action: exportLanguages },
    { label: 'Liste di Incantesimi (spell_lists.csv)', count: spellListsData.length, action: exportSpellLists },
    { label: 'Incantesimi Elenco (spells.csv)', count: spellsData.length, action: exportSpells },
    { label: 'Equipaggiamento e Oggetti (equipment.csv)', count: equipmentData.length, action: exportEquipment },
  ];

  return (
    <div className="card mb-6" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
      <div className="card-header flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <div>
          <h2 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
            Esportazione Dati Ristrutturati (CSV)
          </h2>
          <p className="card-description" style={{ margin: '0.2rem 0 0 0' }}>
            Scarica le tabelle master ristrutturate e localizzate (multilingua) in formato CSV per consultazione esterna.
          </p>
        </div>
      </div>

      <div className="card-body">
        <div className="grid grid-cols-2 gap-4">
          {exports.map((item, idx) => (
            <div 
              key={idx} 
              style={{
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '0.75rem 1rem', 
                backgroundColor: 'var(--bg-gray-50, #f9fafb)', 
                border: '1px solid var(--border-color)', 
                borderRadius: '8px',
                transition: 'all 0.2s'
              }}
              className="hover:shadow-sm"
            >
              <div>
                <span className="block text-sm font-semibold text-gray-800">{item.label}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  {item.count} righe trovate
                </span>
              </div>
              <button 
                onClick={item.action} 
                className="btn btn-outline" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.4rem', 
                  padding: '0.35rem 0.65rem', 
                  fontSize: '0.75rem',
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'white'
                }}
              >
                <Download className="w-3.5 h-3.5" />
                Scarica
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-900 leading-relaxed">
            <strong>Nota di integrità:</strong> Tutti i file estratti mantengono l'integrità referenziale relazionale tramite ID in lingua inglese e forniscono sia la denominazione italiana che quella inglese in colonne affiancate (es: <code>name_it</code> e <code>name_en</code>).
          </div>
        </div>
      </div>
    </div>
  );
}
