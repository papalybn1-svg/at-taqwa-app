import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import FavoritesScreen from '../screens/FavoritesScreen';
import HomeScreen from "../screens/HomeScreen";
import HorairesScreen from '../screens/HorairesScreen';
import ParametresScreen from '../screens/ParametresScreen';
import colors from "../theme/colors";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: { 
          backgroundColor: colors.white,
          height: 80,
          paddingBottom: 20,
          paddingTop: 12,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 12,
          borderTopWidth: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        }
      }}
    >
      <Tab.Screen
        name="Accueil"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
            <MaterialCommunityIcons 
              name={focused ? "home" : "home-outline"} 
              color={color} 
              size={focused ? 26 : 24} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Horaires"
        component={HorairesScreen}
        options={{
          tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
            <MaterialCommunityIcons 
              name={focused ? "clock" : "clock-outline"} 
              color={color} 
              size={focused ? 26 : 24} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Favoris"
        component={FavoritesScreen}
        options={{
          tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
            <MaterialCommunityIcons 
              name={focused ? "heart" : "heart-outline"} 
              color={color} 
              size={focused ? 26 : 24} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Paramètres"
        component={ParametresScreen}
        options={{
          tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
            <MaterialCommunityIcons 
              name={focused ? "cog" : "cog-outline"} 
              color={color} 
              size={focused ? 26 : 24} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
} 