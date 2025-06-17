import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as SystemUI from 'expo-system-ui';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, StatusBar, StyleSheet, Text, View } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import TabNavigator from './src/navigation/TabNavigator';
import BooksScreen from './src/screens/BooksScreen';
import ChapterScreen from './src/screens/ChapterScreen';
import { app as firebaseApp } from './src/screens/firebaseConfig';
import LoginScreen, { AuthContext } from './src/screens/LoginScreen';
import QuizScreen from './src/screens/QuizScreen';
import TasbihScreen from './src/screens/TasbihScreen';

type RootStackParamList = {
  Main: undefined;
  Chapter: {
    chapter: {
      title: string;
      desc: string;
      image: string;
    };
  };
  Books: undefined;
  Quiz: undefined;
  Tasbih: undefined;
  Login: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const { height } = Dimensions.get('window');

function SplashLogo() {
  return (
    <View style={styles.splashLogoBg}>
      <Image source={require('./assets/logo.png')} style={styles.splashLogoXL} />
      <Image source={require('./assets/etoile.png')} style={styles.splashEtoileXL} />
    </View>
  );
}

function SplashFamille() {
  return (
    <View style={[styles.container, { backgroundColor: '#FFF', justifyContent: 'flex-start' }]}> 
      <Image source={require('./assets/logo.png')} style={styles.splashFamilleLogo} />
      <View style={styles.splashFamilleTextContainer}>
        <Text style={styles.splashTitle}>Assalamu Alaïkum,</Text>
        <Text style={styles.splashSubtitle}>Bienvenue sur AT-Taqwa</Text>
        <Text style={styles.splashDescription}>Votre guide pour la réparation de la Prière</Text>
      </View>
      <Image source={require('./assets/couple.png')} style={styles.splashFamilleImageXL} />
    </View>
  );
}

export default function App() {
  const [splashStep, setSplashStep] = useState(0);
  const [user, setUser] = useState<User | null>(null);
  const auth = getAuth(firebaseApp);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

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
              ) : (
                <Stack.Screen name="Main" component={TabNavigator} />
              )}
              <Stack.Screen name="Chapter" component={ChapterScreen} />
              <Stack.Screen name="Books" component={BooksScreen} />
              <Stack.Screen name="Quiz" component={QuizScreen} />
              <Stack.Screen name="Tasbih" component={TasbihScreen} />
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
    backgroundColor: '#174C3C',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  splashLogoXL: {
    width: 260,
    height: 260,
    resizeMode: 'contain',
    zIndex: 2,
  },
  splashEtoileXL: {
    position: 'absolute',
    left: -40,
    bottom: -40,
    width: 200,
    height: 200,
    resizeMode: 'contain',
    zIndex: 1,
  },
  splashFamilleLogo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginTop: 60,
    marginBottom: 10,
    alignSelf: 'center',
  },
  splashFamilleTextContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  splashTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#174C3C',
    marginBottom: 10,
    textAlign: 'center',
  },
  splashSubtitle: {
    fontSize: 20,
    color: '#174C3C',
    marginBottom: 10,
    textAlign: 'center',
  },
  splashDescription: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  splashFamilleImageXL: {
    width: '100%',
    height: 420,
    resizeMode: 'contain',
    marginTop: 10,
    marginBottom: 0,
    alignSelf: 'center',
  },
});

