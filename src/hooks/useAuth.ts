import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { auth, db } from '../screens/firebaseConfig';
import {
    clearAuthPersistence,
    getUserDataWithPersistence,
    saveUserDataWithPersistence
} from '../utils/authPersistence';
import { cleanupUserQuizSessions } from '../utils/quizSession';
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
    // Laisser Firebase Auth gérer la persistance automatiquement
    return null;
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
      return 'user';
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Laisser Firebase Auth gérer la persistance automatiquement
    console.log('🚀 Initialisation Firebase Auth avec persistance...');

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
          
          // Vérifier si l'utilisateur existe en base
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.data();
          
          // Si l'email n'est pas vérifié, on conserve la session pour permettre la redirection automatique
          // L'interface se chargera d'afficher l'écran de vérification (App.tsx) au lieu de déconnecter.
          
          // Récupérer le rôle depuis Firestore
          const freshRole = await fetchUserRoleFromFirestore(firebaseUser);
          const freshUserData = { ...firebaseUser, role: freshRole };
          console.log('🔥 Rôle Firestore:', freshRole, 'pour', firebaseUser.email, 'UID:', firebaseUser.uid);

          if (isMounted) {
            // Nettoyer les données de l'ancien utilisateur si différent
            if (user && user.uid !== firebaseUser.uid) {
              console.log('🔄 Changement d\'utilisateur détecté, nettoyage des données...');
              console.log('👤 Ancien utilisateur:', user.email, 'UID:', user.uid);
              console.log('👤 Nouvel utilisateur:', firebaseUser.email, 'UID:', firebaseUser.uid);
              await cleanupUserData(user.uid);
            }
            
            setUser(freshUserData);
            setLoading(false);
            if (initializing) setInitializing(false);
            
            // Sauvegarder pour fallback
            await saveUserDataLocally(freshUserData);
            console.log('✅ Utilisateur connecté avec persistance:', firebaseUser.email);
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

  // Fonction pour nettoyer les données utilisateur
  const cleanupUserData = async (uid: string) => {
    try {
      console.log('🧹 Nettoyage des données pour l\'utilisateur:', uid);
      await Promise.all([
        removeUserStorage(uid, 'chapterProgress'),
        removeUserStorage(uid, 'favorites'),
        removeUserStorage(uid, 'quizScores'),
        removeUserStorage(uid, 'zikrProgress'),
      ]);
      await removeAllWithPrefix(uid, 'quizSession:');
      await cleanupUserQuizSessions(uid);
      console.log('✅ Données utilisateur nettoyées');
    } catch (error) {
      console.error('❌ Erreur nettoyage données utilisateur:', error);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      // Nettoyer complètement la persistance
      await clearAuthPersistence();
      // Nettoyer les clés locales scopées utilisateur
      const uid = auth.currentUser?.uid;
      if (uid) {
        await cleanupUserData(uid);
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