import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { LogOut, BookOpen, Users, Compass, ShieldAlert, ArrowRight, Shield, RefreshCw } from "lucide-react";
import { 
  subscribeToPlayerWorkspaces, 
  subscribeToPlayerCharacters 
} from "../../services/playerService";
import { subscribeToCompanies } from "../../services/companyService";
import { subscribeToCampaigns } from "../../services/campaignService";
import PlayerCharacterSheet from "./PlayerCharacterSheet";
import { getCharacterHpTot } from "../../utils/skillHelpers";

export default function PlayerDashboard() {
  const { logout, userData, user } = useAuth();
  
  const [workspaces, setWorkspaces] = useState([]);
  const [charactersMap, setCharactersMap] = useState({});
  const [companiesMap, setCompaniesMap] = useState({});
  const [campaignsMap, setCampaignsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedChar, setSelectedChar] = useState(null);

  // 1. Sottoscrizione ai workspace del giocatore
  useEffect(() => {
    if (!user?.uid) return;
    setLoading(true);
    const unsubWorkspaces = subscribeToPlayerWorkspaces(user.uid, (workspaceList) => {
      setWorkspaces(workspaceList);
      if (workspaceList.length === 0) {
        setLoading(false);
      }
    });
    return unsubWorkspaces;
  }, [user?.uid]);

  // 2. Sottoscrizioni dinamiche per ogni GM workspace
  useEffect(() => {
    if (workspaces.length === 0) return;

    const characterUnsubs = [];
    const companyUnsubs = [];
    const campaignUnsubs = [];

    workspaces.forEach((ws) => {
      const { gmId, characterIds } = ws;

      // Sottoscrizione ai personaggi per questo GM
      const unsubChars = subscribeToPlayerCharacters(gmId, characterIds, (chars) => {
        setCharactersMap((prev) => ({
          ...prev,
          [gmId]: chars
        }));
        setLoading(false);
      });
      characterUnsubs.push(unsubChars);

      // Sottoscrizione a tutte le compagnie di questo GM
      const unsubCompanies = subscribeToCompanies(gmId, (comps) => {
        setCompaniesMap((prev) => ({
          ...prev,
          [gmId]: comps
        }));
      });
      companyUnsubs.push(unsubCompanies);

      // Sottoscrizione a tutte le campagne di questo GM
      const unsubCampaigns = subscribeToCampaigns(gmId, (camps) => {
        setCampaignsMap((prev) => ({
          ...prev,
          [gmId]: camps
        }));
      });
      campaignUnsubs.push(unsubCampaigns);
    });

    return () => {
      characterUnsubs.forEach((unsub) => unsub());
      companyUnsubs.forEach((unsub) => unsub());
      campaignUnsubs.forEach((unsub) => unsub());
    };
  }, [workspaces]);

  // Consolidamento dei Personaggi
  const allCharacters = useMemo(() => {
    return Object.values(charactersMap).flat();
  }, [charactersMap]);

  // Consolidamento delle Compagnie a cui appartengono i PG del giocatore
  const allCompanies = useMemo(() => {
    const list = [];
    workspaces.forEach((ws) => {
      const { gmId, characterIds } = ws;
      const gmComps = companiesMap[gmId] || [];
      const charIdsSet = new Set(characterIds || []);
      
      gmComps.forEach((comp) => {
        const myCharsInCompany = (comp.characterIds || []).filter((cid) => charIdsSet.has(cid));
        if (myCharsInCompany.length > 0) {
          list.push({ 
            ...comp, 
            gmId,
            myCharsInCompany // Conserva per visualizzazione
          });
        }
      });
    });
    return list;
  }, [workspaces, companiesMap]);

  // Consolidamento delle Campagne attive associate alle compagnie del giocatore
  const allCampaigns = useMemo(() => {
    const list = [];
    workspaces.forEach((ws) => {
      const { gmId } = ws;
      const gmCamps = campaignsMap[gmId] || [];
      const myCompIds = new Set(allCompanies.filter(c => c.gmId === gmId).map(c => c.id));
      
      gmCamps.forEach((camp) => {
        const myCompsInCampaign = (camp.companyIds || []).filter((cid) => myCompIds.has(cid));
        if (myCompsInCampaign.length > 0) {
          list.push({ 
            ...camp, 
            gmId,
            myCompsInCampaign // Conserva per visualizzazione
          });
        }
      });
    });
    return list;
  }, [workspaces, campaignsMap, allCompanies]);

  // Seleziona il PG completo da visualizzare in dettaglio
  const handleSelectCharacter = (char) => {
    setSelectedChar(char);
  };

  // Aggiorna lo stato del personaggio selezionato per riflettere i cambiamenti live da Firestore
  const activeSelectedChar = useMemo(() => {
    if (!selectedChar) return null;
    return allCharacters.find(c => c.id === selectedChar.id) || selectedChar;
  }, [selectedChar, allCharacters]);

  if (selectedChar && activeSelectedChar) {
    return (
      <PlayerCharacterSheet 
        characterData={activeSelectedChar} 
        onBack={() => setSelectedChar(null)} 
      />
    );
  }

  return (
    <div style={styles.container}>
      <nav style={styles.navbar}>
        <div style={styles.logoContainer}>
          <BookOpen size={24} color="var(--primary-color)" />
          <span style={styles.logoText}>PORTALE GIOCATORE</span>
        </div>
        <div style={styles.navActions}>
          <span style={styles.userDisplay}>
            Benvenuto, <strong>{userData?.displayName || "Giocatore"}</strong>
          </span>
          <button onClick={logout} style={styles.logoutBtn}>
            <LogOut size={16} />
            Esci
          </button>
        </div>
      </nav>

      <main style={styles.main}>
        <div style={styles.welcomeBanner}>
          <h1 style={styles.bannerTitle}>Avventure nella Terra di Mezzo</h1>
          <p style={styles.bannerSubtitle}>
            Consulta le schede dei tuoi personaggi, gestisci il tuo taccuino segreto e segui lo stato del gruppo.
          </p>
        </div>

        {loading ? (
          <div style={styles.loadingContainer}>
            <RefreshCw size={36} className="animate-spin" color="var(--primary-color)" />
            <p style={{ marginTop: "1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>Sincronizzazione con il database...</p>
          </div>
        ) : workspaces.length === 0 ? (
          <div style={styles.emptyContainer}>
            <ShieldAlert size={48} color="var(--text-muted)" style={{ opacity: 0.6 }} />
            <h3 style={{ margin: "1rem 0 0.5rem 0", color: "var(--text-main)" }}>Nessun invito trovato</h3>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Chiedi al tuo Game Master di invitarti indicando il tuo indirizzo email: <strong>{user?.email}</strong>.
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {/* Sezione Personaggi (PG) */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <ShieldAlert size={20} color="var(--primary-color)" />
                <h3 style={styles.cardTitle}>I tuoi Personaggi ({allCharacters.length})</h3>
              </div>
              <div style={styles.cardBody}>
                {allCharacters.length === 0 ? (
                  <p style={styles.placeholderText}>
                    Nessun personaggio ti è stato ancora assegnato dal GM.
                  </p>
                ) : (
                  <div style={styles.list}>
                    {allCharacters.map((char) => {
                      const level = 1 + (char.levelDevelopments || []).length;
                      const hpTot = getCharacterHpTot(char);
                      const hpSub = char.hpSubiti || 0;
                      const hpRem = Math.max(0, hpTot - hpSub);
                      const isGrave = hpSub > (hpTot / 2);
                      const wsInfo = workspaces.find(w => w.gmId === char.gmId);
                      
                      const charCompanies = allCompanies.filter(comp => comp.gmId === char.gmId && comp.characterIds?.includes(char.id));
                      return (
                        <div key={char.id} style={styles.itemRow}>
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={styles.itemName}>{char.name}</span>
                              <span style={styles.levelBadge}>Liv. {level}</span>
                            </div>
                            <span style={styles.itemSubText}>
                              {char.race?.popolo} | {char.profession?.professione}
                            </span>
                            
                            {charCompanies.length > 0 && (
                              <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", alignItems: "center", marginTop: "0.2rem" }}>
                                <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: "700" }}>Compagnia:</span>
                                {charCompanies.map(c => (
                                  <span key={c.id} style={{ ...styles.charBadge, backgroundColor: "var(--theme-primary-skills-bg)", color: "var(--theme-primary-skills-text)", borderColor: "var(--theme-primary-skills-border)" }}>
                                    {c.name}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            {/* Barra dei Punti Ferita */}
                            <div style={{ marginTop: "0.5rem" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", fontWeight: 700, marginBottom: "0.2rem" }}>
                                <span style={{ color: "var(--text-muted)" }}>Punti Ferita:</span>
                                <span style={{ color: isGrave ? "var(--danger-color)" : "var(--success-color)" }}>
                                  {hpRem} / {hpTot} {hpSub > 0 && `(${hpSub} sub.)`}
                                </span>
                              </div>
                              <div style={styles.hpBarBg}>
                                <div style={{
                                  ...styles.hpBarFill,
                                  width: `${Math.max(0, Math.min(100, (hpRem / hpTot) * 100))}%`,
                                  backgroundColor: isGrave ? "var(--danger-color)" : "var(--success-color)"
                                }} />
                              </div>
                            </div>
                            
                            {wsInfo?.gmDisplayName && (
                              <span style={styles.gmTag}>
                                GM: {wsInfo.gmDisplayName}
                              </span>
                            )}
                          </div>
                          <button 
                            onClick={() => handleSelectCharacter(char)}
                            style={styles.actionBtn}
                          >
                            Scheda
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Sezione Compagnie */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <Users size={20} color="var(--success-color)" />
                <h3 style={styles.cardTitle}>Le tue Compagnie ({allCompanies.length})</h3>
              </div>
              <div style={styles.cardBody}>
                {allCompanies.length === 0 ? (
                  <p style={styles.placeholderText}>
                    Non fai ancora parte di nessuna compagnia attiva.
                  </p>
                ) : (
                  <div style={styles.list}>
                    {allCompanies.map((comp) => {
                      const wsInfo = workspaces.find(w => w.gmId === comp.gmId);
                      return (
                        <div key={comp.id} style={styles.compRow}>
                          <span style={styles.compName}>{comp.name}</span>
                          <span style={styles.compDesc}>{comp.description || "Nessuna descrizione."}</span>
                          
                          <div style={{ marginTop: "0.4rem", display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)" }}>I tuoi PG inclusi:</span>
                            <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginTop: "0.15rem" }}>
                              {comp.myCharsInCompany.map(cid => {
                                const ch = allCharacters.find(c => c.id === cid);
                                return ch ? (
                                  <span key={cid} style={styles.charBadge}>
                                    <Shield size={10} />
                                    {ch.name}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>

                          {(() => {
                            const compCampaigns = allCampaigns.filter(camp => camp.gmId === comp.gmId && camp.companyIds?.includes(comp.id));
                            if (compCampaigns.length === 0) return null;
                            return (
                              <div style={{ marginTop: "0.4rem", display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)" }}>Campagne associate:</span>
                                <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginTop: "0.15rem" }}>
                                  {compCampaigns.map(camp => (
                                    <span key={camp.id} style={{ ...styles.charBadge, backgroundColor: "var(--theme-secondary-skills-bg)", color: "var(--theme-secondary-skills-text)", borderColor: "var(--theme-secondary-skills-border)" }}>
                                      {camp.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                          
                          {wsInfo?.gmDisplayName && (
                            <span style={{ ...styles.gmTag, alignSelf: "flex-start", marginTop: "0.5rem" }}>
                              GM: {wsInfo.gmDisplayName}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Sezione Campagne */}
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <Compass size={20} color="var(--warning-color)" />
                <h3 style={styles.cardTitle}>Campagne Attive ({allCampaigns.length})</h3>
              </div>
              <div style={styles.cardBody}>
                {allCampaigns.length === 0 ? (
                  <p style={styles.placeholderText}>
                    Nessuna campagna attiva collegata alle tue compagnie.
                  </p>
                ) : (
                  <div style={styles.list}>
                    {allCampaigns.map((camp) => {
                      const wsInfo = workspaces.find(w => w.gmId === camp.gmId);
                      return (
                        <div key={camp.id} style={styles.compRow}>
                          <span style={styles.compName}>{camp.name}</span>
                          <span style={styles.compDesc}>{camp.description || "Nessuna descrizione."}</span>
                          
                          <div style={{ marginTop: "0.4rem" }}>
                            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)" }}>Compagnie coinvolte:</span>
                            <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", marginTop: "0.15rem" }}>
                              {camp.myCompsInCampaign.map(cid => {
                                const co = allCompanies.find(c => c.id === cid);
                                return co ? (
                                  <span key={cid} style={{ ...styles.charBadge, backgroundColor: "var(--theme-secondary-skills-bg)", color: "var(--theme-secondary-skills-text)", borderColor: "var(--theme-secondary-skills-border)" }}>
                                    {co.name}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>

                          {wsInfo?.gmDisplayName && (
                            <span style={{ ...styles.gmTag, alignSelf: "flex-start", marginTop: "0.5rem" }}>
                              GM: {wsInfo.gmDisplayName}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "var(--bg-color)",
    color: "var(--text-main)",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Montserrat', sans-serif"
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    height: "64px",
    padding: "0 2rem",
    backgroundColor: "var(--surface-color)",
    borderBottom: "1px solid var(--border-color)",
    boxShadow: "var(--shadow-sm)"
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem"
  },
  logoText: {
    fontFamily: "'Lilita One', sans-serif",
    fontSize: "1.25rem",
    color: "var(--primary-color)"
  },
  navActions: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem"
  },
  userDisplay: {
    fontSize: "0.9rem",
    color: "var(--text-muted)"
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    padding: "0.5rem 1rem",
    fontSize: "0.85rem",
    fontWeight: "600",
    backgroundColor: "transparent",
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    color: "var(--text-main)",
    cursor: "pointer",
    transition: "background-color 0.2s"
  },
  main: {
    flex: 1,
    padding: "2rem max(2rem, (100vw - 1200px) / 2)",
    display: "flex",
    flexDirection: "column",
    gap: "2rem"
  },
  welcomeBanner: {
    backgroundColor: "var(--surface-color)",
    border: "1px solid var(--border-color)",
    borderRadius: "12px",
    padding: "1.5rem 2rem",
    boxShadow: "var(--shadow-sm)",
    backgroundImage: "linear-gradient(to right, rgba(2, 132, 199, 0.03), transparent)"
  },
  bannerTitle: {
    fontSize: "1.5rem",
    fontWeight: "900",
    margin: "0 0 0.5rem 0",
    color: "var(--text-main)"
  },
  bannerSubtitle: {
    fontSize: "0.9rem",
    color: "var(--text-muted)",
    margin: 0,
    lineHeight: "1.5"
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "4rem 0"
  },
  emptyContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    backgroundColor: "var(--surface-color)",
    border: "1px dashed var(--border-color)",
    borderRadius: "12px",
    padding: "3rem 1.5rem",
    boxShadow: "var(--shadow-sm)"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "1.5rem",
    alignItems: "start"
  },
  card: {
    backgroundColor: "var(--surface-color)",
    border: "1px solid var(--border-color)",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "var(--shadow-sm)",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
    minHeight: "250px"
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    borderBottom: "1px dashed var(--border-color)",
    paddingBottom: "0.75rem"
  },
  cardTitle: {
    fontSize: "1.05rem",
    fontWeight: "800",
    margin: 0,
    color: "var(--text-main)"
  },
  cardBody: {
    flex: 1
  },
  placeholderText: {
    fontSize: "0.85rem",
    color: "var(--text-muted)",
    textAlign: "center",
    marginTop: "1.5rem",
    fontStyle: "italic"
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem"
  },
  itemRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem 1rem",
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    backgroundColor: "var(--bg-color)",
    transition: "transform 0.15s, box-shadow 0.15s",
    cursor: "default",
    gap: "1rem"
  },
  itemName: {
    fontWeight: "750",
    fontSize: "0.95rem",
    color: "var(--text-main)"
  },
  itemSubText: {
    fontSize: "0.75rem",
    color: "var(--text-muted)"
  },
  levelBadge: {
    fontSize: "0.7rem",
    fontWeight: "700",
    backgroundColor: "var(--primary-light)",
    color: "var(--primary-color)",
    padding: "0.15rem 0.4rem",
    borderRadius: "4px"
  },
  hpBarBg: {
    height: "6px",
    backgroundColor: "#e2e8f0",
    borderRadius: "3px",
    overflow: "hidden"
  },
  hpBarFill: {
    height: "100%",
    borderRadius: "3px",
    transition: "width 0.3s ease"
  },
  gmTag: {
    fontSize: "0.65rem",
    fontWeight: "650",
    color: "var(--text-muted)",
    backgroundColor: "var(--border-color)",
    padding: "0.1rem 0.35rem",
    borderRadius: "3px",
    alignSelf: "flex-start",
    marginTop: "0.25rem"
  },
  actionBtn: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    padding: "0.4rem 0.8rem",
    fontSize: "0.75rem",
    fontWeight: "700",
    backgroundColor: "var(--primary-color)",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background-color 0.2s"
  },
  compRow: {
    display: "flex",
    flexDirection: "column",
    padding: "1rem",
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    backgroundColor: "var(--bg-color)"
  },
  compName: {
    fontWeight: "750",
    fontSize: "0.95rem",
    color: "var(--text-main)",
    marginBottom: "0.25rem"
  },
  compDesc: {
    fontSize: "0.75rem",
    color: "var(--text-muted)",
    lineHeight: "1.4"
  },
  charBadge: {
    fontSize: "0.65rem",
    fontWeight: "600",
    backgroundColor: "var(--theme-race-blu-bg)",
    color: "var(--theme-race-blu-text)",
    border: "1px solid var(--theme-race-blu-border)",
    padding: "0.1rem 0.4rem",
    borderRadius: "4px",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.2rem"
  }
};
