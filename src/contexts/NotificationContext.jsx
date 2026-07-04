import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState(null);

  const notify = useCallback((message, type = 'info', duration = 4000) => {
    setNotification({ message, type, duration });
    if (duration > 0) {
      setTimeout(() => setNotification(null), duration);
    }
  }, []);

  const dismiss = useCallback(() => {
    setNotification(null);
  }, []);

  return (
    <NotificationContext.Provider value={{ notification, notify, dismiss }}>
      {children}
      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            maxWidth: '400px',
            transition: 'opacity 0.3s ease',
            backgroundColor:
              notification.type === 'error' ? '#fee2e2' :
              notification.type === 'success' ? '#d1fae5' :
              notification.type === 'warning' ? '#fef3c7' :
              '#e0f2fe',
            color:
              notification.type === 'error' ? '#991b1b' :
              notification.type === 'success' ? '#065f46' :
              notification.type === 'warning' ? '#92400e' :
              '#075985',
            border: '1px solid',
            borderColor:
              notification.type === 'error' ? '#fecaca' :
              notification.type === 'success' ? '#a7f3d0' :
              notification.type === 'warning' ? '#fde68a' :
              '#bae6fd'
          }}
          onClick={dismiss}
          role="alert"
        >
          {notification.message}
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
}
