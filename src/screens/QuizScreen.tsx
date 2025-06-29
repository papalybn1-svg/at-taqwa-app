// src/screens/QuizScreen.tsx

import { useNavigation, useFocusEffect, CommonActions, StackActions } from '@react-navigation/native';
import React, { useEffect, useCallback } from 'react';
import { Dimensions, Image, StyleSheet, Text, View, BackHandler, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function QuizScreen() {
  const navigation = useNavigation();

  const goToHome = () => {
    // Utilise popToTop pour revenir à la racine de la pile
    navigation.dispatch(StackActions.popToTop());
  };

  // Gestionnaire de swipe personnalisé pour iOS
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Détecter un swipe horizontal de gauche à droite
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && gestureState.dx > 50;
    },
    onPanResponderMove: (evt, gestureState) => {
      // Optionnel: ajouter un feedback visuel pendant le swipe
    },
    onPanResponderRelease: (evt, gestureState) => {
      // Si c'est un swipe de gauche à droite suffisant, aller à l'accueil
      if (gestureState.dx > 100 && Math.abs(gestureState.dy) < 100) {
        console.log('Swipe détecté - retour à l\'accueil');
        goToHome();
      }
    },
  });

  // Gestionnaire pour le bouton retour Android uniquement
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        goToHome();
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [])
  );

  // Redirection automatique après 1 seconde
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('QuizStart' as never);
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} {...panResponder.panHandlers}>
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
    paddingHorizontal: 20,
    paddingTop: 60, // Augmenté de 20 à 60 pour plus de marge en haut
  },

  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  arabicText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: 'System',
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    paddingHorizontal: 20,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginTop: 0, // Centré au milieu de la page
    flex: 1, // Prend tout l'espace disponible pour centrer
  },
  decorativeCircle: {
    position: 'absolute',
    width: screenWidth * 0.8, // Augmenté de 0.6 à 0.8
    height: screenWidth * 0.8, // Augmenté de 0.6 à 0.8
    borderRadius: screenWidth * 0.4, // Augmenté de 0.3 à 0.4
    backgroundColor: '#FFFFFF', // Blanc opaque
    zIndex: 0,
  },
  girlImage: {
    width: screenWidth * 2.6, // Augmenté de 2.2 à 2.6
    height: screenHeight * 1.9, // Augmenté de 1.6 à 1.9
    maxWidth: 1300, // Augmenté de 1100 à 1300
    maxHeight: 1800, // Augmenté de 1500 à 1800
    zIndex: 1,
  },
});
