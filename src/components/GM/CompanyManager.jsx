import React, { useState, useEffect } from "react";
import { subscribeToCompanies, saveCompany, deleteCompany } from "../../services/companyService";
import { useAuth } from "../../contexts/AuthContext";
import { Users, Plus, Trash2, Edit, Shield, Check, X } from "lucide-react";

export default function CompanyManager({ savedCharacters }) {
  const { user } = useAuth();
  const gmId = user?.uid;

  const [companies, setCompanies] = useState([]);
  const [editingCompany, setEditingCompany] = useState(null); // per edit o creazione
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCharIds, setSelectedCharIds] = useState([]);

  useEffect(() => {
    if (!gmId) return;
    const unsub = subscribeToCompanies(gmId, setCompanies);
    return unsub;
  }, [gmId]);

  const handleStartCreate = () => {
    setEditingCompany({ id: "" });
    setName("");
    setDescription("");
    setSelectedCharIds([]);
  };

  const handleStartEdit = (comp) => {
    setEditingCompany(comp);
    setName(comp.name);
    setDescription(comp.description || "");
    setSelectedCharIds(comp.characterIds || []);
  };

  const handleCancel = () => {
    setEditingCompany(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert("Il nome della compagnia è obbligatorio.");

    const compData = {
      ...editingCompany,
      name: name.trim(),
      description: description.trim(),
      characterIds: selectedCharIds
    };

    try {
      await saveCompany(gmId, compData);
      setEditingCompany(null);
      alert("Compagnia salvata con successo!");
    } catch (err) {
      console.error(err);
      alert("Errore nel salvataggio: " + err.message);
    }
  };

  const handleDelete = async (id, compName) => {
    if (!confirm(`Sei sicuro di voler eliminare la compagnia "${compName}"?`)) return;
    try {
      await deleteCompany(gmId, id);
    } catch (err) {
      console.error(err);
      alert("Errore nell'eliminazione: " + err.message);
    }
  };

  const handleToggleChar = (charId) => {
    setSelectedCharIds(prev => 
      prev.includes(charId) ? prev.filter(id => id !== charId) : [...prev, charId]
    );
  };

  return (
    <div style={styles.container}>
      {editingCompany ? (
        /* Form Creazione / Modifica */
        <div className="card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 className="card-title">{editingCompany.id ? "Modifica Compagnia" : "Nuova Compagnia"}</h2>
            <button className="btn btn-outline btn-sm" onClick={handleCancel}><X size={16} /></button>
          </div>
          <form onSubmit={handleSave} className="card-body" style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Nome Compagnia</label>
              <input
                type="text"
                placeholder="es. I Cavalieri di Arthedain"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Descrizione / Note</label>
              <textarea
                placeholder="Breve descrizione o scopo della compagnia..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ ...styles.input, minHeight: "80px", resize: "vertical" }}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Seleziona Membri della Compagnia (PG)</label>
              {savedCharacters.length === 0 ? (
                <p style={styles.noChars}>Nessun personaggio disponibile nel roster. Crea un PG prima di aggiungerlo.</p>
              ) : (
                <div style={styles.charGrid}>
                  {savedCharacters.map(char => {
                    const isChecked = selectedCharIds.includes(char.id);
                    return (
                      <div
                        key={char.id}
                        onClick={() => handleToggleChar(char.id)}
                        style={{
                          ...styles.charSelectCard,
                          borderColor: isChecked ? "var(--primary-color)" : "var(--border-color)",
                          backgroundColor: isChecked ? "var(--primary-light)" : "transparent"
                        }}
                      >
                        <Shield size={16} color={isChecked ? "var(--primary-color)" : "var(--text-muted)"} />
                        <div style={styles.charSelectInfo}>
                          <span style={{ fontSize: "0.85rem", fontWeight: "700" }}>{char.name}</span>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{char.race?.nome || char.race?.popolo} | {char.profession?.professione}</span>
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
              <button type="submit" className="btn btn-primary">Salva Compagnia</button>
            </div>
          </form>
        </div>
      ) : (
        /* Lista Compagnie */
        <div className="card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 className="card-title">Gestione Compagnie</h2>
              <p className="card-description">Crea gruppi di personaggi per organizzare le tue sessioni di gioco.</p>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleStartCreate}
              style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.5rem 1rem", fontSize: "0.85rem" }}
            >
              <Plus size={16} />
              Crea Compagnia
            </button>
          </div>

          <div className="card-body">
            {companies.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
                <Users size={48} style={{ margin: "0 auto 1rem auto", opacity: 0.4 }} />
                <p className="mb-4">Non hai ancora creato nessuna compagnia.</p>
                <button className="btn btn-primary btn-sm" onClick={handleStartCreate}>
                  Crea Prima Compagnia
                </button>
              </div>
            ) : (
              <div style={styles.grid}>
                {companies.map(comp => {
                  const members = savedCharacters.filter(c => (comp.characterIds || []).includes(c.id));
                  return (
                    <div key={comp.id} className="card" style={styles.compCard}>
                      <div style={styles.compHeader}>
                        <h3 style={styles.compName}>{comp.name}</h3>
                        <div style={styles.compActions}>
                          <button
                            className="btn btn-outline"
                            style={styles.iconBtn}
                            onClick={() => handleStartEdit(comp)}
                            title="Modifica"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="btn btn-outline"
                            style={{ ...styles.iconBtn, color: "var(--danger-color)" }}
                            onClick={() => handleDelete(comp.id, comp.name)}
                            title="Elimina"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      {comp.description && (
                        <p style={styles.compDesc}>{comp.description}</p>
                      )}

                      <div style={styles.membersSection}>
                        <h4 style={styles.membersTitle}>Membri ({members.length}):</h4>
                        {members.length === 0 ? (
                          <span style={styles.noMembers}>Nessun personaggio associato</span>
                        ) : (
                          <div style={styles.membersList}>
                            {members.map(m => (
                              <span key={m.id} style={styles.memberBadge}>
                                <Shield size={10} />
                                {m.name}
                              </span>
                            ))}
                          </div>
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
  noChars: {
    fontSize: "0.85rem",
    color: "var(--text-muted)",
    fontStyle: "italic"
  },
  charGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "0.75rem",
    marginTop: "0.25rem"
  },
  charSelectCard: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0.75rem",
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.2s, border-color 0.2s"
  },
  charSelectInfo: {
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
  compCard: {
    padding: "1.25rem",
    border: "1px solid var(--border-color)",
    borderRadius: "10px",
    boxShadow: "var(--shadow-sm)",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem"
  },
  compHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: "1px dashed var(--border-color)",
    paddingBottom: "0.5rem"
  },
  compName: {
    fontSize: "1.1rem",
    fontWeight: "750",
    margin: 0,
    color: "var(--text-main)"
  },
  compActions: {
    display: "flex",
    gap: "0.4rem"
  },
  iconBtn: {
    padding: "0.3rem",
    borderColor: "var(--border-color)",
    color: "var(--text-muted)"
  },
  compDesc: {
    fontSize: "0.85rem",
    color: "var(--text-muted)",
    lineHeight: 1.4,
    margin: 0
  },
  membersSection: {
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem"
  },
  membersTitle: {
    fontSize: "0.75rem",
    fontWeight: "700",
    color: "var(--text-muted)",
    margin: 0
  },
  noMembers: {
    fontSize: "0.75rem",
    fontStyle: "italic",
    color: "var(--text-muted)"
  },
  membersList: {
    display: "flex",
    gap: "0.4rem",
    flexWrap: "wrap"
  },
  memberBadge: {
    fontSize: "0.7rem",
    fontWeight: "600",
    backgroundColor: "var(--theme-race-blu-bg)",
    color: "var(--theme-race-blu-text)",
    border: "1px solid var(--theme-race-blu-border)",
    padding: "0.15rem 0.5rem",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    gap: "0.25rem"
  }
};
