import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { CodexProvider } from './contexts/CodexContext'
import { NotificationProvider } from './contexts/NotificationContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <CodexProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </CodexProvider>
    </AuthProvider>
  </React.StrictMode>,
)
