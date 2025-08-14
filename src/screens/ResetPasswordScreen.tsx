import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from './firebaseConfig';

export default function ResetPasswordScreen({ route, navigation }: any) {
  const code: string | undefined = route?.params?.oobCode;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState<string>('');

  React.useEffect(() => {
    const checkCode = async () => {
      if (!code) return;
      try {
        const mail = await verifyPasswordResetCode(auth, code);
        setEmail(mail);
      } catch (e) {
        Alert.alert('Lien invalide', "Le lien de réinitialisation n'est plus valide. Veuillez en demander un nouveau.", [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    };
    checkCode();
  }, [code]);

  const onSubmit = async () => {
    if (!code) return;
    if (!newPassword || newPassword.length < 8) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      await confirmPasswordReset(auth, code, newPassword);
      Alert.alert('Succès', 'Mot de passe réinitialisé. Vous pouvez vous connecter.', [
        { text: 'Se connecter', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (e: any) {
      let msg = "Échec de la réinitialisation.";
      if (e?.code === 'auth/weak-password') msg = 'Mot de passe trop faible.';
      if (e?.code === 'auth/expired-action-code') msg = 'Lien expiré. Demandez un nouveau lien.';
      if (e?.code === 'auth/invalid-action-code') msg = 'Lien invalide. Demandez un nouveau lien.';
      Alert.alert('Erreur', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <View style={styles.container}>
          <Text style={styles.title}>Réinitialiser le mot de passe</Text>
          {!!email && <Text style={styles.subtitle}>Compte: {email}</Text>}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nouveau mot de passe</Text>
            <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} placeholder="********" secureTextEntry />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmer le mot de passe</Text>
            <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="********" secureTextEntry />
          </View>
          <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#174C3C" /> : <Text style={styles.buttonText}>Valider</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F5F7', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#174C3C', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#174C3C', marginBottom: 16 },
  inputGroup: { width: '100%', maxWidth: 340, marginBottom: 12 },
  label: { color: '#174C3C', marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E0E0E0' },
  button: { backgroundColor: '#D4AF37', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 32, marginTop: 8, width: '100%', maxWidth: 340, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
});

