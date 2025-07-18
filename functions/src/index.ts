import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as sgMail from '@sendgrid/mail';

// Initialiser Firebase Admin
admin.initializeApp();

// Configuration SendGrid (API Key sera configurée via Firebase CLI)
sgMail.setApiKey(functions.config().sendgrid?.api_key || 'your-sendgrid-api-key');

// Fonction pour envoyer l'email de réinitialisation de mot de passe
export const sendPasswordResetEmail = functions.https.onCall(async (data: { email: string }, context: functions.https.CallableContext) => {
  try {
    // Vérifier que l'email est fourni
    if (!data.email) {
      throw new functions.https.HttpsError('invalid-argument', 'Email requis');
    }

    // Vérifier que l'utilisateur existe
    const userRecord = await admin.auth().getUserByEmail(data.email);
    if (!userRecord) {
      throw new functions.https.HttpsError('not-found', 'Aucun utilisateur trouvé avec cet email');
    }

    // Générer un lien de réinitialisation personnalisé
    const actionCodeSettings = {
      url: 'https://attaqwa.app/reset-password',
      handleCodeInApp: false,
    };

    // Créer le lien de réinitialisation
    const resetLink = await admin.auth().generatePasswordResetLink(data.email, actionCodeSettings);

    // Créer le contenu de l'email
    const msg = {
      to: data.email,
      from: 'noreply@attaqwa.app',
      subject: 'Réinitialisation de mot de passe - At-Taqwa App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #174C3C 0%, #D4AF37 100%); padding: 30px; border-radius: 15px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">At-Taqwa App</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Réinitialisation de mot de passe</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #174C3C; margin: 0 0 20px 0; font-size: 24px;">Bonjour ${userRecord.displayName || 'Utilisateur'} !</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Vous avez demandé la réinitialisation de votre mot de passe pour votre compte At-Taqwa App.
              Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background: #174C3C; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; font-size: 16px;">
                Réinitialiser mon mot de passe
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
              Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, 
              vous pouvez ignorer cet email en toute sécurité.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #174C3C; font-size: 14px; margin: 0;">
                <strong>At-Taqwa App</strong><br>
                Transformez chaque prière en un moment de paix
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
          </div>
        </div>
      `
    };

    // Envoyer l'email via SendGrid
    await sgMail.send(msg);
    console.log(`✅ Email de réinitialisation envoyé avec succès à ${data.email}`);

    return {
      success: true,
      message: 'Email de réinitialisation envoyé avec succès'
    };
  } catch (error) {
    console.error('❌ Erreur envoi email réinitialisation:', error);
    
    // Gérer les erreurs spécifiques
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Erreur lors de l\'envoi de l\'email de réinitialisation');
  }
});

// Fonction pour nettoyer les anciens liens de réinitialisation (optionnel)
export const cleanupExpiredResetLinks = functions.pubsub.schedule('every 24 hours').onRun(async (context: functions.EventContext) => {
  try {
    console.log('🧹 Nettoyage des liens de réinitialisation expirés...');
    // Cette fonction peut être utilisée pour nettoyer les liens expirés si nécessaire
    return null;
  } catch (error) {
    console.error('❌ Erreur nettoyage liens:', error);
    return null;
  }
}); 