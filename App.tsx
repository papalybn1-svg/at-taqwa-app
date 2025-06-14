import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import TabNavigator from './src/navigation/TabNavigator';
import ChapterScreen from './src/screens/ChapterScreen';

type RootStackParamList = {
  Main: undefined;
  Chapter: {
    chapter: {
      title: string;
      desc: string;
      image: string;
    };
  };
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

  useEffect(() => {
    if (splashStep === 0) {
      const timer = setTimeout(() => setSplashStep(1), 2000);
      return () => clearTimeout(timer);
    } else if (splashStep === 1) {
      const timer = setTimeout(() => setSplashStep(2), 2000);
      return () => clearTimeout(timer);
    }
  }, [splashStep]);

  if (splashStep === 0) return <SplashLogo />;
  if (splashStep === 1) return <SplashFamille />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="Chapter" component={ChapterScreen} />
      </Stack.Navigator>
    </NavigationContainer>
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

