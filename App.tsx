import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import RootErrorBoundary from './src/components/RootErrorBoundary';
import { AuthProvider, useAuthContext } from './src/contexts/AuthContext';
import { EntitlementsProvider } from './src/contexts/EntitlementsContext';
import PayDunyaDeepLinkHandler from './src/navigation/handlers/PayDunyaDeepLinkHandler';
import TabNavigator from './src/navigation/TabNavigator';
import LoginScreen from './src/screens/LoginScreen';
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

  console.log('[RootNavigator] loading =', loading, 'user =', user?.email);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 12 }}>Initialisation en cours…</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <PayDunyaDeepLinkHandler />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user && user.emailVerified ? (
          <Stack.Screen name="MainTabs" component={MainTabsWithEntitlements} />
        ) : user && !user.emailVerified ? (
          <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
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


