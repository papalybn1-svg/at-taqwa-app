import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp, useNavigation } from '@react-navigation/native'; // Assurez-vous d'avoir installé React Navigation
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import chaptersData from '../../data/chapitres.json'; // Assurez-vous que le chemin est correct
import colors from "../theme/colors";
import { Chapter, ChaptersData } from '../types/chapters';

// Regrouper les blocs en pages (max 15 pages)
function paginateBlocks(blocks: { type: string; contenu: string }[], maxPages = 15) {
  const total = blocks.length;
  if (total <= maxPages) return blocks.map(b => [b]);
  const pageSize = Math.ceil(total / maxPages);
  const pages = [];
  for (let i = 0; i < total; i += pageSize) {
    pages.push(blocks.slice(i, i + pageSize));
  }
  return pages;
}

export default function BooksScreen() {
  const navigation = useNavigation<NavigationProp<any>>(); // Utilisez le hook de navigation avec le type
  const data = chaptersData as ChaptersData; // Typage explicite
  const [progress, setProgress] = React.useState<{[key:string]:number}>({});
  const [drawerVisible, setDrawerVisible] = React.useState(false);
  const [selectedChapter, setSelectedChapter] = React.useState<Chapter|null>(null);

  // Charger la progression utilisateur
  React.useEffect(() => {
    AsyncStorage.getItem('chapterProgress').then(data => {
      if (data) setProgress(JSON.parse(data));
    });
  }, []);

  // Sauvegarder la progression
  const saveProgress = (newProgress: {[key:string]:number}) => {
    setProgress(newProgress);
    AsyncStorage.setItem('chapterProgress', JSON.stringify(newProgress));
  };

  // Ouvrir le drawer latéral
  const openDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);

  // Marquer un chapitre comme lu à 100%
  const completeChapter = (idx: number) => {
    const newProgress = { ...progress, [`chapter${idx+1}`]: 100 };
    saveProgress(newProgress);
  };

  const handleChapterPress = (chapter: Chapter) => {
    navigation.navigate('Chapter', { chapter }); // Naviguez vers l'écran de lecture de chapitre
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header avec bouton retour */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Livres</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Livres disponibles</Text>
          <Text style={styles.subtitle}>Découvrez notre collection de livres spirituels</Text>
          
          {/* Contenu de la page */}
          <View style={styles.booksContainer}>
            <Text style={styles.comingSoon}>Bientôt disponible...</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingVertical: 24, paddingHorizontal: 20, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, marginBottom: 10 },
  backButton: { padding: 10 },
  headerTitle: { color: colors.white, fontSize: 20, fontWeight: 'bold' },
  placeholder: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#444', marginBottom: 20 },
  booksContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  comingSoon: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
}); 