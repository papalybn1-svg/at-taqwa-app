import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as SystemUI from 'expo-system-ui';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, StatusBar, StyleSheet, Text, View } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from './src/hooks/useAuth';
import AdminTabNavigator from './src/navigation/AdminTabNavigator';
import TabNavigator from './src/navigation/TabNavigator';
import ChapterScreen from './src/screens/ChapterScreen';
import LoginScreen, { AuthContext } from './src/screens/LoginScreen';

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
        return prev + 2;
      });
    }, 40);

    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.splashLogoBg}>
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
  return (
    <View style={styles.splashFamilleBg}>
      {/* Bloc image + texte en haut */}
      <View style={styles.topContentBlock}>
        {/* Logo en haut */}
        <Image 
          source={require('./assets/Page acceuil dome mosquée.png')} 
          style={styles.splashFamilleLogo}
        />
        
        {/* Texte principal */}
      <View style={styles.splashFamilleTextContainer}>
          <Text style={styles.splashMainTitle}>Assalamu Alaikum,</Text>
          <Text style={styles.splashSubtitleGreen}>Bienvenue sur AT-Taqwa</Text>
          <Text style={styles.splashDescription}>
            Votre guide pour la réparation de la Prière
          </Text>
        </View>
      </View>
      
      {/* Image de la famille en bas */}
      <Image 
        source={require('./assets/femme et enfant (2).png')} 
        style={styles.splashFamilleImageXL}
      />
    </View>
  );
}

export default function App() {
  const [splashStep, setSplashStep] = useState(0);
  const { user, loading, setUser } = useAuth();

  useEffect(() => {
    if (splashStep === 0) {
      const timer = setTimeout(() => setSplashStep(1), 2000);
      return () => clearTimeout(timer);
    } else if (splashStep === 1) {
      const timer = setTimeout(() => setSplashStep(2), 2000);
      return () => clearTimeout(timer);
    }
  }, [splashStep]);

  // Masquer la barre de navigation système Android après les splashs
  useEffect(() => {
    if (splashStep === 2) {
      SystemUI.setBackgroundColorAsync('#F3F5F7');
    }
  }, [splashStep]);

  if (splashStep === 0) return <SplashLogo />;
  if (splashStep === 1) return <SplashFamille />;
  if (loading) return (
    <View style={{ flex: 1, backgroundColor: '#F3F5F7', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, color: '#174C3C' }}>Chargement...</Text>
    </View>
  );

  // Logs de débogage
  console.log('App.tsx - user:', user);
  console.log('App.tsx - user.role:', user?.role);
  console.log('App.tsx - !user:', !user);
  console.log('App.tsx - user.role === admin:', user?.role === 'admin');

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F5F7' }} edges={["top","bottom"]}>
          <StatusBar barStyle="light-content" backgroundColor="#174C3C" />
          <NavigationContainer>
            <Stack.Navigator 
              screenOptions={{ 
                headerShown: false,
                cardStyle: { backgroundColor: '#F3F5F7' }
              }}
            >
              {!user ? (
                <Stack.Screen name="Login" component={LoginScreen} />
              ) : user.role === 'admin' ? (
                <Stack.Screen name="Admin" component={AdminTabNavigator} options={{ headerShown: false }} />
              ) : (
                <Stack.Screen name="Main" component={TabNavigator} />
              )}
              <Stack.Screen name="Chapter" component={ChapterScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </SafeAreaView>
      </GestureHandlerRootView>
    </AuthContext.Provider>
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
    width: 240,
    height: 240,
    resizeMode: 'contain',
    marginBottom: 0,
    alignSelf: 'center',
  },
  splashFamilleTextContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: -80,
  },
  splashMainTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#174C3C',
    marginBottom: 12,
    textAlign: 'center',
  },
  splashSubtitleGreen: {
    fontSize: 24,
    fontWeight: '600',
    color: '#174C3C',
    marginBottom: 16,
    textAlign: 'center',
  },
  splashDescription: {
    fontSize: 20,
    color: '#174C3C',
    textAlign: 'center',
    lineHeight: 28,
  },
  splashFamilleImageXL: {
    width: '110%',
    height: '60%',
    resizeMode: 'cover',
    position: 'absolute',
    bottom: 0,
    left: '-5%',
  },
});

