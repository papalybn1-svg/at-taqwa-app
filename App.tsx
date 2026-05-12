import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as NavigationBar from 'expo-navigation-bar';
import * as SystemUI from 'expo-system-ui';
import React, { useEffect, useState } from 'react';
import { Image, Platform, StatusBar, StyleSheet, Text, View } from 'react-native';

import RootErrorBoundary from './src/components/RootErrorBoundary';
import { AuthProvider, useAuthContext } from './src/contexts/AuthContext';
import { EntitlementsProvider } from './src/contexts/EntitlementsContext';
import PayDunyaDeepLinkHandler from './src/navigation/handlers/PayDunyaDeepLinkHandler';
import TabNavigator from './src/navigation/TabNavigator';
import LoginScreen from './src/screens/LoginScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';

const Stack = createStackNavigator();

function SplashLogo({ statusText }: { statusText?: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
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
    <View style={styles.splashLogoBg}>
      <StatusBar barStyle="light-content" backgroundColor="#174C3C" />
      <View style={styles.logoContainer}>
        <Image source={require('./assets/logo taqwa en blanc.png')} style={styles.logoImage} />
      </View>
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
      </View>
      {statusText ? <Text style={styles.statusText}>{statusText}</Text> : null}
    </View>
  );
}

function SplashFamille({ statusText }: { statusText?: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
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
      <View style={styles.topContentBlock}>
        <Image source={require('./assets/Page_acceuil_dome_mosquee.png')} style={styles.splashFamilleLogo} />
        <View style={styles.splashFamilleTextContainer}>
          <Text style={styles.splashMainTitle}>Assalamu Alaikum,</Text>
          <Text style={styles.splashSubtitleGreen}>Bienvenue sur AT-Taqwa</Text>
          <Text style={styles.splashDescription}>Votre guide pour la réparation de la Prière</Text>
        </View>
      </View>
      <Image source={require('./assets/femme_et_enfant_2.png')} style={styles.splashFamilleImageXL} />
      <View style={[styles.progressContainer, { bottom: 40 }]}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>
      </View>
      {statusText ? <Text style={[styles.statusText, styles.statusTextDark]}>{statusText}</Text> : null}
    </View>
  );
}

// Composant wrapper pour TabNavigator avec EntitlementsProvider
function MainTabsWithEntitlements() {
  return (
    <EntitlementsProvider>
      <TabNavigator />
    </EntitlementsProvider>
  );
}

