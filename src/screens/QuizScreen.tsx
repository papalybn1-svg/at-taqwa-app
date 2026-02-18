// src/screens/QuizScreen.tsx

import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo } from 'react';
import { Dimensions, Image, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive, getResponsiveStyle } from '../hooks/useResponsive';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function QuizScreen() {
  const navigation = useNavigation();
  const responsive = useResponsive();
  const responsiveStyle = getResponsiveStyle(responsive);
  const insets = useSafeAreaInsets();

  // Styles dynamiques basés sur le responsive
  const dynamicStyles = useMemo(() => {
    const { breakpoint, width, height } = responsive;
    
    // Calcul de la taille du cercle selon le breakpoint - PLUS GRAND
    let circleSize = 0;
    
    if (breakpoint === 'xxl' && width >= 1024) {
      circleSize = Math.min(420, width * 0.45);
    } else if (breakpoint === 'xs') {
      circleSize = Math.min(260, width * 0.65); // Plus grand pour petits écrans
    } else if (breakpoint === 'sm') {
      circleSize = Math.min(320, width * 0.68);
    } else if (breakpoint === 'md') {
      circleSize = Math.min(360, width * 0.62);
    } else {
      // lg et xl
      circleSize = Math.min(400, width * 0.55);
    }

    // L'image doit être environ 25-30% plus grande que le cercle pour qu'elle sorte vraiment
    const imageSize = circleSize * 1.28; // 28% plus grande que le cercle pour bien sortir
    const imageHeight = imageSize * 1.2; // Ratio hauteur/largeur pour l'image

    return {
      content: {
        paddingTop: breakpoint === 'xs' ? 30 : breakpoint === 'sm' ? 35 : breakpoint === 'md' ? 40 : 50,
      },
      title: {
        fontSize: breakpoint === 'xxl' ? 48 : breakpoint === 'xs' ? 28 : breakpoint === 'sm' ? 32 : breakpoint === 'md' ? 36 : 42,
        marginBottom: breakpoint === 'xs' ? 8 : breakpoint === 'sm' ? 10 : 12, // Réduit pour rapprocher du cercle
      },
      arabicText: {
        fontSize: breakpoint === 'xxl' ? 28 : breakpoint === 'xs' ? 16 : breakpoint === 'sm' ? 18 : breakpoint === 'md' ? 20 : 24,
        marginBottom: breakpoint === 'xs' ? 12 : breakpoint === 'sm' ? 16 : breakpoint === 'md' ? 20 : 24, // Réduit pour rapprocher du cercle
        paddingHorizontal: responsiveStyle.spacing.base,
      },
      imageContainer: {
        marginTop: breakpoint === 'xs' ? -10 : breakpoint === 'sm' ? -15 : breakpoint === 'md' ? -20 : -25, // Réduit pour rapprocher
      },
      decorativeCircle: {
        width: circleSize,
        height: circleSize,
        borderRadius: circleSize / 2,
      },
      girlImage: {
        width: imageSize,
        height: imageHeight,
        maxWidth: imageSize,
        maxHeight: imageHeight,
      },
    };
  }, [responsive, responsiveStyle]);

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
      <View style={[styles.content, dynamicStyles.content]}>
        {/* Titre Bismillah */}
        <Text style={[styles.title, dynamicStyles.title]}>Bismillah</Text>

        {/* Texte arabe au-dessus de l'image */}
        <Text style={[styles.arabicText, dynamicStyles.arabicText]}>بسم الله الرحمن الرحيم</Text>

        {/* Image de la fille avec cercle décoratif */}
        <View style={[styles.imageContainer, dynamicStyles.imageContainer]}>
          {/* Cercle décoratif derrière l'image */}
          <View style={[styles.decorativeCircle, dynamicStyles.decorativeCircle]} />

          <Image 
            source={require('../../assets/16.png')} 
            style={[styles.girlImage, dynamicStyles.girlImage]}
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
    paddingHorizontal: 20,
  },
  title: {
    fontWeight: 'bold', 
    color: 'white',
    textAlign: 'center', 
  },
  arabicText: {
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center', 
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  imageContainer: {
    alignItems: 'center', 
    justifyContent: 'center',
    position: 'relative',
    flex: 1, // Prend tout l'espace disponible pour centrer
  },
  decorativeCircle: {
    position: 'absolute',
    backgroundColor: '#FFFFFF', // Blanc opaque
    zIndex: 0,
  },
  girlImage: {
    zIndex: 1,
  },
});
