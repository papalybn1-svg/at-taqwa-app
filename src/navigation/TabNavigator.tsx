import { MaterialCommunityIcons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import AuthorProfileScreen from '../screens/AuthorProfileScreen';
import BooksScreen from '../screens/BooksScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import HomeScreen from "../screens/HomeScreen";
import HorairesScreen from '../screens/HorairesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import OriginalQuizScreen from '../screens/OriginalQuizScreen';
import ParametresScreen from '../screens/ParametresScreen';
import QuizChapterSelectScreen from '../screens/QuizChapterSelectScreen';

import QuizScreen from '../screens/QuizScreen';
import QuizStartScreen from '../screens/QuizStartScreen';
import TasbihScreen from '../screens/TasbihScreen';
import colors from "../theme/colors";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator pour l'onglet Accueil
function HomeStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        gestureEnabled: true, // Active le geste de retour par défaut pour iOS
        gestureDirection: 'horizontal', // Geste horizontal (swipe de gauche à droite)
      }}
    >
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen}
        options={{
          gestureEnabled: false, // Pas de geste sur l'écran principal (c'est la racine)
        }}
      />
      <Stack.Screen 
        name="Quiz" 
        component={QuizScreen}
        options={{
          gestureEnabled: false, // Désactive le swipe natif pour utiliser notre swipe personnalisé
        }}
      />
      <Stack.Screen 
        name="QuizStart" 
        component={QuizStartScreen}
        options={{
          gestureEnabled: false, // Désactive le swipe natif pour utiliser notre swipe personnalisé
        }}
      />
      <Stack.Screen 
        name="QuizChapterSelect" 
        component={QuizChapterSelectScreen}
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="OriginalQuiz" 
        component={OriginalQuizScreen}
        options={{
          gestureEnabled: false, // Désactive le swipe natif pour utiliser notre swipe personnalisé
        }}
      />
      <Stack.Screen 
        name="Tasbih" 
        component={TasbihScreen}
        options={{
          gestureEnabled: true, // Permet le swipe pour revenir à l'accueil
        }}
      />
      <Stack.Screen 
        name="Books" 
        component={BooksScreen}
        options={{
          gestureEnabled: false,
        }}
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{
          gestureEnabled: true, // Permet le swipe pour revenir à l'accueil
        }}
      />
      <Stack.Screen 
        name="AuthorProfile" 
        component={AuthorProfileScreen}
        options={{
          gestureEnabled: true, // Permet le swipe pour revenir
        }}
      />
    </Stack.Navigator>
  );
}

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
        component={HomeStack}
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