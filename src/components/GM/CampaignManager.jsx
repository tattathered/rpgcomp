import React, { useState, useEffect } from "react";
import { subscribeToCampaigns, saveCampaign, deleteCampaign } from "../../services/campaignService";
import { subscribeToCompanies } from "../../services/companyService";
import { useAuth } from "../../contexts/AuthContext";
import { Compass, Plus, Trash2, Edit, Users, Play, Square, X, Check } from "lucide-react";

export default function CampaignManager({ activeCampaign, onSetActiveCampaign }) {
  const { user } = useAuth();
  const gmId = user?.uid;

  const [campaigns, setCampaigns] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCompanyIds, setSelectedCompanyIds] = useState([]);

  useEffect(() => {
    if (!gmId) return;
    const unsubCamp = subscribeToCampaigns(gmId, setCampaigns);
    const unsubComp = subscribeToCompanies(gmId, setCompanies);
    return () => {
      unsubCamp();
      unsubComp();
    };
  }, [gmId]);

  const handleStartCreate = () => {
    setEditingCampaign({ id: "" });
    setName("");
    setDescription("");
    setSelectedCompanyIds([]);
  };

  const handleStartEdit = (camp) => {
    setEditingCampaign(camp);
    setName(camp.name);
    setDescription(camp.description || "");
    setSelectedCompanyIds(camp.companyIds || []);
  };

  const handleCancel = () => {
    setEditingCampaign(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Il nome della campagna è obbligatorio.");

    const campData = {
      ...editingCampaign,
      name: name.trim(),
      description: description.trim(),
      companyIds: selectedCompanyIds
    };

    try {
      await saveCampaign(gmId, campData);
      // Se stiamo modificando la campagna attiva, aggiorniamo lo stato locale
      if (activeCampaign && activeCampaign.id === editingCampaign.id) {
        onSetActiveCampaign({ ...activeCampaign, ...campData });
      }
      setEditingCampaign(null);
      alert("Campagna salvata con successo!");
    } catch (err) {
      console.error(err);
      alert("Errore nel salvataggio: " + err.message);
    }
  };

  const handleDelete = async (id, campName) => {
    if (!confirm(`Sei sicuro di voler eliminare la campagna "${campName}"?`)) return;
    try {
      await deleteCampaign(gmId, id);
      if (activeCampaign && activeCampaign.id === id) {
        onSetActiveCampaign(null);
      }
    } catch (err) {
      console.error(err);
      alert("Errore nell'eliminazione: " + err.message);
    }
  };

  const handleToggleCompany = (compId) => {
    setSelectedCompanyIds(prev => 
      prev.includes(compId) ? prev.filter(id => id !== compId) : [...prev, compId]
    );
  };

  return (
    <div style={styles.container}>
      {editingCampaign ? (
        /* Form Creazione / Modifica */
        <div className="card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 className="card-title">{editingCampaign.id ? "Modifica Campagna" : "Nuova Campagna"}</h2>
            <button className="btn btn-outline btn-sm" onClick={handleCancel}><X size={16} /></button>
          </div>
          <form onSubmit={handleSave} className="card-body" style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Nome Campagna</label>
              <input
                type="text"
                placeholder="es. La Campagna di Moria"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Descrizione / Note</label>
              <textarea
                placeholder="Note sulla trama, luogo d'inizio, o dettagli generali della campagna..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ ...styles.input, minHeight: "80px", resize: "vertical" }}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Seleziona Compagnie Partecipanti</label>
              {companies.length === 0 ? (
                <p style={styles.noData}>Nessuna compagnia disponibile. Crea una compagnia prima di associarla alla campagna.</p>
              ) : (
                <div style={styles.compGrid}>
                  {companies.map(comp => {
                    const isChecked = selectedCompanyIds.includes(comp.id);
                    return (
                      <div
                        key={comp.id}
                        onClick={() => handleToggleCompany(comp.id)}
                        style={{
                          ...styles.compSelectCard,
                          borderColor: isChecked ? "var(--primary-color)" : "var(--border-color)",
                          backgroundColor: isChecked ? "var(--primary-light)" : "transparent"
                        }}
                      >
                        <Users size={16} color={isChecked ? "var(--primary-color)" : "var(--text-muted)"} />
                        <div style={styles.compSelectInfo}>
                          <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>{comp.name}</span>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{comp.characterIds?.length || 0} Membri</span>
                        </div>
                        {isChecked && <Check size={16} color="var(--primary-color)" style={{ marginLeft: "auto" }} />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={styles.actions}>
              <button type="button" className="btn btn-outline" onClick={handleCancel}>Annulla</button>
              <button type="submit" className="btn btn-primary">Salva Campagna</button>
            </div>
          </form>
        </div>
      ) : (
        /* Lista Campagne */
        <div className="card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 className="card-title">Gestione Campagne</h2>
              <p className="card-description">Definisci le tue avventure attive selezionando i gruppi di gioco partecipanti.</p>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleStartCreate}
              style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.5rem 1rem", fontSize: "0.85rem" }}
            >
              <Plus size={16} />
              Crea Campagna
            </button>
          </div>

          <div className="card-body">
            {campaigns.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
                <Compass size={48} style={{ margin: "0 auto 1rem auto", opacity: 0.4 }} />
                <p className="mb-4">Non hai ancora creato nessuna campagna.</p>
                <button className="btn btn-primary btn-sm" onClick={handleStartCreate}>
                  Crea Prima Campagna
                </button>
              </div>
            ) : (
              <div style={styles.grid}>
                {campaigns.map(camp => {
                  const isActive = activeCampaign?.id === camp.id;
                  const campCompanies = companies.filter(c => (camp.companyIds || []).includes(c.id));
                  
                  return (
                    <div key={camp.id} className="card" style={{ 
                      ...styles.campCard, 
                      borderColor: isActive ? "var(--primary-color)" : "var(--border-color)",
                      boxShadow: isActive ? "0 4px 12px rgba(2, 132, 199, 0.15)" : "var(--shadow-sm)"
                    }}>
                      <div style={styles.campHeader}>
                        <div style={styles.titleSection}>
                          <h3 style={styles.campName}>{camp.name}</h3>
                          {isActive && <span style={styles.activeBadge}>Campagna Attiva</span>}
                        </div>
                        <div style={styles.campActions}>
                          <button
                            className="btn btn-outline"
                            style={styles.iconBtn}
                            onClick={() => handleStartEdit(camp)}
                            title="Modifica"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="btn btn-outline"
                            style={{ ...styles.iconBtn, color: "var(--danger-color)" }}
                            onClick={() => handleDelete(camp.id, camp.name)}
                            title="Elimina"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      {camp.description && (
                        <p style={styles.campDesc}>{camp.description}</p>
                      )}

                      <div style={styles.detailsSection}>
                        <h4 style={styles.detailsTitle}>Compagnie Partecipanti ({campCompanies.length}):</h4>
                        {campCompanies.length === 0 ? (
                          <span style={styles.noData}>Nessuna compagnia associata</span>
                        ) : (
                          <div style={styles.badgeList}>
                            {campCompanies.map(c => (
                              <span key={c.id} style={styles.compBadge}>
                                <Users size={10} />
                                {c.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={styles.playSection}>
                        {isActive ? (
                          <button
                            className="btn btn-outline"
                            style={{ ...styles.playBtn, color: "var(--warning-color)", borderColor: "rgba(217, 119, 6, 0.3)" }}
                            onClick={() => onSetActiveCampaign(null)}
                          >
                            <Square size={14} />
                            Termina Sessione Campagna
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary"
                            style={styles.playBtn}
                            onClick={() => onSetActiveCampaign(camp)}
                          >
                            <Play size={14} />
                            Entra / Attiva Campagna
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem"
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem"
  },
  label: {
    fontSize: "0.75rem",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "var(--text-muted)"
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    fontSize: "0.9rem",
    backgroundColor: "var(--bg-color)",
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    color: "var(--text-main)",
    outline: "none"
  },
  noData: {
    fontSize: "0.85rem",
    color: "var(--text-muted)",
    fontStyle: "italic"
  },
  compGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "0.75rem",
    marginTop: "0.25rem"
  },
  compSelectCard: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0.75rem",
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.2s, border-color 0.2s"
  },
  compSelectInfo: {
    display: "flex",
    flexDirection: "column"
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.75rem",
    borderTop: "1px dashed var(--border-color)",
    paddingTop: "1rem",
    marginTop: "0.5rem"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "1.25rem"
  },
  campCard: {
    padding: "1.25rem",
    border: "1px solid var(--border-color)",
    borderRadius: "10px",
    boxShadow: "var(--shadow-sm)",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    transition: "border-color 0.2s, box-shadow 0.2s"
  },
  campHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: "1px dashed var(--border-color)",
    paddingBottom: "0.5rem"
  },
  titleSection: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem"
  },
  campName: {
    fontSize: "1.1rem",
    fontWeight: "750",
    margin: 0,
    color: "var(--text-main)"
  },
  activeBadge: {
    alignSelf: "flex-start",
    fontSize: "0.65rem",
    fontWeight: "750",
    backgroundColor: "var(--theme-stats-bg)",
    color: "var(--theme-stats-text)",
    border: "1px solid var(--theme-stats-border)",
    padding: "0.1rem 0.4rem",
    borderRadius: "4px",
    textTransform: "uppercase"
  },
  campActions: {
    display: "flex",
    gap: "0.4rem"
  },
  iconBtn: {
    padding: "0.3rem",
    borderColor: "var(--border-color)",
    color: "var(--text-muted)"
  },
  campDesc: {
    fontSize: "0.85rem",
    color: "var(--text-muted)",
    lineHeight: 1.4,
    margin: 0
  },
  detailsSection: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem"
  },
  detailsTitle: {
    fontSize: "0.75rem",
    fontWeight: "700",
    color: "var(--text-muted)",
    margin: 0
  },
  badgeList: {
    display: "flex",
    gap: "0.4rem",
    flexWrap: "wrap"
  },
  compBadge: {
    fontSize: "0.7rem",
    fontWeight: "600",
    backgroundColor: "var(--theme-primary-skills-bg)",
    color: "var(--theme-primary-skills-text)",
    border: "1px solid var(--theme-primary-skills-border)",
    padding: "0.15rem 0.5rem",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    gap: "0.25rem"
  },
  playSection: {
    marginTop: "auto",
    paddingTop: "0.5rem"
  },
  playBtn: {
    width: "100%",
    padding: "0.5rem",
    fontSize: "0.8rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.3rem",
    fontWeight: 700
  }
};
