import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList, TabParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

// Auth screens
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';

// Tab screens
import HomeScreen from '../screens/HomeScreen';
import TournamentsScreen from '../screens/TournamentsScreen';
import CreateScreen from '../screens/CreateScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Stack screens
import TournamentDetailScreen from '../screens/TournamentDetailScreen';
import CreateTournamentScreen from '../screens/CreateTournamentScreen';
import MatchDetailScreen from '../screens/MatchDetailScreen';
import ScoreEntryScreen from '../screens/ScoreEntryScreen';
import PlayerProfileScreen from '../screens/PlayerProfileScreen';
import BracketViewScreen from '../screens/BracketViewScreen';
import StandingsScreen from '../screens/StandingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Tournaments" component={TournamentsScreen} />
      <Tab.Screen name="Create" component={CreateScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!session ? (
          <>
            <Stack.Screen name="Auth" component={AuthStack} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="TournamentDetail" component={TournamentDetailScreen} />
            <Stack.Screen name="CreateTournament" component={CreateTournamentScreen} />
            <Stack.Screen name="MatchDetail" component={MatchDetailScreen} />
            <Stack.Screen name="ScoreEntry" component={ScoreEntryScreen} />
            <Stack.Screen name="PlayerProfile" component={PlayerProfileScreen} />
            <Stack.Screen name="BracketView" component={BracketViewScreen} />
            <Stack.Screen name="Standings" component={StandingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}
