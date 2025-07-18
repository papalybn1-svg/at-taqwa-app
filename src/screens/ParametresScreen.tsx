import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useContext, useState } from 'react';
import { Alert, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import colors from '../theme/colors';
import { auth, db, storage } from './firebaseConfig';
import { AuthContext } from './LoginScreen';

export default function ParametresScreen() {
  const { user: contextUser, setUser } = useContext(AuthContext);
  const { logout } = useAuth();
  
  // Utiliser l'utilisateur Firebase Auth directement
  const firebaseUser = auth.currentUser;
  const [editName, setEditName] = useState(firebaseUser?.displayName || '');
  const [editPhoto, setEditPhoto] = useState(firebaseUser?.photoURL || '');
  const [profileModal, setProfileModal] = useState(false);
  const [modalPwd, setModalPwd] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);



  const uploadImage = async (uri: string) => {
    setLoading(true);
    try {
      // Vérifier que l'utilisateur est connecté
      if (!firebaseUser || !firebaseUser.uid) {
        throw new Error('Utilisateur non connecté');
      }

      console.log('📤 Début traitement image...');
      console.log('🔗 URI image:', uri);
      
      // Pour l'instant, on utilise l'URI local comme URL
      // En production, cela sera remplacé par Firebase Storage
      const imageURL = uri;
      
      console.log('🔗 URL finale:', imageURL);
      
      // Mettre à jour l'état local
      setEditPhoto(imageURL);
      
      // Utilisateur Firebase réel - mettre à jour Firebase Auth
      await updateProfile(firebaseUser, { photoURL: imageURL });
      
      // Mettre à jour le contexte aussi
      if (contextUser) {
        const updatedContextUser = { ...contextUser, photoURL: imageURL };
        setUser(updatedContextUser);
      }
      
      // Mettre à jour Firestore aussi
      await updateDoc(doc(db, 'users', firebaseUser.uid), { 
        photoURL: imageURL,
        updatedAt: new Date()
      });
      console.log('✅ Firebase Auth et Firestore mis à jour');
      
      console.log('✅ Profil mis à jour avec succès');
      Alert.alert('Succès', 'Photo de profil mise à jour avec succès !');
    } catch (e) {
      console.error('❌ Erreur upload image:', e);
      let errorMessage = "Impossible de mettre à jour la photo. Veuillez réessayer.";
      
      if (e instanceof Error) {
        if (e.message.includes('auth/network-request-failed')) {
          errorMessage = "Erreur de réseau. Vérifiez votre connexion internet.";
        } else if (e.message.includes('auth/requires-recent-login')) {
          errorMessage = "Session expirée. Veuillez vous reconnecter.";
        } else if (e.message.includes('getIdToken')) {
          errorMessage = "Erreur d'authentification. Veuillez vous reconnecter.";
        }
      }
      
      Alert.alert('Erreur', errorMessage);
    }
    setLoading(false);
  };

  const takePhoto = async () => {
    try {
      // Demander les permissions caméra
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la caméra pour prendre une photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur caméra:', error);
      Alert.alert('Erreur', 'Impossible d\'accéder à la caméra.');
    }
  };

  const pickImage = async () => {
    try {
      // Demander les permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à votre galerie pour sélectionner une photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur sélection image:', error);
      Alert.alert('Erreur', 'Impossible d\'accéder à la galerie.');
    }
  };

  const handleUpdateName = async () => {
    setLoading(true);
    try {
      if (firebaseUser && editName.trim()) {
        console.log('📝 Mise à jour du nom:', editName);
        console.log('👤 Utilisateur actuel:', firebaseUser.uid);
        
        // Utilisateur Firebase réel - mettre à jour Firebase Auth
        await updateProfile(firebaseUser, { displayName: editName });
        console.log('✅ Firebase Auth mis à jour');
        
        // Mettre à jour le contexte aussi
        if (contextUser) {
          const updatedContextUser = { ...contextUser, displayName: editName };
          setUser(updatedContextUser);
          console.log('✅ Contexte mis à jour');
        }
        
        // Mettre à jour Firestore
        await updateDoc(doc(db, 'users', firebaseUser.uid), { 
          displayName: editName,
          updatedAt: new Date()
        });
        console.log('✅ Firestore mis à jour');
        
        setProfileModal(false);
        Alert.alert('Succès', 'Profil mis à jour avec succès !');
      }
    } catch (e) {
      console.error('❌ Erreur mise à jour nom:', e);
      let errorMessage = 'Impossible de mettre à jour le profil. Veuillez réessayer.';
      
      if (e instanceof Error) {
        if (e.message.includes('auth/network-request-failed')) {
          errorMessage = 'Erreur de réseau. Vérifiez votre connexion internet.';
        } else if (e.message.includes('auth/requires-recent-login')) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        } else if (e.message.includes('getIdToken')) {
          errorMessage = 'Erreur d\'authentification. Veuillez vous reconnecter.';
        }
      }
      
      Alert.alert('Erreur', errorMessage);
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    setLoading(true);
    try {
      if (firebaseUser?.email) {
        console.log('📧 Envoi email réinitialisation à:', firebaseUser.email);
        
        // Utiliser Firebase Auth par défaut (solution stable)
        await sendPasswordResetEmail(auth, firebaseUser.email);
        console.log('✅ Email de réinitialisation envoyé avec succès');
        
        setEmailSent(true);
        setModalPwd(false);
        
        // Masquer le toast après 3 secondes
        setTimeout(() => {
          setEmailSent(false);
        }, 3000);
        
        // Afficher un message informatif
        Alert.alert(
          'Email envoyé !', 
          'Un email de réinitialisation a été envoyé à votre adresse. Vérifiez votre boîte de réception et le dossier spam.',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('Email utilisateur non disponible');
      }
    } catch (e) {
      console.error('❌ Erreur reset password:', e);
      let errorMessage = 'Impossible d\'envoyer l\'email de réinitialisation. Veuillez réessayer.';
      
      if (e instanceof Error) {
        if (e.message.includes('auth/user-not-found')) {
          errorMessage = 'Aucun compte trouvé avec cet email.';
        } else if (e.message.includes('auth/too-many-requests')) {
          errorMessage = 'Trop de tentatives. Veuillez attendre avant de réessayer.';
        } else if (e.message.includes('auth/network-request-failed')) {
          errorMessage = 'Erreur de réseau. Vérifiez votre connexion internet.';
        } else if (e.message.includes('auth/invalid-email')) {
          errorMessage = 'Adresse email invalide.';
        }
      }
      
      Alert.alert('Erreur', errorMessage);
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
          {contextUser?.photoURL ? (
            <Image source={{ uri: contextUser.photoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
            <MaterialCommunityIcons name="account-circle" size={80} color={colors.primary} />
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.profileName}>{contextUser?.displayName || 'Utilisateur'}</Text>
        <Text style={styles.profileEmail}>{contextUser?.email}</Text>
        <View style={styles.userBadge}>
          <MaterialCommunityIcons 
            name={contextUser?.role === 'admin' ? 'shield-account' : 'account'} 
            size={16} 
            color={contextUser?.role === 'admin' ? '#d4af37' : colors.primary} 
          />
          <Text style={[styles.userRole, { color: contextUser?.role === 'admin' ? '#d4af37' : colors.primary }]}>
            {contextUser?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
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
            
            {/* Champ nom d'utilisateur */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nom d'utilisateur</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Entrez votre nom" 
                value={editName} 
                onChangeText={setEditName}
                placeholderTextColor={colors.placeholder}
              />
            </View>

            {/* Boutons pour la photo */}
            <View style={styles.imageButtonsContainer}>
              <TouchableOpacity style={styles.imageButton} onPress={takePhoto} disabled={loading}>
                <MaterialCommunityIcons name="camera" size={20} color={colors.primary} />
                <Text style={styles.imageButtonText}>Caméra</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageButton} onPress={pickImage} disabled={loading}>
                <MaterialCommunityIcons name="image" size={20} color={colors.primary} />
                <Text style={styles.imageButtonText}>Galerie</Text>
              </TouchableOpacity>
            </View>

            {/* Indicateur de chargement */}
            {loading && (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Téléversement en cours...</Text>
              </View>
            )}
            
            {/* Aperçu de la photo sélectionnée */}
            {(editPhoto || contextUser?.photoURL) && (
              <View style={styles.imagePreviewContainer}>
                <Image 
                  source={{ uri: editPhoto || contextUser?.photoURL || '' }} 
                  style={styles.imagePreview} 
                />
                <Text style={styles.imagePreviewText}>
                  {editPhoto ? 'Nouvelle photo' : 'Photo actuelle'}
                </Text>
              </View>
            )}

            {/* Boutons d'action */}
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setProfileModal(false)}
                disabled={loading}
              >
                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleUpdateName}
                disabled={loading || !editName.trim()}
              >
                <Text style={[styles.modalButtonText, styles.saveButtonText]}>
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal changer mot de passe */}
      <Modal visible={modalPwd} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons name="lock-reset" size={48} color={colors.primary} style={{ marginBottom: 16 }} />
            <Text style={styles.modalTitle}>Changer le mot de passe</Text>
            <Text style={styles.modalSubtitle}>
              Un email de réinitialisation sera envoyé à{'\n'}
              <Text style={{ fontWeight: 'bold', color: colors.primary }}>{contextUser?.email}</Text>
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setModalPwd(false)}
                disabled={loading}
              >
                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>Annuler</Text>
              </TouchableOpacity>
                          <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]} 
              onPress={handleResetPassword} 
              disabled={loading || !firebaseUser?.email}
            >
              <Text style={[styles.modalButtonText, styles.saveButtonText]}>
                {loading ? 'Envoi...' : "Envoyer l'email"}
              </Text>
            </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast email envoyé */}
      {emailSent && (
        <View style={styles.toastSuccess}>
          <MaterialCommunityIcons name="check-circle" size={24} color={colors.white} />
          <Text style={styles.toastText}>Email de réinitialisation envoyé !</Text>
          <MaterialCommunityIcons name="email-check" size={20} color={colors.white} style={{ marginLeft: 8 }} />
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
  modalContent: { backgroundColor: colors.white, borderRadius: 20, padding: 24, width: 320, maxHeight: '80%', elevation: 8, shadowColor: colors.black, shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primary, marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: colors.background, borderRadius: 12, padding: 14, width: '100%', fontSize: 16, borderWidth: 1, borderColor: colors.border },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 20 },
  modalButton: { borderRadius: 18, paddingVertical: 12, paddingHorizontal: 24, flex: 1, marginHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  cancelButton: { backgroundColor: '#DC3545' },
  saveButton: { backgroundColor: colors.secondary },
  modalButtonText: { fontWeight: 'bold', fontSize: 13 },
  modalSubtitle: { color: colors.primary, textAlign: 'center', marginBottom: 20, fontSize: 16, lineHeight: 22 },
  toastSuccess: { position: 'absolute', bottom: 30, left: 30, right: 30, backgroundColor: colors.primary, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: colors.black, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  toastText: { color: colors.white, fontWeight: 'bold', fontSize: 16, marginLeft: 8, marginRight: 8 },
  imagePreviewContainer: { alignItems: 'center', marginTop: 16, marginBottom: 12 },
  imagePreview: { width: 100, height: 100, borderRadius: 50, marginBottom: 8, backgroundColor: colors.secondary },
  imagePreviewText: { fontSize: 14, color: colors.primary, fontWeight: '500' },
  imageButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 16, marginBottom: 8 },
  imageButton: { backgroundColor: colors.secondary, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', flex: 1, marginHorizontal: 6 },
  imageButtonText: { color: colors.primary, fontWeight: 'bold', fontSize: 12, marginTop: 4 },
  loadingText: { color: colors.primary, fontSize: 14, marginTop: 8, fontStyle: 'italic' },
  inputContainer: { width: '100%', marginBottom: 16 },
  inputLabel: { fontSize: 14, color: colors.primary, marginBottom: 6, fontWeight: '600' },
  loadingContainer: { marginTop: 8, alignItems: 'center' },
  saveButtonText: { color: colors.primary },
  cancelButtonText: { color: colors.white },
}); 