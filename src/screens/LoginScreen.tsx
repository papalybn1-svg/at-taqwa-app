import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Image as RNImage, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AuthUser } from '../hooks/useAuth';
import { useResponsive, getResponsiveStyle } from '../hooks/useResponsive';
import { auth } from './firebaseConfig';

// Créer le contexte utilisateur
export const AuthContext = createContext<{ user: AuthUser | null, setUser: (u: AuthUser | null) => void }>({ 
  user: null, 
  setUser: () => {} 
});

// Ajouter un composant Toast moderne
function Toast({ visible, message, type, onHide, dynamicStyles }: { visible: boolean, message: string, type: 'success' | 'error', onHide: () => void, dynamicStyles?: any }) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onHide, 2500);
      return () => clearTimeout(timer);
    }
  }, [visible]);
  if (!visible) return null;
  
  // Styles par défaut si dynamicStyles n'est pas disponible
  const defaultStyles = {
    toast: {
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      backgroundColor: '#fff',
      borderTopWidth: 1,
      borderTopColor: type === 'success' ? '#4CAF50' : '#f44336',
    },
    toastText: {
      fontSize: 16,
      fontWeight: 'bold' as const,
      color: '#174C3C',
    },
  };
  
  const styles = dynamicStyles || defaultStyles;
  
  // Gérer le cas où toastSuccess ou toastError n'existent pas
  const toastStyle = [
    styles.toast,
    type === 'success' 
      ? (styles.toastSuccess || { borderTopColor: '#4CAF50' })
      : (styles.toastError || { borderTopColor: '#f44336' })
  ];
  
  return (
    <View style={toastStyle}>
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
}

const db = getFirestore();

// Clés pour AsyncStorage (même que dans useAuth)
const STORAGE_KEYS = {
  USER_ROLE: 'userRole',
  USER_EMAIL: 'userEmail',
  USER_DISPLAY_NAME: 'userDisplayName',
  LAST_LOGIN: 'lastLogin'
};

