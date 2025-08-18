import { MaterialCommunityIcons } from '@expo/vector-icons';
import { addDoc, collection, deleteDoc, doc, getDocs, getFirestore, serverTimestamp, updateDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert, FlatList, Modal, RefreshControl, StyleSheet, Text,
    TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';

// Simplified type for this screen
interface Hadith {
  id: string;
  text: string;
  source: string;
}

export default function AdminHadithsScreen() {
  const [hadiths, setHadiths] = useState<Hadith[]>([]);
  const [filteredHadiths, setFilteredHadiths] = useState<Hadith[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHadith, setEditingHadith] = useState<Hadith | null>(null);
  const [hadithData, setHadithData] = useState({ text: '', source: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const db = getFirestore();

  const loadHadiths = useCallback(async () => {
    setRefreshing(true);
    const snapshot = await getDocs(collection(db, 'hadiths'));
    const hadithsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hadith));
    setHadiths(hadithsList);
    setFilteredHadiths(hadithsList);
    setRefreshing(false);
  }, [db]);

  useEffect(() => {
    loadHadiths();
  }, [loadHadiths]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = hadiths.filter(h =>
      h.text.toLowerCase().includes(query.toLowerCase()) ||
      h.source.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredHadiths(filtered);
  };
  
  const openModal = (hadith: Hadith | null = null) => {
    if (hadith) {
      setEditingHadith(hadith);
      setHadithData({ text: hadith.text, source: hadith.source });
    } else {
      setEditingHadith(null);
      setHadithData({ text: '', source: '' });
    }
    setModalVisible(true);
  };
  
  const handleSave = async () => {
    if (!hadithData.text || !hadithData.source) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs.");
      return;
    }
    try {
      if (editingHadith) {
        await updateDoc(doc(db, 'hadiths', editingHadith.id), hadithData);
      } else {
        await addDoc(collection(db, 'hadiths'), { ...hadithData, createdAt: serverTimestamp() });
      }
      setModalVisible(false);
      loadHadiths();
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible de sauvegarder le hadith.");
    }
  };
  
  const handleDelete = (id: string) => {
    Alert.alert("Confirmer", "Supprimer ce hadith ?", [
      { text: "Annuler" },
      { text: "Supprimer", style: 'destructive', onPress: async () => {
        await deleteDoc(doc(db, 'hadiths', id));
        loadHadiths();
      }}
    ]);
  };

  const renderItem = ({ item }: { item: Hadith }) => (
    <View style={styles.card}>
      <Text style={styles.cardText}>"{item.text}"</Text>
      <Text style={styles.cardSource}>- {item.source}</Text>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => openModal(item)} style={styles.actionButton}>
          <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
          <MaterialCommunityIcons name="delete" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Hadiths</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <MaterialCommunityIcons name="plus" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>
      <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un hadith..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      <FlatList
        data={filteredHadiths}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadHadiths} />}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingHadith ? "Modifier" : "Nouveau"} Hadith</Text>
            <TextInput style={styles.input} placeholder="Texte du hadith" value={hadithData.text} onChangeText={text => setHadithData(d => ({ ...d, text }))} multiline />
            <TextInput style={styles.input} placeholder="Source (ex: Bukhari)" value={hadithData.source} onChangeText={source => setHadithData(d => ({ ...d, source }))} />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.modalButton, {backgroundColor: colors.gray}]}>
                <Text style={styles.buttonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={[styles.modalButton, {backgroundColor: colors.primary}]}>
                <Text style={styles.buttonText}>Sauvegarder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  addButton: { backgroundColor: colors.primary, padding: 8, borderRadius: 50 },
  searchInput: { backgroundColor: colors.white, padding: 15, margin: 16, borderRadius: 10, fontSize: 16 },
  card: { backgroundColor: colors.white, borderRadius: 10, padding: 15, marginHorizontal: 16, marginTop: 16, elevation: 2 },
  cardText: { fontSize: 16, color: colors.text, fontStyle: 'italic', marginBottom: 10 },
  cardSource: { fontSize: 14, color: colors.primary, fontWeight: 'bold', alignSelf: 'flex-end' },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15, marginTop: 15, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  actionButton: { padding: 5 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', backgroundColor: colors.white, borderRadius: 10, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: colors.primary },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, marginBottom: 15, fontSize: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-around' },
  modalButton: { padding: 15, borderRadius: 10, flex: 1, marginHorizontal: 5, alignItems: 'center' },
  buttonText: { color: colors.white, fontWeight: 'bold' }
}); 