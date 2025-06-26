import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, getFirestore, orderBy, query } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from "../theme/colors";

const ZIKR_PROGRESS_KEY = '@zikr_progress';

export type Zikr = {
  id: string;
  category: string;
  text: string;
  description: string;
  max: number;
};

type ActiveZikr = Zikr & { count: number };

export default function TasbihScreen() {
  const [zikrs, setZikrs] = useState<Zikr[]>([]);
  const [zikrProgress, setZikrProgress] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [activeZikr, setActiveZikr] = useState<ActiveZikr | null>(null);
  const db = getFirestore();
  const navigation = useNavigation();

  const loadZikrData = useCallback(async () => {
    setLoading(true);
    try {
      // Load progress first
      const savedProgress = await AsyncStorage.getItem(ZIKR_PROGRESS_KEY);
      const progress = savedProgress ? JSON.parse(savedProgress) : {};
      
      // Fetch zikrs from Firestore
      const zikrsRef = collection(db, 'zikrs');
      const q = query(zikrsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedZikrs: Zikr[] = [];
      
      console.log('Nombre de zikrs trouvés:', querySnapshot.size);
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        console.log('Zikr data:', { 
          id: doc.id, 
          category: data.category, 
          text: data.text, 
          description: data.description,
          count: data.count 
        });
        fetchedZikrs.push({ 
          id: doc.id, 
          category: data.category || 'Général',
          text: data.text || 'Zikr',
          description: data.description || 'Louange à Allah',
          max: data.count || 33 
        });
      });
      
      setZikrs(fetchedZikrs);

      // Set progress for fetched zikrs
      const initialProgress = { ...progress };
      fetchedZikrs.forEach(zikr => {
        if (initialProgress[zikr.id] === undefined) {
          initialProgress[zikr.id] = 0;
        }
      });
      setZikrProgress(initialProgress);

    } catch (error) {
      console.error("Erreur de chargement des Zikrs:", error);
      // Fallback to default zikr if no data
      setZikrs([{ 
        id: 'default', 
        category: 'Général',
        text: 'Tasbih de la prière',
        description: 'Louange à Allah',
        max: 33 
      }]);
      setZikrProgress({ default: 0 });
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadZikrData();
  }, [loadZikrData]);

  useEffect(() => {
    AsyncStorage.setItem(ZIKR_PROGRESS_KEY, JSON.stringify(zikrProgress));
  }, [zikrProgress]);

  const increment = (id: string) => {
    const zikr = zikrs.find(z => z.id === id);
    if (!zikr) return;
    
    const currentCount = zikrProgress[id] || 0;
    if (currentCount < zikr.max) {
      const newProgress = { ...zikrProgress, [id]: currentCount + 1 };
      setZikrProgress(newProgress);
      if(activeZikr && activeZikr.id === id) {
        setActiveZikr({...activeZikr, count: newProgress[id] })
      }
    }
  };
  
  const reset = (id: string) => {
    setZikrProgress({ ...zikrProgress, [id]: 0 });
    if(activeZikr && activeZikr.id === id) {
      setActiveZikr({...activeZikr, count: 0 })
    }
  };

  const handleOpenTasbih = (zikr: Zikr) => {
    setActiveZikr({
      ...zikr,
      count: zikrProgress[zikr.id] || 0,
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header avec bouton retour */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tasbih</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.container}>
        <FlatList
          data={zikrs}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const count = zikrProgress[item.id] || 0;
            return (
              <TouchableOpacity onPress={() => handleOpenTasbih(item)}>
                <View style={styles.card}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.zikrCategory}>{item.category}</Text>
                    <Text style={styles.zikrText}>{item.text}</Text>
                    <Text style={styles.zikrDescription}>{item.description}</Text>
                    <Text style={styles.zikrCount}>{count} / {item.max}</Text>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBar, { width: `${(count / item.max) * 100}%` }]} />
                    </View>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => increment(item.id)} style={styles.actionBtn}>
                      <Text style={styles.actionText}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => reset(item.id)} style={styles.actionBtn}>
                      <Text style={styles.actionText}>⟳</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun Zikr trouvé. Ajoutez-en depuis le panneau admin.</Text>
            </View>
          }
          onRefresh={loadZikrData}
          refreshing={loading}
        />
        
        <Modal visible={!!activeZikr} transparent animationType="slide">
          <View style={styles.modalBg}>
            <View style={[styles.modalCard, { width: 320, alignItems: 'center' }]}> 
              <Text style={[styles.modalCategory, { fontSize: 14, color: colors.primary, marginBottom: 8 }]}>
                {activeZikr?.category}
              </Text>
              <Text style={[styles.modalTitle, { fontSize: 22 }]}>{activeZikr?.text}</Text>
              <Text style={[styles.modalDescription, { fontSize: 14, color: colors.gray, marginBottom: 16, textAlign: 'center' }]}>
                {activeZikr?.description}
              </Text>
              <Text style={{ fontSize: 48, fontWeight: 'bold', color: colors.primary, marginVertical: 18 }}>
                {zikrProgress[activeZikr?.id || ''] || 0} / {activeZikr?.max}
              </Text>
              <TouchableOpacity style={[styles.saveBtn, { marginBottom: 12, width: 120, alignItems: 'center' }]} onPress={() => activeZikr && increment(activeZikr.id)}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 22 }}>+1</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#FFD700', marginBottom: 8, width: 120, alignItems: 'center' }]} onPress={() => activeZikr && reset(activeZikr.id)}>
                <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>Réinitialiser</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveZikr(null)} style={{ marginTop: 8 }}>
                <Text style={{ color: colors.primary }}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F3F5F7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 12
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text
  },
  placeholder: {
    flex: 1,
  },
  container: { flex: 1, backgroundColor: '#F3F5F7' },
  content: {
    padding: 16,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.primary, margin: 20, marginBottom: 10 },
  subtitle: { fontSize: 16, color: colors.gray, marginBottom: 20 },
  tasbihContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoon: {
    textAlign: 'center',
    color: colors.gray,
    marginTop: 40,
    fontSize: 16,
  },
  card: { 
    backgroundColor: colors.white, 
    borderRadius: 18, 
    padding: 18, 
    marginBottom: 18, 
    flexDirection: 'row', 
    alignItems: 'center', 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1}, 
    shadowOpacity: 0.1, 
    shadowRadius: 3 
  },
  zikrCategory: { 
    color: colors.primary, 
    fontSize: 12, 
    fontWeight: '600', 
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  zikrText: { 
    color: colors.text, 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 4 
  },
  zikrDescription: { 
    color: colors.gray, 
    fontSize: 14, 
    marginBottom: 8,
    fontStyle: 'italic'
  },
  zikrCount: { 
    color: colors.gray, 
    fontSize: 13, 
    marginBottom: 6 
  },
  progressBarBg: { 
    backgroundColor: '#eee', 
    height: 6, 
    borderRadius: 3, 
    width: '100%', 
    marginBottom: 6, 
    overflow: 'hidden' 
  },
  progressBar: { 
    backgroundColor: colors.primary, 
    height: 6, 
    borderRadius: 3 
  },
  actions: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginLeft: 12 
  },
  actionBtn: { 
    backgroundColor: '#f0f0f0', 
    borderRadius: 16, 
    padding: 6, 
    marginHorizontal: 2, 
    width: 32, 
    height: 32, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  actionText: { 
    color: colors.primary, 
    fontWeight: 'bold', 
    fontSize: 18 
  },
  modalBg: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.18)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modalCard: { 
    backgroundColor: '#fff', 
    borderRadius: 18, 
    padding: 28, 
    width: 300, 
    alignItems: 'center', 
    elevation: 6 
  },
  modalCategory: { 
    fontSize: 14, 
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: colors.primary, 
    marginBottom: 18 
  },
  modalDescription: { 
    fontSize: 14, 
    color: colors.gray,
    textAlign: 'center'
  },
  saveBtn: { 
    backgroundColor: colors.primary, 
    borderRadius: 18, 
    paddingVertical: 10, 
    paddingHorizontal: 32, 
    marginTop: 8 
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    textAlign: 'center', 
    color: colors.gray, 
    marginTop: 40,
    fontSize: 16
  },
}); 