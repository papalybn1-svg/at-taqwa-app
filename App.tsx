import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as Linking from 'expo-linking';
import { AppState } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, StatusBar, StyleSheet, Text, View } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from './src/hooks/useAuth';
import { usePaymentService } from './src/lib/paymentService';
import { useEntitlements, EntitlementsProvider } from './src/contexts/EntitlementsContext';
import AdminTabNavigator from './src/navigation/AdminTabNavigator';
import TabNavigator from './src/navigation/TabNavigator';
import ChapterScreen from './src/screens/ChapterScreen';
import LoginScreen, { AuthContext } from './src/screens/LoginScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';
import { auth, db } from './src/screens/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { applyActionCode } from 'firebase/auth';

type RootStackParamList = {
  Main: undefined;
  Chapter: {
    chapter: {
      title: string;
      desc: string;
      image: string;
    };
  };
  Login: undefined;
  VerifyEmail: undefined;
  ResetPassword: { oobCode?: string } | undefined;
  Admin: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const { height } = Dimensions.get('window');

function SplashLogo() {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 1.5; // Ralenti de 2 à 1.5 pour une progression plus douce
      });
    }, 50); // Ralenti de 40ms à 50ms pour une progression plus lente

    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.splashLogoBg}>
      <StatusBar barStyle="light-content" backgroundColor="#174C3C" />
      {/* Logo principal centré */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('./assets/logo taqwa en blanc.png')} 
          style={styles.logoImage}
        />
      </View>



      {/* Barre de progression en bas */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
      </View>
    </View>
  );
}

function SplashFamille() {
  const [progress, setProgress] = React.useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 1.5;
      });
    }, 50);
    return () => clearInterval(timer);
  }, []);
  return (
    <View style={styles.splashFamilleBg}>
      <StatusBar barStyle="light-content" backgroundColor="#174C3C" />
      {/* Bloc image + texte en haut */}
      <View style={styles.topContentBlock}>
        {/* Logo en haut */}
        <Image 
          source={require('./assets/Page_acceuil_dome_mosquee.png')} 
          style={styles.splashFamilleLogo}
        />
        {/* Texte principal */}
        <View style={styles.splashFamilleTextContainer}>
          <Text style={styles.splashMainTitle}>Assalamu Alaikum,</Text>
          <Text style={styles.splashSubtitleGreen}>Bienvenue sur AT-Taqwa</Text>
          <Text style={styles.splashDescription}>Votre guide pour la réparation de la Prière</Text>
        </View>
      </View>
      {/* Image de la famille en bas */}
      <Image 
        source={require('./assets/femme_et_enfant_2.png')} 
        style={styles.splashFamilleImageXL}
      />
      {/* Barre de progression en bas (même logique que SplashLogo) */}
      <View style={[styles.progressContainer, { bottom: 40 }]}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
      </View>
    </View>
  );
}

