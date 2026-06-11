import React, { useState, useEffect } from "react";
import { db, functions } from "../../firebase";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useAuth } from "../../contexts/AuthContext";
import { User, UserCheck, UserX, UserPlus, Plus, Shield, Check, Info, Edit } from "lucide-react";
import PlayerForm from "./PlayerForm";

export default function PlayerManager({ savedCharacters }) {
  const { user } = useAuth();
  const gmId = user?.uid;

  const [players, setPlayers] = useState([]);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assigningPlayerId, setAssigningPlayerId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Modifica un giocatore tramite Cloud Function Callable
  const handleEditPlayerSubmit = async (playerData) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const updatePlayerCallable = httpsCallable(functions, "updatePlayer");
      const result = await updatePlayerCallable({
        playerId: playerData.uid,
        displayName: playerData.displayName,
        password: playerData.password // opzionale
      });
      
      if (result.data.success) {
        alert(`Dettagli del giocatore "${playerData.displayName}" aggiornati con successo!`);
        setEditingPlayer(null);
      }
    } catch (err) {
      console.error("Errore nell'aggiornamento del giocatore:", err);
      setErrorMessage(err.message || "Impossibile aggiornare il giocatore.");
    } finally {
      setLoading(false);
    }
  };

  // Carica i giocatori del GM in real-time
  useEffect(() => {
    if (!gmId) return;
    const playersRef = collection(db, "gms", gmId, "players");
    const unsub = onSnapshot(playersRef, (snapshot) => {
      const list = [];
      snapshot.forEach((doc) => {
        list.push(doc.data());
      });
      // Ordina per data di creazione o nome
      list.sort((a, b) => a.displayName.localeCompare(b.displayName));
      setPlayers(list);
    }, (error) => {
      console.error("Errore nel caricamento dei giocatori:", error);
    });
    return unsub;
  }, [gmId]);

  // Crea un nuovo account giocatore tramite Cloud Function Callable
  const handleCreatePlayerSubmit = async (playerData) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const createPlayerCallable = httpsCallable(functions, "createPlayer");
      const result = await createPlayerCallable(playerData);
      
      if (result.data.success) {
        if (result.data.associatedExisting) {
          alert(`L'utente con email ${playerData.email} esisteva già ed è stato associato correttamente al tuo workspace.`);
        } else {
          alert(`Giocatore "${playerData.displayName}" creato con successo!`);
        }
        setIsAddingPlayer(false);
      }
    } catch (err) {
      console.error("Errore nella creazione del giocatore:", err);
      setErrorMessage(err.message || "Impossibile creare il giocatore.");
    } finally {
      setLoading(false);
    }
  };

  // Abilita/Disabilita giocatore tramite Cloud Function Callable
  const handleTogglePlayerStatus = async (player) => {
    const nextStatus = !player.enabled;
    const confirmMessage = nextStatus 
      ? `Vuoi riabilitare l'accesso per il giocatore "${player.displayName}"?`
      : `Vuoi disabilitare temporaneamente l'accesso per il giocatore "${player.displayName}"?`;

    if (!confirm(confirmMessage)) return;

    setLoading(true);
    try {
      const togglePlayerStatusCallable = httpsCallable(functions, "togglePlayerStatus");
      await togglePlayerStatusCallable({
        playerId: player.uid,
        enabled: nextStatus
      });
      alert(`Stato del giocatore aggiornato con successo.`);
    } catch (err) {
      console.error("Errore nel toggle dello stato del giocatore:", err);
      alert("Errore: " + (err.message || "Impossibile aggiornare lo stato."));
    } finally {
      setLoading(false);
    }
  };

  // Associa o disassocia un PG ad un giocatore (modifica diretta in Firestore)
  const handleToggleCharacterAssignment = async (playerId, charId, isAssigned) => {
    const player = players.find(p => p.uid === playerId);
    if (!player) return;

    let updatedCharIds = [...(player.characterIds || [])];
    if (isAssigned) {
      if (!updatedCharIds.includes(charId)) {
        updatedCharIds.push(charId);
      }
    } else {
      updatedCharIds = updatedCharIds.filter(id => id !== charId);
    }

    try {
      const playerDocRef = doc(db, "gms", gmId, "players", playerId);
      await updateDoc(playerDocRef, {
        characterIds: updatedCharIds
      });
    } catch (err) {
      console.error("Errore nell'assegnazione del PG:", err);
      alert("Impossibile salvare l'assegnazione: " + err.message);
    }
  };

  const getPlayerAssignedCharacters = (charIds) => {
    if (!charIds || charIds.length === 0) return [];
    return savedCharacters.filter(c => charIds.includes(c.id));
  };

  return (
    <div className="card">
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 className="card-title">Gestione Giocatori</h2>
          <p className="card-description">Invita nuovi giocatori al tuo tavolo e assegna loro i personaggi.</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setIsAddingPlayer(true)}
          style={{ display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.5rem 1rem", fontSize: "0.85rem" }}
          disabled={loading}
        >
          <UserPlus size={16} />
          Nuovo Giocatore
        </button>
      </div>

      <div className="card-body">
        {errorMessage && (
          <div style={styles.errorBox} className="mb-4">
            <strong>Errore:</strong> {errorMessage}
          </div>
        )}

        {players.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
            <User size={48} style={{ margin: "0 auto 1rem auto", opacity: 0.4 }} />
            <p className="mb-4">Non hai ancora invitato nessun giocatore.</p>
            <button className="btn btn-primary btn-sm" onClick={() => setIsAddingPlayer(true)}>
              Invita Primo Giocatore
            </button>
          </div>
        ) : (
          <div style={styles.listContainer}>
            {players.map((player) => {
              const assignedChars = getPlayerAssignedCharacters(player.characterIds);
              const isAssigningThisPlayer = assigningPlayerId === player.uid;

              return (
                <div key={player.uid} style={styles.playerRow}>
                  {/* Info Giocatore */}
                  <div style={styles.playerInfo}>
                    <div style={styles.nameSection}>
                      <span style={styles.playerName}>{player.displayName}</span>
                      <span style={{ 
                        ...styles.statusBadge, 
                        backgroundColor: player.enabled ? "var(--theme-stats-bg)" : "var(--theme-race-rosso-bg)",
                        color: player.enabled ? "var(--theme-stats-text)" : "var(--theme-race-rosso-text)"
                      }}>
                        {player.enabled ? "Attivo" : "Disabilitato"}
                      </span>
                    </div>
                    <span style={styles.playerEmail}>{player.email}</span>
                    
                    {/* PG Assegnati */}
                    <div style={styles.assignedContainer}>
                      <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)" }}>PG Assegnati:</span>
                      {assignedChars.length === 0 ? (
                        <span style={styles.noChars}>Nessun personaggio</span>
                      ) : (
                        <div style={styles.badgeList}>
                          {assignedChars.map(c => (
                            <span key={c.id} style={styles.charBadge}>
                              <Shield size={10} />
                              {c.name} (Liv. {1 + (c.levelDevelopments || []).length})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pulsanti Azione */}
                  <div style={styles.actionsCell}>
                    <button
                      className="btn btn-outline"
                      style={styles.actionBtn}
                      onClick={() => setAssigningPlayerId(isAssigningThisPlayer ? null : player.uid)}
                    >
                      {isAssigningThisPlayer ? "Chiudi Assegnazione" : "Assegna PG"}
                    </button>

                    <button
                      className="btn btn-outline"
                      style={styles.actionBtn}
                      onClick={() => setEditingPlayer(player)}
                      disabled={loading}
                    >
                      <Edit size={14} style={{ marginRight: "4px" }} />
                      Modifica Info
                    </button>

                    <button
                      className="btn btn-outline"
                      style={{ 
                        ...styles.actionBtn, 
                        color: player.enabled ? "var(--danger-color)" : "var(--success-color)",
                        borderColor: player.enabled ? "rgba(220, 38, 38, 0.2)" : "rgba(22, 163, 74, 0.2)" 
                      }}
                      onClick={() => handleTogglePlayerStatus(player)}
                      disabled={loading}
                    >
                      {player.enabled ? (
                        <>
                          <UserX size={14} style={{ marginRight: "4px" }} />
                          Disabilita
                        </>
                      ) : (
                        <>
                          <UserCheck size={14} style={{ marginRight: "4px" }} />
                          Abilita
                        </>
                      )}
                    </button>
                  </div>

                  {/* Pannello di Assegnazione PG (visualizzato in-place se cliccato) */}
                  {isAssigningThisPlayer && (
                    <div style={styles.assignmentPanel}>
                      <h4 style={styles.panelTitle}>Seleziona i personaggi da affidare a {player.displayName}:</h4>
                      {savedCharacters.length === 0 ? (
                        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                          Non hai ancora creato nessun personaggio nel Roster. Vai a "Creazione PG" per crearne uno!
                        </p>
                      ) : (
                        <div style={styles.charGrid}>
                          {savedCharacters.map((char) => {
                            const isChecked = (player.characterIds || []).includes(char.id);
                            return (
                              <label key={char.id} style={{ 
                                ...styles.charCheckboxLabel,
                                border: isChecked ? "1px solid var(--primary-color)" : "1px solid var(--border-color)",
                                backgroundColor: isChecked ? "var(--primary-light)" : "transparent"
                              }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => handleToggleCharacterAssignment(player.uid, char.id, e.target.checked)}
                                  style={styles.checkbox}
                                />
                                <div style={styles.charCheckboxInfo}>
                                  <span style={{ fontWeight: 650, fontSize: "0.85rem", color: isChecked ? "var(--primary-color)" : "var(--text-main)" }}>
                                    {char.name}
                                  </span>
                                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                    {char.race?.nome || char.race?.popolo} | {char.profession?.professione}
                                  </span>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isAddingPlayer && (
        <PlayerForm
          onSubmit={handleCreatePlayerSubmit}
          onCancel={() => setIsAddingPlayer(false)}
          loading={loading}
        />
      )}

      {editingPlayer && (
        <PlayerForm
          initialData={editingPlayer}
          onSubmit={handleEditPlayerSubmit}
          onCancel={() => setEditingPlayer(null)}
          loading={loading}
        />
      )}
    </div>
  );
}

const styles = {
  listContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem"
  },
  playerRow: {
    backgroundColor: "var(--surface-color)",
    border: "1px solid var(--border-color)",
    borderRadius: "10px",
    padding: "1.25rem",
    boxShadow: "var(--shadow-sm)",
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "1rem",
    position: "relative"
  },
  playerInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem"
  },
  nameSection: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem"
  },
  playerName: {
    fontSize: "1.1rem",
    fontWeight: "750",
    color: "var(--text-main)"
  },
  statusBadge: {
    fontSize: "0.65rem",
    fontWeight: "750",
    padding: "0.15rem 0.5rem",
    borderRadius: "20px",
    textTransform: "uppercase",
    letterSpacing: "0.02em"
  },
  playerEmail: {
    fontSize: "0.8rem",
    color: "var(--text-muted)"
  },
  assignedContainer: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginTop: "0.4rem",
    flexWrap: "wrap"
  },
  noChars: {
    fontSize: "0.75rem",
    fontStyle: "italic",
    color: "var(--text-muted)"
  },
  badgeList: {
    display: "flex",
    gap: "0.4rem",
    flexWrap: "wrap"
  },
  charBadge: {
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
  },
  actionsCell: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    justifyContent: "center",
    minWidth: "160px"
  },
  actionBtn: {
    padding: "0.4rem 0.75rem",
    fontSize: "0.75rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 650
  },
  assignmentPanel: {
    gridColumn: "1 / -1",
    borderTop: "1px dashed var(--border-color)",
    paddingTop: "1rem",
    marginTop: "0.5rem"
  },
  panelTitle: {
    fontSize: "0.85rem",
    fontWeight: "700",
    marginBottom: "0.75rem",
    color: "var(--text-main)"
  },
  charGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: "0.75rem"
  },
  charCheckboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0.75rem",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.2s, border-color 0.2s"
  },
  checkbox: {
    cursor: "pointer"
  },
  charCheckboxInfo: {
    display: "flex",
    flexDirection: "column"
  },
  errorBox: {
    backgroundColor: "var(--theme-race-rosso-bg)",
    border: "1px solid var(--theme-race-rosso-border)",
    color: "var(--theme-race-rosso-text)",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "0.85rem"
  }
};
