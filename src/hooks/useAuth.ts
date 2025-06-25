import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { auth } from '../screens/firebaseConfig';

export type UserRole = 'user' | 'admin';

export interface AuthUser extends User {
  role?: UserRole;
}

// Clés pour AsyncStorage
const STORAGE_KEYS = {
  USER_ROLE: 'userRole',
  USER_EMAIL: 'userEmail',
  USER_DISPLAY_NAME: 'userDisplayName',
  LAST_LOGIN: 'lastLogin'
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Fonction pour sauvegarder les données utilisateur localement
  const saveUserDataLocally = async (userData: AuthUser) => {
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.USER_ROLE, userData.role || 'user'],
        [STORAGE_KEYS.USER_EMAIL, userData.email || ''],
        [STORAGE_KEYS.USER_DISPLAY_NAME, userData.displayName || ''],
        [STORAGE_KEYS.LAST_LOGIN, new Date().toISOString()]
      ]);
      console.log('✅ Données utilisateur sauvegardées localement');
    } catch (error) {
      console.error('❌ Erreur sauvegarde locale:', error);
    }
  };

  // Fonction pour récupérer les données utilisateur locales
  const getUserDataFromStorage = async (user: User): Promise<AuthUser> => {
    try {
      const savedData = await AsyncStorage.multiGet([
        STORAGE_KEYS.USER_ROLE,
        STORAGE_KEYS.USER_EMAIL,
        STORAGE_KEYS.USER_DISPLAY_NAME
      ]);

      const savedRole = savedData[0][1];
      const savedEmail = savedData[1][1];

      // Vérifier si les données correspondent à l'utilisateur actuel
      if (savedEmail === user.email && savedRole) {
        console.log('✅ Données utilisateur récupérées depuis le cache local');
        return { ...user, role: savedRole as UserRole };
      }
    } catch (error) {
      console.error('❌ Erreur récupération cache local:', error);
    }

    // Si pas de données locales, retourner l'utilisateur avec rôle par défaut
    return { ...user, role: 'user' };
  };

  // Fonction pour récupérer le rôle depuis Firestore
  const fetchUserRoleFromFirestore = async (user: User): Promise<UserRole> => {
    try {
      const db = getFirestore();
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      return userData?.role || 'user';
    } catch (error) {
      console.error('❌ Erreur récupération rôle Firestore:', error);
      // Fallback pour les comptes administrateurs connus
      if (user.email === 'papalybn@gmail.com') {
        return 'admin';
      }
      return 'user';
    }
  };

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      console.log('🔄 Auth state changed:', firebaseUser ? 'User connected' : 'User disconnected');
      
      if (!isMounted) return;

      try {
        if (firebaseUser) {
          setLoading(true);
          
          // D'abord, essayer de récupérer depuis le cache local
          let userWithRole = await getUserDataFromStorage(firebaseUser);
          
          // Mettre à jour l'état immédiatement avec les données du cache
          if (isMounted) {
            setUser(userWithRole);
            setLoading(false);
            if (initializing) setInitializing(false);
          }

          // Ensuite, récupérer les données fraîches depuis Firestore en arrière-plan
          try {
            const freshRole = await fetchUserRoleFromFirestore(firebaseUser);
            const freshUserData = { ...firebaseUser, role: freshRole };
            
            // Mettre à jour seulement si les données ont changé
            if (freshRole !== userWithRole.role && isMounted) {
              console.log('🔄 Mise à jour rôle:', freshRole);
              setUser(freshUserData);
              await saveUserDataLocally(freshUserData);
            } else if (isMounted) {
              // Sauvegarder même si pas de changement pour mettre à jour lastLogin
              await saveUserDataLocally(freshUserData);
            }
          } catch (firestoreError) {
            console.log('⚠️ Erreur Firestore, utilisation du cache local');
            // En cas d'erreur Firestore, on garde les données du cache
          }
        } else {
          // Utilisateur non connecté
          if (isMounted) {
            setUser(null);
            setLoading(false);
            if (initializing) setInitializing(false);
          }
          
          // Nettoyer le cache local
          try {
            await AsyncStorage.multiRemove([
              STORAGE_KEYS.USER_ROLE,
              STORAGE_KEYS.USER_EMAIL,
              STORAGE_KEYS.USER_DISPLAY_NAME,
              STORAGE_KEYS.LAST_LOGIN
            ]);
          } catch (error) {
            console.error('❌ Erreur nettoyage cache:', error);
          }
        }
      } catch (error) {
        console.error('❌ Erreur dans onAuthStateChanged:', error);
        if (isMounted) {
          setLoading(false);
          if (initializing) setInitializing(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [initializing]);

  const isAdmin = () => user?.role === 'admin';

  const logout = async () => {
    try {
      setLoading(true);
      await auth.signOut();
      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
    }
  };

  return { 
    user, 
    loading: loading || initializing, 
    isAdmin, 
    setUser, 
    logout 
  };
} 