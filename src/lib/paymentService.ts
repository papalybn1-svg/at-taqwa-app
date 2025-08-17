import { auth } from '../screens/firebaseConfig';

export interface PaymentServiceConfig {
  backendUrl: string;
}

export class PaymentService {
  private config: PaymentServiceConfig;

  constructor(config: PaymentServiceConfig) {
    this.config = config;
  }

  /**
   * Obtenir le token Firebase actuel
   */
  private async getFirebaseToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    try {
      const token = await user.getIdToken();
      console.log('🔑 Token Firebase obtenu:', token.substring(0, 20) + '...');
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
      const token = await this.getFirebaseToken();
      console.log('🌐 Appel API entitlements:', `${this.config.backendUrl}/api/entitlements`);
      
      const response = await fetch(`${this.config.backendUrl}/api/entitlements`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      console.log('📡 Réponse entitlements - Status:', response.status);
      console.log('📡 Réponse entitlements - Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur entitlements - Body:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Données entitlements reçues:', data);
      
      // Convertir la nouvelle structure vers l'ancienne pour compatibilité
      const resources = data.resources || [];
      const part2 = resources.find((r: any) => r.id === 'BOOK_PART_2')?.granted || false;
      const part3 = resources.find((r: any) => r.id === 'BOOK_PART_3')?.granted || false;
      
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
  async createPayment(planId: 'BOOK_PART_2' | 'BOOK_PART_3'): Promise<{ success: boolean; checkoutUrl?: string; error?: string }> {
    try {
      const token = await this.getFirebaseToken();
      console.log('🌐 Appel API createPayment:', `${this.config.backendUrl}/api/paydunya/checkout`);
      
      // Appeler le backend pour créer la facture
      const response = await fetch(`${this.config.backendUrl}/api/paydunya/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: planId
        })
      });

      console.log('📡 Réponse createPayment - Status:', response.status);
      console.log('📡 Réponse createPayment - Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur createPayment - Body:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Données createPayment reçues:', data);

      return {
        success: true,
        checkoutUrl: data.checkout_url
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
      const response = await fetch(`${this.config.backendUrl}/api/paydunya/status?token=${token}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
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