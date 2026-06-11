import { Download, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import languagesData from '../data/languages.json';
import racesData from '../data/TB-3-modifiche_speciali_popolo.json';
import raceLanguagesData from '../data/race_languages.json';
import raceAdSkillsData from '../data/TGP-5-sviluppo_abilita_adolescenza.json';
import professionsData from '../data/professions.json';
import devCostsData from '../data/TGP-4-sviluppo_abilita.json';
import levelBonusesData from '../data/profession_level_bonuses.json';
import skillsData from '../data/skills.json';
import spellListsData from '../data/spell_lists.json';
import spellsData from '../data/Tabella-elenco_incantesimi.json';
import equipmentData from '../data/TS-4-equipaggiamento.json';

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
      'id_popolo', 'nome', 'categoria', 'umano',
      'mod_fr', 'mod_ag', 'mod_co', 'mod_in', 'mod_it', 'mod_pr',
      'mod_tr_ess', 'mod_tr_fls', 'mod_tr_vel', 'mod_tr_mal',
      'punti_background', 'punti_lingue_extra', 'probabilita_apprendimento_liste',
      'descrizione'
    ];
    const rows = racesData.map(r => [
      r.id_popolo, r.nome, r.categoria, r.umano,
      r.mod_fr, r.mod_ag, r.mod_co, r.mod_in, r.mod_it, r.mod_pr,
      r.mod_tr_ess, r.mod_tr_fls, r.mod_tr_vel, r.mod_tr_mal,
      r.punti_background, r.punti_lingue_extra, r.probabilita_apprendimento_liste,
      r.descrizione || ''
    ]);
    downloadCSV('TB-3-modifiche_speciali_popolo.csv', headers, rows);
  };

  const exportRaceLanguages = () => {
    const headers = ['race_id', 'language_id', 'is_native', 'level'];
    const rows = raceLanguagesData.map(rl => [
      rl.race_id, rl.language_id, rl.is_native, rl.level
    ]);
    downloadCSV('race_languages.csv', headers, rows);
  };

  const exportRaceAdSkills = () => {
    const headers = ['id_popolo', 'id_abilita', 'gradi'];
    const rows = raceAdSkillsData.map(ra => [
      ra.id_popolo, ra.id_abilita, ra.gradi
    ]);
    downloadCSV('TGP-5-sviluppo_abilita_adolescenza.csv', headers, rows);
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
    const headers = ['id_professione', 'categoria_abilita', 'costo'];
    const rows = devCostsData.map(dc => [
      dc.id_professione, dc.categoria_abilita, dc.costo
    ]);
    downloadCSV('TGP-4-sviluppo_abilita.csv', headers, rows);
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

  // Build mapping: nome_lista (UPPERCASE) -> spell_lists.json id
  const listNameToIdMap = {};
  spellListsData.forEach(reg => {
    const key = (reg.name_it || '').toUpperCase().trim();
    listNameToIdMap[key] = reg.id;
  });

  // Additional manual mappings for lists not present in spell_lists.json
  // (some lists use slightly different naming conventions)
  const manualOverrides = {
    'FORMULE DI PASSAGGIO': 'gateways',
    'FORMULE D\'INCANTESIMO': 'spell_ways',
    'FORMULE DELL\'ESSENZA': 'essence_ways',
    'CONTROLLO SPIRITUALE': 'spirit_mastery',
    'PERCEZIONE DELL\'ESSENZA': 'essence_perceptions',
    'PERCEZIONE DELL\'ESSENZA (1)': 'essence_perceptions',
    'FORMULE SENSORIE': 'detection_mastery',
    'ARTI DELLA GUARIGIONE': 'surface_ways',
    'DIFESA MAGICA': 'spell_defense',
    'MOTI NATURALI': 'nature_movement',
    'FORMULE DI MOVIMENTO': 'pathways',
    'ARTI NATURALI': 'nature_lore',
    'ASPETTI NATURALI': 'nature_ways',
    'CONTROLLO ANIMALE': 'animal_mastery',
    'FLUSSO DIRETTO': 'direct_channeling',
    'RIGENERAZIONE ORGANICA': 'organ_ways',
    'CANTI DEL POTERE': 'controlling_songs',
    'CONTROLLO SONICO': 'sound_mastery',
  };

  const getSpellListId = (nomeLista) => {
    const key = (nomeLista || '').toUpperCase().trim();
    return manualOverrides[key] || listNameToIdMap[key] || key;
  };

  const slugify = (str) => {
    return (str || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const exportSpells = () => {
    const headers = [
      'id', 'spell_list_id', 'level', 'name_it', 'name_en', 
      'class_it', 'class_en', 'istantaneo', 'efficacia', 'durata', 'raggio_azione',
      'description_it', 'description_en'
    ];
    
    const rows = [];
    const lists = spellsData.liste_incantesimi || [];
    
    lists.forEach(lista => {
      const spellListId = getSpellListId(lista.nome_lista);
      
      (lista.incantesimi || []).forEach(inc => {
        rows.push([
          `${spellListId}_${inc.numero}_${slugify(inc.nome)}`,
          spellListId,
          inc.numero,
          inc.nome,
          '', // name_en not available
          inc.tipologia || '',
          '', // class_en not available
          inc.istantaneo ? 'yes' : 'no',
          inc.efficacia || '',
          inc.durata || '',
          inc.raggio_azione || '',
          inc.descrizione || '',
          ''  // description_en not available
        ]);
      });
    });
    
    downloadCSV('spells.csv', headers, rows);
  };

  const exportEquipment = () => {
    const headers = [
      'categoria', 'nome', 'abbreviazione', 'costo_MB', 
      'peso_kg', 'note', 'dotazione_iniziale', 'carico'
    ];
    const rows = equipmentData.map(item => [
      item.categoria, item.nome, item.abbreviazione || '', item.costo_MB,
      item['peso in kg'] !== null ? item['peso in kg'] : '',
      item.note || '', item.dotazione_iniziale, item.carico
    ]);
    downloadCSV('TS-4-equipaggiamento.csv', headers, rows);
  };

  const exports = [
    { label: '1. Lingue (languages.csv)', count: languagesData.length, action: exportLanguages },
    { label: '2. Modifiche Speciali Popolo (TB-3-modifiche_speciali_popolo.csv)', count: racesData.length, action: exportRaces },
    { label: '3. Lingue Popoli (race_languages.csv)', count: raceLanguagesData.length, action: exportRaceLanguages },
    { label: '4. Gradi Adolescenza (TGP-5-sviluppo_abilita_adolescenza.csv)', count: raceAdSkillsData.length, action: exportRaceAdSkills },
    { label: '5. Professioni (professions.csv)', count: professionsData.length, action: exportProfessions },
    { label: '6. Costi Sviluppo (TGP-4-sviluppo_abilita.csv)', count: devCostsData.length, action: exportDevCosts },
    { label: '7. Bonus Livello (profession_level_bonuses.csv)', count: levelBonusesData.length, action: exportLevelBonuses },
    { label: '8. Catalogo Abilità (skills.csv)', count: skillsData.length, action: exportSkills },
    { label: '9. Liste di Incantesimi (spell_lists.csv)', count: spellListsData.length, action: exportSpellLists },
    { label: '10. Elenco Incantesimi (spells.csv)', count: (spellsData.liste_incantesimi || []).reduce((sum, l) => sum + (l.incantesimi || []).length, 0), action: exportSpells },
    { label: '11. Equipaggiamento (TS-4-equipaggiamento.csv)', count: equipmentData.length, action: exportEquipment },
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
            <strong>Nota di integrità:</strong> Le tabelle sono strutturate in prima forma normale (1NF) con ID stabili. Le relazioni molti-a-molti e le liste (come lingue e abilità d'adolescenza) sono state separate in tabelle associative esterne eliminando campi nidificati o pipe-separati.
          </div>
        </div>
      </div>
    </div>
  );
}