function RootNavigator() {
  const { user } = useAuthContext();
  const navigationRef = React.useRef<NavigationContainerRef<any>>(null);

  return (
    <NavigationContainer 
      ref={navigationRef} 
      onReady={() => {
        console.log('✅ NavigationContainer prêt');
      }}
      theme={{
        dark: false,
        colors: {
          primary: '#19514A',
          background: '#F3F5F7', // ✅ Couleur de fond pour éviter l'écran gris
          card: '#FFFFFF',
          text: '#1D1818',
          border: '#E5E5E5',
          notification: '#19514A',
        },
      }}
    >
      <PayDunyaDeepLinkHandler navigationRef={navigationRef} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* ═══════════════════════════════════════════════════════════════════════════
            🔒 VÉRIFICATION D'EMAIL DÉSACTIVÉE (v1.0.4) - Code commenté pour réutilisation future
            ═══════════════════════════════════════════════════════════════════════════
            
            AVANT (avec vérification d'email) :
            {user && user.emailVerified ? (
              <Stack.Screen name="MainTabs" component={MainTabsWithEntitlements} />
            ) : user && !user.emailVerified ? (
              <>
                <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
                <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
              </>
            ) : (
              <>
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
              </>
            )}
            
            ═══════════════════════════════════════════════════════════════════════════
            ✅ NOUVEAU COMPORTEMENT : Accès direct pour tous les utilisateurs connectés
            ═══════════════════════════════════════════════════════════════════════════ */}
        {user ? (
          <Stack.Screen name="MainTabs" component={MainTabsWithEntitlements} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            {/* VerifyEmail reste disponible mais n'est plus utilisé automatiquement */}
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <RootErrorBoundary>
      <AuthProvider>
        <EntitlementsProvider>
          <AppShell />
        </EntitlementsProvider>
      </AuthProvider>
    </RootErrorBoundary>
  );
}

function AppShell() {
  const { loading } = useAuthContext();
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [splashStep, setSplashStep] = useState(0);
  const [quickSplashDone, setQuickSplashDone] = useState(false);
  const [appShown, setAppShown] = useState(false); // ✅ État pour verrouiller l'affichage de l'app

  // Masquer la barre de navigation système Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setVisibilityAsync('hidden');
      NavigationBar.setBehaviorAsync('overlay-swipe');
    }
  }, []);

  useEffect(() => {
    const loadFlag = async () => {
      try {
        const saved = await AsyncStorage.getItem('hasSeenFullSplash');
        setIsFirstLaunch(saved === 'true' ? false : true);
      } catch {
        setIsFirstLaunch(true);
      }
    };
    loadFlag();
  }, []);

  useEffect(() => {
    if (isFirstLaunch) {
      if (splashStep === 0) {
        const timer = setTimeout(() => setSplashStep(1), 3000);
        return () => clearTimeout(timer);
      }
      if (splashStep === 1) {
        const timer = setTimeout(() => setSplashStep(2), 3000);
        return () => clearTimeout(timer);
      }
    }
    return undefined;
  }, [isFirstLaunch, splashStep]);

  useEffect(() => {
    if (isFirstLaunch === false) {
      setQuickSplashDone(false);
      const timer = setTimeout(() => setQuickSplashDone(true), 1500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isFirstLaunch]);

  useEffect(() => {
    if (isFirstLaunch && splashStep >= 2 && !loading) {
      AsyncStorage.setItem('hasSeenFullSplash', 'true').catch(() => {});
    }
  }, [isFirstLaunch, splashStep, loading]);

  useEffect(() => {
    if (
      (isFirstLaunch && splashStep >= 2 && !loading) ||
      (isFirstLaunch === false && quickSplashDone && !loading)
    ) {
      SystemUI.setBackgroundColorAsync('#F3F5F7').catch(() => {});
    }
  }, [isFirstLaunch, splashStep, quickSplashDone, loading]);

  // ✅ Calculer si l'app doit être affichée (une seule fois)
  const shouldShowApp = isFirstLaunch
    ? splashStep >= 2 && !loading
    : quickSplashDone && !loading;

  // ✅ Marquer l'app comme affichée une fois qu'elle doit être montrée
  useEffect(() => {
    if (shouldShowApp && !appShown) {
      setAppShown(true);
    }
  }, [shouldShowApp, appShown]);

  // ✅ Si l'app a déjà été affichée, ne plus revenir au splash screen
  // ✅ Cela évite la boucle si loading change après l'affichage initial
  if (appShown) {
    console.log('[App] rendu racine');
    return <RootNavigator />;
  }

  // ✅ Pendant le chargement initial, afficher immédiatement le splash screen
  // ✅ Cela évite l'écran gris pendant le chargement du flag AsyncStorage
  if (isFirstLaunch === null) {
    return <SplashLogo statusText="Initialisation…" />;
  }

  // ✅ Afficher le splash screen seulement si l'app n'a pas encore été montrée
  if (!shouldShowApp) {
    if (isFirstLaunch) {
      if (splashStep === 0) {
        return <SplashLogo />;
      }
      return <SplashFamille statusText={loading ? 'Initialisation…' : undefined} />;
    }
    return <SplashLogo statusText="Initialisation…" />;
  }

  console.log('[App] rendu racine');
  return <RootNavigator />;
}

const styles = StyleSheet.create({
  splashLogoBg: {
    flex: 1,
    backgroundColor: '#1B4D3E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 320,
    height: 320,
    resizeMode: 'contain',
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
  statusText: {
    marginTop: 16,
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  statusTextDark: {
    color: '#174C3C',
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
