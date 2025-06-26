import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Image as RNImage, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AuthUser } from '../hooks/useAuth';
import { auth } from './firebaseConfig';

// Créer le contexte utilisateur
export const AuthContext = createContext<{ user: AuthUser | null, setUser: (u: AuthUser | null) => void }>({ user: null, setUser: () => {} });

// Ajouter un composant Toast moderne
function Toast({ visible, message, type, onHide }: { visible: boolean, message: string, type: 'success' | 'error', onHide: () => void }) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onHide, 2500);
      return () => clearTimeout(timer);
    }
  }, [visible]);
  if (!visible) return null;
  return (
    <View style={[styles.toast, type === 'success' ? styles.toastSuccess : styles.toastError]}>
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
}

const db = getFirestore();

export default function LoginScreen({ navigation }: any) {
  const [screen, setScreen] = useState<'intro' | 'login' | 'register'>('intro');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { user, setUser } = useContext(AuthContext);
  const [toast, setToast] = useState<{ visible: boolean, message: string, type: 'success' | 'error' }>({ visible: false, message: '', type: 'success' });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ visible: true, message, type });
  };

  const handleAuth = async () => {
    setLoading(true);
    try {
      if (screen === 'register') {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: `${prenom} ${nom}` });
        
        // Créer le document utilisateur avec le rôle par défaut
        await setDoc(doc(db, 'users', userCred.user.uid), {
          email: userCred.user.email,
          role: 'user',
          createdAt: new Date(),
          displayName: `${prenom} ${nom}`,
        });

        showToast('Inscription réussie ! Vous êtes maintenant connecté.', 'success');
        console.log('✅ Inscription réussie pour:', userCred.user.email);
        
        // Laisser useAuth gérer la navigation automatiquement
        // Pas besoin de navigation manuelle ici
      } else {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        const userDocRef = doc(db, 'users', userCred.user.uid);
        let userDoc = await getDoc(userDocRef);
        let userData = userDoc.data();

        if (!userData) {
          // Si le document n'existe pas, on le crée automatiquement
          await setDoc(userDocRef, {
            email: userCred.user.email,
            role: 'user',
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

        showToast('Connexion réussie ! Redirection en cours...', 'success');
        console.log('✅ Connexion réussie pour:', userCred.user.email);

        // Laisser useAuth gérer la navigation automatiquement
        // useAuth détectera le changement d'état et App.tsx affichera la bonne interface
      }
    } catch (e: any) {
      let msg = 'Une erreur est survenue.';
      console.error('❌ Erreur auth:', e);
      
      if (e.code === 'auth/wrong-password') msg = 'Mot de passe incorrect.';
      else if (e.code === 'auth/user-not-found') msg = "Aucun compte trouvé pour cet email.";
      else if (e.code === 'auth/email-already-in-use') msg = "Cet email est déjà utilisé.";
      else if (e.code === 'auth/invalid-email') msg = "Email invalide.";
      else if (e.code === 'auth/weak-password') msg = "Le mot de passe est trop faible.";
      else if (e.code === 'auth/network-request-failed') msg = "Erreur de connexion réseau.";
      else if (e.code === 'auth/too-many-requests') msg = "Trop de tentatives. Réessayez plus tard.";
      
      showToast(msg, 'error');
    }
    setLoading(false);
  };

  // Ecran d'intro
  if (screen === 'intro') {
    return (
      <View style={styles.introContainer}>
        {/* Image du couple en haut - occupe la majeure partie de l'écran */}
        <View style={styles.imageTopSection}>
          <Image source={require('../../assets/couple-livre.png')} style={styles.coupleImage} />
        </View>
        
        {/* Bloc blanc en bas avec le contenu */}
        <View style={styles.whiteBottomCard}>
          <Text style={styles.mainTitle}>Rattraper mes prières</Text>
          <Text style={styles.descriptionText}>
            Rien n'est perdu :{"\n"}chaque prière rattrapée{"\n"}est un pas vers Allah.
          </Text>
          
          {/* Boutons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.connectButton} onPress={() => setScreen('login')}>
              <Text style={styles.connectButtonText}>Se connecter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.registerButton} onPress={() => setScreen('register')}>
              <Text style={styles.registerButtonText}>S'inscrire</Text>
            </TouchableOpacity>
          </View>
          
          {/* Barre de progression en bas */}
          <View style={styles.progressIndicator}>
            <View style={styles.progressDot} />
          </View>
        </View>
        
        <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
      </View>
    );
  }

  // Ecran d'inscription
  if (screen === 'register') {
    return (
      <View style={styles.registerContainer}>
        {/* Etoile en haut à droite */}
        <View style={styles.registerStarContainer}>
          <RNImage source={require('../../assets/etoile.png')} style={styles.registerStar} />
        </View>
        
        {/* Section principale */}
        <View style={styles.registerMainSection}>
          {/* Titre */}
          <Text style={styles.registerTitle}>Créez un compte</Text>
          <Text style={styles.registerSubtitle}>Découvrez la voie de la piété</Text>
          
          {/* Champs de saisie */}
          <View style={styles.registerInputWrapper}>
            <MaterialCommunityIcons 
              name="account-outline" 
              size={20} 
              color="#174C3C" 
              style={styles.registerInputIcon} 
            />
            <TextInput 
              style={[styles.registerInput, styles.registerInputWithIcon]} 
              placeholder="Prénom" 
              placeholderTextColor="#174C3C"
              value={prenom} 
              onChangeText={setPrenom} 
            />
          </View>
          
          <View style={styles.registerInputWrapper}>
            <MaterialCommunityIcons 
              name="account-outline" 
              size={20} 
              color="#174C3C" 
              style={styles.registerInputIcon} 
            />
            <TextInput 
              style={[styles.registerInput, styles.registerInputWithIcon]} 
              placeholder="Nom" 
              placeholderTextColor="#174C3C"
              value={nom} 
              onChangeText={setNom} 
            />
          </View>
          
          <View style={styles.registerInputWrapper}>
            <MaterialCommunityIcons 
              name="email-outline" 
              size={20} 
              color="#174C3C" 
              style={styles.registerInputIcon} 
            />
            <TextInput 
              style={[styles.registerInput, styles.registerInputWithIcon]} 
              placeholder="Email" 
              placeholderTextColor="#174C3C"
              value={email} 
              onChangeText={setEmail} 
              autoCapitalize="none" 
              keyboardType="email-address" 
            />
          </View>
          
          <View style={styles.registerInputWrapper}>
            <MaterialCommunityIcons 
              name="lock-outline" 
              size={20} 
              color="#174C3C" 
              style={styles.registerInputIcon} 
            />
            <TextInput
              style={[styles.registerInput, styles.registerInputWithIcon]}
              placeholder="Mot de passe"
              placeholderTextColor="#174C3C"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!isPasswordVisible}
            />
            <TouchableOpacity 
              style={styles.registerEyeButton} 
              onPress={() => setIsPasswordVisible(v => !v)}
            >
              <MaterialCommunityIcons 
                name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color="#174C3C" 
              />
            </TouchableOpacity>
          </View>
          
          {/* Bouton principal S'inscrire */}
          <TouchableOpacity 
            style={styles.registerPrimaryButton} 
            onPress={handleAuth} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#174C3C" />
            ) : (
              <Text style={styles.registerPrimaryButtonText}>S'inscrire</Text>
            )}
          </TouchableOpacity>
          

          
          {/* Lien de connexion */}
          <TouchableOpacity 
            onPress={() => setScreen('login')} 
            disabled={loading}
            style={styles.registerLoginLink}
          >
            <Text style={styles.registerLoginText}>Déjà un membre? Se connecter.</Text>
          </TouchableOpacity>
        </View>
        
        {/* Barre de progression en bas */}
        <View style={styles.registerProgressContainer}>
          <View style={styles.registerProgressBar} />
        </View>
        
        <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
      </View>
    );
  }

  // Ecran de connexion
  return (
    <View style={styles.loginContainer}>
      {/* Section principale du formulaire */}
      <View style={styles.loginMainSection}>
        {/* Etoile en haut à droite */}
        <View style={styles.loginStarContainer}>
          <RNImage source={require('../../assets/etoile.png')} style={styles.loginStar} />
        </View>
        
        {/* Titre */}
        <Text style={styles.loginTitle}>Bismillah,{"\n"}Se connecter</Text>
        
        {/* Champs de saisie */}
        <View style={styles.loginInputWrapper}>
          <MaterialCommunityIcons 
            name="email-outline" 
            size={20} 
            color="#174C3C" 
            style={styles.loginInputIcon}
          />
          <TextInput 
            style={[styles.loginInput, styles.loginInputWithIcon]} 
            placeholder="E-mail" 
            placeholderTextColor="#174C3C"
            value={email} 
            onChangeText={setEmail} 
            autoCapitalize="none" 
            keyboardType="email-address" 
            editable={!loading}
          />
        </View>
        
        <View style={styles.loginInputWrapper}>
          <MaterialCommunityIcons 
            name="lock-outline" 
            size={20} 
            color="#174C3C" 
            style={styles.loginInputIcon}
          />
          <TextInput
            style={[styles.loginInput, styles.loginInputWithIcon]}
            placeholder="Mot de passe"
            placeholderTextColor="#174C3C"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!isPasswordVisible}
            editable={!loading}
          />
          <TouchableOpacity style={styles.loginEyeButton} onPress={() => setIsPasswordVisible(v => !v)}>
            <MaterialCommunityIcons 
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} 
              size={20} 
              color="#174C3C" 
            />
          </TouchableOpacity>
        </View>
        
        {/* Bouton Se connecter */}
        <TouchableOpacity style={styles.loginButton} onPress={handleAuth} disabled={loading}>
          {loading ? <ActivityIndicator color="#174C3C" /> : <Text style={styles.loginButtonText}>Se connecter</Text>}
        </TouchableOpacity>
        
        {/* Mot de passe oublié */}
        <TouchableOpacity style={styles.forgotPasswordContainer}>
          <Text style={styles.forgotPassword}>Mot de passe oublié ?</Text>
        </TouchableOpacity>
        
        {/* Lien inscription */}
        <TouchableOpacity 
          onPress={() => setScreen('register')} 
          disabled={loading}
          style={styles.registerLinkContainer}
        >
          <Text style={styles.registerLinkText}>S'inscrire.</Text>
        </TouchableOpacity>
      </View>


      
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
    </View>
  );
}

