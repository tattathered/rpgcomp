import React, { useState, useEffect } from "react";
import npcDataJson from "../../data/TS-3-personaggi_standard.json";
import { saveCampaignNpc } from "../../services/npcService";
import { Shield, Sword, Heart, Save, AlertCircle } from "lucide-react";

const ST3_CHARACTERISTICS = {
  guerriero: { FR: 15, AG: 10, CO: 5, IN: 0, IT: 0, PR: 0 },
  scout: { FR: 10, AG: 15, CO: 5, IN: 0, IT: 0, PR: 0 },
  ranger: { FR: 10, AG: 5, CO: 10, IT: 5, IN: 0, PR: 0 },
  bardo: { AG: 5, IN: 10, IT: 5, PR: 10, FR: 0, CO: 0 },
  mago: { AG: 5, IN: 15, IT: 5, PR: 5, FR: 0, CO: 0 },
  animista: { FR: 5, AG: 5, IN: 5, IT: 15, CO: 0, PR: 0 }
};

const BACKGROUND_INFO = {
  physical: [
    "Ottenuta un'arma primaria +10 (pre-applicato in BO)",
    "Ottenuta l'abilità speciale 'Riflessi Fulminei'",
    "Ottenute 30 monete d'oro",
    "Un'abilità secondaria sviluppata a rango 5",
    "Una caratteristica aumentata di +2"
  ],
  magical: [
    "Ottenuto moltiplicatore incantesimi +2 (spell adder)",
    "Appresa una lista di incantesimi extra",
    "Ottenute 30 monete d'oro",
    "Un'abilità secondaria sviluppata a rango 5",
    "Una caratteristica aumentata di +2"
  ]
};

