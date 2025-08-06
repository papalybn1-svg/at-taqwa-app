import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View, BackHandler } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function QuizStartScreen() {
  const navigation = useNavigation();
  const route = useRoute();

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
    <SafeAreaView style={styles.container}>
      {/* Bouton retour */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={goHome}
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

      {/* Carte blanche principale */}
      <View style={styles.cardStack}>
        <View style={styles.backCard} />
        <View style={styles.middleCard} />
        <View style={styles.whiteCard}>
          <Text style={styles.cardTitle}>{'Commençons le\nQuizz'}</Text>
          <TouchableOpacity 
            style={styles.playButton} 
            onPress={goToChapters}
            activeOpacity={0.7}
          >
            <Text style={styles.playButtonText}>Commencer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#174C3C',
    paddingBottom: 30,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
    width: screenWidth * 1.4,
    height: screenHeight * 0.9,
    maxWidth: 800,
    maxHeight: 1000,
    marginTop: -200,
    zIndex: 400,
  },
  cardStack: {
    position: 'absolute',
    bottom: 80,
    left: 15,
    right: 15,
    alignItems: 'center',
  },
  backCard: {
    backgroundColor: '#0F3A2E',
    borderRadius: 30,
    height: 300,
    width: '100%',
    position: 'absolute',
    bottom: -20,
    borderWidth: 2,
    borderColor: '#0A2D23',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  middleCard: {
    backgroundColor: '#BB9B4E',
    borderRadius: 30,
    height: 310,
    width: '95%',
    position: 'absolute',
    bottom: -10,
    borderWidth: 2,
    borderColor: '#A08642',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 15,
    borderWidth: 2,
    borderColor: '#F0F0F0',
    width: '90%',
    height: 320,
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
    shadowOffset: { width: 0, height: 4 },
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