const styles = StyleSheet.create({
  introContainer: { flex: 1, backgroundColor: '#174C3C' },
  imageTopSection: { flex: 2, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, marginBottom: -20 },
  coupleImage: { width: '200%', height: '160%', resizeMode: 'contain', marginBottom: -120, marginLeft: 20 },
  whiteBottomCard: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 32, paddingTop: 40, width: '100%', alignItems: 'center', minHeight: 330 },
  mainTitle: { fontSize: 32, fontWeight: 'bold', color: '#174C3C', marginBottom: 16, textAlign: 'center' },
  descriptionText: { fontSize: 20, fontWeight: 'bold', color: '#174C3C', textAlign: 'center', marginBottom: 32, lineHeight: 28 },
  buttonsContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 24 },
  connectButton: { backgroundColor: '#174C3C', borderRadius: 25, paddingVertical: 16, paddingHorizontal: 32, flex: 0.48, elevation: 3 },
  registerButton: { backgroundColor: '#E7C97B', borderRadius: 25, paddingVertical: 16, paddingHorizontal: 32, flex: 0.48, elevation: 3 },
  connectButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
  registerButtonText: { color: '#174C3C', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
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
  progressIndicator: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  progressDot: { width: 40, height: 4, backgroundColor: '#E7C97B', borderRadius: 2 },
  etoileContainer: { position: 'absolute', top: 20, right: 20 },
  etoile: { width: 24, height: 24 },
  inputWrapper: { position: 'relative', width: '100%', maxWidth: 340 },
  eyeBtnInInput: { position: 'absolute', right: 10, top: 14, zIndex: 2 },
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
  loginButton: { backgroundColor: '#D4AF37', borderRadius: 25, paddingVertical: 16, paddingHorizontal: 40, marginTop: 16, marginBottom: 16, width: '100%', maxWidth: 340 },
  loginButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16, textAlign: 'center' },
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
    fontSize: 28,
    fontWeight: '700',
    color: '#174C3C',
    textAlign: 'left',
    alignSelf: 'flex-start',
    marginBottom: 8,
    width: '100%',
    maxWidth: 340,
  },
  registerSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#174C3C',
    textAlign: 'left',
    alignSelf: 'flex-start',
    marginBottom: 32,
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
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  registerPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  registerAppleButton: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#000000',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  registerAppleIcon: {
    width: 32,
    height: 32,
    marginRight: 10,
    tintColor: '#FFFFFF',
  },
  registerAppleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  registerGoogleButton: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 20,
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
    marginRight: 10,
  },
  registerGoogleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#174C3C',
  },
  registerLoginLink: {
    marginTop: 8,
  },
  registerLoginText: {
    fontSize: 16,
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
    fontSize: 16,
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
}); 