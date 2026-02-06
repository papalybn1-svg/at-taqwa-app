import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect } from 'react';
import { BackHandler, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getResponsiveStyle, useResponsive } from '../hooks/useResponsive';
import { getCardSizes, getCardStackPosition, getCharacterPosition, getCharacterSize, getWhiteCardPaddingTop } from '../utils/quizResponsive';

export default function QuizStartScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const responsiveStyle = getResponsiveStyle(responsive);
  const styles = createStyles(responsive, responsiveStyle, insets);

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
            style={styles.backButton} 
            onPress={goHome}
          >
            <MaterialCommunityIcons name="arrow-left" size={responsiveStyle.fontSize.lg} color="white" />
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

const createStyles = (responsive: any, responsiveStyle: any, insets: any) => {
  // Utilisation des fonctions utilitaires pour un système responsive unifié
  const characterSize = getCharacterSize(responsive);
  const characterPosition = getCharacterPosition(responsive);
  const cardStackPosition = getCardStackPosition(responsive);
  const cardSizes = getCardSizes(responsive);
  const paddingTopMultiplier = getWhiteCardPaddingTop(responsive);
  
  const isTablet = responsive.breakpoint === 'xl' || responsive.breakpoint === 'xxl';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#174C3C',
      paddingTop: 0,
      paddingBottom: responsiveStyle.spacing.lg,
    },
    backButton: {
      position: 'absolute',
      left: responsive.horizontalPadding,
      top: insets.top + responsiveStyle.spacing.base,
      zIndex: 30,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderRadius: responsiveStyle.component.borderRadius * 2.5,
      padding: responsiveStyle.spacing.sm,
      width: responsiveStyle.component.iconSize * 2,
      height: responsiveStyle.component.iconSize * 2,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: responsiveStyle.spacing.xs,
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
      // Taille responsive unifiée via getCharacterSize
      width: characterSize.width,
      height: characterSize.height,
      // Position responsive unifiée via getCharacterPosition
      marginTop: characterPosition.marginTop,
      zIndex: 400,
    },
    cardStack: {
      position: 'absolute',
      bottom: cardStackPosition.bottom,
      left: responsive.horizontalPadding,
      right: responsive.horizontalPadding,
      alignItems: 'center',
    },
    backCard: {
      backgroundColor: '#0F3A2E',
      borderRadius: responsiveStyle.component.borderRadius * 3.75,
      height: cardSizes.backCard.height,
      width: '100%',
      position: 'absolute',
      bottom: isTablet ? -20 : -15,
      borderWidth: 2,
      borderColor: '#0A2D23',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: responsiveStyle.spacing.xs,
      elevation: 5,
    },
    middleCard: {
      backgroundColor: '#BB9B4E',
      borderRadius: responsiveStyle.component.borderRadius * 3.75,
      height: cardSizes.middleCard.height,
      width: '95%',
      position: 'absolute',
      bottom: isTablet ? -10 : -8,
      borderWidth: 2,
      borderColor: '#A08642',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: responsiveStyle.spacing.sm,
      elevation: 7,
    },
    whiteCard: {
      backgroundColor: 'white',
      borderRadius: responsiveStyle.component.borderRadius * 3.75,
      paddingHorizontal: isTablet ? responsiveStyle.spacing['2xl'] : responsiveStyle.spacing.xl,
      paddingTop: isTablet ? responsiveStyle.spacing['2xl'] : responsiveStyle.spacing.lg,
      paddingBottom: isTablet ? responsiveStyle.spacing['2xl'] : responsiveStyle.spacing.lg,
      alignItems: 'center',
      justifyContent: 'center', // ✅ Centré verticalement au lieu de 'flex-end'
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: responsiveStyle.spacing.base,
      elevation: 15,
      borderWidth: 2,
      borderColor: '#F0F0F0',
      width: '90%',
      height: cardSizes.whiteCard.height,
    },
    cardTitle: {
      fontSize: isTablet 
        ? responsiveStyle.fontSize['2xl']  // Tablettes : 20px
        : responsive.breakpoint === 'xs'
          ? responsiveStyle.fontSize.lg  // Très petits écrans : 16px
          : responsiveStyle.fontSize.xl, // iPhone standard et grands téléphones : 18px
      fontWeight: 'bold',
      color: '#174C3C',
      textAlign: 'center',
      marginBottom: isTablet ? responsiveStyle.spacing.xl : responsiveStyle.spacing.base, // ✅ Responsive margin
      marginTop: 0, // ✅ Pas de marginTop car centré verticalement
      lineHeight: isTablet 
        ? responsiveStyle.fontSize['2xl'] * 1.25
        : responsive.breakpoint === 'xs'
          ? responsiveStyle.fontSize.lg * 1.3
          : responsiveStyle.fontSize.xl * 1.3,
      // Propriétés pour éviter que le texte soit coupé
      paddingHorizontal: responsiveStyle.spacing.sm,
      flexWrap: 'wrap',
    },
    playButton: {
      backgroundColor: '#BB9B4E',
      paddingHorizontal: isTablet ? responsiveStyle.spacing['3xl'] : responsiveStyle.spacing['2xl'],
      paddingVertical: responsiveStyle.spacing.base,
      borderRadius: responsiveStyle.component.borderRadius * 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: responsiveStyle.spacing.sm,
      elevation: 8,
      minWidth: isTablet ? 170 : responsive.breakpoint === 'xs' ? 130 : 150,
      alignItems: 'center',
    },
    playButtonText: {
      color: 'white',
      fontSize: isTablet 
        ? responsiveStyle.fontSize['2xl']  // Tablettes : 20px
        : responsive.breakpoint === 'xs'
          ? responsiveStyle.fontSize.xl  // Très petits écrans : 18px
          : responsiveStyle.fontSize.xl, // iPhone standard et grands téléphones : 18px
      fontWeight: 'bold',
    },
  });
}; 