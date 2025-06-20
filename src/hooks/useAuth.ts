import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { auth } from '../screens/firebaseConfig';

export type UserRole = 'user' | 'admin';

export interface AuthUser extends User {
  role?: UserRole;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        if (user) {
          // Récupérer le rôle de l'utilisateur
          const db = getFirestore();
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          const role = userData?.role || 'user';
          
          console.log('useAuth - userData:', userData);
          console.log('useAuth - role:', role);
          console.log('useAuth - user.uid:', user.uid);
          
          setUser({ ...user, role });
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du rôle:', error);
        
        // En cas d'erreur (mode hors ligne), on essaie de récupérer le rôle depuis le stockage local
        if (user) {
          try {
            // Essayer de récupérer depuis AsyncStorage
            const savedRole = await AsyncStorage.getItem('userRole');
            const savedEmail = await AsyncStorage.getItem('userEmail');
            
            if (savedRole && savedEmail === user.email) {
              console.log('useAuth - Rôle récupéré depuis AsyncStorage:', savedRole);
              setUser({ ...user, role: savedRole as UserRole });
            } else {
              // Solution temporaire : forcer le rôle admin pour papalybn@gmail.com
              if (user.email === 'papalybn@gmail.com') {
                console.log('useAuth - Mode hors ligne, forcer admin pour papalybn@gmail.com');
                setUser({ ...user, role: 'admin' });
              } else {
                // Si pas de stockage local ou email différent, on garde l'utilisateur sans rôle
                console.log('useAuth - Mode hors ligne, utilisateur sans rôle:', user.email);
                setUser({ ...user, role: undefined });
              }
            }
          } catch (storageError) {
            console.log('useAuth - Erreur AsyncStorage, utilisateur sans rôle:', user.email);
            setUser({ ...user, role: undefined });
          }
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = () => user?.role === 'admin';

  return { user, loading, isAdmin, setUser };
} 