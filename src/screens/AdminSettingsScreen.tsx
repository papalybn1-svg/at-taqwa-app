import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';

type SettingsItemProps = {
  icon: any;
  title: string;
  description: string;
  onPress: () => void;
};

const SettingsItem: React.FC<SettingsItemProps> = ({ icon, title, description, onPress }) => (
  <TouchableOpacity style={styles.itemContainer} onPress={onPress}>
    <View style={styles.iconContainer}>
      <MaterialCommunityIcons name={icon} size={24} color={colors.primary} />
    </View>
    <View style={styles.textContainer}>
      <Text style={styles.itemTitle}>{title}</Text>
      <Text style={styles.itemDescription}>{description}</Text>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={24} color={colors.gray} />
  </TouchableOpacity>
);

export default function AdminSettingsScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.headerTitle}>Paramètres Admin</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestion</Text>
          <SettingsItem
            icon="bell-outline"
            title="Gestion des Notifications"
            description="Envoyer et gérer les notifications"
            onPress={() => navigation.navigate('AdminNotifications')}
          />
          <SettingsItem
            icon="account-cog-outline"
            title="Mon Compte"
            description="Gérer votre profil administrateur"
            onPress={() => navigation.navigate('AdminAccount')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration</Text>
          <SettingsItem
            icon="database-import-outline"
            title="Importer des données"
            description="Ajouter des hadiths ou zikrs en masse"
            onPress={() => { /* TODO */ }}
          />
          <SettingsItem
            icon="database-export-outline"
            title="Exporter des données"
            description="Sauvegarder les données de l'application"
            onPress={() => { /* TODO */ }}
          />
        </View>
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconContainer: {
    backgroundColor: colors.lightGray,
    padding: 12,
    borderRadius: 12,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  itemDescription: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 2,
  },
}); 