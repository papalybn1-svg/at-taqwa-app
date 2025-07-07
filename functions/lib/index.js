"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredOTP = exports.verifyOTP = exports.sendOTPEmail = void 0;
const sgMail = require("@sendgrid/mail");
const admin = require("firebase-admin");
const functions = require("firebase-functions");
admin.initializeApp();
// Configuration SendGrid (API Key sera configurée via Firebase CLI)
sgMail.setApiKey(((_a = functions.config().sendgrid) === null || _a === void 0 ? void 0 : _a.api_key) || 'your-sendgrid-api-key');
// Fonction pour envoyer l'email OTP
exports.sendOTPEmail = functions.https.onCall(async (data, context) => {
    try {
        // Vérifier que l'email est fourni
        if (!data.email || !data.otp) {
            throw new functions.https.HttpsError('invalid-argument', 'Email et code OTP requis');
        }
        // Créer le contenu de l'email
        const msg = {
            to: data.email,
            from: 'noreply@attaqwa.app',
            subject: 'Code de vérification - At-Taqwa App',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #174C3C 0%, #D4AF37 100%); padding: 30px; border-radius: 15px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">At-Taqwa App</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Vérification de votre compte</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 15px 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #174C3C; margin: 0 0 20px 0; font-size: 24px;">Code de vérification</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Salam alaykum ${data.displayName ? data.displayName.split(' ')[0] : ''} !<br>
              Merci de vous être inscrit sur At-Taqwa App. Pour finaliser votre inscription, 
              veuillez utiliser le code de vérification ci-dessous :
            </p>
            
            <div style="background: #f8f9fa; border: 2px solid #D4AF37; border-radius: 10px; padding: 20px; text-align: center; margin: 25px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #174C3C; letter-spacing: 5px;">${data.otp}</span>
            </div>
            
            <p style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
              Ce code expire dans 10 minutes. Si vous n'avez pas demandé ce code, 
              vous pouvez ignorer cet email.
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
        console.log(`✅ Email OTP envoyé avec succès à ${data.email}`);
        // Stocker le code OTP dans Firestore avec expiration
        const otpRef = admin.firestore().collection('otpCodes').doc(data.email);
        await otpRef.set({
            otp: data.otp,
            email: data.email,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            used: false
        });
        return {
            success: true,
            message: 'Code de vérification envoyé avec succès'
        };
    }
    catch (error) {
        console.error('❌ Erreur envoi email OTP:', error);
        throw new functions.https.HttpsError('internal', 'Erreur lors de l\'envoi du code de vérification');
    }
});
// Fonction pour vérifier le code OTP
exports.verifyOTP = functions.https.onCall(async (data, context) => {
    try {
        if (!data.email || !data.otp) {
            throw new functions.https.HttpsError('invalid-argument', 'Email et code OTP requis');
        }
        // Récupérer le code OTP depuis Firestore
        const otpRef = admin.firestore().collection('otpCodes').doc(data.email);
        const otpDoc = await otpRef.get();
        if (!otpDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Code de vérification non trouvé');
        }
        const otpData = otpDoc.data();
        if (!otpData) {
            throw new functions.https.HttpsError('not-found', 'Données de vérification invalides');
        }
        // Vérifier si le code a expiré
        const now = new Date();
        const expiresAt = otpData.expiresAt.toDate();
        if (now > expiresAt) {
            // Supprimer le code expiré
            await otpRef.delete();
            throw new functions.https.HttpsError('deadline-exceeded', 'Code de vérification expiré');
        }
        // Vérifier si le code a déjà été utilisé
        if (otpData.used) {
            throw new functions.https.HttpsError('already-exists', 'Code de vérification déjà utilisé');
        }
        // Vérifier le code
        if (otpData.otp !== data.otp) {
            throw new functions.https.HttpsError('invalid-argument', 'Code de vérification incorrect');
        }
        // Marquer le code comme utilisé
        await otpRef.update({
            used: true,
            usedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Code OTP vérifié avec succès pour ${data.email}`);
        return {
            success: true,
            message: 'Code de vérification validé'
        };
    }
    catch (error) {
        console.error('❌ Erreur vérification OTP:', error);
        throw error;
    }
});
// Fonction de nettoyage automatique des codes OTP expirés
exports.cleanupExpiredOTP = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
    try {
        const now = new Date();
        const expiredOTPs = await admin.firestore()
            .collection('otpCodes')
            .where('expiresAt', '<', now)
            .get();
        const batch = admin.firestore().batch();
        expiredOTPs.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`🧹 ${expiredOTPs.docs.length} codes OTP expirés supprimés`);
        return { success: true, deletedCount: expiredOTPs.docs.length };
    }
    catch (error) {
        console.error('❌ Erreur nettoyage OTP:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Erreur inconnue' };
    }
});
//# sourceMappingURL=index.js.map