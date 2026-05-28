import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import LoginPage from "./LoginPage";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <div style={styles.loadingText}>Caricamento in corso...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div style={styles.deniedContainer}>
        <h2 style={styles.deniedTitle}>Accesso Negato</h2>
        <p style={styles.deniedText}>Non hai i permessi necessari per accedere a questo spazio.</p>
      </div>
    );
  }

  return children;
}

const styles = {
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    fontFamily: "'Montserrat', sans-serif"
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "4px solid rgba(2, 132, 199, 0.1)",
    borderTop: "4px solid var(--primary-color)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },
  loadingText: {
    marginTop: "1rem",
    fontSize: "1rem",
    fontWeight: "500",
    color: "#94a3b8"
  },
  deniedContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    padding: "2rem",
    textAlign: "center",
    fontFamily: "'Montserrat', sans-serif"
  },
  deniedTitle: {
    fontFamily: "'Lilita One', sans-serif",
    fontSize: "2.5rem",
    color: "#ef4444",
    marginBottom: "1rem"
  },
  deniedText: {
    fontSize: "1.1rem",
    color: "#94a3b8",
    maxWidth: "500px"
  }
};
