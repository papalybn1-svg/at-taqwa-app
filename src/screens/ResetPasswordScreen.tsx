import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useResponsive, getResponsiveStyle } from '../hooks/useResponsive';
import { auth } from './firebaseConfig';

export default function ResetPasswordScreen({ route, navigation }: any) {
  const responsive = useResponsive();
  const responsiveStyle = getResponsiveStyle(responsive);
  const dynamicStyles = createStyles(responsive, responsiveStyle);
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
        <View style={dynamicStyles.container}>
          <Text style={dynamicStyles.title}>Réinitialiser le mot de passe</Text>
          {!!email && <Text style={dynamicStyles.subtitle}>Compte: {email}</Text>}

          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>Nouveau mot de passe</Text>
            <TextInput style={dynamicStyles.input} value={newPassword} onChangeText={setNewPassword} placeholder="********" secureTextEntry />
          </View>
          <View style={dynamicStyles.inputGroup}>
            <Text style={dynamicStyles.label}>Confirmer le mot de passe</Text>
            <TextInput style={dynamicStyles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="********" secureTextEntry />
          </View>
          <TouchableOpacity style={dynamicStyles.button} onPress={onSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#174C3C" /> : <Text style={dynamicStyles.buttonText}>Valider</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (responsive: any, responsiveStyle: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F5F7', alignItems: 'center', justifyContent: 'center', padding: responsiveStyle.spacing['2xl'] },
  title: { fontSize: responsiveStyle.fontSize['2xl'], fontWeight: 'bold', color: '#174C3C', marginBottom: responsiveStyle.spacing.sm },
  subtitle: { fontSize: responsiveStyle.fontSize.sm, color: '#174C3C', marginBottom: responsiveStyle.spacing.base },
  inputGroup: { width: '100%', maxWidth: 340, marginBottom: responsiveStyle.spacing.base },
  label: { color: '#174C3C', marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: responsiveStyle.spacing.base, paddingHorizontal: responsiveStyle.spacing.base, borderWidth: 1, borderColor: '#E0E0E0' },
  button: { backgroundColor: '#D4AF37', borderRadius: 20, paddingVertical: responsiveStyle.spacing.base, paddingHorizontal: responsiveStyle.spacing['2xl'], marginTop: responsiveStyle.spacing.sm, width: '100%', maxWidth: 340, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: responsiveStyle.fontSize.sm },
});

