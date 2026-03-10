'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, Band } from '@/lib/api';

interface BandContextType {
  band: Band | null;
  isLoading: boolean;
  refreshBand: () => Promise<void>;
}

const BandContext = createContext<BandContextType | null>(null);

export function useBand() {
  const context = useContext(BandContext);
  if (!context) {
    throw new Error('useBand must be used within BandProvider');
  }
  return context;
}

export function BandProvider({ children }: { children: ReactNode }) {
  const { isBand } = useAuth();
  const [band, setBand] = useState<Band | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshBand = useCallback(async () => {
    if (!isBand) return;
    setIsLoading(true);
    try {
      const bands = await apiClient.getUserBands();
      if (bands.length > 0) {
        const details = await apiClient.getBand(bands[0].slug);
        setBand(details);
      }
    } catch (error) {
      console.error('Failed to fetch band:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isBand]);

  useEffect(() => {
    if (isBand) {
      refreshBand();
    }
  }, [isBand, refreshBand]);

  return (
    <BandContext.Provider value={{ band, isLoading, refreshBand }}>
      {children}
    </BandContext.Provider>
  );
}
