import { Download, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import languagesData from '../data/languages.json';
import racesData from '../data/races.json';
import raceLanguagesData from '../data/race_languages.json';
import raceAdSkillsData from '../data/race_adolescence_skills.json';
import professionsData from '../data/professions.json';
import devCostsData from '../data/profession_development_costs.json';
import levelBonusesData from '../data/profession_level_bonuses.json';
import skillsData from '../data/skills.json';
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

  const exportLanguages = () => {
    const headers = ['id', 'name_it', 'name_en', 'description_it', 'description_en'];
    const rows = languagesData.map(l => [
      l.id, l.name_it, l.name_en, l.description_it || '', l.description_en || ''
    ]);
    downloadCSV('languages.csv', headers, rows);
  };

  const exportRaces = () => {
    const headers = [
      'id', 'name_it', 'name_en', 'category_it', 'category_en', 'is_human',
      'mod_fr', 'mod_ag', 'mod_co', 'mod_in', 'mod_it', 'mod_pr',
      'mod_tr_ess', 'mod_tr_fls', 'mod_tr_vel', 'mod_tr_mal',
      'background_points', 'extra_language_points', 'spell_list_learn_chance',
      'description_it', 'description_en'
    ];
    const rows = racesData.map(r => [
      r.id, r.name_it, r.name_en, r.category_it, r.category_en, r.is_human,
      r.mod_fr, r.mod_ag, r.mod_co, r.mod_in, r.mod_it, r.mod_pr,
      r.mod_tr_ess, r.mod_tr_fls, r.mod_tr_vel, r.mod_tr_mal,
      r.background_points, r.extra_language_points, r.spell_list_learn_chance,
      r.description_it || '', r.description_en || ''
    ]);
    downloadCSV('races.csv', headers, rows);
  };

  const exportRaceLanguages = () => {
    const headers = ['race_id', 'language_id', 'is_native', 'level'];
    const rows = raceLanguagesData.map(rl => [
      rl.race_id, rl.language_id, rl.is_native, rl.level
    ]);
    downloadCSV('race_languages.csv', headers, rows);
  };

  const exportRaceAdSkills = () => {
    const headers = ['race_id', 'skill_id', 'ranks'];
    const rows = raceAdSkillsData.map(ra => [
      ra.race_id, ra.skill_id, ra.ranks
    ]);
    downloadCSV('race_adolescence_skills.csv', headers, rows);
  };

  const exportProfessions = () => {
    const headers = [
      'id', 'name_it', 'name_en', 'primary_stat', 'secondary_stat', 
      'spell_realm', 'spell_max_level', 'description_it', 'description_en'
    ];
    const rows = professionsData.map(p => [
      p.id, p.name_it, p.name_en, p.primary_stat, p.secondary_stat,
      p.spell_realm || '', p.spell_max_level !== null ? p.spell_max_level : '',
      p.description_it || '', p.description_en || ''
    ]);
    downloadCSV('professions.csv', headers, rows);
  };

  const exportDevCosts = () => {
    const headers = ['profession_id', 'skill_category', 'cost'];
    const rows = devCostsData.map(dc => [
      dc.profession_id, dc.skill_category, dc.cost
    ]);
    downloadCSV('profession_development_costs.csv', headers, rows);
  };

  const exportLevelBonuses = () => {
    const headers = ['profession_id', 'skill_id', 'bonus'];
    const rows = levelBonusesData.map(lb => [
      lb.profession_id, lb.skill_id, lb.bonus
    ]);
    downloadCSV('profession_level_bonuses.csv', headers, rows);
  };

  const exportSkills = () => {
    const headers = [
      'id', 'name_it', 'name_en', 'category', 'type', 
      'associated_stat', 'is_primary', 'description_it', 'description_en'
    ];
    const rows = skillsData.map(s => [
      s.id, s.name_it, s.name_en, s.category, s.type,
      s.associated_stat || '', s.is_primary, s.description_it || '', s.description_en || ''
    ]);
    downloadCSV('skills.csv', headers, rows);
  };

  const exportSpellLists = () => {
    const headers = [
      'id', 'name_it', 'name_en', 'realm', 'category', 
      'profession_id', 'description_it', 'description_en'
    ];
    const rows = spellListsData.map(sl => [
      sl.id, sl.name_it, sl.name_en, sl.realm, sl.category,
      sl.profession_id || '', sl.description_it || '', sl.description_en || ''
    ]);
    downloadCSV('spell_lists.csv', headers, rows);
  };

  const exportSpells = () => {
    const headers = [
      'id', 'spell_list_id', 'level', 'name_it', 'name_en', 
      'type_it', 'type_en', 'preparation_it', 'preparation_en', 
      'description_it', 'description_en'
    ];
    const rows = spellsData.map(s => [
      s.id, s.spell_list_id, s.level, s.name_it, s.name_en,
      s.type_it || '', s.type_en || '',
      s.preparation_it || '', s.preparation_en || '',
      s.description_it || '', s.description_en || ''
    ]);
    downloadCSV('spells.csv', headers, rows);
  };

  const exportEquipment = () => {
    const headers = [
      'id', 'name_it', 'name_en', 'category', 'abbreviation', 'cost_mb', 
      'weight_kg', 'notes_it', 'notes_en', 'initial_kit', 'loadable', 
      'description_it', 'description_en'
    ];
    const rows = equipmentData.map(item => [
      item.id, item.name_it, item.name_en, item.category, item.abbreviation || '', item.cost_mb,
      item.weight_kg !== null ? item.weight_kg : '',
      item.notes_it || '', item.notes_en || '',
      item.initial_kit, item.loadable, item.description_it || '', item.description_en || ''
    ]);
    downloadCSV('equipment.csv', headers, rows);
  };

  const exports = [
    { label: '1. Lingue (languages.csv)', count: languagesData.length, action: exportLanguages },
    { label: '2. Popoli e Culture (races.csv)', count: racesData.length, action: exportRaces },
    { label: '3. Lingue Popoli (race_languages.csv)', count: raceLanguagesData.length, action: exportRaceLanguages },
    { label: '4. Gradi Adolescenza (race_adolescence_skills.csv)', count: raceAdSkillsData.length, action: exportRaceAdSkills },
    { label: '5. Professioni (professions.csv)', count: professionsData.length, action: exportProfessions },
    { label: '6. Costi Sviluppo (profession_development_costs.csv)', count: devCostsData.length, action: exportDevCosts },
    { label: '7. Bonus Livello (profession_level_bonuses.csv)', count: levelBonusesData.length, action: exportLevelBonuses },
    { label: '8. Catalogo Abilità (skills.csv)', count: skillsData.length, action: exportSkills },
    { label: '9. Liste di Incantesimi (spell_lists.csv)', count: spellListsData.length, action: exportSpellLists },
    { label: '10. Elenco Incantesimi (spells.csv)', count: spellsData.length, action: exportSpells },
    { label: '11. Equipaggiamento (equipment.csv)', count: equipmentData.length, action: exportEquipment },
  ];

  return (
    <div className="card mb-6" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
      <div className="card-header flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <div>
          <h2 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileSpreadsheet className="w-5 h-5 text-indigo-500" />
            Esportazione Database Relazionale (CSV)
          </h2>
          <p className="card-description" style={{ margin: '0.2rem 0 0 0' }}>
            Scarica le 11 tabelle relazionali normalizzate (multilingua) in formato CSV per consultazione GM.
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
            <strong>Nota di integrità:</strong> Le tabelle sono strutturate in prima forma normale (1NF) con ID stabili in inglese. Le relazioni molti-a-molti e le liste (come lingue e abilità d'adolescenza) sono state separate in tabelle associative esterne (es: <code>race_languages</code>, <code>race_adolescence_skills</code>) eliminando campi nidificati o pipe-separated.
          </div>
        </div>
      </div>
    </div>
  );
}
