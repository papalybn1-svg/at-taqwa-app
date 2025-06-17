import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { sendPasswordResetEmail, signOut, updateProfile } from 'firebase/auth';
import React, { useContext, useState } from 'react';
import { Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from './firebaseConfig';
import { AuthContext } from './LoginScreen';

export default function ParametresScreen() {
  const { user, setUser } = useContext(AuthContext);
  const [photo, setPhoto] = useState(user?.photoURL || null);
  const [editName, setEditName] = useState(false);
  const [newName, setNewName] = useState('');
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
      setPhoto(result.assets[0].uri);
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
      if (user && newName.trim()) {
        await updateProfile(user, { displayName: newName });
        setUser({ ...user, displayName: newName });
        setEditName(false);
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
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={pickImage} style={styles.avatarBtn}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatar} />
          ) : (
            <MaterialCommunityIcons name="account-circle" size={80} color="#E7C97B" style={styles.avatar} />
          )}
          <View style={styles.cameraIconBg}>
            <MaterialCommunityIcons name="camera" size={22} color="#174C3C" />
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{user?.displayName || user?.email}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>
      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={() => setEditName(true)}>
          <MaterialCommunityIcons name="account-edit" size={22} color="#174C3C" />
          <Text style={styles.rowText}>Modifier le nom</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={() => setModalPwd(true)}>
          <MaterialCommunityIcons name="lock-reset" size={22} color="#174C3C" />
          <Text style={styles.rowText}>Changer le mot de passe</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.row, { marginTop: 18 }]} onPress={async () => { await signOut(auth); setUser(null); }}>
          <MaterialCommunityIcons name="logout" size={22} color="#f44336" />
          <Text style={[styles.rowText, { color: '#f44336' }]}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
      {/* Modal modifier nom */}
      <Modal visible={editName} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Modifier le nom</Text>
            <TextInput style={styles.input} placeholder="Nouveau nom" value={newName} onChangeText={setNewName} />
            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateName} disabled={loading}>
              <Text style={styles.saveBtnText}>{loading ? '...' : 'Enregistrer'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditName(false)} style={{ marginTop: 8 }}>
              <Text style={{ color: '#174C3C' }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Modal changer mot de passe */}
      <Modal visible={modalPwd} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Changer le mot de passe</Text>
            <Text style={{ color: '#174C3C', marginBottom: 12 }}>Un email de réinitialisation sera envoyé à {user?.email}</Text>
            <TouchableOpacity style={styles.saveBtn} onPress={handleResetPassword} disabled={loading}>
              <Text style={styles.saveBtnText}>{loading ? '...' : "Envoyer l'email"}</Text>
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
  avatarContainer: { alignItems: 'center', marginBottom: 30 },
  avatarBtn: { position: 'relative' },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 10, backgroundColor: '#E7C97B' },
  cameraIconBg: { position: 'absolute', bottom: 8, right: 2, backgroundColor: '#fff', borderRadius: 16, padding: 3, elevation: 2 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#174C3C', marginBottom: 2 },
  email: { fontSize: 15, color: '#888', marginBottom: 8 },
  section: { width: '90%', backgroundColor: '#fff', borderRadius: 18, padding: 18, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rowText: { fontSize: 16, color: '#174C3C', marginLeft: 14, fontWeight: 'bold' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#fff', borderRadius: 18, padding: 28, width: 300, alignItems: 'center', elevation: 6 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#174C3C', marginBottom: 18 },
  input: { backgroundColor: '#F3F5F7', borderRadius: 10, padding: 10, width: '100%', marginBottom: 12, fontSize: 15 },
  saveBtn: { backgroundColor: '#174C3C', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 32, marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  toastSuccess: { position: 'absolute', bottom: 30, left: 30, right: 30, backgroundColor: '#E7C97B', borderRadius: 12, padding: 14, alignItems: 'center', elevation: 4 },
  toastText: { color: '#174C3C', fontWeight: 'bold', fontSize: 16 },
}); 