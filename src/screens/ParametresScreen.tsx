import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import { Image as ExpoImage } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { deleteUser, sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import chaptersData from '../../data/chapitres.json';
import { useAuthContext } from '../contexts/AuthContext';
import { useResponsive, getResponsiveStyle } from '../hooks/useResponsive';
import colors from '../theme/colors';
import { cleanupUserQuizSessions, getQuizProfile } from '../utils/quizSession';
import { removeAllWithPrefix, remove as removeUserStorage } from '../utils/userStorage';
import { auth, db } from './firebaseConfig';
// (Préférences étendues retirées à la demande)

export default function ParametresScreen() {
  const responsive = useResponsive();
  const responsiveStyle = getResponsiveStyle(responsive);
  const dynamicStyles = createStyles(responsive, responsiveStyle);
  const { user: contextUser, setUser, logout } = useAuthContext();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  
  // Utiliser l'utilisateur Firebase Auth directement
  const firebaseUser = auth.currentUser;
  const [editName, setEditName] = useState(firebaseUser?.displayName || '');
  const [editPhoto, setEditPhoto] = useState(firebaseUser?.photoURL || '');
  const [profileModal, setProfileModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [isCertificateEligible, setIsCertificateEligible] = useState(false);
  // (États retirés: darkMode, langue, textScale, notifCount)
  // Vérifier l'éligibilité au certificat (tous les quiz avec données complètes)
  const checkCertificateEligibility = async (): Promise<boolean> => {
    try {
      const scores = (await readUserStorage<Record<string, number>>(firebaseUser?.uid, 'quizScores')) || {};
      const profile = firebaseUser?.uid ? await getQuizProfile(firebaseUser.uid) : null;
      const bestScores = profile?.bestScores || {};
      // Mapping statique des fichiers d'exercices (évite require dynamique non supporté par Metro)
      const exercicesFiles: { [key: string]: any[] | { quiz: any[] } } = {
        '1': require('../../data/exercices_par_chapitre/chapitre_1_exercices.json'),
        '2': require('../../data/exercices_par_chapitre/chapitre_2_exercices.json'),
        '3': require('../../data/exercices_par_chapitre/chapitre_3_exercices.json'),
        '4': require('../../data/exercices_par_chapitre/chapitre_4_exercices.json'),
        '5': require('../../data/exercices_par_chapitre/chapitre_5_exercices.json'),
        '6': require('../../data/exercices_par_chapitre/chapitre_6_exercices.json'),
        '7': require('../../data/exercices_par_chapitre/chapitre_7_exercices.json'),
        '8': require('../../data/exercices_par_chapitre/chapitre_8_exercices.json'),
        '9': require('../../data/exercices_par_chapitre/chapitre_9_execrcices.json'),
        '10': require('../../data/exercices_par_chapitre/chapitre_10_exercices.json'),
        '11': require('../../data/exercices_par_chapitre/chapitre_11_exercices.json'),
        '12': require('../../data/exercices_par_chapitre/chapitre_12_exercices.json'),
      };
      // Lister tous les chapitres qui ont des quiz
      const allChapters = Object.entries(chaptersData).flatMap(([_, partie]: any) =>
        partie.chapitres.map((ch: any) => {
          const numKey = String(parseInt(ch.image, 10));
          const data = exercicesFiles[numKey];
          const hasQuiz = Array.isArray(data)
            ? data.length > 0
            : (data && typeof data === 'object' && 'quiz' in data && Array.isArray((data as any).quiz) && (data as any).quiz.length > 0);
          return hasQuiz ? numKey : null;
        })
      ).filter((k: string | null): k is string => !!k);
      if (allChapters.length === 0) return false;
      
      // Calculer la moyenne de tous les quiz
      let totalScore = 0;
      let completedCount = 0;
      
      for (const key of allChapters) {
        const score = (scores as any)[key] ?? (bestScores as any)[key];
        if (score !== undefined) {
          completedCount++;
          totalScore += score;
        } else {
          // Si un quiz n'est pas complété, pas éligible
          console.log(`❌ Quiz ${key} non complété - attestation non disponible`);
          return false;
        }
      }
      
      // Vérifier que tous les quiz sont complétés et que la moyenne est >= 80%
      const averageScore = completedCount > 0 ? totalScore / completedCount : 0;
      const isEligible = completedCount === allChapters.length && averageScore >= 80;
      console.log(`📊 Vérification attestation (Paramètres): ${completedCount}/${allChapters.length} quiz complétés, moyenne: ${averageScore.toFixed(1)}%, éligible: ${isEligible}`);
      return isEligible;
    } catch {
      return false;
    }
  };

  // Charger la photo de profil depuis Firestore ou le contexte
  useEffect(() => {
    const loadPhoto = async () => {
      // D'abord, utiliser la photo du contexte utilisateur si disponible
      if (contextUser?.photoURL) {
        setEditPhoto(contextUser.photoURL);
        return;
      }
      
      // Sinon, charger depuis Firestore
      if (firebaseUser?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.data();
          if (userData?.photoURL) {
            setEditPhoto(userData.photoURL);
            // Mettre à jour le contexte utilisateur aussi
            if (contextUser) {
              setUser({ ...contextUser, photoURL: userData.photoURL });
            }
          }
        } catch (error) {
          console.error('❌ Erreur chargement photo Firestore:', error);
        }
      }
    };
    loadPhoto();
  }, [firebaseUser?.uid, contextUser?.photoURL]);

  // Vérifier l'éligibilité au chargement et quand l'écran devient actif
  useEffect(() => {
    const checkEligibility = async () => {
      if (firebaseUser?.uid) {
        const eligible = await checkCertificateEligibility();
        setIsCertificateEligible(eligible);
      }
    };
    checkEligibility();
  }, [firebaseUser?.uid]);

  useFocusEffect(
    useCallback(() => {
      const loadPhotoAndCheckEligibility = async () => {
        // Recharger la photo depuis Firestore si nécessaire
        if (firebaseUser?.uid && !contextUser?.photoURL) {
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            const userData = userDoc.data();
            if (userData?.photoURL) {
              setEditPhoto(userData.photoURL);
              if (contextUser) {
                setUser({ ...contextUser, photoURL: userData.photoURL });
              }
            }
          } catch (error) {
            console.error('❌ Erreur chargement photo Firestore:', error);
          }
        } else if (contextUser?.photoURL) {
          setEditPhoto(contextUser.photoURL);
        }
        
        // Vérifier l'éligibilité
        if (firebaseUser?.uid) {
          const eligible = await checkCertificateEligibility();
          setIsCertificateEligible(eligible);
        }
      };
      loadPhotoAndCheckEligibility();
    }, [firebaseUser?.uid, contextUser?.photoURL])
  );

  const handleOpenCertificate = () => {
    // Naviguer directement vers le CertificateScreen
    // Le CertificateScreen gérera l'affichage si l'utilisateur n'est pas éligible
    navigation.navigate('Accueil', { screen: 'Certificate' });
  };




  const uploadImage = async (uri: string, mimeType?: string, base64Data?: string | null) => {
    setLoading(true);
    try {
      // Vérifier que l'utilisateur est connecté
      if (!firebaseUser || !firebaseUser.uid) {
        throw new Error('Utilisateur non connecté');
      }

      console.log('📤 Préparation image (mode sans Storage)...');
      // Assurer un base64 fiable, compressé et redimensionné pour éviter les crashs mémoire
      let b64 = base64Data || null;
      let finalMime = 'image/jpeg';
      try {
        const manipulated = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: 512, height: 512 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        b64 = manipulated.base64 || b64;
        finalMime = 'image/jpeg';
      } catch (manipErr) {
        console.warn('⚠️ Échec de la manipulation d’image, fallback lecture brute:', manipErr);
        if (!b64) {
          b64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });
          finalMime = mimeType || 'image/jpeg';
        }
      }
      if (!b64) throw new Error('Conversion base64 échouée');
      const dataUrl = `data:${finalMime};base64,${b64}`;
      
      // Mettre à jour localement et dans le contexte
      setEditPhoto(dataUrl);
      if (contextUser) setUser({ ...contextUser, photoURL: dataUrl });

      // Stocker dans Firestore uniquement (pas de Storage, pas d’Auth photoURL)
      await updateDoc(doc(db, 'users', firebaseUser.uid), { 
        photoURL: dataUrl,
        updatedAt: new Date(),
        _photoStorage: 'inline'
      });
      console.log('✅ Photo de profil stockée en Data URL dans Firestore');
      Alert.alert('Succès', 'Photo de profil mise à jour !');
    } catch (e: any) {
      console.error('❌ Erreur upload image:', e);
      if (e && e.code) console.error('🔎 Code Storage:', e.code);
      if (e && e.customData) console.error('🔎 Détails Storage:', e.customData);
      let errorMessage = "Impossible de traiter la photo. Veuillez réessayer.";
      
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
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0] as any;
        await uploadImage(asset.uri, asset.mimeType || 'image/jpeg', asset.base64 || null);
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
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0] as any;
        await uploadImage(asset.uri, asset.mimeType || 'image/jpeg', asset.base64 || null);
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



  const handleSendResetEmail = async () => {
    try {
      if (!firebaseUser?.email) {
        Alert.alert('Erreur', "Impossible d'envoyer l'email: utilisateur non connecté.");
        return;
      }
      setSendingReset(true);
      await sendPasswordResetEmail(auth, firebaseUser.email);
      Alert.alert('Email envoyé', `Un lien de réinitialisation a été envoyé à ${firebaseUser.email}.`);
    } catch (e: any) {
      console.error('❌ Erreur envoi email reset:', e);
      let msg = "Impossible d'envoyer l'email. Veuillez réessayer.";
      if (e?.code === 'auth/invalid-email') msg = 'Adresse email invalide.';
      if (e?.code === 'auth/user-not-found') msg = "Aucun compte trouvé pour cette adresse.";
      if (e?.code === 'auth/too-many-requests') msg = 'Trop de tentatives, réessayez plus tard.';
      if (e?.code === 'auth/network-request-failed') msg = 'Erreur réseau. Vérifiez votre connexion.';
      Alert.alert('Erreur', msg);
    } finally {
      setSendingReset(false);
    }
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

  const handleDeleteAccount = async () => {
    const current = auth.currentUser;
    if (!current) {
      Alert.alert('Erreur', 'Aucun utilisateur connecté.');
      return;
    }
    Alert.alert(
      'Supprimer mon compte',
      "Cette action est définitive et supprimera vos données de profil (y compris l'avatar) et votre accès à l’application. Voulez‑vous continuer ?",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const uid = current.uid;
              
              // 1. Nettoyer toutes les données utilisateur locales (AsyncStorage)
              try {
                console.log('🧹 Nettoyage des données locales pour l\'utilisateur:', uid);
                await Promise.all([
                  removeUserStorage(uid, 'chapterProgress'),
                  removeUserStorage(uid, 'favorites'),
                  removeUserStorage(uid, 'quizScores'),
                  removeUserStorage(uid, 'zikrProgress'),
                  removeUserStorage(uid, 'entitlements'),
                  removeUserStorage(uid, 'payment_token'),
                ]);
                await removeAllWithPrefix(uid, 'quizSession:');
                await cleanupUserQuizSessions(uid);
                console.log('✅ Données locales nettoyées');
              } catch (cleanupError) {
                console.error('⚠️ Erreur lors du nettoyage des données locales (non-bloquant):', cleanupError);
                // Continuer même si le nettoyage échoue
              }
              
              // 2. Supprimer les données de profil Firestore
              try {
                await deleteDoc(doc(db, 'users', uid));
                console.log('✅ Document Firestore supprimé');
              } catch (e) {
                // ignorer si déjà supprimé / permissions limitées
                console.log('ℹ️ Document Firestore déjà supprimé ou inexistant');
              }
              
              // 3. Supprimer le compte Auth (peut exiger une reconnexion récente)
              try {
                await deleteUser(current);
                console.log('✅ Compte Firebase Auth supprimé');
              } catch (e: any) {
                if (e?.code === 'auth/requires-recent-login') {
                  Alert.alert(
                    'Reconnexion requise',
                    'Pour confirmer la suppression, veuillez vous reconnecter puis réessayer.',
                    [{ text: 'OK' }]
                  );
                  await logout();
                  return;
                }
                throw e;
              }
              
              // 4. Mettre à jour le contexte et déconnecter
              setUser(null);
              Alert.alert('Compte supprimé', 'Votre compte a été définitivement supprimé.');
              await logout();
            } catch (err: any) {
              console.error('❌ Erreur lors de la suppression du compte:', err);
              Alert.alert(
                'Erreur',
                err?.message || "La suppression du compte a échoué. Veuillez réessayer plus tard."
              );
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[dynamicStyles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={dynamicStyles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* En-tête retiré à la demande */}

        {/* Carte profil */}
        <LinearGradient colors={['#174C3C', '#19514A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={dynamicStyles.profileCard}>
          <View style={dynamicStyles.profileContent}>
            <TouchableOpacity onPress={() => setProfileModal(true)} activeOpacity={0.9}>
              {contextUser?.photoURL ? (
                <ExpoImage source={{ uri: contextUser.photoURL }} style={dynamicStyles.avatarXL} contentFit="cover" />
              ) : (
                <View style={dynamicStyles.avatarXLPlaceholder}>
                  <MaterialCommunityIcons name="account-circle" size={72} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
            <Text style={dynamicStyles.profileNameXL}>{contextUser?.displayName || 'Utilisateur'}</Text>
            <Text style={dynamicStyles.profileEmailXL}>{contextUser?.email}</Text>
            <View style={dynamicStyles.userBadgeXL}>
              <MaterialCommunityIcons 
                name={contextUser?.role === 'admin' ? 'shield-account' : 'account'} 
                size={16} 
                color="#FFD666"
              />
              <Text style={dynamicStyles.userRoleXL}>
                {contextUser?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Section: Mon compte */}
        <View style={dynamicStyles.sectionCard}>
          <Text style={dynamicStyles.sectionTitle}>Mon compte</Text>
          <TouchableOpacity style={dynamicStyles.listItem} onPress={() => setProfileModal(true)}>
            <View style={dynamicStyles.listLeft}>
              <MaterialCommunityIcons name="account-edit" size={20} color={colors.primary} />
              <Text style={dynamicStyles.listText}>Modifier le profil</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.placeholder} />
          </TouchableOpacity>
          <TouchableOpacity style={dynamicStyles.listItem} onPress={handleOpenCertificate}>
            <View style={dynamicStyles.listLeft}>
              <View style={{ position: 'relative' }}>
                <MaterialCommunityIcons name="certificate" size={20} color={isCertificateEligible ? "#D4AF37" : colors.primary} />
                {isCertificateEligible && (
                  <View style={dynamicStyles.certificateBadge}>
                    <MaterialCommunityIcons name="check-circle" size={14} color="#fff" />
                  </View>
                )}
              </View>
              <View>
                <Text style={[dynamicStyles.listText, isCertificateEligible && { color: "#D4AF37", fontWeight: 'bold' }]}>
                  Mon attestation
                </Text>
                {isCertificateEligible && (
                  <Text style={dynamicStyles.certificateAvailableText}>✅ Disponible !</Text>
                )}
              </View>
            </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.placeholder} />
        </TouchableOpacity>
        </View>

        {/* (Section Application et Prière & rappels retirées) */}

        {/* Section: Aide */}
        <View style={dynamicStyles.sectionCard}>
          <Text style={dynamicStyles.sectionTitle}>Aide</Text>
          <TouchableOpacity
            style={dynamicStyles.listItem}
            onPress={() => Linking.openURL('https://attaqwa-confidentialite.vercel.app/contact.html')}
          >
            <View style={dynamicStyles.listLeft}>
              <MaterialCommunityIcons name="lifebuoy" size={20} color={colors.primary} />
              <Text style={dynamicStyles.listText}>Assistance / Contact</Text>
            </View>
            <MaterialCommunityIcons name="open-in-new" size={18} color={colors.placeholder} />
        </TouchableOpacity>
      </View>

        {/* Section: Sécurité */}
        <View style={dynamicStyles.sectionCard}>
          <Text style={dynamicStyles.sectionTitle}>Sécurité</Text>
          <TouchableOpacity style={dynamicStyles.listItem} onPress={handleSendResetEmail} disabled={sendingReset}>
            <View style={dynamicStyles.listLeft}>
              <MaterialCommunityIcons name="email-lock" size={20} color={colors.primary} />
              <Text style={dynamicStyles.listText}>Recevoir un email de réinitialisation</Text>
            </View>
            <MaterialCommunityIcons name="send" size={18} color={sendingReset ? '#ccc' : colors.placeholder} />
          </TouchableOpacity>
          <TouchableOpacity style={dynamicStyles.listItem} onPress={handleLogout}>
            <View style={dynamicStyles.listLeft}>
              <MaterialCommunityIcons name="logout" size={20} color={colors.primary} />
              <Text style={dynamicStyles.listText}>Déconnexion</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.placeholder} />
          </TouchableOpacity>
        </View>

        {/* Danger zone */}
        <View style={[dynamicStyles.sectionCard, dynamicStyles.dangerCard]}>
          <Text style={[dynamicStyles.sectionTitle, { color: '#B00020' }]}>Danger</Text>
          <TouchableOpacity style={dynamicStyles.listItem} onPress={handleDeleteAccount}>
            <View style={dynamicStyles.listLeft}>
              <MaterialCommunityIcons name="account-remove" size={20} color="#B00020" />
              <Text style={[dynamicStyles.listText, { color: '#B00020' }]}>Supprimer mon compte</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#B00020" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal modification profil */}
      <Modal visible={profileModal} transparent animationType="fade" onRequestClose={() => setProfileModal(false)}>
        <View style={dynamicStyles.modalOverlay}>
          <View style={dynamicStyles.modalContent}>
            <Text style={dynamicStyles.modalTitle}>Modifier le profil</Text>
            
            {/* Champ nom d'utilisateur */}
            <View style={dynamicStyles.inputContainer}>
              <Text style={dynamicStyles.inputLabel}>Nom d'utilisateur</Text>
            <TextInput 
              style={dynamicStyles.input} 
                placeholder="Entrez votre nom" 
              value={editName} 
              onChangeText={setEditName} 
                placeholderTextColor={colors.placeholder}
              />
            </View>

            {/* Boutons pour la photo */}
            <View style={dynamicStyles.imageButtonsContainer}>
              <TouchableOpacity style={dynamicStyles.imageButton} onPress={takePhoto} disabled={loading}>
                <MaterialCommunityIcons name="camera" size={20} color={colors.primary} />
                <Text style={dynamicStyles.imageButtonText}>Caméra</Text>
              </TouchableOpacity>
              <TouchableOpacity style={dynamicStyles.imageButton} onPress={pickImage} disabled={loading}>
                <MaterialCommunityIcons name="image" size={20} color={colors.primary} />
                <Text style={dynamicStyles.imageButtonText}>Galerie</Text>
              </TouchableOpacity>
            </View>

            {/* Indicateur de chargement */}
            {loading && (
              <View style={dynamicStyles.loadingContainer}>
                <Text style={dynamicStyles.loadingText}>Téléversement en cours...</Text>
              </View>
            )}
            
            {/* Aperçu de la photo sélectionnée */}
            {(editPhoto || contextUser?.photoURL) && (
              <View style={dynamicStyles.imagePreviewContainer}>
                <ExpoImage 
                  source={{ uri: editPhoto || contextUser?.photoURL || '' }} 
                  style={dynamicStyles.imagePreview} 
                  contentFit="cover"
                />
                <Text style={dynamicStyles.imagePreviewText}>
                  {editPhoto ? 'Nouvelle photo' : 'Photo actuelle'}
                </Text>
              </View>
            )}

            {/* Boutons d'action */}
            <View style={dynamicStyles.modalButtons}>
              <TouchableOpacity 
                style={[dynamicStyles.modalButton, dynamicStyles.cancelButton]} 
                onPress={() => setProfileModal(false)}
                disabled={loading}
              >
                <Text style={[dynamicStyles.modalButtonText, dynamicStyles.cancelButtonText]}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[dynamicStyles.modalButton, dynamicStyles.saveButton]} 
                onPress={handleUpdateName}
                disabled={loading || !editName.trim()}
              >
                <Text style={[dynamicStyles.modalButtonText, dynamicStyles.saveButtonText]}>
                  {loading ? 'Envoi...' : 'Envoyer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* (Modal Taille du texte retiré) */}




    </View>
  );
}

const createStyles = (responsive: any, responsiveStyle: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F5F7' },
  scrollContent: { paddingTop: 16, paddingBottom: 24 },
  header: { alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#174C3C', marginBottom: 8 },
  headerSubtitle: { fontSize: 14, color: '#58736B', textAlign: 'center' },

  profileCard: {
    marginHorizontal: 16,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 16,
    alignSelf: 'stretch',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#BB9B4E',
  },
  profileContent: { 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 4,
  },
  avatarXL: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ffffff33', marginBottom: 16, borderWidth: 1, borderColor: '#BB9B4E' },
  avatarXLPlaceholder: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#ffffff22', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#BB9B4E'
  },
  profileNameXL: { color: '#fff', fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  profileEmailXL: { color: '#E6F1EE', fontSize: 14, textAlign: 'center', marginBottom: 12 },
  userBadgeXL: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff22', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  userRoleXL: { color: '#FFD666', fontSize: 12, fontWeight: '700', marginLeft: 6 },
  profileQuickRow: { flexDirection: 'row', marginTop: 14 },
  quickAction: { backgroundColor: '#FFF', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginRight: 10, flexDirection: 'row', alignItems: 'center' },
  quickActionText: { marginLeft: 8, color: '#174C3C', fontWeight: '700', fontSize: 12 },

  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 6,
    marginHorizontal: 16,
    marginTop: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  dangerCard: {
    backgroundColor: '#FFF6F6',
    borderWidth: 1,
    borderColor: '#F7DADA',
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#58736B', paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4, textTransform: 'uppercase', letterSpacing: 0.6 },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: '#F1F1F1' },
  listLeft: { flexDirection: 'row', alignItems: 'center' },
  listText: { fontSize: 15, color: '#174C3C', marginLeft: 12, fontWeight: '700' },
  listSubText: { fontSize: 12, color: '#58736B', marginLeft: 12, marginTop: 2 },
  trailingValue: { fontSize: 13, color: '#58736B', marginRight: 6, fontWeight: '600' },
  certificateBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  certificateAvailableText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: colors.white, borderRadius: 20, padding: 24, width: 320, maxHeight: '80%', elevation: 8, shadowColor: colors.black, shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primary, marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: colors.background, borderRadius: 12, padding: 14, width: '100%', fontSize: 16, borderWidth: 1, borderColor: colors.border },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 20 },
  modalButton: { borderRadius: 16, paddingVertical: responsiveStyle.spacing.base, paddingHorizontal: responsiveStyle.spacing.lg, flex: 1, marginHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  cancelButton: { backgroundColor: '#DC3545' },
  saveButton: { backgroundColor: colors.secondary },
  modalButtonText: { fontWeight: 'bold', fontSize: responsiveStyle.fontSize.sm },
  modalSubtitle: { color: colors.primary, textAlign: 'center', marginBottom: responsiveStyle.spacing.lg, fontSize: responsiveStyle.fontSize.base, lineHeight: 22 },
  choiceButton: { backgroundColor: colors.background, paddingVertical: responsiveStyle.spacing.base, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  choiceText: { color: colors.primary, fontWeight: '700', fontSize: responsiveStyle.fontSize.base },

  imagePreviewContainer: { alignItems: 'center', marginTop: responsiveStyle.spacing.base, marginBottom: responsiveStyle.spacing.base },
  imagePreview: { width: 100, height: 100, borderRadius: 50, marginBottom: responsiveStyle.spacing.sm, backgroundColor: colors.secondary },
  imagePreviewText: { fontSize: responsiveStyle.fontSize.sm, color: colors.primary, fontWeight: '500' },
  imageButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: responsiveStyle.spacing.base, marginBottom: responsiveStyle.spacing.sm },
  imageButton: { backgroundColor: colors.secondary, borderRadius: 16, paddingVertical: responsiveStyle.spacing.base, paddingHorizontal: responsiveStyle.spacing.base, alignItems: 'center', flex: 1, marginHorizontal: 6 },
  imageButtonText: { color: colors.primary, fontWeight: 'bold', fontSize: responsiveStyle.fontSize.xs, marginTop: 4 },
  loadingText: { color: colors.primary, fontSize: 14, marginTop: 8, fontStyle: 'italic' },
  inputContainer: { width: '100%', marginBottom: 16 },
  inputLabel: { fontSize: 14, color: colors.primary, marginBottom: 6, fontWeight: '600' },
  loadingContainer: { marginTop: 8, alignItems: 'center' },
  saveButtonText: { color: colors.primary },
  cancelButtonText: { color: colors.white },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  eyeButton: {
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 