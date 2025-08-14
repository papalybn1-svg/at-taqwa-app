import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { auth, db } from '../screens/firebaseConfig';
import {
    checkAuthWithPersistence,
    clearAuthPersistence,
    getUserDataWithPersistence,
    saveUserDataWithPersistence
} from '../utils/authPersistence';
import { removeAllWithPrefix, remove as removeUserStorage } from '../utils/userStorage';

export type UserRole = 'user' | 'admin';

export interface AuthUser extends User {
  role?: UserRole;
}

// Les clés AsyncStorage sont maintenant gérées dans authPersistence.ts

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Fonction pour sauvegarder les données utilisateur avec persistance
  const saveUserDataLocally = async (userData: AuthUser) => {
    try {
      await saveUserDataWithPersistence(userData);
    } catch (error) {
      console.error('❌ Erreur sauvegarde locale:', error);
    }
  };

  // Fonction pour vérifier si l'utilisateur est connecté avec persistance
  const checkLocalAuth = async (): Promise<AuthUser | null> => {
    try {
      return await checkAuthWithPersistence();
    } catch (error) {
      console.error('❌ Erreur vérification persistance:', error);
      return null;
    }
  };

  // Fonction pour récupérer les données utilisateur avec persistance
  const getUserDataFromStorage = async (user: User): Promise<AuthUser> => {
    try {
      return await getUserDataWithPersistence(user);
    } catch (error) {
      console.error('❌ Erreur récupération données utilisateur:', error);
      return { ...user, role: 'user' };
    }
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

    // Vérifier d'abord le cache local pour Expo Go (développement uniquement)
    const checkLocalAuthFirst = async () => {
      if (__DEV__) {
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
        
        console.log('📱 Aucun utilisateur en cache, attente de Firebase Auth...');
      } else {
        console.log('🚀 Mode production - Attente de Firebase Auth native...');
      }
    };

    // Vérifier le cache local immédiatement (développement uniquement)
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
            await clearAuthPersistence();
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
      
      // Nettoyer complètement la persistance
      await clearAuthPersistence();
      // Nettoyer les clés locales scopées utilisateur
      const uid = auth.currentUser?.uid;
      try {
        await Promise.all([
          removeUserStorage(uid, 'chapterProgress'),
          removeUserStorage(uid, 'favorites'),
          removeUserStorage(uid, 'quizScores'),
        ]);
        await removeAllWithPrefix(uid, 'quizSession:');
      } catch (e) {
        console.log('⚠️ Erreur lors du nettoyage des clés utilisateur:', e);
      }
      
      // Déconnecter Firebase
      await auth.signOut();
      
      // Mettre à jour l'état local
      setUser(null);
      setLoading(false);
      
      console.log('✅ Déconnexion réussie - Persistance et Firebase nettoyés');
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