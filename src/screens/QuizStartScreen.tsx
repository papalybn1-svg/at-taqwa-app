import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View, BackHandler } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

export default function QuizStartScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  // Gestion du bouton retour Android pour aller à l'accueil
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('HomeMain' as never);
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation])
  );

  // Intercepter le retour (swipe ou bouton) pour forcer l'accueil
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      // Si ce n'est pas déjà un retour vers HomeMain, on force
      if (e.data.action.type === 'GO_BACK' || e.data.action.type === 'POP') {
        e.preventDefault();
        navigation.navigate('HomeMain' as never);
      }
    });
    return unsubscribe;
  }, [navigation]);

  const goToChapters = () => {
    navigation.navigate('QuizChapterSelect' as never);
  };

  const goHome = () => {
    navigation.navigate('HomeMain' as never);
  };

  // Gestionnaire de geste de swipe
  const onGestureEvent = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      if ((translationX > 50 && velocityX > 500) || translationX > 150) {
        goHome();
      }
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <PanGestureHandler onHandlerStateChange={onGestureEvent}>
        <View style={[styles.container, { paddingTop: insets.top }]}>
          {/* Bouton retour */}
          <TouchableOpacity 
            style={[styles.backButton, { top: insets.top + getResponsiveSize(20, false) }]} 
            onPress={goHome}
          >
            <MaterialCommunityIcons name="arrow-left" size={getResponsiveSize(24)} color="white" />
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

      {/* Carte blanche principale */}
      <View style={styles.cardStack}>
        <View style={styles.backCard} />
        <View style={styles.middleCard} />
        <View style={styles.whiteCard}>
          <Text style={styles.cardTitle} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.7}>Testez vos connaissances</Text>
          <TouchableOpacity 
            style={styles.playButton} 
            onPress={goToChapters}
            activeOpacity={0.7}
          >
            <Text style={styles.playButtonText}>Lancer</Text>
          </TouchableOpacity>
        </View>
      </View>
        </View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#174C3C',
    paddingTop: 0, // Selon référence
    paddingBottom: getResponsiveSize(30, false),
  },
  backButton: {
    position: 'absolute',
    left: getResponsiveSize(20),
    zIndex: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: getResponsiveSize(20),
    padding: getResponsiveSize(8),
    width: getResponsiveSize(40),
    height: getResponsiveSize(40),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: getResponsiveSize(2, false) },
    shadowOpacity: 0.25,
    shadowRadius: getResponsiveSize(4),
    elevation: 5,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
    pointerEvents: 'none',
    zIndex: 200,
  },
  imageContainer: {
    pointerEvents: 'none',
    zIndex: 300,
  },
  manImage: {
    width: screenWidth * (isSmallScreen ? 1.2 : isLargeScreen ? 1.6 : 1.4),
    height: screenHeight * (isSmallScreen ? 0.7 : isLargeScreen ? 1.0 : 0.9),
    maxWidth: getResponsiveSize(isSmallScreen ? 600 : isLargeScreen ? 900 : 800),
    maxHeight: getResponsiveSize(isSmallScreen ? 700 : isLargeScreen ? 1200 : 1000, false),
    marginTop: getResponsiveSize(isSmallScreen ? -100 : isLargeScreen ? -200 : -150, false), // Réduit encore pour faire descendre l'image
    zIndex: 400,
  },
  cardStack: {
    position: 'absolute',
    bottom: getResponsiveSize(isSmallScreen ? 60 : isLargeScreen ? 100 : 80, false),
    left: getResponsiveSize(15),
    right: getResponsiveSize(15),
    alignItems: 'center',
  },
  backCard: {
    backgroundColor: '#0F3A2E',
    borderRadius: getResponsiveSize(30),
    height: getResponsiveSize(isSmallScreen ? 250 : isLargeScreen ? 350 : 300, false),
    width: '100%',
    position: 'absolute',
    bottom: getResponsiveSize(-20, false),
    borderWidth: getResponsiveSize(2),
    borderColor: '#0A2D23',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: getResponsiveSize(2, false) },
    shadowOpacity: 0.1,
    shadowRadius: getResponsiveSize(4),
    elevation: 5,
  },
  middleCard: {
    backgroundColor: '#BB9B4E',
    borderRadius: getResponsiveSize(30),
    height: getResponsiveSize(isSmallScreen ? 260 : isLargeScreen ? 360 : 310, false),
    width: '95%',
    position: 'absolute',
    bottom: getResponsiveSize(-10, false),
    borderWidth: getResponsiveSize(2),
    borderColor: '#A08642',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: getResponsiveSize(3, false) },
    shadowOpacity: 0.15,
    shadowRadius: getResponsiveSize(6),
    elevation: 7,
  },
  whiteCard: {
    backgroundColor: 'white',
    borderRadius: getResponsiveSize(30),
    paddingHorizontal: getResponsiveSize(isSmallScreen ? 30 : isLargeScreen ? 50 : 40),
    paddingTop: getResponsiveSize(isSmallScreen ? 100 : isLargeScreen ? 140 : 120, false),
    paddingBottom: getResponsiveSize(isSmallScreen ? 25 : isLargeScreen ? 35 : 30, false),
    alignItems: 'center',
    justifyContent: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: getResponsiveSize(4, false) },
    shadowOpacity: 0.2,
    shadowRadius: getResponsiveSize(10),
    elevation: 15,
    borderWidth: getResponsiveSize(2),
    borderColor: '#F0F0F0',
    width: '90%',
    height: getResponsiveSize(isSmallScreen ? 270 : isLargeScreen ? 370 : 320, false),
  },
  cardTitle: {
    fontSize: getResponsiveSize(isSmallScreen ? 17 : isLargeScreen ? 21 : 19),
    fontWeight: 'bold',
    color: '#174C3C',
    textAlign: 'center',
    marginBottom: getResponsiveSize(isSmallScreen ? 15 : isLargeScreen ? 25 : 20, false),
    marginTop: getResponsiveSize(isSmallScreen ? 15 : isLargeScreen ? 25 : 20, false),
    lineHeight: getResponsiveSize(isSmallScreen ? 21 : isLargeScreen ? 25 : 23, false),
  },
  playButton: {
    backgroundColor: '#BB9B4E',
    paddingHorizontal: getResponsiveSize(isSmallScreen ? 40 : isLargeScreen ? 60 : 50),
    paddingVertical: getResponsiveSize(isSmallScreen ? 14 : isLargeScreen ? 18 : 16, false),
    borderRadius: getResponsiveSize(25),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: getResponsiveSize(4, false) },
    shadowOpacity: 0.3,
    shadowRadius: getResponsiveSize(6),
    elevation: 8,
    minWidth: getResponsiveSize(isSmallScreen ? 130 : isLargeScreen ? 170 : 150),
    alignItems: 'center',
  },
  playButtonText: {
    color: 'white',
    fontSize: getResponsiveSize(isSmallScreen ? 18 : isLargeScreen ? 22 : 20),
    fontWeight: 'bold',
  },
}); 