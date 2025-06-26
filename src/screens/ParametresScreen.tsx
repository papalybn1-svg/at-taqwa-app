import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import React, { useContext, useState } from 'react';
import { Alert, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import colors from '../theme/colors';
import { auth } from './firebaseConfig';
import { AuthContext } from './LoginScreen';

export default function ParametresScreen() {
  const { user, setUser } = useContext(AuthContext);
  const { logout } = useAuth();
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
    } catch (e) {
      console.error('❌ Erreur mise à jour nom:', e);
    }
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
    } catch (e) {
      console.error('❌ Erreur reset password:', e);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        {
          text: "Déconnexion",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              console.log('✅ Déconnexion réussie depuis les paramètres');
            } catch (error) {
              console.error('❌ Erreur déconnexion:', error);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <Text style={styles.headerSubtitle}>Gérez votre profil et vos préférences</Text>
      </View>

      <View style={styles.profileContainer}>
        <TouchableOpacity onPress={() => setProfileModal(true)}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
            <MaterialCommunityIcons name="account-circle" size={80} color={colors.primary} />
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.profileName}>{user?.displayName || 'Utilisateur'}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
        <View style={styles.userBadge}>
          <MaterialCommunityIcons 
            name={user?.role === 'admin' ? 'shield-account' : 'account'} 
            size={16} 
            color={user?.role === 'admin' ? '#d4af37' : colors.primary} 
          />
          <Text style={[styles.userRole, { color: user?.role === 'admin' ? '#d4af37' : colors.primary }]}>
            {user?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={() => setProfileModal(true)}>
          <MaterialCommunityIcons name="account-edit" size={22} color={colors.primary} />
          <Text style={styles.rowText}>Modifier le profil</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.placeholder} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={() => setModalPwd(true)}>
          <MaterialCommunityIcons name="lock-reset" size={22} color={colors.primary} />
          <Text style={styles.rowText}>Changer le mot de passe</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.placeholder} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.row, styles.logoutRow]} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={22} color="#f44336" />
          <Text style={[styles.rowText, { color: '#f44336' }]}>Déconnexion</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#f44336" />
        </TouchableOpacity>
      </View>

      {/* Modal modification profil */}
      <Modal visible={profileModal} transparent animationType="fade" onRequestClose={() => setProfileModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifier le profil</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Nom d'utilisateur" 
              value={editName} 
              onChangeText={setEditName} 
            />
            <TextInput 
              style={styles.input} 
              placeholder="URL de la photo" 
              value={editPhoto} 
              onChangeText={setEditPhoto} 
            />
            <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
              <MaterialCommunityIcons name="camera" size={20} color={colors.primary} />
              <Text style={styles.imagePickerText}>Choisir une photo</Text>
            </TouchableOpacity>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setProfileModal(false)}
              >
                <Text style={styles.modalButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.sendButton]} 
                onPress={handleUpdateName}
                disabled={loading}
              >
                <Text style={styles.modalButtonText}>
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal changer mot de passe */}
      <Modal visible={modalPwd} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <MaterialCommunityIcons name="lock-reset" size={48} color={colors.primary} style={{ marginBottom: 16 }} />
            <Text style={styles.modalTitle}>Changer le mot de passe</Text>
            <Text style={styles.modalSubtitle}>
              Un email de réinitialisation sera envoyé à{'\n'}
              <Text style={{ fontWeight: 'bold' }}>{user?.email}</Text>
            </Text>
            <TouchableOpacity 
              style={[styles.modalButton, styles.sendButton]} 
              onPress={handleResetPassword} 
              disabled={loading}
            >
              <Text style={styles.modalButtonText}>
                {loading ? 'Envoi...' : "Envoyer l'email"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalPwd(false)} style={styles.cancelTextButton}>
              <Text style={styles.cancelTextButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Toast email envoyé */}
      {emailSent && (
        <View style={styles.toastSuccess}>
          <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} />
          <Text style={styles.toastText}>Email de réinitialisation envoyé !</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', backgroundColor: '#F3F5F7', paddingTop: 40 },
  header: { alignItems: 'center', marginBottom: 30 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#174C3C', marginBottom: 8 },
  headerSubtitle: { fontSize: 16, color: '#174C3C', textAlign: 'center' },
  profileContainer: { alignItems: 'center', marginBottom: 30 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 10, backgroundColor: '#E7C97B' },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, marginBottom: 10, backgroundColor: '#E7C97B', justifyContent: 'center', alignItems: 'center' },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#174C3C', marginBottom: 2 },
  profileEmail: { fontSize: 16, color: '#174C3C', marginBottom: 2 },
  userBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  userRole: { fontSize: 16, color: '#174C3C', marginLeft: 8 },
  section: { width: '90%', backgroundColor: '#fff', borderRadius: 18, padding: 18, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee', justifyContent: 'space-between' },
  rowText: { fontSize: 16, color: '#174C3C', marginLeft: 14, fontWeight: 'bold', flex: 1 },
  logoutRow: { borderBottomWidth: 0 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 18, padding: 28, width: 300, alignItems: 'center', elevation: 6 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#174C3C', marginBottom: 18 },
  input: { backgroundColor: '#F3F5F7', borderRadius: 10, padding: 10, width: '100%', marginBottom: 12, fontSize: 15 },
  imagePickerButton: { backgroundColor: '#E7C97B', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 32, marginTop: 12 },
  imagePickerText: { color: '#174C3C', fontWeight: 'bold', fontSize: 15 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 12 },
  modalButton: { backgroundColor: '#174C3C', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 32 },
  cancelButton: { backgroundColor: '#f44336' },
  sendButton: { backgroundColor: '#E7C97B' },
  modalButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#fff', borderRadius: 18, padding: 28, width: 300, alignItems: 'center', elevation: 6 },
  modalSubtitle: { color: '#174C3C', textAlign: 'center', marginBottom: 12 },
  cancelTextButton: { backgroundColor: '#f44336', borderRadius: 18, paddingVertical: 10, paddingHorizontal: 32, marginTop: 12 },
  cancelTextButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  toastSuccess: { position: 'absolute', bottom: 30, left: 30, right: 30, backgroundColor: '#E7C97B', borderRadius: 12, padding: 14, alignItems: 'center', elevation: 4 },
  toastText: { color: '#174C3C', fontWeight: 'bold', fontSize: 16 },
}); 