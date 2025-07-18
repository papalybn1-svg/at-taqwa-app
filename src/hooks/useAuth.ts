import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { auth, db } from '../screens/firebaseConfig';

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

  // Fonction pour vérifier si l'utilisateur est connecté localement (uniquement pour Expo Go)
  const checkLocalAuth = async (): Promise<AuthUser | null> => {
    try {
      // En production, on ne doit PAS utiliser le cache local comme fallback
      // Cette fonction n'est utilisée que pour Expo Go
      const savedData = await AsyncStorage.multiGet([
        STORAGE_KEYS.USER_ROLE,
        STORAGE_KEYS.USER_EMAIL,
        STORAGE_KEYS.USER_DISPLAY_NAME,
        STORAGE_KEYS.LAST_LOGIN
      ]);

      const savedRole = savedData[0][1];
      const savedEmail = savedData[1][1];
      const savedDisplayName = savedData[2][1];
      const lastLogin = savedData[3][1];

      if (savedEmail && savedRole && lastLogin) {
        // Vérifier si la dernière connexion date de moins de 7 jours (plus strict pour la sécurité)
        const lastLoginDate = new Date(lastLogin);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        if (lastLoginDate > sevenDaysAgo) {
          console.log('✅ Utilisateur trouvé en cache local (Expo Go)');
          return {
            uid: 'local-user',
            email: savedEmail,
            displayName: savedDisplayName,
            role: savedRole as UserRole,
            // Autres propriétés Firebase User simulées
            emailVerified: true,
            isAnonymous: false,
            metadata: {
              creationTime: lastLogin,
              lastSignInTime: lastLogin
            }
          } as AuthUser;
        }
      }
      return null;
    } catch (error) {
      console.error('❌ Erreur vérification cache local:', error);
      return null;
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

    // Vérifier d'abord le cache local pour Expo Go
    const checkLocalAuthFirst = async () => {
      try {
        const localUser = await checkLocalAuth();
        if (localUser && isMounted) {
          console.log('🔄 Utilisateur trouvé en cache local (Expo Go), connexion automatique...');
          setUser(localUser);
          setLoading(false);
          setInitializing(false);
          return; // Sortir si on a trouvé un utilisateur en cache
        }
      } catch (error) {
        console.error('❌ Erreur vérification cache local:', error);
      }
      
      // Si pas d'utilisateur en cache, continuer avec Firebase
      console.log('📱 Aucun utilisateur en cache, attente de Firebase Auth...');
    };

    // Vérifier le cache local immédiatement
    checkLocalAuthFirst();

    // Timeout de sécurité pour forcer la fin du chargement après 15 secondes
    const timeoutId = setTimeout(() => {
      console.log('⏰ Timeout de sécurité - Forcer la fin du chargement');
      if (isMounted) {
        setLoading(false);
        setInitializing(false);
        // Si aucun utilisateur n'est chargé après 15s, on force null pour aller à LoginScreen
        setUser(null);
      }
    }, 15000);

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      console.log('🔄 Auth state changed:', firebaseUser ? 'User connected' : 'User disconnected');
      
      // Annuler le timeout si l'auth state change
      clearTimeout(timeoutId);
      
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
            console.log('🔥 Rôle Firestore:', freshRole, 'pour', firebaseUser.email, 'UID:', firebaseUser.uid);

            if (isMounted) {
              // Toujours mettre à jour le rôle, même si c'est la même valeur
              setUser(freshUserData);
              await saveUserDataLocally(freshUserData);
              console.log('🔄 Rôle utilisateur mis à jour depuis Firestore:', freshRole);
            }
          } catch (firestoreError) {
            console.log('⚠️ Erreur Firestore, utilisation du cache local');
            // En cas d'erreur Firestore, on garde les données du cache
          }
        } else {
          // En production, si Firebase dit déconnecté, l'utilisateur est vraiment déconnecté
          // Le cache local n'est utilisé que comme fallback pour Expo Go
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
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [initializing]);

  const isAdmin = () => user?.role === 'admin';

  const logout = async () => {
    try {
      setLoading(true);
      
      // Nettoyer le cache local
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER_ROLE,
        STORAGE_KEYS.USER_EMAIL,
        STORAGE_KEYS.USER_DISPLAY_NAME,
        STORAGE_KEYS.LAST_LOGIN
      ]);
      
      // Déconnecter Firebase
      await auth.signOut();
      
      // Mettre à jour l'état local
      setUser(null);
      setLoading(false);
      
      console.log('✅ Déconnexion réussie - Cache local nettoyé');
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
      setLoading(false);
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