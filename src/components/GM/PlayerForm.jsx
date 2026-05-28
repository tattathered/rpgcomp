import React, { useState } from "react";
import { UserPlus, Mail, Lock, User, X } from "lucide-react";

export default function PlayerForm({ onSubmit, onCancel, loading, initialData }) {
  const isEdit = !!initialData;
  const [email, setEmail] = useState(initialData?.email || "");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState(initialData?.displayName || "");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !displayName.trim()) {
      return setError("Nome e indirizzo email sono obbligatori.");
    }
    if (!isEdit && !password.trim()) {
      return setError("La password è obbligatoria per i nuovi giocatori.");
    }
    if (password.trim() && password.length < 6) {
      return setError("La password deve essere di almeno 6 caratteri.");
    }
    setError("");

    const data = {
      email: email.trim(),
      displayName: displayName.trim()
    };
    if (password.trim()) {
      data.password = password;
    }
    if (isEdit) {
      data.uid = initialData.uid;
    }

    onSubmit(data);
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal} className="card">
        <div style={styles.header}>
          <div style={styles.titleGroup}>
            <UserPlus size={20} color="var(--primary-color)" />
            <h3 style={styles.title}>{isEdit ? "Modifica Dettagli Giocatore" : "Invita Nuovo Giocatore"}</h3>
          </div>
          <button onClick={onCancel} style={styles.closeBtn} disabled={loading}>
            <X size={18} />
          </button>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nome del Giocatore</label>
            <div style={styles.inputWrapper}>
              <User size={16} style={styles.icon} />
              <input
                type="text"
                placeholder="es. Mario Rossi"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={styles.input}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Indirizzo Email</label>
            <div style={styles.inputWrapper}>
              <Mail size={16} style={styles.icon} />
              <input
                type="email"
                placeholder="giocatore@esempio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || isEdit}
                required
                style={{ ...styles.input, ...(isEdit ? { opacity: 0.7, backgroundColor: '#f1f5f9', cursor: 'not-allowed' } : {}) }}
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              {isEdit ? "Nuova Password (lascia vuoto per non cambiare)" : "Parola d'Ordine Temporanea (Password)"}
            </label>
            <div style={styles.inputWrapper}>
              <Lock size={16} style={styles.icon} />
              <input
                type="text"
                placeholder={isEdit ? "Lascia vuoto per non modificare" : "Minimo 6 caratteri"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                disabled={loading}
                required={!isEdit}
              />
            </div>
            <span style={styles.hint}>
              {isEdit 
                ? "Compila questo campo solo se desideri forzare una nuova password per l'utente."
                : "Comunica questa password al giocatore; potrà cambiarla successivamente."}
            </span>
          </div>

          <div style={styles.actions}>
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-outline"
              style={styles.cancelBtn}
              disabled={loading}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={styles.submitBtn}
              disabled={loading}
            >
              {loading 
                ? (isEdit ? "Salvataggio..." : "Creazione...") 
                : (isEdit ? "Salva Modifiche" : "Crea Giocatore")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "1rem"
  },
  modal: {
    backgroundColor: "var(--surface-color)",
    border: "1px solid var(--border-color)",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "480px",
    padding: "1.5rem",
    boxShadow: "var(--shadow-lg)"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px dashed var(--border-color)",
    paddingBottom: "0.75rem",
    marginBottom: "1.25rem"
  },
  titleGroup: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem"
  },
  title: {
    margin: 0,
    fontSize: "1.2rem"
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    padding: "4px",
    display: "flex"
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
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center"
  },
  icon: {
    position: "absolute",
    left: "12px",
    color: "var(--text-muted)"
  },
  input: {
    width: "100%",
    padding: "10px 12px 10px 36px",
    fontSize: "0.9rem",
    backgroundColor: "var(--bg-color)",
    border: "1px solid var(--border-color)",
    borderRadius: "8px",
    color: "var(--text-main)",
    outline: "none"
  },
  hint: {
    fontSize: "0.7rem",
    color: "var(--text-muted)",
    marginTop: "2px"
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.75rem",
    borderTop: "1px dashed var(--border-color)",
    paddingTop: "1rem",
    marginTop: "0.5rem"
  },
  cancelBtn: {
    padding: "0.5rem 1rem",
    fontSize: "0.85rem"
  },
  submitBtn: {
    padding: "0.5rem 1.25rem",
    fontSize: "0.85rem"
  },
  errorBox: {
    backgroundColor: "var(--theme-race-rosso-bg)",
    border: "1px solid var(--theme-race-rosso-border)",
    borderRadius: "8px",
    color: "var(--theme-race-rosso-text)",
    padding: "10px",
    fontSize: "0.85rem",
    textAlign: "center",
    marginBottom: "1rem"
  }
};
