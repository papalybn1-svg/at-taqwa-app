import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminHadithsScreen from '../screens/AdminHadithsScreen';
import AdminUsersScreen from '../screens/AdminUsersScreen';
import AdminZikrsScreen from '../screens/AdminZikrsScreen';
import colors from '../theme/colors';
import AdminSettingsNavigator from './AdminSettingsNavigator';

const Tab = createBottomTabNavigator();

export default function AdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 65,
          paddingBottom: 10,
          paddingTop: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{
          tabBarLabel: 'Tableau de bord',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Users"
        component={AdminUsersScreen}
        options={{
          tabBarLabel: 'Utilisateurs',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MaterialCommunityIcons name="account-group" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Hadiths"
        component={AdminHadithsScreen}
        options={{
          tabBarLabel: 'Hadiths',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MaterialCommunityIcons name="book-open-variant" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Zikrs"
        component={AdminZikrsScreen}
        options={{
          tabBarLabel: 'Zikrs',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MaterialCommunityIcons name="hands-pray" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={AdminSettingsNavigator}
        options={{
          tabBarLabel: 'Paramètres',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
} 