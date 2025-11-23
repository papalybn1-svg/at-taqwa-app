import { auth } from '../screens/firebaseConfig';
import { write as writeUserStorage } from '../utils/userStorage';

export interface PaymentServiceConfig {
  backendUrl: string;
}

export class PaymentService {
  private config: PaymentServiceConfig;

  constructor(config: PaymentServiceConfig) {
    this.config = config;
  }

  /**
   * Requête HTTP typée vers le backend
   * - Construit l’URL `${backendUrl}/api/...`
   * - Ajoute l’Authorization Bearer si withAuth = true
   * - Parse le JSON en T et remonte les erreurs HTTP
   */
  private async request<T>(
    path: string,
    options: {
      method?: 'GET'|'POST'|'PUT'|'DELETE';
      body?: any;
      withAuth?: boolean;
      forceRefreshToken?: boolean;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      withAuth = false,
      forceRefreshToken = false,
      headers = {}
    } = options;

    const url = `${this.config.backendUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    const finalHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (withAuth) {
      const idToken = await this.getFirebaseToken(forceRefreshToken);
      finalHeaders['Authorization'] = `Bearer ${idToken}`;
    }

    const res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }
    return (await res.json()) as T;
  }

  /**
   * Obtenir le token Firebase actuel
   */
  private async getFirebaseToken(force = false): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    try {
      // Force refresh uniquement si explicitement demandé
      const token = await user.getIdToken(force);
      console.log('🔑 Token Firebase obtenu (complet):', token);
      console.log('👤 User UID:', user.uid);
      console.log('📧 User email:', user.email);
      return token;
    } catch (error) {
      console.error('❌ Erreur génération token Firebase:', error);
      throw new Error('Impossible de générer le token Firebase');
    }
  }

  /**
   * Vérifier les entitlements de l'utilisateur
   */
  async checkEntitlements(): Promise<{ part2: boolean; part3: boolean }> {
    try {
      // Requête authentifiée (pas de force refresh)
      const data = await this.request<{
        resources?: Array<{ id: string; granted: boolean }>;
      }>(`/api/entitlements`, { withAuth: true, forceRefreshToken: false });
      console.log('✅ Données entitlements reçues:', data);
      
      // Convertir la nouvelle structure vers l'ancienne pour compatibilité
      const resources = data.resources || [];
      const part2 = resources.find((r: any) => r.id === 'BOOK_PART_2')?.granted || false;
      const part3 = resources.find((r: any) => r.id === 'BOOK_PART_3')?.granted || false;
      // Stocker aussi une version simplifiée dans le storage utilisateur
      try {
        const uid = auth.currentUser?.uid || null;
        const grantedIds = resources.filter(r => r.granted).map(r => r.id);
        await writeUserStorage(uid, 'entitlements', grantedIds);
      } catch (e) {
        console.warn('⚠️ Impossible d’écrire entitlements en local:', e);
      }
      
      console.log('🎯 Entitlements calculés:', { part2, part3 });
      return { part2, part3 };
    } catch (error) {
      console.error('Erreur vérification entitlements:', error);
      return { part2: false, part3: false };
    }
  }

  /**
   * Créer un paiement pour débloquer une partie du livre
   */
  async createPayment(planId: 'BOOK_PART_2' | 'BOOK_PART_3'): Promise<{ success: boolean; checkoutUrl?: string; token?: string; error?: string }> {
    try {
      // Pour créer un paiement, on force un token frais + auth requise
      const data = await this.request<{ checkout_url?: string; token?: string }>(
        `/api/paydunya/checkout`,
        {
          method: 'POST',
          withAuth: true,
          forceRefreshToken: true,
          body: { planId }
        }
      );
      console.log('✅ Données createPayment reçues:', data);
      
      // Récupérer et persister le token complet pour éviter toute troncature côté app/tests
      const paymentToken: string | undefined = data?.token;
      if (paymentToken && paymentToken.length > 0) {
        const uid = auth.currentUser?.uid || null;
        console.log('🔎 payment_token (complet):', paymentToken);
        try {
          await writeUserStorage(uid, 'payment_token', paymentToken);
          console.log('💾 payment_token stocké localement pour', uid || 'anon');
        } catch (e) {
          console.warn('⚠️ Impossible de stocker payment_token:', e);
        }
      }

      return {
        success: true,
        checkoutUrl: data.checkout_url,
        token: paymentToken
      };
    } catch (error) {
      console.error('Erreur création paiement:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur réseau'
      };
    }
  }

  /**
   * Vérifier le statut d'un paiement
   */
  async checkPaymentStatus(token: string): Promise<{ status: string; error?: string }> {
    try {
      const data = await this.request<{ status: string }>(
        `/api/paydunya/status?token=${encodeURIComponent(token)}`
      );
      // Si confirmé, synchroniser les entitlements
      const status = (data.status || '').toString().toUpperCase();
      if (status === 'COMPLETED') {
        try { await this.checkEntitlements(); } catch {}
      }
      return { status: data.status };
    } catch (error) {
      console.error('Erreur vérification statut paiement:', error);
      return { status: 'unknown', error: 'Erreur vérification' };
    }
  }

  /**
   * Ouvrir le checkout PayDunya
   */
  async openPayDunyaCheckout(checkoutUrl: string): Promise<void> {
    try {
      const { openURL } = await import('expo-linking');
      await openURL(checkoutUrl);
    } catch (error) {
      console.error('Erreur ouverture checkout PayDunya:', error);
      throw new Error('Impossible d\'ouvrir PayDunya');
    }
  }
}

import { ENV } from '../config/environment';

/**
 * Hook React pour utiliser le service de paiement
 */
export function usePaymentService() {
  const paymentService = new PaymentService({
    backendUrl: ENV.BACKEND_URL
  });

  return {
    checkEntitlements: () => paymentService.checkEntitlements(),
    createPayment: (planId: 'BOOK_PART_2' | 'BOOK_PART_3') => paymentService.createPayment(planId),
    checkPaymentStatus: (token: string) => paymentService.checkPaymentStatus(token),
    openPayDunyaCheckout: (checkoutUrl: string) => paymentService.openPayDunyaCheckout(checkoutUrl)
  };
} 