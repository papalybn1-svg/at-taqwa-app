import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { usePaymentService } from '../lib/paymentService';
import { useAuthContext } from './AuthContext';
import { read as readUserStorage } from '../utils/userStorage';

interface EntitlementsContextType {
  entitlements: { part2: boolean; part3: boolean };
  refreshEntitlements: (force?: boolean) => Promise<void>;
  isLoading: boolean;
}

export const EntitlementsContext = createContext<EntitlementsContextType | undefined>(undefined);

export function EntitlementsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const { checkEntitlements } = usePaymentService();
  const [entitlements, setEntitlements] = useState<{ part2: boolean; part3: boolean }>({ part2: false, part3: false });
  const [isLoading, setIsLoading] = useState(false);
  const lastFetchRef = useRef<number>(0);
  const COOLDOWN_MS = 3_000; // anti-boucle: 3s mini entre deux fetch normaux (optimisé)
  const MIN_FORCE_GAP_MS = 1_000; // même en force, pas plus d'1 appel / 1s (optimisé)
  const isLoadingRef = useRef<boolean>(false); // éviter les re-renders liés à isLoading dans les deps
  const checkEntitlementsRef = useRef(checkEntitlements);
  
  // Mettre à jour la ref quand checkEntitlements change (mais ne pas l'inclure dans les deps)
  React.useEffect(() => {
    checkEntitlementsRef.current = checkEntitlements;
  }, [checkEntitlements]);

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
      // Utiliser la ref pour éviter les dépendances qui changent
      const newEntitlements = await checkEntitlementsRef.current();
      setEntitlements(newEntitlements);
      console.log('🔄 Entitlements mis à jour globalement:', newEntitlements);
    } catch (error: any) {
      // Ne pas logger en boucle si erreur réseau
      if (!error?.message?.includes('Network request failed') && !error?.message?.includes('Failed to fetch')) {
        console.error('❌ Erreur lors du refresh des entitlements:', error);
      }
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [user?.uid]); // Retirer checkEntitlements des dépendances

  // ✅ OPTIMISATION : Charger le cache local immédiatement, puis mettre à jour en arrière-plan
  React.useEffect(() => {
    if (user?.uid) {
      // 1) CHARGER LE CACHE IMMÉDIATEMENT (0ms de délai)
      const loadCache = async () => {
        try {
          const cached = await readUserStorage<string[]>(user.uid, 'entitlements');
          if (cached && Array.isArray(cached)) {
            const part2 = cached.includes('BOOK_PART_2');
            const part3 = cached.includes('BOOK_PART_3');
            setEntitlements({ part2, part3 });
            console.log('📦 Entitlements chargés depuis le cache:', { part2, part3 });
          }
        } catch (e) {
          console.warn('⚠️ Erreur lecture cache entitlements:', e);
        }
      };
      loadCache();
      
      // 2) METTRE À JOUR EN ARRIÈRE-PLAN (sans timeout artificiel)
      const refreshInBackground = async () => {
        try {
          await refreshEntitlements(true); // force=true pour bypasser le cooldown au démarrage
        } catch (e: any) {
          // Ne pas logger en boucle si erreur réseau
          if (!e?.message?.includes('Network request failed') && !e?.message?.includes('Failed to fetch')) {
            console.error('Erreur refreshEntitlements initial:', e);
          }
          // En cas d'erreur, on garde le cache chargé
        }
      };
      refreshInBackground();
    } else {
      setEntitlements({ part2: false, part3: false });
    }
  }, [user?.uid, refreshEntitlements]); // Inclure refreshEntitlements pour éviter les warnings

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
