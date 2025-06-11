import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import colors from "../theme/colors";

const chapters = [
  {
    image: require('../../assets/3.png'),
    title: 'Chapitre 1',
    desc: 'Signification, sources et vertus de la prière',
    author: 'Aly Sow',
  },
  {
    image: require('../../assets/abulution.png'),
    title: 'Chapitre 2',
    desc: 'La Purification, Condition Préalable de Validité',
    author: 'Aly Sow',
  },
  {
    image: require('../../assets/femme-prie.png'),
    title: 'Chapitre 3',
    desc: 'Signification, sources et vertus de la prière',
    author: 'Aly Sow',
  },
];

export default function BooksScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Livre</Text>
      </View>
      <Text style={styles.sectionTitle}>Chapitres</Text>
      <View style={styles.chapterList}>
        {chapters.map((ch, idx) => (
          <View key={idx} style={styles.chapterCard}>
            <Image source={ch.image} style={styles.chapterImage} />
            <View style={styles.chapterContent}>
              <Text style={styles.chapterTitle}>{ch.title}</Text>
              <Text style={styles.chapterDesc}>{ch.desc}</Text>
              <Text style={styles.chapterAuthor}>{ch.author}</Text>
            </View>
          </View>
        ))}
        <View style={styles.chapterCardEmpty}>
          <Text style={styles.chapterTitle}>Chapitre 4</Text>
        </View>
      </View>
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
  chapterCardEmpty: { backgroundColor: colors.white, borderRadius: 16, marginBottom: 16, elevation: 2, alignItems: 'flex-start', padding: 18, justifyContent: 'center' },
}); 