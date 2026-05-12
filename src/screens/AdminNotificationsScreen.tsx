import { MaterialCommunityIcons } from '@expo/vector-icons';
import { addDoc, collection, deleteDoc, doc, getDocs, getFirestore, serverTimestamp, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal, RefreshControl,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthContext } from '../contexts/AuthContext';
import colors from '../theme/colors';

interface Notification {
  id: string;
  title: string;
  message: string;
  target: 'all' | 'users' | 'admins';
  createdAt: any;
  isActive: boolean;
  authorName?: string;
  targetUsers?: 'all' | 'users' | 'admins';
}

type NewNotification = Omit<Notification, 'id' | 'createdAt'>;

export default function AdminNotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info',
    authorName: '',
    targetUsers: 'all',
    isActive: true
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const db = getFirestore();
  const { user } = useAuthContext();

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'notifications'));
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
      setNotifications(notifs);
    } catch (error) {
      console.error("Erreur de chargement des notifications:", error);
      Alert.alert("Erreur", "Impossible de charger les notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications().then(() => setRefreshing(false));
  };

  const handleSave = async () => {
    if (!newNotification.title || !newNotification.message) {
      Alert.alert("Champs requis", "Le titre et le message sont obligatoires.");
      return;
    }

    try {
      // Récupérer automatiquement le nom de l'admin connecté
      const adminName = user?.displayName || user?.email?.split('@')[0] || 'Admin';
      
      const notificationData = {
        ...newNotification,
        authorName: adminName, // Nom automatique de l'admin
        targetUsers: newNotification.targetUsers,
        createdAt: serverTimestamp()
      };

      if (editingNotification) {
        // Update
        const notifRef = doc(db, 'notifications', editingNotification.id);
        await updateDoc(notifRef, notificationData);
      } else {
        // Create
        await addDoc(collection(db, 'notifications'), notificationData);
      }
      setModalVisible(false);
      setEditingNotification(null);
      await loadNotifications();
      Alert.alert("Succès", `Notification ${editingNotification ? 'mise à jour' : 'créée'} avec succès.`);
    } catch (error) {
      console.error("Erreur de sauvegarde:", error);
      Alert.alert("Erreur", "La sauvegarde a échoué.");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Confirmer la suppression",
      "Êtes-vous sûr de vouloir supprimer cette notification ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer", style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'notifications', id));
              await loadNotifications();
              Alert.alert("Succès", "Notification supprimée.");
            } catch (error) {
              console.error("Erreur de suppression:", error);
              Alert.alert("Erreur", "La suppression a échoué.");
            }
          }
        }
      ]
    );
  };

  const openModal = (notif: Notification | null = null) => {
    if (notif) {
      setEditingNotification(notif);
      setNewNotification({
        title: notif.title,
        message: notif.message,
        type: 'info',
        authorName: notif.authorName || '',
        targetUsers: notif.targetUsers || 'all',
        isActive: notif.isActive
      });
    } else {
      setEditingNotification(null);
      setNewNotification({
        title: '',
        message: '',
        type: 'info',
        authorName: '',
        targetUsers: 'all',
        isActive: true
      });
    }
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <MaterialCommunityIcons name="plus" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {notifications.map(notif => (
          <View key={notif.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{notif.title}</Text>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => openModal(notif)}>
                  <MaterialCommunityIcons name="pencil" size={22} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(notif.id)}>
                  <MaterialCommunityIcons name="delete" size={22} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.cardMessage}>{notif.message}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardMeta}>Cible: {notif.targetUsers || notif.target}</Text>
              <Text style={styles.cardMeta}>
                Statut: {notif.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingNotification ? 'Modifier' : 'Nouvelle'} Notification</Text>
            <TextInput
              style={styles.input}
              placeholder="Titre"
              value={newNotification.title}
              onChangeText={(text) => setNewNotification(prev => ({ ...prev, title: text }))}
            />
            <TextInput
              style={[styles.input, { height: 100 }]}
              placeholder="Message"
              value={newNotification.message}
              onChangeText={(text) => setNewNotification(prev => ({ ...prev, message: text }))}
              multiline
            />
            <View style={styles.switchContainer}>
              <Text>Active</Text>
              <Switch
                value={newNotification.isActive}
                onValueChange={(val) => setNewNotification(prev => ({ ...prev, isActive: val }))}
                trackColor={{ false: "#767577", true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
            {/* Simple target selector for now */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, newNotification.targetUsers === 'all' && styles.buttonActive]}
                onPress={() => setNewNotification(prev => ({ ...prev, targetUsers: 'all' }))}
              >
                <Text style={[styles.buttonText, newNotification.targetUsers === 'all' && styles.buttonTextActive]}>Tous</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, newNotification.targetUsers === 'users' && styles.buttonActive]}
                onPress={() => setNewNotification(prev => ({ ...prev, targetUsers: 'users' }))}
              >
                <Text style={[styles.buttonText, newNotification.targetUsers === 'users' && styles.buttonTextActive]}>Utilisateurs</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, newNotification.targetUsers === 'admins' && styles.buttonActive]}
                onPress={() => setNewNotification(prev => ({ ...prev, targetUsers: 'admins' }))}
              >
                <Text style={[styles.buttonText, newNotification.targetUsers === 'admins' && styles.buttonTextActive]}>Admins</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSave}>
                <Text style={styles.modalButtonText}>Sauvegarder</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Annuler</Text>
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
  addButton: {
    backgroundColor: colors.primary,
    padding: 8,
    borderRadius: 50
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 16,
    margin: 16,
    marginBottom: 0,
    elevation: 1
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  actions: { flexDirection: 'row', gap: 15 },
  cardMessage: { fontSize: 16, color: colors.text, marginBottom: 10 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    marginTop: 10
  },
  cardMeta: { fontSize: 14, color: colors.gray },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    width: '90%',
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 20,
    elevation: 5
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: colors.primary },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20
  },
  button: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary
  },
  buttonActive: { backgroundColor: colors.primary },
  buttonText: { color: colors.primary, fontWeight: 'bold' },
  buttonTextActive: { color: colors.white },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center'
  },
  saveButton: { backgroundColor: colors.primary },
  cancelButton: { backgroundColor: colors.gray },
  modalButtonText: { color: colors.white, fontWeight: 'bold' }
}); 