export default function NpcCatalogTab({ gmId, campaignId, onSaveSuccess }) {
  const [name, setName] = useState("");
  const [profession, setProfession] = useState("guerriero");
  const [level, setLevel] = useState(1);
  const [equippedArmor, setEquippedArmor] = useState("nessuna");
  
  // Stati modificabili dei bonus
  const [stats, setStats] = useState({ FR: 0, AG: 0, CO: 0, IN: 0, IT: 0, PR: 0 });
  const [skills, setSkills] = useState({});
  const [hpMax, setHpMax] = useState(0);
  const [dbBonus, setDbBonus] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Inizializza i dati basandosi su professione e livello
  useEffect(() => {
    if (!profession || !level) return;

    // 1. Caratteristiche
    const baseStats = ST3_CHARACTERISTICS[profession] || { FR: 0, AG: 0, CO: 0, IN: 0, IT: 0, PR: 0 };
    setStats({ ...baseStats });

    // 2. Filtra le abilità da TS-3
    const profSkills = npcDataJson.filter(
      (s) => s.professione.toLowerCase() === profession.toLowerCase()
    );

    const parsedSkills = {};
    let parsedHp = 0;
    let parsedDb = 0;

    profSkills.forEach((item) => {
      const abilName = item.abilita;
      const lvlKey = `lvl${level}`;
      const rawVal = item[lvlKey];
      
      // Converte stringa "+15" o "-35" in numero
      const cleanVal = parseInt(String(rawVal || "0").replace("+", ""), 10) || 0;

      if (abilName === "Resistenza fisica (PF)") {
        parsedHp = cleanVal;
      } else if (abilName === "Bonus difensivo") {
        parsedDb = cleanVal;
      } else {
        parsedSkills[abilName] = cleanVal;
      }
    });

    setSkills(parsedSkills);
    setHpMax(parsedHp);
    setDbBonus(parsedDb);

    // Determina l'armatura equipaggiata di default basandosi sulla professione
    if (["guerriero", "scout", "ranger"].includes(profession)) {
      setEquippedArmor("cuoio_rinforzato");
    } else {
      setEquippedArmor("nessuna");
    }
  }, [profession, level]);

  // Gestione modifica caratteristiche
  const handleStatChange = (key, delta) => {
    setStats((prev) => ({
      ...prev,
      [key]: prev[key] + delta
    }));
  };

  // Gestione modifica abilità
  const handleSkillChange = (key, delta) => {
    setSkills((prev) => ({
      ...prev,
      [key]: prev[key] + delta
    }));
  };

  // Salvataggio del PNG
  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name.trim()) {
      setError("Inserisci un nome per il PNG.");
      return;
    }
    if (!campaignId) {
      setError("Nessuna campagna attiva selezionata.");
      return;
    }

    try {
      // Calcolo del DB finale: bonus difensivo (TS-3) + bonus agilità (ST-3)
      const agBonus = stats.AG || 0;
      const finalDb = dbBonus + agBonus;

      // Costruisce l'oggetto PNG
      const npcData = {
        name: name.trim(),
        professione: profession,
        livello: parseInt(level, 10),
        equippedArmor,
        hpMax: hpMax,
        hpCorrenti: hpMax,
        db: finalDb,
        stats: stats,
        skills: skills,
        culture: ["guerriero", "scout", "ranger", "animista"].includes(profession)
          ? "Umanità Rurale"
          : "Umanità Urbana",
        // Calcolo TR automatico basato sui bonus caratteristiche
        tr: {
          ess: stats.IN || 0,
          flu: stats.IT || 0,
          vel: stats.CO || 0,
          mal: stats.CO || 0,
          cal: stats.CO || 0,
          fre: stats.CO || 0
        }
      };

      await saveCampaignNpc(gmId, campaignId, npcData);
      setSuccess(`PNG "${name}" salvato con successo!`);
      setName("");
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      console.error(err);
      setError("Errore durante il salvataggio su Firestore.");
    }
  };

  const isPhysical = ["guerriero", "scout", "ranger"].includes(profession);
  const culture = ["guerriero", "scout", "ranger", "animista"].includes(profession)
    ? "Umanità Rurale (Uomini delle Campagne)"
    : "Umanità Urbana (Uomini delle Città)";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Configurazione & Info Generali */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Configura PNG</h3>
          
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Nome PNG</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="es. Guardia di Osgiliath"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Professione</label>
                <select
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="guerriero">Guerriero</option>
                  <option value="scout">Scout</option>
                  <option value="ranger">Ranger</option>
                  <option value="bardo">Bardo</option>
                  <option value="mago">Mago</option>
                  <option value="animista">Animista</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Livello</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => (
                    <option key={lvl} value={lvl}>
                      Livello {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Armatura Indossata</label>
              <select
                value={equippedArmor}
                onChange={(e) => setEquippedArmor(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="nessuna">Nessuna Armatura</option>
                <option value="cuoio_grezzo">Cuoio Grezzo</option>
                <option value="cuoio_rinforzato">Cuoio Rinforzato</option>
                <option value="maglia">Corazza di Maglia</option>
                <option value="piastre">Corazza di Piastre</option>
              </select>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-1.5 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 text-green-700 text-xs rounded-lg flex items-center gap-1.5 border border-green-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              Salva in Campagna
            </button>
          </form>
        </div>

        {/* Premesse di Background (Informativo) */}
        <div className="bg-amber-50/50 p-5 rounded-xl border border-amber-200 shadow-sm space-y-3">
          <h4 className="text-sm font-black text-amber-900 flex items-center gap-1.5">
            <Shield className="w-4 h-4" />
            Premesse dello Sviluppo (ST-3)
          </h4>
          <p className="text-xs text-amber-800 leading-relaxed">
            I valori medi indicati sono calcolati assumendo l'appartenenza a: <br/>
            <strong>{culture}</strong>.
          </p>
          <div className="border-t border-amber-200 pt-2.5">
            <span className="text-[10px] font-bold text-amber-900 block uppercase tracking-wider mb-1">
              Opzioni Background Incluse:
            </span>
            <ul className="text-xs text-amber-800 space-y-1 list-disc pl-4 leading-normal">
              {(isPhysical ? BACKGROUND_INFO.physical : BACKGROUND_INFO.magical).map((bg, idx) => (
                <li key={idx}>{bg}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Editor Valori Scheda (Statistiche & Abilità) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Caratteristiche e Parametri Fisici */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2 flex justify-between items-center">
            <span>Statistiche Base</span>
            <div className="flex gap-4 text-xs font-semibold text-gray-600">
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4 text-red-500" /> HP:
                <input
                  type="number"
                  value={hpMax}
                  onChange={(e) => setHpMax(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-12 text-center font-bold border border-gray-300 rounded ml-1"
                />
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-indigo-500" /> DB Base:
                <input
                  type="number"
                  value={dbBonus}
                  onChange={(e) => setDbBonus(parseInt(e.target.value, 10) || 0)}
                  className="w-12 text-center font-bold border border-gray-300 rounded ml-1"
                />
              </span>
            </div>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {Object.keys(stats).map((key) => (
              <div key={key} className="border border-gray-200 rounded-lg p-2.5 bg-gray-50/50 flex flex-col items-center">
                <span className="text-xs font-extrabold text-gray-500">{key}</span>
                <span className="text-lg font-black text-indigo-900 my-1">
                  {stats[key] >= 0 ? `+${stats[key]}` : stats[key]}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleStatChange(key, -1)}
                    className="w-5 h-5 flex items-center justify-center text-xs font-black bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
                  >
                    -
                  </button>
                  <button
                    onClick={() => handleStatChange(key, 1)}
                    className="w-5 h-5 flex items-center justify-center text-xs font-black bg-white border border-gray-300 rounded text-gray-600 hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Abilità e Competenze */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Bonus Abilità Medi (Modificabili)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 max-h-[400px] overflow-y-auto pr-2">
            {Object.keys(skills).map((key) => (
              <div key={key} className="flex justify-between items-center py-1.5 border-b border-gray-100 hover:bg-gray-50/30 px-1 rounded">
                <span className="text-xs text-gray-700 font-semibold">{key}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-indigo-950 w-10 text-right">
                    {skills[key] >= 0 ? `+${skills[key]}` : skills[key]}
                  </span>
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => handleSkillChange(key, -1)}
                      className="w-5 h-5 flex items-center justify-center text-xs font-bold bg-gray-100 rounded text-gray-600 hover:bg-gray-200"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleSkillChange(key, 1)}
                      className="w-5 h-5 flex items-center justify-center text-xs font-bold bg-gray-100 rounded text-gray-600 hover:bg-gray-200"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