// Composant interne pour gérer les deep links PayDunya (doit être dans EntitlementsProvider)
function PayDunyaDeepLinkHandler() {
  const { checkEntitlements } = usePaymentService();
  const { refreshEntitlements } = useEntitlements();
  const { user, setUser } = React.useContext(AuthContext);

  // Stabiliser les références pour ne pas recréer l'écouteur en boucle
  const refreshRef = React.useRef(refreshEntitlements);
  const checkRef = React.useRef(checkEntitlements);
  React.useEffect(() => { refreshRef.current = refreshEntitlements; }, [refreshEntitlements]);
  React.useEffect(() => { checkRef.current = checkEntitlements; }, [checkEntitlements]);

  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      console.log('🔗 Deep link reçu:', url);
      
      try {
        const parsed = Linking.parse(url);
        console.log('🔍 Deep link parsé:', parsed);
        
        if (parsed?.hostname === 'paydunya') {
          switch (parsed.path) {
            case 'success':
              console.log('✅ Paiement PayDunya réussi');
              // Récupérer le token depuis les paramètres de requête
              const token = parsed.queryParams?.token;
              console.log('🔑 Token reçu:', token);
              
              // Re-vérifier les entitlements avec un délai pour laisser le temps au backend
              try {
                // Attendre 2 secondes pour laisser le temps au backend de traiter le paiement
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Rafraîchir les entitlements globalement
                await refreshRef.current();
                
                // Vérifier à nouveau pour l'alert
                const entitlements = await checkRef.current();
                console.log('🎯 Entitlements après paiement:', entitlements);
                
                if (entitlements.part2 || entitlements.part3) {
                  Alert.alert(
                    'Paiement réussi !',
                    'Votre paiement a été confirmé. Vous avez maintenant accès aux parties premium.',
                    [{ text: 'Parfait !' }]
                  );
                } else if (token) {
                  // Si pas d'entitlements mais token présent, le paiement est peut-être encore en cours
                  Alert.alert(
                    'Paiement en cours de traitement',
                    'Votre paiement a été reçu. L\'accès sera débloqué dans quelques instants.',
                    [{ text: 'OK' }]
                  );
                } else {
                  // Si pas encore d'entitlements, le paiement est peut-être encore en cours
                  Alert.alert(
                    'Paiement en cours de traitement',
                    'Votre paiement a été reçu et est en cours de traitement. L\'accès sera débloqué dans quelques instants.',
                    [{ text: 'Compris' }]
                  );
                }
              } catch (error) {
                console.error('❌ Erreur vérification entitlements:', error);
                Alert.alert(
                  'Paiement en cours de traitement',
                  'Votre paiement a été reçu. L\'accès sera débloqué dans quelques instants.',
                  [{ text: 'OK' }]
                );
              }
              break;
              
            case 'cancel':
              console.log('❌ Paiement PayDunya annulé');
              Alert.alert(
                'Paiement annulé',
                'Vous avez annulé le paiement. Vous pouvez réessayer à tout moment.',
                [{ text: 'Compris' }]
              );
              break;
              
            case 'failed':
              console.log('💥 Paiement PayDunya échoué');
              Alert.alert(
                'Paiement échoué',
                'Le paiement n\'a pas pu être traité. Veuillez réessayer.',
                [{ text: 'OK' }]
              );
              break;
              
            default:
              console.log('❓ Deep link PayDunya inconnu:', parsed.path);
          }
        } else if (parsed?.hostname === 'verify-email') {
          // Gestion retour vérification email: attaqwa://verify-email/success
          if (parsed.path === 'success') {
            try {
              const oob = (parsed.queryParams?.oobCode as string) || '';
              if (oob) {
                console.log('📧 applyActionCode avec oobCode reçu via deep link');
                await applyActionCode(auth, oob);
              }
              await auth.currentUser?.reload();
              const isVerified = !!auth.currentUser?.emailVerified;
              console.log('📧 Retour verify-email: emailVerified=', isVerified);
              if (isVerified && auth.currentUser) {
                // Créer le doc utilisateur si absent, puis positionner le contexte
                try {
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
                  }
                  const role = (snap.data() as any)?.role || 'user';
                  setUser?.({ ...(auth.currentUser as any), role });
                } catch {
                  setUser?.({ ...(auth.currentUser as any), role: 'user' });
                }
                Alert.alert('E‑mail vérifié', 'Votre adresse e‑mail est confirmée.', [{ text: 'OK' }]);
              } else {
                Alert.alert('Vérification en cours', 'Nous ne détectons pas encore la vérification. Réessayez dans quelques instants.');
              }
            } catch (e) {
              console.error('Erreur verify-email via deep link:', e);
            }
          }
        }
      } catch (error) {
        console.error('❌ Erreur traitement deep link:', error);
      }
    };

    // Écouter les deep links entrants
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Vérifier s'il y a un deep link au démarrage
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('🚀 Deep link au démarrage:', url);
        handleDeepLink(url);
      }
    });

    // Reload emailVerified quand l’app revient au premier plan
    const appStateSub = AppState.addEventListener('change', async (state) => {
      if (state === 'active') {
        try {
          await auth.currentUser?.reload();
          if (auth.currentUser?.emailVerified && auth.currentUser) {
            try {
              const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
              const role = (snap.data() as any)?.role || 'user';
              setUser?.({ ...(auth.currentUser as any), role });
            } catch {
              setUser?.({ ...(auth.currentUser as any), role: 'user' });
            }
          }
        } catch {}
      }
    });

    return () => {
      subscription?.remove();
      appStateSub?.remove();
    };
  }, []); // ne pas recréer l'écouteur à chaque re-render

  return null;
}

