import { MaterialCommunityIcons } from '@expo/vector-icons';
import { addDoc, collection, deleteDoc, doc, getDocs, getFirestore, serverTimestamp, updateDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert, FlatList, Modal, RefreshControl, StyleSheet, Text,
    TextInput, TouchableOpacity, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';

interface Zikr {
  id: string;
  text: string;
  count: number;
  category: string;
}

export default function AdminZikrsScreen() {
  const [zikrs, setZikrs] = useState<Zikr[]>([]);
  const [filteredZikrs, setFilteredZikrs] = useState<Zikr[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingZikr, setEditingZikr] = useState<Zikr | null>(null);
  const [zikrData, setZikrData] = useState({ text: '', count: '0', category: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const db = getFirestore();

  const loadZikrs = useCallback(async () => {
    setRefreshing(true);
    const snapshot = await getDocs(collection(db, 'zikrs'));
    const zikrsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Zikr));
    setZikrs(zikrsList);
    setFilteredZikrs(zikrsList);
    setRefreshing(false);
  }, [db]);

  useEffect(() => {
    loadZikrs();
  }, [loadZikrs]);
  
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = zikrs.filter(z =>
      z.text.toLowerCase().includes(query.toLowerCase()) ||
      z.category.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredZikrs(filtered);
  };
  
  const openModal = (zikr: Zikr | null = null) => {
    if (zikr) {
      setEditingZikr(zikr);
      setZikrData({ text: zikr.text, count: String(zikr.count), category: zikr.category });
    } else {
      setEditingZikr(null);
      setZikrData({ text: '', count: '0', category: '' });
    }
    setModalVisible(true);
  };
  
  const handleSave = async () => {
    const count = parseInt(zikrData.count, 10);
    if (!zikrData.text || isNaN(count)) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs correctement.");
      return;
    }
    const dataToSave = { ...zikrData, count };
    try {
      if (editingZikr) {
        await updateDoc(doc(db, 'zikrs', editingZikr.id), dataToSave);
      } else {
        await addDoc(collection(db, 'zikrs'), { ...dataToSave, createdAt: serverTimestamp() });
      }
      setModalVisible(false);
      loadZikrs();
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible de sauvegarder le zikr.");
    }
  };
  
  const handleDelete = (id: string) => {
    Alert.alert("Confirmer", "Supprimer ce zikr ?", [
      { text: "Annuler" },
      { text: "Supprimer", style: 'destructive', onPress: async () => {
        await deleteDoc(doc(db, 'zikrs', id));
        loadZikrs();
      }}
    ]);
  };

  const renderItem = ({ item }: { item: Zikr }) => (
    <View style={styles.card}>
      <View>
        <Text style={styles.cardText}>{item.text}</Text>
        <Text style={styles.cardCategory}>{item.category}</Text>
      </View>
      <View style={styles.rightContent}>
        <Text style={styles.cardCount}>{item.count}x</Text>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => openModal(item)} style={styles.actionButton}>
            <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionButton}>
            <MaterialCommunityIcons name="delete" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Zikrs</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <MaterialCommunityIcons name="plus" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>
      <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un zikr..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      <FlatList
        data={filteredZikrs}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadZikrs} />}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingZikr ? "Modifier" : "Nouveau"} Zikr</Text>
            <TextInput style={styles.input} placeholder="Texte du zikr" value={zikrData.text} onChangeText={text => setZikrData(d => ({ ...d, text }))} />
            <TextInput style={styles.input} placeholder="Nombre de répétitions" value={zikrData.count} onChangeText={count => setZikrData(d => ({ ...d, count }))} keyboardType="number-pad" />
            <TextInput style={styles.input} placeholder="Catégorie" value={zikrData.category} onChangeText={category => setZikrData(d => ({ ...d, category }))} />
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
  card: { backgroundColor: colors.white, borderRadius: 10, padding: 15, marginHorizontal: 16, marginTop: 16, elevation: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardText: { fontSize: 16, color: colors.text, fontWeight: '500' },
  cardCategory: { fontSize: 14, color: colors.gray, marginTop: 4 },
  rightContent: { alignItems: 'flex-end' },
  cardCount: { fontSize: 18, color: colors.primary, fontWeight: 'bold', marginBottom: 10 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15 },
  actionButton: { padding: 5 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', backgroundColor: colors.white, borderRadius: 10, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: colors.primary },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, marginBottom: 15, fontSize: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-around' },
  modalButton: { padding: 15, borderRadius: 10, flex: 1, marginHorizontal: 5, alignItems: 'center' },
  buttonText: { color: colors.white, fontWeight: 'bold' }
}); 