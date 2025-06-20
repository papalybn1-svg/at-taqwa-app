import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import AdminAccountScreen from '../screens/AdminAccountScreen';
import AdminNotificationsScreen from '../screens/AdminNotificationsScreen';
import AdminSettingsScreen from '../screens/AdminSettingsScreen';

const Stack = createStackNavigator();

export default function AdminSettingsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
      <Stack.Screen name="AdminNotifications" component={AdminNotificationsScreen} />
      <Stack.Screen name="AdminAccount" component={AdminAccountScreen} />
    </Stack.Navigator>
  );
} 