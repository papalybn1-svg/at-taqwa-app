import { MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, deleteDoc, doc, getDocs, getFirestore } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserCard } from '../components/UserCard';
import colors from '../theme/colors';

const { width, height } = Dimensions.get('window');

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: any;
  photoURL?: string;
}

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const db = getFirestore();

  // Animations
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadUsers();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true })
    ]).start();
  };

  const loadUsers = async () => {
    try {
      console.log('🔍 Chargement des utilisateurs...');
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const usersList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      
      console.log(`✅ ${usersList.length} utilisateurs chargés`);
      setUsers(usersList);
      setFilteredUsers(usersList);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des utilisateurs:', error);
      Alert.alert('Erreur', 'Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUsers().then(() => setRefreshing(false));
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      const filtered = users.filter(user =>
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(query.toLowerCase()) ||
        user.role.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  };

  const handleUpdateRoleInList = (userId: string, newRole: string) => {
    const updateUser = (userList: User[]) => userList.map(u => u.id === userId ? { ...u, role: newRole } : u);
    setUsers(prev => updateUser(prev));
    setFilteredUsers(prev => updateUser(prev));
  };

  const deleteUser = async (userId: string, userEmail: string) => {
    Alert.alert(
      'Confirmation',
      `Voulez-vous vraiment supprimer l'utilisateur ${userEmail} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', userId));
              setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
              Alert.alert('Succès', 'Utilisateur supprimé');
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'utilisateur');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Utilisateurs</Text>
      </View>
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.gray} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un utilisateur..."
          placeholderTextColor={colors.gray}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>
      <FlatList
        data={filteredUsers}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <UserCard user={item} onUpdateRole={handleUpdateRoleInList} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun utilisateur trouvé.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    padding: 20,
    paddingBottom: 10,
    backgroundColor: colors.white,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  list: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray,
  },
}); 