import { MaterialCommunityIcons } from '@expo/vector-icons';
import { sendEmailVerification } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from './firebaseConfig';

export default function VerifyEmailScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(auth.currentUser?.email || '');

  const handleResendEmail = async () => {
    if (!auth.currentUser) {
      Alert.alert('Erreur', 'Aucun utilisateur connecté');
      return;
    }

    setLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
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
      // Marquer l'email comme vérifié dans Firestore
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        emailVerified: true
      });
      
      Alert.alert(
        'Vérification réussie !',
        'Votre email a été vérifié. Vous allez être redirigé vers l\'application.',
        [
          { 
            text: 'Continuer', 
            onPress: () => {
              // L'utilisateur est maintenant vérifié, il peut rester connecté
              navigation.navigate('Main' as never);
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
          <MaterialCommunityIcons name="email-send" size={20} color="white" />
          <Text style={styles.buttonText}>
            {loading ? 'Envoi...' : 'Renvoyer l\'email'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.helpText}>
          L'email a expiré ? Cliquez sur "Renvoyer l'email" ci-dessus.
        </Text>

        <TouchableOpacity 
          style={[styles.button, styles.verifiedButton]} 
          onPress={handleIveVerified}
        >
          <MaterialCommunityIcons name="check-circle" size={20} color="white" />
          <Text style={styles.buttonText}>J'ai vérifié mon email</Text>
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