import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePaymentService } from '../lib/paymentService';

interface EntitlementsContextType {
  entitlements: { part2: boolean; part3: boolean };
  refreshEntitlements: (force?: boolean) => Promise<void>;
  isLoading: boolean;
}

const EntitlementsContext = createContext<EntitlementsContextType | undefined>(undefined);

export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { checkEntitlements } = usePaymentService();
  const [entitlements, setEntitlements] = useState<{ part2: boolean; part3: boolean }>({ part2: false, part3: false });
  const [isLoading, setIsLoading] = useState(false);
  const lastFetchRef = useRef<number>(0);
  const COOLDOWN_MS = 10_000; // anti-boucle: 10s mini entre deux fetch
  const MIN_FORCE_GAP_MS = 2_000; // même en force, pas plus d'1 appel / 2s
  const isLoadingRef = useRef<boolean>(false); // éviter les re-renders liés à isLoading dans les deps

  const refreshEntitlements = useCallback(async (force = false) => {
    if (!user?.uid) return;
    const now = Date.now();
    if (!force) {
      if (isLoadingRef.current) return; // éviter parallélisme
      if (now - lastFetchRef.current < COOLDOWN_MS) return; // throttling simple
    } else {
      if (now - lastFetchRef.current < MIN_FORCE_GAP_MS) return; // petit garde-fou même en force
    }
    lastFetchRef.current = now;
    
    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      const newEntitlements = await checkEntitlements();
      setEntitlements(newEntitlements);
      console.log('🔄 Entitlements mis à jour globalement:', newEntitlements);
    } catch (error) {
      console.error('❌ Erreur lors du refresh des entitlements:', error);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [user?.uid, checkEntitlements]);

  // Charger/rafraîchir immédiatement à chaque changement d'utilisateur
  React.useEffect(() => {
    if (user?.uid) {
      refreshEntitlements(true).catch(() => {});
    } else {
      setEntitlements({ part2: false, part3: false });
    }
  }, [user?.uid]);

  return (
    <EntitlementsContext.Provider value={{ entitlements, refreshEntitlements, isLoading }}>
      {children}
    </EntitlementsContext.Provider>
  );
}

export function useEntitlements() {
  const context = useContext(EntitlementsContext);
  if (context === undefined) {
    throw new Error('useEntitlements must be used within an EntitlementsProvider');
  }
  return context;
}
