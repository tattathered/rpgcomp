import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Shield, Lock, Mail, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return setError("Inserisci sia l'email che la password.");
    }

    try {
      setError("");
      setLoading(true);
      await login(email, password);
    } catch (err) {
      console.error(err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Credenziali non valide. Riprova.");
      } else {
        setError("Errore durante l'accesso: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <Shield size={42} color="var(--primary-color)" />
          </div>
          <h1 style={styles.title}>MERP COMPANION</h1>
          <p style={styles.subtitle}>Inserisci le credenziali per entrare nel Portale</p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email del Giocatore / GM</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.icon} />
              <input
                type="email"
                placeholder="il-tuo-nome@esempio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Parola d'Ordine (Password)</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.icon} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Verifica in corso..." : "Entra nel Gioco"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#0f172a", // Darker slate for RPG theme contrast
    backgroundImage: "radial-gradient(circle at top, #1e293b 0%, #0f172a 100%)",
    padding: "1.5rem",
  },
  card: {
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "420px",
    padding: "2.5rem 2rem",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)",
    color: "#f8fafc",
  },
  header: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  logoContainer: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    backgroundColor: "rgba(2, 132, 199, 0.15)",
    border: "1px solid rgba(2, 132, 199, 0.3)",
    marginBottom: "1rem",
  },
  title: {
    fontFamily: "'Lilita One', sans-serif",
    fontSize: "2rem",
    letterSpacing: "1px",
    color: "#38bdf8", // Sky blue highlight
    textShadow: "0 2px 4px rgba(0,0,0,0.5)",
    marginBottom: "0.25rem",
  },
  subtitle: {
    fontSize: "0.875rem",
    color: "#94a3b8",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    fontSize: "0.75rem",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#cbd5e1",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  icon: {
    position: "absolute",
    left: "12px",
    color: "#64748b",
  },
  input: {
    width: "100%",
    padding: "12px 40px 12px 42px",
    fontSize: "0.95rem",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "8px",
    color: "#f8fafc",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  eyeButton: {
    position: "absolute",
    right: "12px",
    background: "none",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    marginTop: "0.5rem",
    padding: "12px",
    fontSize: "1rem",
    fontWeight: "700",
    backgroundColor: "var(--primary-color)",
    border: "none",
    borderRadius: "8px",
    color: "#ffffff",
    cursor: "pointer",
    transition: "background-color 0.2s, transform 0.1s",
    boxShadow: "0 4px 6px -1px rgba(2, 132, 199, 0.4)",
  },
  errorBox: {
    backgroundColor: "rgba(220, 38, 38, 0.15)",
    border: "1px solid rgba(220, 38, 38, 0.3)",
    borderRadius: "8px",
    color: "#f87171",
    padding: "10px",
    fontSize: "0.85rem",
    textAlign: "center",
    marginBottom: "1rem",
  }
};