export default function App() {
  const [splashStep, setSplashStep] = useState(0);
  const { user, loading, setUser } = useAuth();
  
  useEffect(() => {
    // Séquence splash par défaut à chaque ouverture
    setSplashStep(0);
  }, []);

  useEffect(() => {
    if (splashStep === 0) {
      const timer = setTimeout(() => setSplashStep(1), 3500);
      return () => clearTimeout(timer);
    }
    if (splashStep === 1) {
      const timer = setTimeout(() => setSplashStep(2), 4000);
      return () => clearTimeout(timer);
    }
  }, [splashStep]);

  // iOS/Android: masquer la barre système après splash

  // Masquer la barre de navigation système Android après les splashs
  useEffect(() => {
    if (splashStep === 2) {
      SystemUI.setBackgroundColorAsync('#F3F5F7');
    }
  }, [splashStep]);

  if (splashStep === 0) {
    console.log('📱 Affichage SplashLogo (step 0)');
    return <SplashLogo />;
  }
  if (splashStep === 1) {
    console.log('📱 Affichage SplashFamille (step 1)');
    return <SplashFamille />;
  }
  if (loading) {
    console.log('⏳ App en état de chargement - user:', user, 'loading:', loading);
    return (
    <View style={{ flex: 1, backgroundColor: '#F3F5F7', justifyContent: 'center', alignItems: 'center' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F5F7" />
      <Text style={{ fontSize: 18, color: '#174C3C' }}>Chargement...</Text>
        <Text style={{ fontSize: 14, color: '#666', marginTop: 10 }}>Initialisation de l'authentification</Text>
    </View>
  );
  }

  // Logs de débogage détaillés
  console.log('🔍 App.tsx État final:');
  console.log('  - splashStep:', splashStep);
  console.log('  - loading:', loading);
  console.log('  - user:', user);
  console.log('  - user.role:', user?.role);
  console.log('  - !user:', !user);
  console.log('  - user.role === admin:', user?.role === 'admin');
  console.log('🚀 Navigation vers:', !user ? 'LoginScreen' : user.role === 'admin' ? 'AdminTabNavigator' : 'TabNavigator');

  return (
    <SafeAreaProvider>
    <AuthContext.Provider value={{ user, setUser }}>
      <EntitlementsProvider>
        <PayDunyaDeepLinkHandler />
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F5F7' }} edges={["top","bottom"]}>
            <StatusBar barStyle="dark-content" backgroundColor="#F3F5F7" />
            <NavigationContainer>
              <Stack.Navigator 
              screenOptions={{ 
                headerShown: false,
                  cardStyle: { backgroundColor: '#F3F5F7' }
              }}
            >
              {!user ? (
                <Stack.Screen name="Login" component={LoginScreen} />
              ) : !user.emailVerified ? (
                <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
              ) : user.role === 'admin' ? (
                <Stack.Screen name="Admin" component={AdminTabNavigator} options={{ headerShown: false }} />
              ) : (
                <Stack.Screen name="Main" component={TabNavigator} />
              )}
              <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
              <Stack.Screen name="Chapter" component={ChapterScreen} options={{ gestureEnabled: false }} />
            </Stack.Navigator>
            </NavigationContainer>
          </SafeAreaView>
        </GestureHandlerRootView>
      </EntitlementsProvider>
    </AuthContext.Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  splashLogoBg: {
    flex: 1,
    backgroundColor: '#1B4D3E',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 700,
    height: 700,
    resizeMode: 'contain',
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 3,
    marginTop: 10,
  },

  progressContainer: {
    position: 'absolute',
    bottom: 50,
    left: 40,
    right: 40,
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 2,
  },
  splashFamilleBg: {
    flex: 1,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  topContentBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    width: '100%',
  },
  splashFamilleLogo: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 0,
    marginTop: 40,
    alignSelf: 'center',
  },
  splashFamilleTextContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: -40,
    marginBottom: 8,
  },
  splashMainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#174C3C',
    marginBottom: 8,
    textAlign: 'center',
  },
  splashSubtitleGreen: {
    fontSize: 20,
    fontWeight: '600',
    color: '#174C3C',
    marginBottom: 10,
    textAlign: 'center',
  },
  splashDescription: {
    fontSize: 17,
    color: '#174C3C',
    textAlign: 'center',
    marginBottom: 0,
    lineHeight: 22,
  },
  splashFamilleImageXL: {
    width: '110%',
    height: '55%',
    resizeMode: 'cover',
    position: 'absolute',
    bottom: 0,
    left: '-10%',
    marginBottom: 0,
    marginTop: 0,
    alignSelf: 'center',
  },
});

