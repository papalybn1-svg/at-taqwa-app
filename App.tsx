import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import RootErrorBoundary from './src/components/RootErrorBoundary';
import { AuthContext } from './src/contexts/AuthContext';
import { EntitlementsProvider } from './src/contexts/EntitlementsContext';
import { useAuth } from './src/hooks/useAuth';
import PayDunyaDeepLinkHandler from './src/navigation/handlers/PayDunyaDeepLinkHandler';
import TabNavigator from './src/navigation/TabNavigator';
import LoginScreen from './src/screens/LoginScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';

const Stack = createStackNavigator();

function RootNavigator() {
  const { user, loading } = useAuth();

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
        {user ? (
          <EntitlementsProvider>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
          </EntitlementsProvider>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const { user, setUser } = useAuth();
  console.log('[App] rendu racine');
  return (
    <RootErrorBoundary>
      <AuthContext.Provider value={{ user, setUser }}>
        <RootNavigator />
      </AuthContext.Provider>
    </RootErrorBoundary>
  );
}


