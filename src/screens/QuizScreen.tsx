// src/screens/QuizScreen.tsx

import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Fonction pour calculer les dimensions responsive
const getResponsiveSize = (size: number, isWidth: boolean = true) => {
  const baseWidth = 375; // iPhone standard
  const baseHeight = 812; // iPhone standard
  const scale = isWidth ? screenWidth / baseWidth : screenHeight / baseHeight;
  return Math.round(size * scale);
};

// Fonction pour déterminer si c'est un petit écran
const isSmallScreen = screenHeight < 700;
const isLargeScreen = screenHeight > 900;

export default function QuizScreen() {
  const navigation = useNavigation();

  // Redirection automatique vers la page "Commencer" après 1 seconde
  useEffect(() => {
    let cancelled = false;
    const go = async () => {
      if (!cancelled) navigation.navigate('QuizStart' as never);
    };
    const timer = setTimeout(go, 1000);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Contenu principal */}
      <View style={styles.content}>
        {/* Titre Bismillah */}
        <Text style={styles.title}>Bismillah</Text>

        {/* Texte arabe au-dessus de l'image */}
        <Text style={styles.arabicText}>بسم الله الرحمن الرحيم</Text>

        {/* Image de la fille avec cercle décoratif */}
        <View style={styles.imageContainer}>
          {/* Cercle décoratif derrière l'image */}
          <View style={styles.decorativeCircle} />

          <Image 
            source={require('../../assets/16.png')} 
            style={styles.girlImage}
            resizeMode="contain"
          />
        </View>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#174C3C', // Vert principal de l'application
  },
  content: {
    flex: 1,
    alignItems: 'center', 
    justifyContent: 'flex-start',
    paddingHorizontal: getResponsiveSize(20),
    paddingTop: getResponsiveSize(isSmallScreen ? 40 : 60, false),
  },

  title: {
    fontSize: getResponsiveSize(isSmallScreen ? 28 : isLargeScreen ? 42 : 36),
    fontWeight: 'bold', 
    color: 'white',
    marginBottom: getResponsiveSize(isSmallScreen ? 15 : 20, false),
    textAlign: 'center', 
  },
  arabicText: {
    fontSize: getResponsiveSize(isSmallScreen ? 18 : isLargeScreen ? 26 : 22),
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center', 
    marginBottom: getResponsiveSize(isSmallScreen ? 30 : 40, false),
    fontFamily: 'System',
    letterSpacing: getResponsiveSize(1),
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: getResponsiveSize(2), height: getResponsiveSize(2) },
    textShadowRadius: getResponsiveSize(4),
    paddingHorizontal: getResponsiveSize(10),
  },
  imageContainer: {
    alignItems: 'center', 
    justifyContent: 'center',
    position: 'relative',
    marginTop: getResponsiveSize(isSmallScreen ? -30 : -50, false),
    flex: 1, // Prend tout l'espace disponible pour centrer
  },
  decorativeCircle: {
    position: 'absolute',
    width: screenWidth * (isSmallScreen ? 0.7 : isLargeScreen ? 0.85 : 0.8),
    height: screenWidth * (isSmallScreen ? 0.7 : isLargeScreen ? 0.85 : 0.8),
    borderRadius: screenWidth * (isSmallScreen ? 0.35 : isLargeScreen ? 0.425 : 0.4),
    backgroundColor: '#FFFFFF', // Blanc opaque
    zIndex: 0,
  },
  girlImage: {
    width: screenWidth * (isSmallScreen ? 1.6 : isLargeScreen ? 2.2 : 2.0),
    height: screenHeight * (isSmallScreen ? 1.0 : isLargeScreen ? 1.4 : 1.3),
    maxWidth: getResponsiveSize(isSmallScreen ? 700 : isLargeScreen ? 1000 : 900),
    maxHeight: getResponsiveSize(isSmallScreen ? 800 : isLargeScreen ? 1400 : 1200, false),
    zIndex: 1,
  },
});
