import { MaterialCommunityIcons } from '@expo/vector-icons';
import { doc, getFirestore, updateDoc } from 'firebase/firestore';
import React from 'react';
import {
    Alert,
    StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import colors from '../theme/colors';


export function UserCard({ user, onUpdateRole }: any) {
  const db = getFirestore();

  const handleUpdateRole = () => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    Alert.alert(
      'Confirmer le changement',
      `Voulez-vous vraiment changer le rôle de ${user.email} en "${newRole}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            try {
              const userRef = doc(db, 'users', user.id);
              await updateDoc(userRef, { role: newRole });
              onUpdateRole(user.id, newRole); 
              Alert.alert('Succès', 'Le rôle a été mis à jour.');
            } catch (error) {
              console.error("Erreur de mise à jour du rôle:", error);
              Alert.alert('Erreur', "Impossible de mettre à jour le rôle.");
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.userInfo}>
        <MaterialCommunityIcons 
          name={user.role === 'admin' ? 'account-tie' : 'account'} 
          size={32} 
          color={user.role === 'admin' ? colors.secondary : colors.primary} 
        />
        <View style={styles.textContainer}>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.role}>Rôle: {user.role}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleUpdateRole}>
        <Text style={styles.buttonText}>Changer Rôle</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  email: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  role: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 2,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: colors.white,
    fontWeight: 'bold',
  },
}); 