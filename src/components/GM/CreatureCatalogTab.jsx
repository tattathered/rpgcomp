import React, { useState, useMemo } from "react";
import creaturesJson from "../../data/TS-2-animali_TdM.json";
import { saveCampaignCreature } from "../../services/npcService";
import { Search, Plus, Shield, Sword, Heart, Compass, Check, AlertCircle } from "lucide-react";

export default function CreatureCatalogTab({ gmId, campaignId, onSaveSuccess }) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedCreature, setSelectedCreature] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [customCreatureName, setCustomCreatureName] = useState("");

  // Estrae categorie uniche
  const categories = useMemo(() => {
    const cats = creaturesJson.map((c) => c.Categoria).filter(Boolean);
    return ["all", ...new Set(cats)];
  }, []);

  // Filtra e cerca le creature
  const filteredCreatures = useMemo(() => {
    return creaturesJson.filter((c) => {
      const matchesSearch = (c.Nome || "").toLowerCase().includes(search.toLowerCase()) ||
                            (c.Note || "").toLowerCase().includes(search.toLowerCase());
      const matchesCat = categoryFilter === "all" || c.Categoria === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [search, categoryFilter]);

  // Seleziona la prima creatura della lista se nessuna è selezionata
  React.useEffect(() => {
    if (filteredCreatures.length > 0 && !selectedCreature) {
      setSelectedCreature(filteredCreatures[0]);
    }
  }, [filteredCreatures, selectedCreature]);

  // Sincronizza il nome personalizzato all'inserimento/cambio della creatura selezionata
  React.useEffect(() => {
    if (selectedCreature) {
      setCustomCreatureName(selectedCreature.Nome || "");
    }
  }, [selectedCreature]);

  // Associa la creatura selezionata alla campagna
  const handleAddToCampaign = async () => {
    setError("");
    setSuccess("");

    if (!selectedCreature) return;
    if (!campaignId) {
      setError("Nessuna campagna attiva selezionata.");
      return;
    }

    try {
      const finalName = customCreatureName.trim() || selectedCreature.Nome;
      // Crea un clone per la campagna
      const creatureClone = {
        Nome: finalName,
        Categoria: selectedCreature.Categoria,
        Livello: parseInt(selectedCreature.Livello, 10) || 0,
        quantita: selectedCreature.quantita,
        velocità_movimento: selectedCreature["velocità movimento"] || "",
        VM_movimento_base: selectedCreature.VM_movimento_base || "",
        VM_bonus_MM: parseInt(selectedCreature.VM_bonus_MM, 10) || 0,
        velocità_attacco: selectedCreature.velocità_attacco || "",
        VA_bonus_inziativa: parseInt(selectedCreature.VA_bonus_inziativa, 10) || 0,
        punti_ferita: parseInt(selectedCreature.punti_ferita, 10) || 0,
        hpCorrenti: parseInt(selectedCreature.punti_ferita, 10) || 0,
        tipo_armatura: selectedCreature.tipo_armatura || "nessuna armatura",
        bonus_difensivo: parseInt(selectedCreature.bonus_difensivo, 10) || 0,
        Attacco_uno: selectedCreature.Attacco_uno || "",
        Attacco_uno_BO: parseInt(selectedCreature.Attacco_uno_BO, 10) || 0,
        Attacco_due: selectedCreature.Attacco_due || "",
        Attacco_due_BO: parseInt(selectedCreature.Attacco_due_BO, 10) || 0,
        attacco_speciale: selectedCreature.attacco_speciale || "",
        Dimensioni_animale: selectedCreature.Dimensioni_animale || "medio",
        critico_animale: selectedCreature.critico_animale || "normale",
        Note: selectedCreature.Note || ""
      };

      await saveCampaignCreature(gmId, campaignId, creatureClone);
      setSuccess(`Creatura "${finalName}" aggiunta alla campagna!`);
      if (onSaveSuccess) onSaveSuccess();
      
      // Auto dismiss success
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error(err);
      setError("Errore durante il salvataggio su Firestore.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Lista & Ricerca */}
      <div className="lg:col-span-1 bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col h-[600px]">
        <h3 className="text-md font-bold text-gray-800 mb-3 uppercase tracking-wider">Catalogo Bestiario</h3>
        
        {/* Filtri */}
        <div className="space-y-2 mb-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca per nome o note..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tutte le Categorie ({creaturesJson.length})</option>
            {categories.filter(c => c !== "all").map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1.5">
          {filteredCreatures.length === 0 ? (
            <div className="text-center py-8 text-xs text-gray-400">Nessuna creatura trovata.</div>
          ) : (
            filteredCreatures.map((c, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedCreature(c);
                  setError("");
                  setSuccess("");
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex justify-between items-center transition-colors ${
                  selectedCreature?.Nome === c.Nome
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "hover:bg-gray-100 text-gray-700 bg-gray-50/50"
                }`}
              >
                <span className="truncate max-w-[150px]">{c.Nome}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                  selectedCreature?.Nome === c.Nome ? "bg-indigo-700 text-white" : "bg-gray-200 text-gray-600"
                }`}>
                  Lvl {c.Livello}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Dettagli della Creatura */}
      <div className="lg:col-span-2 space-y-4">
        {selectedCreature ? (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6 flex flex-col justify-between h-[600px] overflow-y-auto">
            
            <div className="space-y-6">
              {/* Intestazione */}
              <div className="border-b border-gray-200 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                      {selectedCreature.Categoria}
                    </span>
                    <h2 className="text-2xl font-black text-gray-800 mt-1">{selectedCreature.Nome}</h2>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-500 block">Livello</span>
                    <span className="text-2xl font-black text-indigo-900">{selectedCreature.Livello}</span>
                  </div>
                </div>
              </div>

              {/* Grid Parametri Chiave */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="border border-gray-150 p-3 rounded-lg bg-gray-50/30 flex items-center gap-2.5">
                  <Heart className="w-5 h-5 text-red-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold block uppercase">Punti Ferita</span>
                    <span className="text-base font-black text-gray-800">{selectedCreature.punti_ferita}</span>
                  </div>
                </div>

                <div className="border border-gray-150 p-3 rounded-lg bg-gray-50/30 flex items-center gap-2.5">
                  <Shield className="w-5 h-5 text-indigo-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold block uppercase">Defensa (DB)</span>
                    <span className="text-base font-black text-gray-800">+{selectedCreature.bonus_difensivo}</span>
                  </div>
                </div>

                <div className="border border-gray-150 p-3 rounded-lg bg-gray-50/30 flex items-center gap-2.5">
                  <Compass className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold block uppercase">Armatura</span>
                    <span className="text-xs font-extrabold text-gray-800 capitalize truncate max-w-[90px]" title={selectedCreature.tipo_armatura}>
                      {selectedCreature.tipo_armatura}
                    </span>
                  </div>
                </div>

                <div className="border border-gray-150 p-3 rounded-lg bg-gray-50/30 flex items-center gap-2.5">
                  <Compass className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold block uppercase">Taglia / Crit</span>
                    <span className="text-xs font-extrabold text-gray-800 capitalize">
                      {selectedCreature.Dimensioni_animale} ({selectedCreature.critico_animale})
                    </span>
                  </div>
                </div>
              </div>

              {/* Attacchi della Creatura */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1">
                  <Sword className="w-4 h-4 text-indigo-600" />
                  Attacchi Standard
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedCreature.Attacco_uno && (
                    <div className="border border-indigo-100 p-3.5 rounded-lg bg-indigo-50/20 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-indigo-600 font-bold uppercase block">Attacco Primario</span>
                        <span className="text-sm font-bold text-indigo-950">{selectedCreature.Attacco_uno}</span>
                      </div>
                      <span className="text-lg font-black text-indigo-900 bg-white border border-indigo-200 px-2 py-0.5 rounded shadow-2xs">
                        +{selectedCreature.Attacco_uno_BO}
                      </span>
                    </div>
                  )}

                  {selectedCreature.Attacco_due ? (
                    <div className="border border-indigo-100 p-3.5 rounded-lg bg-indigo-50/20 flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-indigo-600 font-bold uppercase block">Attacco Secondario</span>
                        <span className="text-sm font-bold text-indigo-950">{selectedCreature.Attacco_due}</span>
                      </div>
                      <span className="text-lg font-black text-indigo-900 bg-white border border-indigo-200 px-2 py-0.5 rounded shadow-2xs">
                        +{selectedCreature.Attacco_due_BO}
                      </span>
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-200 p-3.5 rounded-lg bg-gray-50/30 flex items-center justify-center text-xs text-gray-400">
                      Nessun attacco secondario
                    </div>
                  )}
                </div>
              </div>

              {/* Dettagli Movimento & Altre note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs border-t border-gray-100 pt-4">
                <div className="space-y-2">
                  <h5 className="font-bold text-gray-700">Movimento & Iniziativa</h5>
                  <ul className="space-y-1 text-gray-600">
                    <li>Velocità Movimento: <strong>{selectedCreature["velocità movimento"]}</strong></li>
                    <li>Distanza Base: <strong>{selectedCreature.VM_movimento_base}</strong></li>
                    <li>Mod. MM (Fisso): <strong>{selectedCreature.VM_bonus_MM}</strong></li>
                    <li>Velocità Iniziativa: <strong>{selectedCreature.velocità_attacco}</strong></li>
                    <li>Mod. Iniziativa: <strong>{selectedCreature.VA_bonus_inziativa}</strong></li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h5 className="font-bold text-gray-700">Abilità Speciali & Note</h5>
                  <div className="p-2.5 bg-gray-50 rounded border border-gray-150 text-gray-600 min-h-[70px]">
                    {selectedCreature.Note || "Nessuna nota particolare."}
                    {selectedCreature.attacco_speciale && (
                      <div className="mt-1.5 pt-1.5 border-t border-gray-200 text-indigo-900 font-semibold">
                        Speciale: {selectedCreature.attacco_speciale}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Azioni di salvataggio */}
            <div className="pt-4 border-t border-gray-100">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg mb-3 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-50 text-green-700 text-xs rounded-lg mb-3 flex items-center gap-1.5">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {/* Input Personalizzazione Nome */}
              <div className="mb-4 bg-slate-50 border border-gray-150 rounded-lg p-3 text-left">
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                  Personalizza Nome prima di Associare:
                </label>
                <input
                  type="text"
                  value={customCreatureName}
                  onChange={(e) => setCustomCreatureName(e.target.value)}
                  placeholder="Nome del Mostro/Creatura"
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800 bg-white"
                />
                <p className="text-[9px] text-gray-400 mt-1 leading-normal">
                  Verrà salvato questo nome personalizzato per la campagna attiva (es. per distinguerlo nel roster).
                </p>
              </div>

              <button
                onClick={handleAddToCampaign}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 text-sm shadow-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                Associa questa Creatura alla Campagna Attiva
              </button>
            </div>

          </div>
        ) : (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl h-[600px] flex items-center justify-center text-gray-400 text-sm">
            Seleziona una creatura dal catalogo
          </div>
        )}
      </div>

    </div>
  );
}
