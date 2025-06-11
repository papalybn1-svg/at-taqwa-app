import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from "react";
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import colors from "../theme/colors";

const STORAGE_KEY = 'USER_ZIKRS';

export type Zikr = {
  id: string;
  name: string;
  max: number;
  count: number;
};

export default function TasbihScreen() {
  const [zikrs, setZikrs] = useState<Zikr[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newZikrName, setNewZikrName] = useState("");
  const [newZikrCount, setNewZikrCount] = useState<number>(100);
  const [activeZikr, setActiveZikr] = useState<Zikr|null>(null);

  useEffect(() => {
    loadZikrs();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(zikrs));
  }, [zikrs]);

  const loadZikrs = async () => {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.length === 0) {
        setZikrs([{ id: 'default', name: 'Tasbih de la prière', max: 33, count: 0 }]);
      } else {
        setZikrs(parsed);
      }
    } else {
      setZikrs([{ id: 'default', name: 'Tasbih de la prière', max: 33, count: 0 }]);
    }
  };

  const addZikr = () => {
    if (!newZikrName.trim()) return;
    setZikrs([...zikrs, { name: newZikrName, max: newZikrCount, count: 0, id: Date.now().toString() }]);
    setNewZikrName("");
    setNewZikrCount(100);
    setModalVisible(false);
  };

  const increment = (id: string) => {
    setZikrs(zikrs.map(z => z.id === id && z.count < z.max ? { ...z, count: z.count + 1 } : z));
  };

  const reset = (id: string) => {
    setZikrs(zikrs.map(z => z.id === id ? { ...z, count: 0 } : z));
  };

  const remove = (id: string) => {
    setZikrs(zikrs.filter(z => z.id !== id));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tes Zikrs</Text>
      <FlatList
        data={zikrs}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setActiveZikr(item)}>
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.zikrName}>{item.name}</Text>
                <Text style={styles.zikrCount}>{item.count} / {item.max}</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBar, { width: `${(item.count / item.max) * 100}%` }]} />
                </View>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => increment(item.id)} style={styles.actionBtn}><Text style={styles.actionText}>+</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => reset(item.id)} style={styles.actionBtn}><Text style={styles.actionText}>⟳</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => remove(item.id)} style={styles.actionBtn}><Text style={styles.actionText}>🗑️</Text></TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>Aucun Zikr. Ajoute-en un !</Text>}
      />
      <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
        <Text style={styles.addBtnText}>+ Nouveau Zikr</Text>
      </TouchableOpacity>
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Créer un Zikr</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom du Zikr"
              value={newZikrName}
              onChangeText={setNewZikrName}
            />
            <TextInput
              style={styles.input}
              placeholder="Nombre de Zikr"
              value={String(newZikrCount)}
              onChangeText={v => setNewZikrCount(Number(v.replace(/[^0-9]/g, '')))}
              keyboardType="numeric"
              maxLength={4}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={addZikr}>
              <Text style={styles.saveBtnText}>Enregistrer</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 8 }}>
              <Text style={{ color: colors.primary }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={!!activeZikr} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modalCard, { width: 320, alignItems: 'center' }]}> 
            <Text style={[styles.modalTitle, { fontSize: 22 }]}>{activeZikr?.name}</Text>
            <Text style={{ fontSize: 48, fontWeight: 'bold', color: colors.primary, marginVertical: 18 }}>{activeZikr?.count} / {activeZikr?.max}</Text>
            <TouchableOpacity style={[styles.saveBtn, { marginBottom: 12, width: 120, alignItems: 'center' }]} onPress={() => {
              if (activeZikr && activeZikr.count < activeZikr.max) {
                setZikrs(zikrs.map(z => z.id === activeZikr.id ? { ...z, count: z.count + 1 } : z));
                setActiveZikr(activeZikr && activeZikr.count + 1 < activeZikr.max ? { ...activeZikr, count: activeZikr.count + 1 } : activeZikr);
              }
            }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 22 }}>+1</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#FFD700', marginBottom: 8, width: 120, alignItems: 'center' }]} onPress={() => {
              if (activeZikr) {
                setZikrs(zikrs.map(z => z.id === activeZikr.id ? { ...z, count: 0 } : z));
                setActiveZikr({ ...activeZikr, count: 0 });
              }
            }}>
              <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>Réinitialiser</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveZikr(null)} style={{ marginTop: 8 }}>
              <Text style={{ color: colors.primary }}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F5F7' },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.primary, margin: 20, marginBottom: 10 },
  card: { backgroundColor: colors.primary, borderRadius: 18, padding: 18, marginBottom: 18, flexDirection: 'row', alignItems: 'center', elevation: 3 },
  zikrName: { color: colors.white, fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  zikrCount: { color: '#fff', fontSize: 13, marginBottom: 6 },
  progressBarBg: { backgroundColor: '#fff', height: 6, borderRadius: 3, width: '100%', marginBottom: 6 },
  progressBar: { backgroundColor: '#FFD700', height: 6, borderRadius: 3 },
  actions: { flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  actionBtn: { backgroundColor: '#fff', borderRadius: 16, padding: 6, marginHorizontal: 2 },
  actionText: { color: colors.primary, fontWeight: 'bold', fontSize: 18 },
  addBtn: { backgroundColor: colors.primary, borderRadius: 24, paddingVertical: 14, paddingHorizontal: 32, alignSelf: 'center', margin: 18, elevation: 2 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#fff', borderRadius: 18, padding: 28, width: 300, alignItems: 'center', elevation: 6 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.primary, marginBottom: 18 },
  input: { backgroundColor: '#F3F5F7', borderRadius: 10, padding: 10, width: '100%', marginBottom: 12, fontSize: 15 },
  saveBtn: { backgroundColor: colors.primary, borderRadius: 18, paddingVertical: 10, paddingHorizontal: 32, marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
}); 