import React, { createContext, useContext, useState, useCallback } from 'react';
import { usePaymentService } from '../lib/paymentService';
import { useAuth } from '../hooks/useAuth';

interface EntitlementsContextType {
  entitlements: { part2: boolean; part3: boolean };
  refreshEntitlements: () => Promise<void>;
  isLoading: boolean;
}

const EntitlementsContext = createContext<EntitlementsContextType | undefined>(undefined);

export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { checkEntitlements } = usePaymentService();
  const [entitlements, setEntitlements] = useState<{ part2: boolean; part3: boolean }>({ part2: false, part3: false });
  const [isLoading, setIsLoading] = useState(false);

  const refreshEntitlements = useCallback(async () => {
    if (!user?.uid) return;
    
    setIsLoading(true);
    try {
      const newEntitlements = await checkEntitlements();
      setEntitlements(newEntitlements);
      console.log('🔄 Entitlements mis à jour globalement:', newEntitlements);
    } catch (error) {
      console.error('❌ Erreur lors du refresh des entitlements:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid, checkEntitlements]);

  // Charger les entitlements au début
  React.useEffect(() => {
    if (user?.uid) {
      refreshEntitlements();
    }
  }, [user?.uid, refreshEntitlements]);

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
