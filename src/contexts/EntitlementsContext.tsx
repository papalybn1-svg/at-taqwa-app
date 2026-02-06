import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { usePaymentService } from '../lib/paymentService';
import { useAuthContext } from './AuthContext';

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
  const COOLDOWN_MS = 10_000; // anti-boucle: 10s mini entre deux fetch normaux
  const MIN_FORCE_GAP_MS = 2_000; // même en force, pas plus d'1 appel / 2s (permet refresh après paiement)
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

  // Charger/rafraîchir immédiatement à chaque changement d'utilisateur
  React.useEffect(() => {
    if (user?.uid) {
      // ✅ Amélioration Android : Attendre un peu pour que le token Firebase soit prêt
      // Sur Android, le token peut prendre plus de temps à être disponible
      const loadEntitlements = async () => {
        // Attendre un peu pour que le token Firebase soit prêt (surtout sur Android)
        await new Promise(resolve => setTimeout(resolve, 500));
        // Forcer le refresh initial pour s'assurer d'avoir les entitlements dès le démarrage
        try {
          await refreshEntitlements(true); // force=true pour bypasser le cooldown au démarrage
        } catch (e: any) {
          // Ne pas logger en boucle si erreur réseau
          if (!e?.message?.includes('Network request failed') && !e?.message?.includes('Failed to fetch')) {
            console.error('Erreur refreshEntitlements initial:', e);
          }
        }
      };
      loadEntitlements();
    } else {
      setEntitlements({ part2: false, part3: false });
    }
  }, [user?.uid]); // Retirer refreshEntitlements des dépendances pour éviter les boucles

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
