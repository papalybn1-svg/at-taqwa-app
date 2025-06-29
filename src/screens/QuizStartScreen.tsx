import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, CommonActions, StackActions } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View, BackHandler, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function QuizStartScreen() {
  const navigation = useNavigation();

  const startQuiz = () => {
    console.log('Navigation vers OriginalQuiz');
    navigation.navigate('OriginalQuiz' as never);
  };

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
        return true; // Empêche le comportement par défaut
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [])
  );

  return (
    <SafeAreaView style={styles.container} {...panResponder.panHandlers}>
      {/* Bouton de retour */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={goToHome}
      >
        <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
      </TouchableOpacity>

      {/* Contenu principal - Image de l'homme */}
      <View style={styles.mainContent}>
        <View style={styles.imageContainer}>
          <Image 
            source={require('../../assets/6.png')} 
            style={styles.manImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Cartes empilées en bas */}
      <View style={styles.cardStack}>
        {/* Carte arrière (la plus profonde) */}
        <View style={styles.backCard} />
        
        {/* Carte du milieu */}
        <View style={styles.middleCard} />
        
        {/* Carte blanche principale */}
        <View style={styles.whiteCard}>
          <Text style={styles.cardTitle}>Commençons le{'\n'}Quizz</Text>
          
          <TouchableOpacity 
            style={styles.playButton} 
            onPress={startQuiz}
            activeOpacity={0.7}
          >
            <Text style={styles.playButtonText}>Jouer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#174C3C', // Vert principal de l'application
    paddingBottom: 30, // Ajout d'une marge en bas de la page
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    padding: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
    pointerEvents: 'none', // Empêche tout le conteneur de bloquer les interactions
    zIndex: 200, // Augmenté pour mettre tout le contenu au premier plan
  },
  imageContainer: {
    pointerEvents: 'none',
    zIndex: 300, // Encore plus élevé pour le conteneur de l'image
  },
  manImage: {
    width: screenWidth * 1.4, // Augmenté de 1.2 à 1.4
    height: screenHeight * 0.9, // Augmenté de 0.8 à 0.9
    maxWidth: 800, // Augmenté de 650 à 800
    maxHeight: 1000, // Augmenté de 800 à 1000
    marginTop: -150, // Augmenté de -100 à -150 pour diminuer la marge en haut
    zIndex: 400, // Encore plus élevé pour garantir que l'image soit au premier plan
  },
  cardStack: {
    position: 'absolute',
    bottom: 80, // Augmenté de 40 à 80 pour faire monter les cartes
    left: 15,
    right: 15,
    alignItems: 'center',
  },
  backCard: {
    backgroundColor: '#0F3A2E', // Vert plus foncé que #174C3C
    borderRadius: 30,
    height: 300, // Augmenté de 250 à 300
    width: '100%',
    position: 'absolute',
    bottom: -20,
    borderWidth: 2,
    borderColor: '#0A2D23',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  middleCard: {
    backgroundColor: '#BB9B4E',
    borderRadius: 30,
    height: 310, // Augmenté de 260 à 310
    width: '95%',
    position: 'absolute',
    bottom: -10,
    borderWidth: 2,
    borderColor: '#A08642',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 7,
  },
  whiteCard: {
    backgroundColor: 'white',
    borderRadius: 30,
    paddingHorizontal: 40,
    paddingTop: 120,
    paddingBottom: 30,
    alignItems: 'center',
    justifyContent: 'flex-end',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 15,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    width: '90%',
    height: 320, // Augmenté de 270 à 320
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#174C3C',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 20,
    lineHeight: 36,
  },
  playButton: {
    backgroundColor: '#BB9B4E',
    paddingHorizontal: 50,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    minWidth: 150,
    alignItems: 'center',
  },
  playButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
}); 