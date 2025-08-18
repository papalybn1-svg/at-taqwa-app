import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../screens/firebaseConfig';

export type UserRole = 'user' | 'admin';

export interface AuthUser extends User {
  role?: UserRole;
}

// Clés pour AsyncStorage
const STORAGE_KEYS = {
  USER_ROLE: 'userRole',
  USER_EMAIL: 'userEmail',
  USER_DISPLAY_NAME: 'userDisplayName',
  LAST_LOGIN: 'lastLogin',
  FIREBASE_AUTH_PERSISTENCE: 'firebaseAuthPersistence'
};

/**
 * Sauvegarde les données utilisateur avec persistance Firebase native
 */
export const saveUserDataWithPersistence = async (userData: AuthUser) => {
  try {
    // Sauvegarde locale pour fallback
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.USER_ROLE, userData.role || 'user'],
      [STORAGE_KEYS.USER_EMAIL, userData.email || ''],
      [STORAGE_KEYS.USER_DISPLAY_NAME, userData.displayName || ''],
      [STORAGE_KEYS.LAST_LOGIN, new Date().toISOString()],
      [STORAGE_KEYS.FIREBASE_AUTH_PERSISTENCE, 'enabled']
    ]);
    
    console.log('✅ Données utilisateur sauvegardées avec persistance Firebase');
    return true;
  } catch (error) {
    console.error('❌ Erreur sauvegarde persistance:', error);
    return false;
  }
};

/**
 * Vérifie si la persistance Firebase est activée
 */
export const checkFirebasePersistence = async (): Promise<boolean> => {
  try {
    const persistence = await AsyncStorage.getItem(STORAGE_KEYS.FIREBASE_AUTH_PERSISTENCE);
    return persistence === 'enabled';
  } catch (error) {
    console.error('❌ Erreur vérification persistance:', error);
    return false;
  }
};

/**
 * Récupère les données utilisateur avec priorité Firebase
 */
export const getUserDataWithPersistence = async (user: User): Promise<AuthUser> => {
  try {
    // En production, priorité à Firebase Auth
    if (!__DEV__) {
      console.log('🚀 Mode production - Utilisation Firebase Auth native');
      
      // Récupérer le rôle depuis Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      const role = userData?.role || 'user';
      
      const authUser = { ...user, role } as AuthUser;
      
      // Sauvegarder pour fallback
      await saveUserDataWithPersistence(authUser);
      
      return authUser;
    }
    
    // En développement, utiliser le cache local
    const savedData = await AsyncStorage.multiGet([
      STORAGE_KEYS.USER_ROLE,
      STORAGE_KEYS.USER_EMAIL,
      STORAGE_KEYS.USER_DISPLAY_NAME
    ]);

    const savedRole = savedData[0][1];
    const savedEmail = savedData[1][1];

    if (savedEmail === user.email && savedRole) {
      console.log('✅ Données utilisateur récupérées depuis le cache local (dev)');
      return { ...user, role: savedRole as UserRole };
    }
    
    // Fallback : récupérer depuis Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();
    const role = userData?.role || 'user';
    
    return { ...user, role } as AuthUser;
  } catch (error) {
    console.error('❌ Erreur récupération données utilisateur:', error);
    return { ...user, role: 'user' } as AuthUser;
  }
};

/**
 * Nettoie complètement la persistance
 */
export const clearAuthPersistence = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_ROLE,
      STORAGE_KEYS.USER_EMAIL,
      STORAGE_KEYS.USER_DISPLAY_NAME,
      STORAGE_KEYS.LAST_LOGIN,
      STORAGE_KEYS.FIREBASE_AUTH_PERSISTENCE
    ]);
    
    console.log('✅ Persistance d\'authentification nettoyée');
    return true;
  } catch (error) {
    console.error('❌ Erreur nettoyage persistance:', error);
    return false;
  }
};

/**
 * Vérifie si l'utilisateur est connecté avec persistance
 */
export const checkAuthWithPersistence = async (): Promise<AuthUser | null> => {
  try {
    if (__DEV__) {
      // En développement, vérifier le cache local
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
        const lastLoginDate = new Date(lastLogin);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        if (lastLoginDate > sevenDaysAgo) {
          console.log('✅ Utilisateur trouvé en cache local (dev)');
          return {
            uid: 'local-user',
            email: savedEmail,
            displayName: savedDisplayName,
            role: savedRole as UserRole,
            emailVerified: true,
            isAnonymous: false,
            metadata: {
              creationTime: lastLogin,
              lastSignInTime: lastLogin
            }
          } as AuthUser;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erreur vérification persistance:', error);
    return null;
  }
}; 