export default function LoginScreen({ navigation }: any) {
  const responsive = useResponsive();
  const responsiveStyle = getResponsiveStyle(responsive);
  const [screen, setScreen] = useState<'intro' | 'login' | 'register' | 'forgot'>('intro');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { user, setUser } = useContext(AuthContext);
  const [toast, setToast] = useState<{ visible: boolean, message: string, type: 'success' | 'error' }>({ visible: false, message: '', type: 'success' });
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; percent: number; label: 'Faible' | 'Moyen' | 'Fort' | 'Très fort' } | null>(null);
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ visible: true, message, type });
  };

  // Fonction pour réinitialiser tous les champs
  const resetAllFields = () => {
    setEmail('');
    setPassword('');
    setPrenom('');
    setNom('');
    setErrorMessage('');
    setPasswordStrength(null);
    setIsPasswordValid(false);
    setIsPasswordVisible(false);
    setToast({ visible: false, message: '', type: 'success' });
  };

  // Réinitialiser les champs quand on change d'écran (sauf au premier rendu)
  const prevScreenRef = React.useRef<'intro' | 'login' | 'register' | 'forgot' | null>(null);
  useEffect(() => {
    // Ne pas réinitialiser au premier rendu (quand prevScreenRef.current est null)
    if (prevScreenRef.current !== null && prevScreenRef.current !== screen) {
      resetAllFields();
    }
    prevScreenRef.current = screen;
  }, [screen]);

  const evaluatePassword = (pwd: string) => {
    const hasMinLen = pwd.length >= 8;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasDigit = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const rules = [hasMinLen, hasUpper, hasLower, hasDigit, hasSpecial];
    const score = rules.reduce((s, ok) => s + (ok ? 1 : 0), 0);
    const percent = Math.min(100, Math.round((score / 5) * 100));
    let label: 'Faible' | 'Moyen' | 'Fort' | 'Très fort' = 'Faible';
    if (score >= 4) label = 'Fort';
    if (score === 5) label = 'Très fort';
    if (score === 3) label = 'Moyen';
    setPasswordStrength({ score, percent, label });
    setIsPasswordValid(hasMinLen && hasUpper && hasLower && hasDigit && hasSpecial);
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      showToast('Veuillez saisir votre adresse email d\'abord.', 'error');
      return;
    }

    setLoading(true);
    try {
      console.log('📧 Envoi email réinitialisation à:', email.trim());
      await sendPasswordResetEmail(auth, email.trim());
      console.log('✅ Email de réinitialisation envoyé avec succès');
      
      // Message plus détaillé comme dans ParametresScreen
      showToast('Email envoyé ! Vérifiez votre boîte de réception et le dossier spam.', 'success');
      
      // Afficher aussi une alerte pour plus de clarté
      Alert.alert(
        'Email envoyé !', 
        'Un email de réinitialisation a été envoyé à votre adresse. Vérifiez votre boîte de réception et le dossier spam.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('❌ Erreur envoi email réinitialisation:', error);
      let errorMessage = 'Impossible d\'envoyer l\'email de réinitialisation. Veuillez réessayer.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Aucun compte trouvé avec cette adresse email.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Adresse email invalide.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Trop de tentatives. Veuillez attendre avant de réessayer.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Erreur de réseau. Vérifiez votre connexion internet.';
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (screen === 'register') {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: `${prenom} ${nom}` });
        
        // ═══════════════════════════════════════════════════════════════════════════
        // 🔒 VÉRIFICATION D'EMAIL DÉSACTIVÉE (v1.0.4) - Code commenté pour réutilisation future
        // ═══════════════════════════════════════════════════════════════════════════
        // 
        // AVANT (vérification d'email activée) :
        // // Envoyer l'email de vérification avec actionCodeSettings pour les deep links
        // const actionCodeSettings = {
        //   url: 'https://attaqwa-confidentialite.vercel.app/?mode=verifyEmail',
        //   handleCodeInApp: true, // ✅ Important : permet l'ouverture directe de l'app sur Android/iOS
        //   iOS: { bundleId: 'com.attaqwa.app' },
        //   android: { packageName: 'com.attaqwaAly.app', installApp: false, minimumVersion: '1' },
        // } as any;
        // await sendEmailVerification(userCred.user, actionCodeSettings);
        // console.log('📧 Email de vérification envoyé à:', userCred.user.email);
        //
        // ═══════════════════════════════════════════════════════════════════════════
        // ✅ NOUVEAU COMPORTEMENT : Accès direct sans vérification d'email
        // ═══════════════════════════════════════════════════════════════════════════
        
        // Créer le document utilisateur avec emailVerified: true automatiquement
        // L'utilisateur accède directement à l'app sans vérification d'email
        await setDoc(doc(db, 'users', userCred.user.uid), {
          email: userCred.user.email,
          role: 'user',
          emailVerified: true, // ✅ Marqué comme vérifié automatiquement (pas de vérification d'email requise)
          createdAt: new Date(),
          displayName: `${prenom} ${nom}`,
        });

        // Sauvegarder les données utilisateur localement pour Expo Go
        try {
          await AsyncStorage.multiSet([
            [STORAGE_KEYS.USER_ROLE, 'user'],
            [STORAGE_KEYS.USER_EMAIL, userCred.user.email || ''],
            [STORAGE_KEYS.USER_DISPLAY_NAME, `${prenom} ${nom}`],
            [STORAGE_KEYS.LAST_LOGIN, new Date().toISOString()]
          ]);
          console.log('✅ Données utilisateur sauvegardées localement (inscription)');
        } catch (error) {
          console.error('❌ Erreur sauvegarde locale:', error);
        }

        // ═══════════════════════════════════════════════════════════════════════════
        // 🔒 MESSAGES D'INSCRIPTION MODIFIÉS (v1.0.4) - Code commenté pour réutilisation future
        // ═══════════════════════════════════════════════════════════════════════════
        //
        // AVANT (avec vérification d'email) :
        // showToast('Inscription réussie ! Vérifiez votre email pour activer votre compte.', 'success');
        // Alert.alert(
        //   'Inscription réussie !',
        //   'Un email de vérification a été envoyé à votre adresse. Veuillez vérifier votre boîte de réception et cliquer sur le lien pour activer votre compte.',
        //   [
        //     { 
        //       text: 'Vérifier mon email', 
        //       onPress: () => {
        //         navigation.navigate('VerifyEmail' as never);
        //       }
        //     }
        //   ]
        // );
        //
        // ═══════════════════════════════════════════════════════════════════════════
        // ✅ NOUVEAU COMPORTEMENT : Message de bienvenue direct
        // ═══════════════════════════════════════════════════════════════════════════
        
        showToast('Inscription réussie ! Bienvenue sur At-Taqwa.', 'success');
        console.log('✅ Inscription réussie pour:', userCred.user.email);
        
        // L'utilisateur sera automatiquement redirigé vers l'accueil via App.tsx
        // Pas besoin d'alerte, la navigation se fait automatiquement
      } else {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        
        // ═══════════════════════════════════════════════════════════════════════════
        // 🔒 VÉRIFICATION D'EMAIL DÉSACTIVÉE (v1.0.4) - Code commenté pour réutilisation future
        // ═══════════════════════════════════════════════════════════════════════════
        //
        // AVANT (vérification d'email requise) :
        // // Vérifier si l'email est vérifié (seulement pour les nouveaux utilisateurs)
        // const userDocRef = doc(db, 'users', userCred.user.uid);
        // let userDoc = await getDoc(userDocRef);
        // let userData = userDoc.data();
        // if (!userCred.user.emailVerified && !userData) {
        //   showToast('Veuillez vérifier votre email avant de vous connecter.', 'error');
        //   setLoading(false);
        //   return;
        // }
        //
        // ═══════════════════════════════════════════════════════════════════════════
        // ✅ NOUVEAU COMPORTEMENT : Connexion directe sans vérification d'email
        // ═══════════════════════════════════════════════════════════════════════════
        
        const userDocRef = doc(db, 'users', userCred.user.uid);
        let userDoc = await getDoc(userDocRef);
        let userData = userDoc.data();

        if (!userData) {
          // Si le document n'existe pas, on le crée automatiquement
          await setDoc(userDocRef, {
            email: userCred.user.email,
            role: 'user',
            emailVerified: userCred.user.emailVerified,
            createdAt: new Date(),
            displayName: userCred.user.displayName || '',
          });
          userDoc = await getDoc(userDocRef);
          userData = userDoc.data();
        }

        // Vérifier si c'est un nouvel utilisateur
        const isNewUser = userCred.user.metadata.creationTime === userCred.user.metadata.lastSignInTime;
        
        if (isNewUser) {
          // Créer une notification de bienvenue
          try {
            const welcomeNotification = {
              title: "Bienvenue !",
              message: `Bienvenue dans At-Taqwa App ! Nous sommes ravis de vous compter parmi nous. Découvrez nos fonctionnalités et commencez votre voyage spirituel.`,
              type: "welcome",
              authorName: "Système",
              targetUsers: "all",
              isActive: true,
              createdAt: serverTimestamp()
            };
            
            await addDoc(collection(db, 'notifications'), welcomeNotification);
            console.log("✅ Notification de bienvenue créée");
          } catch (notifError) {
            console.log("⚠️ Erreur création notification de bienvenue:", notifError);
          }
        }

        // Sauvegarder les données utilisateur localement pour Expo Go
        try {
          const userRole = userData?.role || 'user';
          await AsyncStorage.multiSet([
            [STORAGE_KEYS.USER_ROLE, userRole],
            [STORAGE_KEYS.USER_EMAIL, userCred.user.email || ''],
            [STORAGE_KEYS.USER_DISPLAY_NAME, userCred.user.displayName || ''],
            [STORAGE_KEYS.LAST_LOGIN, new Date().toISOString()]
          ]);
          console.log('✅ Données utilisateur sauvegardées localement (connexion)');
        } catch (error) {
          console.error('❌ Erreur sauvegarde locale:', error);
        }

        showToast('Connexion réussie ! Redirection en cours...', 'success');
        console.log('✅ Connexion réussie pour:', userCred.user.email);

        // Laisser useAuth gérer la navigation automatiquement
        // useAuth détectera le changement d'état et App.tsx affichera la bonne interface
      }
    } catch (e: any) {
      let msg = 'Email ou mot de passe invalide.';
      console.error('❌ Erreur auth:', e);
      
      if (e.code === 'auth/wrong-password') msg = 'Email ou mot de passe invalide.';
      else if (e.code === 'auth/user-not-found') msg = "Email ou mot de passe invalide.";
      else if (e.code === 'auth/email-already-in-use') msg = "Cet email est déjà utilisé.";
      else if (e.code === 'auth/invalid-email') msg = "Email ou mot de passe invalide.";
      else if (e.code === 'auth/weak-password') msg = "Le mot de passe est trop faible.";
      else if (e.code === 'auth/network-request-failed') msg = "Erreur de connexion réseau.";
      else if (e.code === 'auth/too-many-requests') msg = "Trop de tentatives. Réessayez plus tard.";
      
      setErrorMessage(msg);
    }
    setLoading(false);
  };

  const dynamicStyles = createStyles(responsive, responsiveStyle);

  // Ecran d'intro
  if (screen === 'intro') {
    return (
      <View style={dynamicStyles.introContainer}>
        {/* Image du couple en haut */}
        <View style={dynamicStyles.imageTopSection}>
          <Image source={require('../../assets/couple-livre.png')} style={dynamicStyles.coupleImage} />
        </View>
        {/* Bloc blanc en bas avec le contenu */}
        <View style={dynamicStyles.whiteBottomCard}>
          <Text style={dynamicStyles.mainTitle}>Réparer mes prières</Text>
          <Text style={dynamicStyles.descriptionText}>
            Rien n'est perdu:{"\n"}chaque prière réparée{"\n"}est un pas vers Allah.
          </Text>
          {/* Boutons */}
          <View style={dynamicStyles.buttonsContainer}>
            <TouchableOpacity style={dynamicStyles.connectButton} onPress={() => setScreen('login')}>
              <Text style={dynamicStyles.connectButtonText}>Se connecter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dynamicStyles.registerButton} onPress={() => setScreen('register')}>
              <Text style={dynamicStyles.registerButtonText}>S'inscrire</Text>
            </TouchableOpacity>
          </View>
          {/* Barre de progression en bas */}
          <View style={dynamicStyles.progressIndicator}>
            <View style={dynamicStyles.progressDot} />
          </View>
        </View>
        <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} dynamicStyles={dynamicStyles} />
      </View>
    );
  }

  // Ecran mot de passe oublié
  if (screen === 'forgot') {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={dynamicStyles.loginContainer}>
            <View style={dynamicStyles.loginMainSection}>
              <Text style={dynamicStyles.loginTitle}>Mot de passe oublié</Text>
              <View style={dynamicStyles.loginInputWrapper}>
                <MaterialCommunityIcons name="email-outline" size={20} color="#174C3C" style={dynamicStyles.loginInputIcon} />
                <TextInput
                  style={[dynamicStyles.loginInput, dynamicStyles.loginInputWithIcon]}
                  placeholder="E-mail"
                  placeholderTextColor="#174C3C"
                  value={email}
                  onChangeText={(t) => setEmail(t)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              <TouchableOpacity style={dynamicStyles.loginButton} onPress={handleForgotPassword} disabled={loading || !email.trim()}>
                {loading ? <ActivityIndicator color="#174C3C" /> : <Text style={dynamicStyles.loginButtonText}>Envoyer le lien de réinitialisation</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setScreen('login')} style={dynamicStyles.registerLinkContainer} disabled={loading}>
                <Text style={dynamicStyles.registerLinkText}>Retour à la connexion</Text>
              </TouchableOpacity>
            </View>
            <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} dynamicStyles={dynamicStyles} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Ecran d'inscription
  if (screen === 'register') {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
      <View style={dynamicStyles.registerContainer}>
        {/* Etoile en haut à droite */}
        <View style={dynamicStyles.registerStarContainer}>
          <RNImage source={require('../../assets/etoile.png')} style={dynamicStyles.registerStar} />
        </View>
        
        {/* Section principale */}
        <View style={dynamicStyles.registerMainSection}>
          {/* Titre */}
          <Text style={dynamicStyles.registerTitle}>Créez un compte</Text>
          <Text style={dynamicStyles.registerSubtitle}>Découvrez la voie de la piété</Text>
          
          {/* Champs de saisie */}
          <View style={dynamicStyles.registerInputWrapper}>
            <MaterialCommunityIcons 
              name="account-outline" 
              size={20} 
              color="#174C3C" 
              style={dynamicStyles.registerInputIcon} 
            />
          <TextInput 
              style={[dynamicStyles.registerInput, dynamicStyles.registerInputWithIcon]} 
              placeholder="Prénom" 
              placeholderTextColor="#174C3C"
              value={prenom} 
              onChangeText={setPrenom} 
            />
          </View>
          
          <View style={dynamicStyles.registerInputWrapper}>
            <MaterialCommunityIcons 
              name="account-outline" 
              size={20} 
              color="#174C3C" 
              style={dynamicStyles.registerInputIcon} 
            />
            <TextInput 
              style={[dynamicStyles.registerInput, dynamicStyles.registerInputWithIcon]} 
              placeholder="Nom" 
              placeholderTextColor="#174C3C"
              value={nom} 
              onChangeText={setNom} 
            />
          </View>
          
          <View style={dynamicStyles.registerInputWrapper}>
            <MaterialCommunityIcons 
              name="email-outline" 
              size={20} 
              color="#174C3C" 
              style={dynamicStyles.registerInputIcon} 
            />
            <TextInput 
              style={[dynamicStyles.registerInput, dynamicStyles.registerInputWithIcon]} 
              placeholder="Email" 
              placeholderTextColor="#174C3C"
              value={email} 
              onChangeText={setEmail} 
              autoCapitalize="none" 
              keyboardType="email-address" 
            />
          </View>
          
          <View style={dynamicStyles.registerInputWrapper}>
            <MaterialCommunityIcons 
              name="lock-outline" 
              size={20} 
              color="#174C3C" 
              style={dynamicStyles.registerInputIcon} 
            />
          <TextInput
              style={[dynamicStyles.registerInput, dynamicStyles.registerInputWithIcon]}
            placeholder="Mot de passe"
              placeholderTextColor="#174C3C"
            value={password}
            onChangeText={(t) => { setPassword(t); evaluatePassword(t); }}
            secureTextEntry={!isPasswordVisible}
          />
            <TouchableOpacity 
              style={dynamicStyles.registerEyeButton} 
              onPress={() => setIsPasswordVisible(v => !v)}
            >
              <MaterialCommunityIcons 
                name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color="#174C3C" 
              />
            </TouchableOpacity>
          </View>

          {/* Indicateur de force du mot de passe */}
          {password.length > 0 && passwordStrength && (
            <View style={{ width: '100%', maxWidth: 340, marginTop: -8, marginBottom: 8 }}>
              <View style={{ height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, overflow: 'hidden' }}>
                <View style={{ height: 6, width: `${passwordStrength.percent}%`, backgroundColor: passwordStrength.percent >= 80 ? '#2E7D32' : passwordStrength.percent >= 60 ? '#F9A825' : '#E53935' }} />
              </View>
              <Text style={{ marginTop: 6, fontSize: 12, color: '#174C3C', fontWeight: '600' }}>Force: {passwordStrength.label}</Text>
              {!isPasswordValid && (
                <Text style={{ marginTop: 4, fontSize: 12, color: '#B00020' }}>
                  Min 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 spécial.
                </Text>
              )}
            </View>
          )}
          
          {/* Bouton principal S'inscrire */}
          <TouchableOpacity 
            style={dynamicStyles.registerPrimaryButton} 
            onPress={() => {
              if (!isPasswordValid) {
                setErrorMessage('Le mot de passe est trop faible.');
                return;
              }
              handleAuth();
            }} 
            disabled={loading || !isPasswordValid}
          >
            {loading ? (
              <ActivityIndicator color="#174C3C" />
            ) : (
              <Text style={dynamicStyles.registerPrimaryButtonText}>S'inscrire</Text>
            )}
          </TouchableOpacity>
          

          
          {/* Lien de connexion */}
          <TouchableOpacity 
            onPress={() => setScreen('login')} 
            disabled={loading}
            style={dynamicStyles.registerLoginLink}
          >
            <Text style={dynamicStyles.registerLoginText}>Déjà un membre? Se connecter.</Text>
          </TouchableOpacity>
        </View>
        
        {/* Barre de progression en bas */}
        <View style={dynamicStyles.registerProgressContainer}>
          <View style={dynamicStyles.registerProgressBar} />
        </View>
        
        <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} dynamicStyles={dynamicStyles} />
      </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Ecran de connexion
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
    <View style={dynamicStyles.loginContainer}>
      {/* Section principale du formulaire */}
      <View style={dynamicStyles.loginMainSection}>
        {/* Etoile en haut à droite */}
        <View style={dynamicStyles.loginStarContainer}>
          <RNImage source={require('../../assets/etoile.png')} style={dynamicStyles.loginStar} />
      </View>
        
        {/* Titre */}
        <Text style={dynamicStyles.loginTitle}>Bismillah,{"\n"}Se connecter</Text>
        
        {/* Champs de saisie */}
        <View style={dynamicStyles.loginInputWrapper}>
          <MaterialCommunityIcons 
            name="email-outline" 
            size={20} 
            color="#174C3C" 
            style={dynamicStyles.loginInputIcon}
          />
          <TextInput 
            style={[dynamicStyles.loginInput, dynamicStyles.loginInputWithIcon]} 
            placeholder="E-mail" 
            placeholderTextColor="#174C3C"
            value={email} 
            onChangeText={(text) => {
              setEmail(text);
              setErrorMessage('');
            }} 
            autoCapitalize="none" 
            keyboardType="email-address" 
            editable={!loading}
          />
      </View>
        
        <View style={dynamicStyles.loginInputWrapper}>
          <MaterialCommunityIcons 
            name="lock-outline" 
            size={20} 
            color="#174C3C" 
            style={dynamicStyles.loginInputIcon}
          />
        <TextInput
            style={[dynamicStyles.loginInput, dynamicStyles.loginInputWithIcon]}
          placeholder="Mot de passe"
            placeholderTextColor="#174C3C"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setErrorMessage('');
          }}
          secureTextEntry={!isPasswordVisible}
            editable={!loading}
        />
          <TouchableOpacity style={dynamicStyles.loginEyeButton} onPress={() => setIsPasswordVisible(v => !v)}>
            <MaterialCommunityIcons 
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} 
              size={20} 
              color="#174C3C" 
            />
          </TouchableOpacity>
        </View>
        
        {/* Message d'erreur */}
        {errorMessage ? (
          <View style={dynamicStyles.errorContainer}>
            <Text style={dynamicStyles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
        
        {/* Bouton Se connecter */}
        <TouchableOpacity style={dynamicStyles.loginButton} onPress={handleAuth} disabled={loading}>
          {loading ? <ActivityIndicator color="#174C3C" /> : <Text style={dynamicStyles.loginButtonText}>Se connecter</Text>}
        </TouchableOpacity>
        
        {/* Mot de passe oublié */}
        <TouchableOpacity 
          style={dynamicStyles.forgotPasswordContainer}
          onPress={() => setScreen('forgot')}
          disabled={loading}
        >
          <Text style={dynamicStyles.forgotPassword}>Mot de passe oublié ?</Text>
        </TouchableOpacity>
        
        {/* Lien inscription */}
        <TouchableOpacity 
          onPress={() => setScreen('register')} 
          disabled={loading}
          style={dynamicStyles.registerLinkContainer}
        >
          <Text style={dynamicStyles.registerLinkText}>S'inscrire.</Text>
        </TouchableOpacity>
      </View>


      
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} dynamicStyles={dynamicStyles} />
    </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (responsive: any, responsiveStyle: any) => StyleSheet.create({
  introContainer: { flex: 1, backgroundColor: '#174C3C' },
  imageTopSection: { flex: 2, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, marginBottom: -80 },
  coupleImage: { width: '200%', height: '160%', resizeMode: 'contain', marginBottom: -160, marginLeft: 20 },
  whiteBottomCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: responsiveStyle.spacing['2xl'],
    paddingTop: responsiveStyle.spacing['2xl'],
    paddingBottom: responsiveStyle.spacing.base,
    width: '100%',
    alignItems: 'center',
    minHeight: 320,
    justifyContent: 'center',
  },
  mainTitle: { fontSize: responsiveStyle.fontSize['2xl'], fontWeight: '800', color: '#174C3C', marginBottom: responsiveStyle.spacing.base, textAlign: 'center' },
  descriptionText: { fontSize: responsiveStyle.fontSize.base, color: '#4B5563', textAlign: 'center', marginBottom: responsiveStyle.spacing.lg, fontWeight: '500' },
  buttonsContainer: { flexDirection: 'row', justifyContent: 'center', width: '100%', marginBottom: responsiveStyle.spacing.base },
  connectButton: { backgroundColor: '#174C3C', borderRadius: 22, paddingVertical: responsiveStyle.spacing.base, width: '48%', marginHorizontal: 4, elevation: 3 },
  registerButton: { backgroundColor: '#E7C97B', borderRadius: 22, paddingVertical: responsiveStyle.spacing.base, width: '48%', marginHorizontal: 4, elevation: 3 },
  connectButtonText: { color: '#fff', fontWeight: 'bold', fontSize: responsiveStyle.fontSize.base, textAlign: 'center' },
  registerButtonText: { color: '#174C3C', fontWeight: 'bold', fontSize: responsiveStyle.fontSize.base, textAlign: 'center' },
  progressIndicator: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 6 },
  progressDot: { width: 40, height: 3, backgroundColor: '#E7C97B', borderRadius: 2 },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F5F7', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#174C3C', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#174C3C', marginBottom: 18 },
  input: { width: '100%', maxWidth: 340, backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 14, fontSize: 16, borderWidth: 1, borderColor: '#e0e0e0' },
  inputDark: { width: '100%', maxWidth: 340, backgroundColor: '#174C3C', color: '#fff', borderRadius: 12, padding: 14, marginBottom: 14, fontSize: 16 },
  buttonGold: { backgroundColor: '#E7C97B', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40, marginTop: 8, marginBottom: 12 },
  buttonText: { color: '#174C3C', fontWeight: 'bold', fontSize: 16 },
  link: { color: '#174C3C', fontWeight: 'bold', marginTop: 8, fontSize: 15 },
  forgot: { color: '#174C3C', fontWeight: 'bold', marginBottom: 8, fontSize: 15 },
  or: { color: '#174C3C', fontWeight: 'bold', marginVertical: 8, fontSize: 15 },
  eyeBtn: { position: 'absolute', right: 40, top: 185, zIndex: 2 },
  toast: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  toastSuccess: {
    borderTopColor: '#4CAF50',
  },
  toastError: {
    borderTopColor: '#f44336',
  },
  toastText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#174C3C',
  },
  loginContainer: { 
    flex: 1, 
    backgroundColor: '#F3F5F7', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 24,
    paddingBottom: 40 
  },
  loginMainSection: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginBottomSection: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 20,
  },
  loginTitle: { fontSize: 28, fontWeight: 'bold', color: '#174C3C', marginBottom: 32, textAlign: 'left', alignSelf: 'flex-start', maxWidth: 340, width: '100%', marginTop: 60 },
  loginInput: { width: '100%', maxWidth: 340, backgroundColor: '#FFFFFF', color: '#174C3C', borderRadius: 25, paddingVertical: 16, paddingHorizontal: 20, fontSize: 16, fontWeight: '500', borderWidth: 1, borderColor: '#E0E0E0', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  loginButton: { 
    backgroundColor: '#D4AF37', 
    borderRadius: 20,
    paddingVertical: responsiveStyle.spacing.base,
    paddingHorizontal: responsiveStyle.spacing['2xl'],
    marginTop: responsiveStyle.spacing.base, 
    marginBottom: responsiveStyle.spacing.base, 
    width: '100%', 
    maxWidth: 340 
  },
  loginButtonText: { 
    color: '#FFFFFF', 
    fontWeight: 'bold', 
    fontSize: responsiveStyle.fontSize.sm,
    textAlign: 'center' 
  },
  forgotPasswordContainer: { alignItems: 'center', marginTop: 16, marginBottom: 16 },
  forgotPassword: { color: '#174C3C', fontWeight: 'bold', fontSize: 16 },
  separatorContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, width: '100%', maxWidth: 340 },
  separatorLine: { flex: 1, height: 1, backgroundColor: '#174C3C' },
  separatorText: { color: '#174C3C', fontWeight: 'bold', marginHorizontal: 16, fontSize: 16 },
  platformIconsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginTop: 20, 
    marginBottom: 20, 
    width: '100%', 
    maxWidth: 320,
    paddingHorizontal: 20
  },
  platformIcon: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 14, 
    elevation: 4, 
    shadowColor: '#000', 
    shadowOpacity: 0.15, 
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    minWidth: 60,
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center'
  },
  platformIconImage: { 
    width: 36, 
    height: 36, 
    resizeMode: 'contain' 
  },

  // Styles pour la page d'inscription
  registerContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  registerStarContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
  },
  registerStar: {
    width: 200,
    height: 200,
    tintColor: '#D4AF37',
  },
  registerMainSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  registerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#174C3C',
    textAlign: 'left',
    alignSelf: 'flex-start',
    marginBottom: 8,
    width: '100%',
    maxWidth: 340,
  },
  registerSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#174C3C',
    textAlign: 'left',
    alignSelf: 'flex-start',
    marginBottom: 20,
    width: '100%',
    maxWidth: 340,
  },
  registerInputWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: 340,
    marginBottom: 16,
  },
  registerInput: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#174C3C',
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  registerInputWithIcon: {
    paddingLeft: 50,
  },
  registerInputIcon: {
    position: 'absolute',
    left: 18,
    top: 18,
    zIndex: 2,
  },
  registerEyeButton: {
    position: 'absolute',
    right: 18,
    top: 18,
    zIndex: 2,
    padding: 2,
  },
  registerPrimaryButton: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#D4AF37',
    borderRadius: 20,
    paddingVertical: responsiveStyle.spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: responsiveStyle.spacing.base,
    marginBottom: responsiveStyle.spacing.base,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  registerPrimaryButtonText: {
    fontSize: responsiveStyle.fontSize.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  registerAppleButton: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: responsiveStyle.spacing.base,
    paddingHorizontal: responsiveStyle.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsiveStyle.spacing.base,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  registerAppleIcon: {
    width: 32,
    height: 32,
    marginRight: responsiveStyle.spacing.base,
    tintColor: '#FFFFFF',
  },
  registerAppleButtonText: {
    fontSize: responsiveStyle.fontSize.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  registerGoogleButton: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: responsiveStyle.spacing.base,
    paddingHorizontal: responsiveStyle.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  registerGoogleIcon: {
    width: 32,
    height: 32,
    marginRight: responsiveStyle.spacing.base,
  },
  registerGoogleButtonText: {
    fontSize: responsiveStyle.fontSize.sm,
    fontWeight: '600',
    color: '#174C3C',
  },
  registerLoginLink: {
    marginTop: 8,
  },
  registerLoginText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#174C3C',
    textAlign: 'center',
  },
  registerProgressContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  registerProgressBar: {
    width: 120,
    height: 4,
    backgroundColor: '#174C3C',
    borderRadius: 2,
  },
  registerLinkContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  registerLinkText: {
    color: '#174C3C',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Styles pour la page de connexion avec icônes
  loginStarContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
  },
  loginStar: {
    width: 200,
    height: 200,
    tintColor: '#D4AF37',
  },
  loginInputWrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: 340,
    marginBottom: 16,
  },
  loginInputIcon: {
    position: 'absolute',
    left: 18,
    top: 18,
    zIndex: 2,
  },
  loginInputWithIcon: {
    paddingLeft: 50,
  },
  loginEyeButton: {
    position: 'absolute',
    right: 18,
    top: 18,
    zIndex: 2,
    padding: 2,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: '100%',
    maxWidth: 340,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
}); 