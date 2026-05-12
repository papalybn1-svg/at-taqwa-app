import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { signOut } from 'firebase/auth';
import React, { useContext, useEffect, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';
import { AuthContext } from '../contexts/AuthContext';
import { auth } from './firebaseConfig';

const { width, height } = Dimensions.get('window');

interface AdminStats {
  totalActions: number;
  lastLogin: string;
  notificationsSent: number;
  contentManaged: number;
}

const SettingItem = ({ title, description, icon, value, onToggle }: any) => (
  <View style={styles.settingItem}>
    <MaterialCommunityIcons name={icon} size={24} color={colors.primary} style={styles.settingIcon} />
    <View style={styles.settingTextContainer}>
      <Text style={styles.settingTitle}>{title}</Text>
      <Text style={styles.settingDescription}>{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: "#E9E9EA", true: colors.primary }}
      thumbColor={colors.white}
    />
  </View>
);

export default function AdminAccountScreen() {
  const { user, setUser } = useContext(AuthContext);
  const [stats, setStats] = useState<AdminStats>({
    totalActions: 0,
    lastLogin: new Date().toLocaleDateString(),
    notificationsSent: 0,
    contentManaged: 0
  });
  const [settings, setSettings] = useState({
    notifications: true,
    autoBackup: false,
  });
  const [modalVisible, setModalVisible] = useState(false);

  // Animations
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  const profileAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startAnimations();
    loadStats();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      Animated.timing(profileAnim, { toValue: 1, duration: 1200, useNativeDriver: true })
    ]).start();
  };

  const loadStats = () => {
    // Simuler le chargement des statistiques
    setStats({
      totalActions: 156,
      lastLogin: new Date().toLocaleDateString(),
      notificationsSent: 23,
      contentManaged: 89
    });
  };

  const handleSignOut = () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Confirmer", style: "destructive", onPress: async () => {
          try {
            // Utiliser le hook logout pour garantir nettoyage des données locales
            const { logout } = require('../hooks/useAuth');
            if (typeof logout === 'function') {
              await logout();
            } else {
              await signOut(auth);
              setUser(null);
            }
          } catch (error) {
            Alert.alert("Erreur", "La déconnexion a échoué.");
          }
        }}
      ]
    );
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const StatCard = ({ title, value, icon, gradient }: any) => (
    <Animated.View style={[styles.statCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <BlurView intensity={20} style={styles.statCardBlur}>
        <LinearGradient
          colors={gradient}
          style={styles.statCardGradient}
        >
          <MaterialCommunityIcons name={icon} size={24} color="#fff" />
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileName}>{user?.displayName || 'Admin'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres du compte</Text>
          <SettingItem
            title="Notifications Admin"
            description="Recevoir les notifications importantes"
            icon="bell-ring-outline"
            value={settings.notifications}
            onToggle={() => toggleSetting('notifications')}
          />
          <SettingItem
            title="Sauvegarde auto"
            description="Sauvegarder les données chaque semaine"
            icon="cloud-sync-outline"
            value={settings.autoBackup}
            onToggle={() => toggleSetting('autoBackup')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons name="shield-lock-outline" size={24} color={colors.primary} />
            <Text style={styles.actionButtonText}>Changer le mot de passe</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleSignOut}>
            <MaterialCommunityIcons name="logout" size={24} color={colors.error} />
            <Text style={[styles.actionButtonText, { color: colors.error }]}>Se déconnecter</Text>
          </TouchableOpacity>
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
  profileHeader: {
    backgroundColor: colors.white,
    paddingVertical: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    color: colors.white,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  profileEmail: {
    fontSize: 16,
    color: colors.gray,
    marginTop: 4,
  },
  section: {
    marginTop: 20,
    backgroundColor: colors.white,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.gray,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  settingIcon: {
    marginRight: 15,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  actionButtonText: {
    fontSize: 16,
    color: colors.primary,
    marginLeft: 15,
    fontWeight: '500'
  },
  statCard: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 20,
    overflow: 'hidden',
  },
  statCardBlur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  statCardGradient: {
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statTitle: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
}); 