import React from "react";
import { Image, ScrollView, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useNavigation, NavigationProp } from '@react-navigation/native'; // Assurez-vous d'avoir installé React Navigation
import colors from "../theme/colors";
import chaptersData from '../../data/chapitres.json'; // Assurez-vous que le chemin est correct
import { ChaptersData, Chapter } from '../types/chapters'; // Importez le type

const imageMap = {
  "1": require('../../assets/1.png'),
  "2": require('../../assets/2.png'),
  "3": require('../../assets/3.png'),
  "4": require('../../assets/4.png'),
  "5": require('../../assets/5.png'),
  "6": require('../../assets/6.png'),
  "7": require('../../assets/12.png'),
  "8": require('../../assets/15.png'),
  "9": require('../../assets/16.png'),
  "10": require('../../assets/17.png'),
  "11": require('../../assets/20.png'),
  "12": require('../../assets/21.png'),
  // Ajoutez d'autres images ici
};

export default function BooksScreen() {
  const navigation = useNavigation<NavigationProp<any>>(); // Utilisez le hook de navigation avec le type
  const data = chaptersData as ChaptersData; // Typage explicite

  const handleChapterPress = (chapter: Chapter) => {
    navigation.navigate('Chapter', { chapter }); // Naviguez vers l'écran de lecture de chapitre
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Livre</Text>
      </View>
      {Object.keys(data).map((partie, index) => (
        <View key={index}>
          <Text style={styles.sectionTitle}>{data[partie as keyof ChaptersData].titre}</Text>
          <View style={styles.chapterList}>
            {data[partie as keyof ChaptersData].chapitres.map((ch, idx) => (
              <TouchableOpacity key={idx} style={styles.chapterCard} onPress={() => handleChapterPress(ch)}>
                <Image source={imageMap[ch.image as keyof typeof imageMap]} style={styles.chapterImage} />
                <View style={styles.chapterContent}>
                  <Text style={styles.chapterTitle}>{ch.title}</Text>
                  <Text style={styles.chapterDesc}>{ch.desc}</Text>
                  <Text style={styles.chapterAuthor}>{ch.author}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { backgroundColor: colors.primary, paddingVertical: 24, paddingHorizontal: 20, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, marginBottom: 10 },
  headerTitle: { color: colors.white, fontSize: 20, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.primary, marginLeft: 20, marginTop: 20, marginBottom: 10 },
  chapterList: { paddingHorizontal: 16 },
  chapterCard: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: 16, marginBottom: 16, elevation: 2, alignItems: 'center', padding: 10 },
  chapterImage: { width: 60, height: 60, borderRadius: 12, marginRight: 14, resizeMode: 'cover' },
  chapterContent: { flex: 1 },
  chapterTitle: { fontSize: 16, fontWeight: 'bold', color: colors.primary, marginBottom: 4 },
  chapterDesc: { fontSize: 13, color: '#444', marginBottom: 4 },
  chapterAuthor: { fontSize: 12, color: colors.primary, fontStyle: 'italic' },
}); 