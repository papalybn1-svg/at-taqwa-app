import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import RootErrorBoundary from './src/components/RootErrorBoundary';
import SplashScreen from './src/components/SplashScreen';
import { AuthProvider, useAuthContext } from './src/contexts/AuthContext';
import { EntitlementsProvider } from './src/contexts/EntitlementsContext';
import PayDunyaDeepLinkHandler from './src/navigation/handlers/PayDunyaDeepLinkHandler';
import TabNavigator from './src/navigation/TabNavigator';
import LoginScreen from './src/screens/LoginScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';

const Stack = createStackNavigator();

// Composant wrapper pour TabNavigator avec EntitlementsProvider
function MainTabsWithEntitlements() {
  return (
    <EntitlementsProvider>
      <TabNavigator />
    </EntitlementsProvider>
  );
}

function RootNavigator() {
  const { user, loading } = useAuthContext();
  const navigationRef = React.useRef<NavigationContainerRef<any>>(null);

  console.log('[RootNavigator] loading =', loading, 'user =', user?.email);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef} onReady={() => {
      console.log('✅ NavigationContainer prêt');
    }}>
      <PayDunyaDeepLinkHandler navigationRef={navigationRef} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user && user.emailVerified ? (
          <Stack.Screen name="MainTabs" component={MainTabsWithEntitlements} />
        ) : user && !user.emailVerified ? (
          <>
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  console.log('[App] rendu racine');
  return (
    <RootErrorBoundary>
      <AuthProvider>
        <EntitlementsProvider>
          <RootNavigator />
        </EntitlementsProvider>
      </AuthProvider>
    </RootErrorBoundary>
  );
}


