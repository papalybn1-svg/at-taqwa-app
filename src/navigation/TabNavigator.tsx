import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import BooksScreen from "../screens/BooksScreen";
import HomeScreen from "../screens/HomeScreen";
import HorairesScreen from '../screens/HorairesScreen';
import ParametresScreen from '../screens/ParametresScreen';
import QuizScreen from "../screens/QuizScreen";
import TasbihScreen from "../screens/TasbihScreen";
import colors from "../theme/colors";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#888",
        tabBarStyle: { 
          backgroundColor: colors.white,
          height: 64,
          paddingBottom: 22,
          paddingTop: 14,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarSafeAreaInsets: { bottom: 12, top: 0 },
        tabBarLabelStyle: {
          fontSize: 12
        }
      }}
    >
      <Tab.Screen
        name="Accueil"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Livres"
        component={BooksScreen}
        options={{
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MaterialCommunityIcons name="book-open-page-variant" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Quiz"
        component={QuizScreen}
        options={{
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MaterialCommunityIcons name="head-question" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Paramètres"
        component={ParametresScreen}
        options={{
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Chapelet"
        component={TasbihScreen}
        options={{
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MaterialCommunityIcons name="circle-multiple" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Horaires"
        component={HorairesScreen}
        options={{
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MaterialCommunityIcons name="clock-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
} 