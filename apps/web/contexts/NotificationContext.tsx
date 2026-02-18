'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';

interface NotificationContextType {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  refreshUnreadCount: () => Promise<void>;
  // Allow setting initial count from dashboard data
  setInitialCount: (count: number) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const initializedRef = useRef(false);

  const refreshUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const response = await apiClient.getUnreadNotificationCount();
      setUnreadCount(response?.unread_count || 0);
    } catch {
      // Silently fail
    }
  }, [user]);

  // Allow setting initial count from dashboard (avoids extra API call)
  const setInitialCount = useCallback((count: number) => {
    if (!initializedRef.current) {
      setUnreadCount(count);
      initializedRef.current = true;
    }
  }, []);

  // Only poll after initialization, don't fetch on mount
  // Initial count comes from dashboard endpoint via setInitialCount
  useEffect(() => {
    if (!user) return;

    // Poll for new notifications every 60 seconds
    const interval = setInterval(refreshUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [user, refreshUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        setUnreadCount,
        refreshUnreadCount,
        setInitialCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
