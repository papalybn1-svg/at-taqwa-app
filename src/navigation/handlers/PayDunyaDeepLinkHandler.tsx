import React from 'react';
import * as Linking from 'expo-linking';
import { Alert, AppState } from 'react-native';
import { NavigationContainerRef, CommonActions } from '@react-navigation/native';
import { applyActionCode } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { EntitlementsContext } from '../../contexts/EntitlementsContext';
import { usePaymentService } from '../../lib/paymentService';
import { AuthContext } from '../../contexts/AuthContext';
import { auth, db } from '../../screens/firebaseConfig';

interface PayDunyaDeepLinkHandlerProps {
  navigationRef: React.RefObject<NavigationContainerRef<any>>;
}

const PayDunyaDeepLinkHandler: React.FC<PayDunyaDeepLinkHandlerProps> = ({ navigationRef }) => {
  const { checkEntitlements } = usePaymentService();
  const entitlementsContext = React.useContext(EntitlementsContext);
  const refreshEntitlements = entitlementsContext?.refreshEntitlements;
  const { setUser } = React.useContext(AuthContext);
  const pendingResetPasswordUrl = React.useRef<string | null>(null);
  const navigationReady = React.useRef(false);

  const refreshRef = React.useRef(refreshEntitlements);
  const checkRef = React.useRef(checkEntitlements);
  React.useEffect(() => { 
    if (refreshEntitlements) {
      refreshRef.current = refreshEntitlements;
    }
  }, [refreshEntitlements]);
  React.useEffect(() => { checkRef.current = checkEntitlements; }, [checkEntitlements]);

  React.useEffect(() => {
    const handleDeepLink = async (url: string) => {
      try {
        const parsed = Linking.parse(url);
        if (parsed?.hostname === 'paydunya') {
          switch (parsed.path) {
            case 'success': {
              try {
                // Attendre un peu pour que le backend traite le paiement
                await new Promise(r => setTimeout(r, 2000));
                // FORCER le refresh après un paiement réussi pour débloquer immédiatement
                if (refreshRef.current) {
                  await refreshRef.current(true); // force=true pour bypasser le cooldown
                }
                const entitlements = await checkRef.current();
                if (entitlements.part2 || entitlements.part3) {
                  Alert.alert('Paiement réussi !', 'Votre paiement a été confirmé. Accès débloqué.', [{ text: 'OK' }]);
                } else {
                  Alert.alert('Paiement en cours', 'L\'accès sera débloqué dans quelques instants.', [{ text: 'OK' }]);
                }
              } catch {
                Alert.alert('Paiement en cours', 'L\'accès sera débloqué dans quelques instants.', [{ text: 'OK' }]);
              }
              break;
            }
            case 'cancel':
              Alert.alert('Paiement annulé', 'Vous pouvez réessayer à tout moment.', [{ text: 'OK' }]);
              break;
            case 'failed':
              Alert.alert('Paiement échoué', 'Le paiement n\'a pas pu être traité.', [{ text: 'OK' }]);
              break;
          }
        } else if (parsed?.scheme === 'https' && parsed?.hostname === 'attaqwa-confidentialite.vercel.app') {
          const mode = parsed.queryParams?.mode as string | undefined;
          const oob = parsed.queryParams?.oobCode as string | undefined;
          
          if (mode === 'resetPassword' && oob) {
            // Rediriger vers l'écran de réinitialisation de mot de passe
            console.log('🔐 Deep link réinitialisation mot de passe détecté, oobCode:', oob);
            
            // Fonction pour naviguer vers ResetPassword
            const navigateToResetPassword = () => {
              if (!navigationRef.current) {
                // Navigation pas encore prête, stocker l'URL et réessayer plus tard
                pendingResetPasswordUrl.current = url;
                console.log('⏳ NavigationContainer pas encore prêt, attente...');
                return;
              }
              
              try {
                navigationRef.current.dispatch(
                  CommonActions.navigate({
                    name: 'ResetPassword',
                    params: { oobCode: oob },
                  })
                );
                pendingResetPasswordUrl.current = null;
                console.log('✅ Navigation vers ResetPassword réussie');
              } catch (error) {
                console.error('❌ Erreur navigation ResetPassword:', error);
                // Stocker pour réessayer plus tard
                pendingResetPasswordUrl.current = url;
              }
            };
            
            navigateToResetPassword();
          } else if (mode === 'verifyEmail' && oob) {
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
    
    // Gérer l'URL initiale avec un délai pour laisser la navigation se préparer
    Linking.getInitialURL().then(url => { 
      if (url) {
        console.log('🔗 URL initiale détectée:', url);
        // Attendre que la navigation soit prête avant de traiter le deep link
        const tryHandleUrl = (attempt = 0) => {
          if (navigationRef.current) {
            navigationReady.current = true;
            handleDeepLink(url);
          } else if (attempt < 10) {
            // Réessayer jusqu'à 10 fois (5 secondes max)
            setTimeout(() => tryHandleUrl(attempt + 1), 500);
          } else {
            // Si après 5 secondes la navigation n'est pas prête, stocker l'URL
            console.warn('⚠️ NavigationContainer toujours pas prêt après 5 secondes');
            pendingResetPasswordUrl.current = url;
          }
        };
        tryHandleUrl();
      }
    });
    
    // Vérifier périodiquement s'il y a une URL en attente de navigation
    const checkPendingUrl = setInterval(() => {
      if (pendingResetPasswordUrl.current && navigationRef.current) {
        const url = pendingResetPasswordUrl.current;
        const parsed = Linking.parse(url);
        const mode = parsed.queryParams?.mode as string | undefined;
        const oob = parsed.queryParams?.oobCode as string | undefined;
        
        if (mode === 'resetPassword' && oob) {
          console.log('✅ NavigationContainer prêt, traitement de l\'URL en attente');
          try {
            navigationRef.current.dispatch(
              CommonActions.navigate({
                name: 'ResetPassword',
                params: { oobCode: oob },
              })
            );
            pendingResetPasswordUrl.current = null;
          } catch (error) {
            console.error('❌ Erreur navigation URL en attente:', error);
          }
        }
      }
    }, 500);

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
      clearInterval(checkPendingUrl);
    };
  }, []);

  return null;
};

export default PayDunyaDeepLinkHandler;


