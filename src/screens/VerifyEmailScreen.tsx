import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { applyActionCode, sendEmailVerification, signOut } from 'firebase/auth';
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, db } from './firebaseConfig';
import { AuthContext } from '../contexts/AuthContext';

export default function VerifyEmailScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(auth.currentUser?.email || '');
  const [confirmEnabled, setConfirmEnabled] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [verificationLink, setVerificationLink] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const { setUser } = React.useContext(AuthContext);
  
  // Auto-polling: recharger l'état emailVerified toutes les 3s
  // useAuth détectera le changement et App.tsx redirigera automatiquement vers MainTabs
  React.useEffect(() => {
    let mounted = true;
    let timer: any;
    const tick = async () => {
      try {
        if (auth.currentUser) {
          await auth.currentUser.reload();
          // Le changement de emailVerified déclenchera onAuthStateChanged dans useAuth
          // qui mettra à jour l'utilisateur, et App.tsx redirigera automatiquement
        }
      } catch (error) {
        console.error('Erreur polling vérification:', error);
      } finally {
        if (mounted) {
          timer = setTimeout(tick, 3000);
        }
      }
    };
    tick();
    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Anti-mauvais clic: activer le bouton "J'ai vérifié" après 5s
  React.useEffect(() => {
    let sec = 5;
    setCountdown(sec);
    setConfirmEnabled(false);
    const tick = setInterval(() => {
      sec -= 1;
      setCountdown(sec);
      if (sec <= 0) {
        setConfirmEnabled(true);
        clearInterval(tick);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const handleResendEmail = async () => {
    if (!auth.currentUser) {
      Alert.alert('Erreur', 'Aucun utilisateur connecté');
      return;
    }

    setLoading(true);
    try {
      const actionCodeSettings = {
        url: 'https://attaqwa-confidentialite.vercel.app/index.html',
        handleCodeInApp: false,
        iOS: { bundleId: 'com.attaqwa.app' },
        android: { packageName: 'com.attaqwa.app', installApp: false, minimumVersion: '1' },
      } as any;
      await sendEmailVerification(auth.currentUser, actionCodeSettings);
      Alert.alert(
        'Email envoyé !',
        'Un nouvel email de vérification a été envoyé. Vérifiez votre boîte de réception et le dossier spam.\n\nSi vous ne recevez pas l\'email, attendez quelques minutes avant de réessayer.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Erreur envoi email:', error);
      let errorMsg = 'Impossible d\'envoyer l\'email de vérification.';
      let errorTitle = 'Erreur';
      
      if (error.code === 'auth/too-many-requests') {
        errorTitle = 'Trop de tentatives';
        errorMsg = 'Vous avez fait trop de tentatives d\'envoi d\'email. Firebase limite l\'envoi pour éviter le spam.\n\nVeuillez attendre 5 à 10 minutes avant de réessayer.\n\nEn attendant, vérifiez votre boîte de réception et le dossier spam - vous avez peut-être déjà reçu un email de vérification.';
      } else if (error.code === 'auth/network-request-failed') {
        errorTitle = 'Erreur de connexion';
        errorMsg = 'Impossible d\'envoyer l\'email à cause d\'un problème de connexion. Vérifiez votre connexion internet et réessayez.';
      } else if (error.code === 'auth/user-not-found') {
        errorTitle = 'Utilisateur introuvable';
        errorMsg = 'L\'utilisateur n\'existe plus. Veuillez vous réinscrire.';
      }
      
      Alert.alert(errorTitle, errorMsg, [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleIveVerified = async () => {
    if (!auth.currentUser) {
      Alert.alert('Erreur', 'Aucun utilisateur connecté');
      return;
    }

    try {
      // Recharger l'utilisateur Firebase pour récupérer l'état réel
      await auth.currentUser.reload();
      const isVerified = !!auth.currentUser.emailVerified;
      if (isVerified) {
        // Créer/mettre à jour le document Firestore uniquement après vérification réelle
        try {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          // Tentative d'update; si le doc n'existe pas, l'update échouera et on pourra setDoc côté App (deep link)
          await updateDoc(userRef, { emailVerified: true });
        } catch {
          // Si le doc n'existe pas, on le créera au prochain passage (useAuth/App) pour éviter des erreurs de droits
        }
      }
      
      Alert.alert(
        isVerified ? 'Vérification réussie !' : 'Vérification non détectée',
        isVerified 
          ? 'Votre email a été vérifié. Vous allez être redirigé vers l\'application.'
          : 'Nous ne détectons pas encore la vérification. Réessayez dans quelques secondes après avoir cliqué sur le lien de l’email.',
        [
          { 
            text: isVerified ? 'Continuer' : 'Réessayer', 
            onPress: () => {
              if (isVerified && auth.currentUser) {
                // Mettre à jour l'utilisateur pour déclencher la redirection automatique
                const role = (auth.currentUser as any).role || 'user';
                setUser?.({ ...(auth.currentUser as any), role, emailVerified: true });
                // App.tsx redirigera automatiquement vers MainTabs
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur mise à jour emailVerified:', error);
      Alert.alert(
        'Erreur',
        'Impossible de mettre à jour le statut de vérification. Veuillez réessayer.',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Continuer quand même', 
            onPress: () => {
              if (auth.currentUser) {
                const role = (auth.currentUser as any).role || 'user';
                setUser?.({ ...(auth.currentUser as any), role, emailVerified: true });
                // App.tsx redirigera automatiquement vers MainTabs
              }
            }
          }
        ]
      );
    }
  };

  const handleVerifyLinkManually = async () => {
    if (!verificationLink.trim()) {
      Alert.alert('Lien requis', 'Veuillez coller le lien de vérification reçu par email.');
      return;
    }

    setLoading(true);
    try {
      // Extraire le oobCode du lien
      let oobCode: string | null = null;
      
      // Format 1: https://attaqwa-confidentialite.vercel.app/?mode=verifyEmail&oobCode=...
      const urlMatch = verificationLink.match(/[?&]oobCode=([^&]+)/);
      if (urlMatch) {
        oobCode = decodeURIComponent(urlMatch[1]);
      } else {
        // Format 2: juste le code (si l'utilisateur copie seulement le code)
        oobCode = verificationLink.trim();
      }

      if (!oobCode) {
        Alert.alert('Lien invalide', 'Le lien de vérification semble invalide. Assurez-vous d\'avoir copié le lien complet depuis l\'email.');
        return;
      }

      // Appliquer le code de vérification
      await applyActionCode(auth, oobCode);
      await auth.currentUser?.reload();
      
      if (auth.currentUser?.emailVerified && auth.currentUser) {
        // Créer/mettre à jour le document Firestore
        const ref = doc(db, 'users', auth.currentUser.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, {
            email: auth.currentUser.email,
            role: 'user',
            emailVerified: true,
            createdAt: new Date(),
            displayName: auth.currentUser.displayName || '',
          });
        } else {
          await updateDoc(ref, { emailVerified: true });
        }
        const role = (snap.data() as any)?.role || 'user';
        // Mettre à jour l'utilisateur avec emailVerified: true pour déclencher la redirection automatique dans App.tsx
        setUser?.({ ...(auth.currentUser as any), role, emailVerified: true });
        
        // Ne pas naviguer manuellement : App.tsx détectera emailVerified: true et redirigera automatiquement
        setVerificationLink('');
        setShowLinkInput(false);
      } else {
        Alert.alert('Erreur', 'La vérification n\'a pas pu être confirmée. Vérifiez que le lien est correct et non expiré.');
      }
    } catch (error: any) {
      console.error('Erreur vérification manuelle:', error);
      let errorMsg = 'Impossible de vérifier le lien.';
      if (error.code === 'auth/invalid-action-code') {
        errorMsg = 'Le lien de vérification est invalide ou a expiré. Demandez un nouvel email.';
      } else if (error.code === 'auth/expired-action-code') {
        errorMsg = 'Le lien de vérification a expiré. Cliquez sur "Renvoyer l\'email" pour en recevoir un nouveau.';
      }
      Alert.alert('Erreur de vérification', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUnverifiedAccount = async () => {
    if (!auth.currentUser) {
      Alert.alert('Erreur', 'Aucun utilisateur connecté');
      return;
    }

    // Confirmation avant suppression
    Alert.alert(
      'Supprimer mon compte',
      'Voulez-vous vraiment supprimer votre compte non vérifié ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const uid = auth.currentUser?.uid;
              
              // Supprimer éventuel doc Firestore
              if (uid) {
                try {
                  await deleteDoc(doc(db, 'users', uid));
                  console.log('✅ Document Firestore supprimé');
                } catch (e) {
                  console.log('ℹ️ Document Firestore déjà supprimé ou inexistant');
                }
              }
              
              // Supprimer le compte Firebase (nécessite une session récente: OK juste après inscription)
              try {
                await auth.currentUser?.delete();
                console.log('✅ Compte Firebase supprimé');
              } catch (deleteError: any) {
                if (deleteError?.code === 'auth/requires-recent-login') {
                  // Si la session est trop ancienne, déconnecter et demander de se reconnecter
                  await signOut(auth);
                  setUser?.(null);
                  Alert.alert(
                    'Reconnexion requise',
                    'Pour supprimer ce compte, veuillez vous reconnecter puis réessayer.',
                    [{ text: 'OK' }]
                  );
                  setLoading(false);
                  return;
                }
                throw deleteError;
              }
              
              // Déconnecter et mettre à jour le contexte
              try {
                await signOut(auth);
              } catch (signOutError) {
                console.log('ℹ️ SignOut après suppression (non bloquant):', signOutError);
              }
              
              // Mettre à jour le contexte pour déclencher la redirection automatique dans App.tsx
              setUser?.(null);
              
              Alert.alert(
                'Compte supprimé',
                'Votre compte non vérifié a été supprimé. Vous pouvez recommencer l\'inscription.',
                [{ text: 'OK' }]
              );
              
              // App.tsx détectera user = null et redirigera automatiquement vers Login
            } catch (e: any) {
              console.error('❌ Erreur suppression compte:', e);
              Alert.alert(
                'Suppression impossible',
                e?.message || 'Nous n\'avons pas pu supprimer le compte. Essayez de vous reconnecter puis de relancer la suppression.',
                [{ text: 'OK' }]
              );
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <MaterialCommunityIcons name="email-check" size={40} color="#FFFFFF" />
          </View>
        </View>

        <Text style={styles.title}>Vérifiez votre email</Text>
        
        <Text style={styles.description}>
          Nous avons envoyé un email de vérification à :
        </Text>
        
        <View style={styles.emailContainer}>
          <Text style={styles.email} numberOfLines={1} ellipsizeMode="middle">{email}</Text>
        </View>
        
        <Text style={styles.instructions}>
          Cliquez sur le lien dans l'email pour activer votre compte.{'\n\n'}
          Si vous ne trouvez pas l'email :
          {'\n'}• Vérifiez votre dossier spam/indésirable
          {'\n'}• Vérifiez le dossier Promotions (Gmail)
          {'\n'}• Attendez 2-3 minutes (les emails peuvent prendre du temps)
          {'\n'}• Si vous avez fait plusieurs tentatives, attendez 5-10 minutes avant de réessayer
          {'\n\n'}
          Vous pouvez aussi coller le lien de vérification manuellement ci-dessous si vous avez reçu l'email sur un autre appareil.
        </Text>

      {/* Option pour coller le lien manuellement */}
      <TouchableOpacity 
        style={styles.linkToggleButton}
        onPress={() => setShowLinkInput(!showLinkInput)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons 
          name={showLinkInput ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#174C3C" 
        />
        <Text style={styles.linkToggleText}>
          {showLinkInput ? 'Masquer' : 'Vérifier manuellement (app et email sur deux appareils)'}
        </Text>
      </TouchableOpacity>

      {showLinkInput && (
        <View style={styles.linkInputContainer}>
          <View style={styles.linkInputHeader}>
            <MaterialCommunityIcons name="link-variant" size={20} color="#174C3C" />
            <Text style={styles.linkInputLabel}>
              Collez le lien de vérification depuis votre email :
            </Text>
          </View>
          <TextInput
            style={styles.linkInput}
            placeholder="https://attaqwa-confidentialite.vercel.app/?mode=verifyEmail&oobCode=..."
            value={verificationLink}
            onChangeText={setVerificationLink}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#999"
          />
          <TouchableOpacity
            onPress={handleVerifyLinkManually}
            disabled={loading || !verificationLink.trim()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={loading || !verificationLink.trim() ? ['#9E9E9E', '#757575'] : ['#174C3C', '#19514A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.button, styles.verifyLinkButton]}
            >
              <MaterialCommunityIcons name="check-circle" size={20} color="white" />
              <Text style={styles.buttonText}>
                {loading ? 'Vérification...' : 'Vérifier ce lien'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <View style={styles.helpTextContainer}>
          <MaterialCommunityIcons name="information-outline" size={14} color="#666" />
          <Text style={styles.helpText}>
            L'email a expiré ? Cliquez sur "Renvoyer" ci-dessous.
          </Text>
        </View>

        <View style={styles.helpTextContainer}>
          <MaterialCommunityIcons name="information-outline" size={14} color="#666" />
          <Text style={styles.helpText}>
            Tu veux supprimer le compte ? Clique sur "Supprimer".
          </Text>
        </View>

        <View style={styles.buttonsRow}>
          <TouchableOpacity 
            onPress={handleResendEmail}
            disabled={loading}
            activeOpacity={0.8}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={loading ? ['#9E9E9E', '#757575'] : ['#174C3C', '#19514A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.button, styles.buttonCompact]}
            >
              <MaterialCommunityIcons name="email-outline" size={18} color="white" />
              <Text style={styles.buttonTextCompact}>
                {loading ? 'Envoi...' : 'Renvoyer'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleIveVerified}
            disabled={!confirmEnabled || loading}
            activeOpacity={0.8}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={!confirmEnabled || loading ? ['#9E9E9E', '#757575'] : ['#BB9B4E', '#D4AF37']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.button, styles.buttonCompact]}
            >
              <MaterialCommunityIcons name="check-circle" size={18} color="white" />
              <Text style={styles.buttonTextCompact} numberOfLines={1}>
                {confirmEnabled ? "Vérifié" : `${countdown}s`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleDeleteUnverifiedAccount}
            activeOpacity={0.8}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={['#B00020', '#C62828']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.button, styles.buttonCompact]}
            >
              <MaterialCommunityIcons name="trash-can" size={18} color="white" />
              <Text style={styles.buttonTextCompact} numberOfLines={1}>Supprimer</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.backButton} 
          onPress={async () => {
            try {
              await signOut(auth);
              setUser?.(null);
              // App.tsx détectera user = null et redirigera automatiquement vers Login
            } catch (error) {
              console.error('Erreur déconnexion:', error);
              Alert.alert('Erreur', 'Impossible de se déconnecter. Veuillez réessayer.');
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.backButtonContent}>
            <MaterialCommunityIcons name="arrow-left" size={18} color="#174C3C" />
            <Text style={styles.backButtonText}>Retour à la connexion</Text>
          </View>
        </TouchableOpacity>
      </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 60,
    paddingBottom: 10,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  iconBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#174C3C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#174C3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#174C3C',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#E8F5E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  email: {
    fontSize: 15,
    fontWeight: '700',
    color: '#174C3C',
    textAlign: 'center',
    width: '100%',
  },
  instructions: {
    fontSize: 13,
    color: '#174C3C',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 10,
    width: '100%',
    maxWidth: 400,
    borderLeftWidth: 3,
    borderLeftColor: '#BB9B4E',
    borderRightWidth: 3,
    borderRightColor: '#BB9B4E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
    marginBottom: 0,
  },
  buttonsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    justifyContent: 'space-between',
  },
  buttonWrapper: {
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonCompact: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
  },
  resendButton: {
    // Gradient appliqué via LinearGradient
  },
  verifiedButton: {
    // Gradient appliqué via LinearGradient
  },
  deleteButton: {
    // Gradient appliqué via LinearGradient
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  buttonTextCompact: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    width: '100%',
    borderRadius: 10,
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    color: '#174C3C',
    fontSize: 16,
    fontWeight: '600',
  },
  helpTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 0,
    paddingHorizontal: 10,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    flex: 1,
  },
  linkToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#E8F5E8',
    borderRadius: 10,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  linkToggleText: {
    fontSize: 14,
    color: '#174C3C',
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  linkInputContainer: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E8F5E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  linkInputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  linkInputLabel: {
    fontSize: 14,
    color: '#174C3C',
    fontWeight: '600',
    flex: 1,
  },
  linkInput: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 10,
    backgroundColor: '#F8F9FA',
    fontFamily: 'monospace',
  },
  verifyLinkButton: {
    // Gradient appliqué via LinearGradient
  },
}); 