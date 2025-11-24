import { User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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
          try {
            // Recharger pour récupérer emailVerified frais
            await firebaseUser.reload();
          } catch {}
          const refreshedUser = auth.currentUser || firebaseUser;
          if (!refreshedUser?.emailVerified) {
            // Email non vérifié → ne pas exposer de user actif
            if (isMounted) {
              setUser(null);
              setLoading(false);
              if (initializing) setInitializing(false);
            }
            return;
          }
          // Ici: email vérifié → s'assurer que Firestore reflète l'état
          try {
            const userRef = doc(db, 'users', refreshedUser.uid);
            const snap = await getDoc(userRef);
            if (!snap.exists()) {
              await setDoc(userRef, {
                email: refreshedUser.email,
                role: 'user',
                emailVerified: true,
                createdAt: new Date(),
                displayName: refreshedUser.displayName || '',
              });
            } else if (!(snap.data() as any)?.emailVerified) {
              await updateDoc(userRef, { emailVerified: true });
            }
          } catch (e) {
            console.log('ℹ️ Sync Firestore users skipped/failed:', e);
          }
          // Rôle Firestore
          const freshRole = await fetchUserRoleFromFirestore(refreshedUser);
          // Récupérer d'éventuelles méta‑données supplémentaires depuis Firestore (ex: photoURL inline)
          let photoURLOverride: string | undefined;
          try {
            const profileSnap = await getDoc(doc(db, 'users', refreshedUser.uid));
            photoURLOverride = (profileSnap.data() as any)?.photoURL || undefined;
          } catch {}
          const freshUserData = { ...(refreshedUser as any), role: freshRole, photoURL: photoURLOverride || refreshedUser.photoURL };
          console.log('🔥 Rôle Firestore:', freshRole, 'pour', refreshedUser.email, 'UID:', refreshedUser.uid);

          if (isMounted) {
            // Nettoyer les données de l'ancien utilisateur si différent
            if (user && user.uid !== refreshedUser.uid) {
              console.log('🔄 Changement d\'utilisateur détecté, nettoyage des données...');
              console.log('👤 Ancien utilisateur:', user.email, 'UID:', user.uid);
              console.log('👤 Nouvel utilisateur:', refreshedUser.email, 'UID:', refreshedUser.uid);
              await cleanupUserData(user.uid);
            }
            setUser(freshUserData);
            setLoading(false);
            if (initializing) setInitializing(false);
            await saveUserDataLocally(freshUserData);
            console.log('✅ Utilisateur connecté (email vérifié):', refreshedUser.email);
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