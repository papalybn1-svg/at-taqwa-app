import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState, useEffect, useCallback } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, BackHandler } from 'react-native';
import imageMap from '../../assets/chapterImages';
import chaptersData from '../../data/chapitres.json';
import colors from '../theme/colors';
import { useFocusEffect } from '@react-navigation/native';

// Liste centralisée des fichiers d'exercices (clé = numéro de chapitre sous forme de string)
const exercicesFiles: { [key: string]: any[] } = {
  '1': require('../../data/exercices_par_chapitre/chapitre_1_exercices.json'),
  '2': require('../../data/exercices_par_chapitre/chapitre_02_exercices.json'),
  '3': require('../../data/exercices_par_chapitre/chapitre_03_exercices.json'),
  '5': require('../../data/exercices_par_chapitre/chapitre_05_exercices.json'),
  '6': require('../../data/exercices_par_chapitre/chapitre_06_exercices.json'),
  '7': require('../../data/exercices_par_chapitre/chapitre_07_exercices.json'),
  '9': require('../../data/exercices_par_chapitre/chapitre_09_exercices.json'),
  '10': require('../../data/exercices_par_chapitre/chapitre_10_exercices.json'),
  '12': require('../../data/exercices_par_chapitre/chapitre_12_exercices.json'),
};

// SplashFamille copié depuis App.tsx
function SplashFamille() {
  return (
    <View style={styles.splashFamilleBg}>
      {/* Bloc image + texte en haut */}
      <View style={styles.topContentBlock}>
        {/* Logo en haut */}
        <Image 
          source={require('../../assets/Page acceuil dome mosquée.png')} 
          style={styles.splashFamilleLogo}
        />
        {/* Texte principal */}
        <View style={styles.splashFamilleTextContainer}>
          <Text style={styles.splashMainTitle}>Assalamu Alaikum,</Text>
          <Text style={styles.splashSubtitleGreen}>Bienvenue sur AT-Taqwa</Text>
          <Text style={styles.splashDescription}>Votre guide pour la réparation de la Prière</Text>
        </View>
      </View>
      {/* Image de la famille en bas */}
      <Image 
        source={require('../../assets/femme et enfant (2).png')} 
        style={styles.splashFamilleImageXL}
      />
    </View>
  );
}

export default function QuizChapterSelectScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // Génère la liste plate de tous les chapitres, sans doublon, avec association fiable
  const seen: { [key: string]: boolean } = {};
  const allChapters = Object.entries(chaptersData).flatMap(([partieKey, partie], partieIndex) =>
    partie.chapitres.map((ch, chapitreIndex) => {
      // On tente d'associer le chapitre à son fichier d'exercices par numéro
      const num = (ch as any).numero || ch.image || `${chapitreIndex + 1}`;
      const numKey = String(parseInt(num, 10)); // '01' -> '1', '10' -> '10'
      const exercices = exercicesFiles[numKey];
      if (Array.isArray(exercices) && exercices.length > 0 && !seen[numKey]) {
        seen[numKey] = true;
        return {
          ...ch,
          id: `${partieIndex}-${chapitreIndex}`,
          partie: partie.titre,
          image: ch.image || '',
          exercicesKey: numKey,
        };
      }
      return null;
    })
  ).filter((chapter): chapter is { id: string; partie: string; exercicesKey: string; image: string; title: string; desc: string; author: string } => !!chapter);

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
      if (e.data.action.type === 'GO_BACK' || e.data.action.type === 'POP') {
        e.preventDefault();
        navigation.navigate('HomeMain' as never);
      }
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 40}}>
      <Text style={styles.title}>Choisissez un chapitre pour le quiz</Text>
      <View style={styles.list}>
        {allChapters.map((chapter, idx) => (
          <TouchableOpacity
            key={chapter.id}
            style={styles.chapterCard}
            onPress={() => (navigation as any).navigate('OriginalQuiz', { exercicesKey: chapter.exercicesKey, chapterTitle: chapter.title, chapterPart: chapter.partie })}
            activeOpacity={0.85}
          >
            <View style={styles.chapterImageContainer}>
            <Image
              source={imageMap[chapter.image] || imageMap['1']}
              style={styles.chapterImage}
              resizeMode="cover"
            />
            </View>
            <View style={styles.chapterInfo}>
              <Text style={styles.chapterTitle}>{chapter.title && chapter.title.trim() !== '' ? chapter.title : `Chapitre ${chapter.exercicesKey}`}</Text>
              <Text style={styles.chapterPart}>{chapter.partie || 'Partie inconnue'}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7F6' },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.primary, marginTop: 30, marginBottom: 18, textAlign: 'center' },
  list: { paddingHorizontal: 18 },
  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  chapterImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterImage: {
    width: '140%',
    height: '140%',
    resizeMode: 'cover',
    minWidth: '140%',
    minHeight: '140%',
    transform: [{ scale: 1.4 }],
  },
  chapterInfo: { flex: 1 },
  chapterTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 2 },
  chapterPart: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  // Styles pour SplashFamille
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
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 0,
    marginTop: 40,
    alignSelf: 'center',
  },
  splashFamilleTextContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: -40,
    marginBottom: 8,
  },
  splashMainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#174C3C',
    marginBottom: 8,
    textAlign: 'center',
  },
  splashSubtitleGreen: {
    fontSize: 20,
    fontWeight: '600',
    color: '#174C3C',
    marginBottom: 10,
    textAlign: 'center',
  },
  splashDescription: {
    fontSize: 17,
    color: '#174C3C',
    textAlign: 'center',
    marginBottom: 0,
    lineHeight: 22,
  },
  splashFamilleImageXL: {
    width: '110%',
    height: '55%',
    resizeMode: 'cover',
    position: 'absolute',
    bottom: 0,
    left: '-10%',
    marginBottom: 0,
    marginTop: 0,
    alignSelf: 'center',
  },
}); 