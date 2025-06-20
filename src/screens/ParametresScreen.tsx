import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { sendPasswordResetEmail, signOut, updateProfile } from 'firebase/auth';
import React, { useContext, useState } from 'react';
import { Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import colors from '../theme/colors';
import { auth } from './firebaseConfig';
import { AuthContext } from './LoginScreen';

export default function ParametresScreen() {
  const { user, setUser } = useContext(AuthContext);
  const [editName, setEditName] = useState(user?.displayName || '');
  const [editPhoto, setEditPhoto] = useState(user?.photoURL || '');
  const [profileModal, setProfileModal] = useState(false);
  const [modalPwd, setModalPwd] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setEditPhoto(result.assets[0].uri);
      // Mettre à jour le profil Firebase (photoURL)
      if (user) {
        await updateProfile(user, { photoURL: result.assets[0].uri });
        setUser({ ...user, photoURL: result.assets[0].uri });
      }
    }
  };

  const handleUpdateName = async () => {
    setLoading(true);
    try {
      if (user && editName.trim()) {
        await updateProfile(user, { displayName: editName });
        setUser({ ...user, displayName: editName });
        setProfileModal(false);
      }
    } catch (e) {}
    setLoading(false);
  };

  const handleResetPassword = async () => {
    setLoading(true);
    try {
      if (user?.email) {
        await sendPasswordResetEmail(auth, user.email);
        setEmailSent(true);
        setModalPwd(false);
      }
    } catch (e) {}
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileContainer}>
        <TouchableOpacity onPress={() => setProfileModal(true)}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <MaterialCommunityIcons name="account-circle" size={80} color={colors.primary} />
          )}
        </TouchableOpacity>
        <Text style={styles.profileName}>{user?.displayName || user?.email}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={async () => {
          await signOut(auth);
          setUser(null);
        }}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={() => setProfileModal(true)}>
          <MaterialCommunityIcons name="account-edit" size={22} color="#174C3C" />
          <Text style={styles.rowText}>Modifier le nom</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={() => setModalPwd(true)}>
          <MaterialCommunityIcons name="lock-reset" size={22} color="#174C3C" />
          <Text style={styles.rowText}>Changer le mot de passe</Text>
        </TouchableOpacity>
      </View>
      {/* Modal modification profil */}
      <Modal visible={profileModal} transparent animationType="fade" onRequestClose={() => setProfileModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifier le profil</Text>
            <TextInput style={styles.input} placeholder="Nom d'utilisateur" value={editName} onChangeText={setEditName} />
            <TextInput style={styles.input} placeholder="URL de la photo" value={editPhoto} onChangeText={setEditPhoto} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setProfileModal(false)}>
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.sendButton]} onPress={handleUpdateName}>
                <Text style={styles.modalButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Modal changer mot de passe */}
      <Modal visible={modalPwd} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Changer le mot de passe</Text>
            <Text style={{ color: '#174C3C', marginBottom: 12 }}>Un email de réinitialisation sera envoyé à {user?.email}</Text>
            <TouchableOpacity style={[styles.modalButton, styles.sendButton]} onPress={handleResetPassword} disabled={loading}>
              <Text style={styles.modalButtonText}>{loading ? '...' : "Envoyer l'email"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalPwd(false)} style={{ marginTop: 8 }}>
              <Text style={{ color: '#174C3C' }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Toast email envoyé */}
      {emailSent && (
        <View style={styles.toastSuccess}><Text style={styles.toastText}>Email envoyé !</Text></View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', backgroundColor: '#F3F5F7', paddingTop: 40 },
  profileContainer: { alignItems: 'center', marginBottom: 30 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 10, backgroundColor: '#E7C97B' },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#174C3C', marginBottom: 2 },
  logoutButton: { backgroundColor: '#f44336', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 32, marginTop: 8 },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  section: { width: '90%', backgroundColor: '#fff', borderRadius: 18, padding: 18, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowText: { fontSize: 16, color: '#174C3C', marginLeft: 14, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 18, padding: 28, width: 300, alignItems: 'center', elevation: 6 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#174C3C', marginBottom: 18 },
  input: { backgroundColor: '#F3F5F7', borderRadius: 10, padding: 10, width: '100%', marginBottom: 12, fontSize: 15 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 12 },
  modalButton: { backgroundColor: '#174C3C', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 32 },
  cancelButton: { backgroundColor: '#f44336' },
  sendButton: { backgroundColor: '#E7C97B' },
  modalButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#fff', borderRadius: 18, padding: 28, width: 300, alignItems: 'center', elevation: 6 },
  toastSuccess: { position: 'absolute', bottom: 30, left: 30, right: 30, backgroundColor: '#E7C97B', borderRadius: 12, padding: 14, alignItems: 'center', elevation: 4 },
  toastText: { color: '#174C3C', fontWeight: 'bold', fontSize: 16 },
}); 