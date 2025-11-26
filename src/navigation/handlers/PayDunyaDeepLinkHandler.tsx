import React from 'react';
import * as Linking from 'expo-linking';
import { Alert, AppState } from 'react-native';
import { applyActionCode } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEntitlements } from '../../contexts/EntitlementsContext';
import { usePaymentService } from '../../lib/paymentService';
import { AuthContext } from '../../contexts/AuthContext';
import { auth, db } from '../../screens/firebaseConfig';

const PayDunyaDeepLinkHandler: React.FC = () => {
  const { checkEntitlements } = usePaymentService();
  const { refreshEntitlements } = useEntitlements();
  const { setUser } = React.useContext(AuthContext);

  const refreshRef = React.useRef(refreshEntitlements);
  const checkRef = React.useRef(checkEntitlements);
  React.useEffect(() => { refreshRef.current = refreshEntitlements; }, [refreshEntitlements]);
  React.useEffect(() => { checkRef.current = checkEntitlements; }, [checkEntitlements]);

  React.useEffect(() => {
    const handleDeepLink = async (url: string) => {
      try {
        const parsed = Linking.parse(url);
        if (parsed?.hostname === 'paydunya') {
          switch (parsed.path) {
            case 'success': {
              try {
                await new Promise(r => setTimeout(r, 2000));
                await refreshRef.current();
                const entitlements = await checkRef.current();
                if (entitlements.part2 || entitlements.part3) {
                  Alert.alert('Paiement réussi !', 'Votre paiement a été confirmé. Accès débloqué.', [{ text: 'OK' }]);
                } else {
                  Alert.alert('Paiement en cours', 'L’accès sera débloqué dans quelques instants.', [{ text: 'OK' }]);
                }
              } catch {
                Alert.alert('Paiement en cours', 'L’accès sera débloqué dans quelques instants.', [{ text: 'OK' }]);
              }
              break;
            }
            case 'cancel':
              Alert.alert('Paiement annulé', 'Vous pouvez réessayer à tout moment.', [{ text: 'OK' }]);
              break;
            case 'failed':
              Alert.alert('Paiement échoué', 'Le paiement n’a pas pu être traité.', [{ text: 'OK' }]);
              break;
          }
        } else if (parsed?.scheme === 'https' && parsed?.hostname === 'attaqwa-confidentialite.vercel.app') {
          const mode = parsed.queryParams?.mode as string | undefined;
          const oob = parsed.queryParams?.oobCode as string | undefined;
          if (mode === 'verifyEmail' && oob) {
            try {
              await applyActionCode(auth, oob);
              await auth.currentUser?.reload();
              if (auth.currentUser?.emailVerified && auth.currentUser) {
                const ref = doc(db, 'users', auth.currentUser.uid);
                const snap = await getDoc(ref);
                if (!snap.exists()) {
                  await setDoc(ref, {
                    email: auth.currentUser.email,
                    role: 'user',
                    emailVerified: true,
                    createdAt: new Date(),
                    displayName: auth.currentUser.displayName || '',
                  });
                }
                const role = (snap.data() as any)?.role || 'user';
                setUser?.({ ...(auth.currentUser as any), role });
                Alert.alert('E‑mail vérifié', 'Votre adresse e‑mail est confirmée.', [{ text: 'OK' }]);
              } else {
                Alert.alert('Vérification en cours', 'Réessayez dans quelques instants.');
              }
            } catch {}
          }
        }
      } catch (error) {
        console.error('❌ Deep link error:', error);
      }
    };

    const sub = Linking.addEventListener('url', e => handleDeepLink(e.url));
    Linking.getInitialURL().then(url => { if (url) handleDeepLink(url); });

    const appStateSub = AppState.addEventListener('change', async state => {
      if (state === 'active') {
        try {
          await auth.currentUser?.reload();
          if (auth.currentUser?.emailVerified && auth.currentUser) {
            try {
              const snap = await getDoc(doc(db, 'users', auth.currentUser.uid));
              const role = (snap.data() as any)?.role || 'user';
              setUser?.({ ...(auth.currentUser as any), role });
            } catch {
              setUser?.({ ...(auth.currentUser as any), role: 'user' });
            }
          }
        } catch {}
      }
    });

    return () => {
      sub.remove();
      appStateSub.remove();
    };
  }, []);

  return null;
};

export default PayDunyaDeepLinkHandler;


