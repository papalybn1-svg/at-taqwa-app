import { MaterialCommunityIcons } from '@expo/vector-icons';
import { sendEmailVerification } from 'firebase/auth';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from './firebaseConfig';

export default function VerifyEmailScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(auth.currentUser?.email || '');
  const [confirmEnabled, setConfirmEnabled] = useState(false);
  const [countdown, setCountdown] = useState(5);
  
  // Auto-polling: recharger l'état emailVerified toutes les 3s pour rediriger automatiquement
  React.useEffect(() => {
    let mounted = true;
    let timer: any;
    const tick = async () => {
      try {
        await auth.currentUser?.reload();
        if (mounted && auth.currentUser?.emailVerified) {
          navigation.navigate('Main' as never);
          return;
        }
      } finally {
        timer = setTimeout(tick, 3000);
      }
    };
    tick();
    return () => {
      mounted = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Anti-mauvais clic: activer le bouton "J'ai vérifié" après 5s
  React.useEffect(() => {
    let sec = 5;
    setCountdown(sec);
    setConfirmEnabled(false);
    const tick = setInterval(() => {
      sec -= 1;
      setCountdown(sec);
      if (sec <= 0) {
        setConfirmEnabled(true);
        clearInterval(tick);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const handleResendEmail = async () => {
    if (!auth.currentUser) {
      Alert.alert('Erreur', 'Aucun utilisateur connecté');
      return;
    }

    setLoading(true);
    try {
      const actionCodeSettings = {
        url: 'https://attaqwa-confidentialite.vercel.app/index.html',
        handleCodeInApp: false,
        iOS: { bundleId: 'com.attaqwa.app' },
        android: { packageName: 'com.attaqwa.app', installApp: false, minimumVersion: '1' },
      } as any;
      await sendEmailVerification(auth.currentUser, actionCodeSettings);
      Alert.alert(
        'Email envoyé !',
        'Un nouvel email de vérification a été envoyé. Vérifiez votre boîte de réception et le dossier spam.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Erreur envoi email:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer l\'email de vérification. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleIveVerified = async () => {
    if (!auth.currentUser) {
      Alert.alert('Erreur', 'Aucun utilisateur connecté');
      return;
    }

    try {
      // Recharger l'utilisateur Firebase pour récupérer l'état réel
      await auth.currentUser.reload();
      const isVerified = !!auth.currentUser.emailVerified;
      if (isVerified) {
        // Créer/mettre à jour le document Firestore uniquement après vérification réelle
        try {
          const userRef = doc(db, 'users', auth.currentUser.uid);
          // Tentative d'update; si le doc n'existe pas, l'update échouera et on pourra setDoc côté App (deep link)
          await updateDoc(userRef, { emailVerified: true });
        } catch {
          // Si le doc n'existe pas, on le créera au prochain passage (useAuth/App) pour éviter des erreurs de droits
        }
      }
      
      Alert.alert(
        isVerified ? 'Vérification réussie !' : 'Vérification non détectée',
        isVerified 
          ? 'Votre email a été vérifié. Vous allez être redirigé vers l\'application.'
          : 'Nous ne détectons pas encore la vérification. Réessayez dans quelques secondes après avoir cliqué sur le lien de l’email.',
        [
          { 
            text: isVerified ? 'Continuer' : 'Réessayer', 
            onPress: () => {
              if (isVerified) {
                navigation.navigate('Main' as never);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Erreur mise à jour emailVerified:', error);
      Alert.alert(
        'Erreur',
        'Impossible de mettre à jour le statut de vérification. Veuillez réessayer.',
        [
          { text: 'Annuler', style: 'cancel' },
          { 
            text: 'Continuer quand même', 
            onPress: () => {
              navigation.navigate('Main' as never);
            }
          }
        ]
      );
    }
  };

  const handleDeleteUnverifiedAccount = async () => {
    if (!auth.currentUser) {
      Alert.alert('Erreur', 'Aucun utilisateur connecté');
      return;
    }
    try {
      // Supprimer éventuel doc Firestore
      try {
        await deleteDoc(doc(db, 'users', auth.currentUser.uid));
      } catch {}
      // Supprimer le compte Firebase (nécessite une session récente: OK juste après inscription)
      await auth.currentUser.delete();
      Alert.alert(
        'Compte supprimé',
        'Votre compte non vérifié a été supprimé. Vous pouvez recommencer l’inscription.',
        [{ text: 'OK', onPress: () => {} }]
      );
    } catch (e: any) {
      Alert.alert(
        'Suppression impossible',
        'Nous n’avons pas pu supprimer le compte. Essayez de vous reconnecter puis de relancer la suppression.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons name="email-check" size={80} color="#174C3C" />
      </View>

      <Text style={styles.title}>Vérifiez votre email</Text>
      
      <Text style={styles.description}>
        Nous avons envoyé un email de vérification à :
      </Text>
      
      <Text style={styles.email}>{email}</Text>
      
      <Text style={styles.instructions}>
        Cliquez sur le lien dans l'email pour activer votre compte.{'\n\n'}
        Si vous ne trouvez pas l'email, vérifiez votre dossier spam.
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.resendButton]} 
          onPress={handleResendEmail}
          disabled={loading}
        >
          <MaterialCommunityIcons name="email-outline" size={20} color="white" />
          <Text style={styles.buttonText}>
            {loading ? 'Envoi...' : 'Renvoyer l\'email'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.helpText}>
          L'email a expiré ? Cliquez sur "Renvoyer l'email" ci-dessus.
        </Text>

        <TouchableOpacity 
          style={[styles.button, styles.verifiedButton, { opacity: confirmEnabled ? 1 : 0.6 }]} 
          onPress={handleIveVerified}
          disabled={!confirmEnabled || loading}
        >
          <MaterialCommunityIcons name="check-circle" size={20} color="white" />
          <Text style={styles.buttonText}>
            {confirmEnabled ? "J'ai vérifié mon email" : `Disponible dans ${countdown}s`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#B00020' }]} 
          onPress={handleDeleteUnverifiedAccount}
        >
          <MaterialCommunityIcons name="trash-can" size={20} color="white" />
          <Text style={styles.buttonText}>Supprimer mon compte (non vérifié)</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.navigate('Login')}
      >
        <MaterialCommunityIcons name="arrow-left" size={20} color="#174C3C" />
        <Text style={styles.backButtonText}>Retour à la connexion</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  content: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#174C3C',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  email: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#174C3C',
    marginBottom: 20,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
    marginBottom: 30,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 10,
  },
  resendButton: {
    backgroundColor: '#174C3C',
  },
  verifiedButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#174C3C',
    fontSize: 16,
    fontWeight: '500',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
}); 