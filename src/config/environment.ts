/**
 * Configuration des variables d'environnement
 */

export const ENV = {
  // URL du backend
  BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL || 'https://attaqwa-paiement-g0v79mkvb-bathilycoumba254-6208s-projects.vercel.app',
  
  // Configuration PayDunya
  PAYDUNYA_RETURN_URL: 'attaqwa://paydunya/success',
  PAYDUNYA_CANCEL_URL: 'attaqwa://paydunya/cancel',
  
  // Mode de développement
  IS_DEV: __DEV__,
};

export default ENV; 