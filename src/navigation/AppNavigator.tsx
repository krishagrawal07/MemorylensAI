import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import Icon from '../components/AppIcon';

// Import screens (will create them next)
import HomeScreen from '../screens/HomeScreen';
import TimelineScreen from '../screens/TimelineScreen';
import CaptureMemoryScreen from '../screens/CaptureMemoryScreen';
import VoiceNoteScreen from '../screens/VoiceNoteScreen';
import CameraMemoryScreen from '../screens/CameraMemoryScreen';
import AskMemoryLensScreen from '../screens/AskMemoryLensScreen';
import SearchResultsScreen from '../screens/SearchResultsScreen';
import MemoryDetailScreen from '../screens/MemoryDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import PermissionsScreen from '../screens/PermissionsScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  Permissions: undefined;
  MainTabs: undefined;
  CaptureMemory: undefined;
  VoiceNote: undefined;
  CameraMemory: undefined;
  AskMemoryLens: undefined;
  SearchResults: { query: string };
  MemoryDetail: { memoryId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Timeline: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICON_MAP: Record<keyof MainTabParamList, string> = {
  Home: 'home',
  Timeline: 'timeline',
  Settings: 'settings',
};

type TabIconProps = {
  focused: boolean;
  color: string;
  size: number;
};

type NamedTabIconProps = TabIconProps & {
  name: string;
};

const TabIcon = ({ focused, color, size, name }: NamedTabIconProps) => (
  <View style={[styles.tabIconWrapper, focused && styles.tabIconWrapperFocused]}>
    <Icon name={name} size={focused ? size + 1 : size} color={focused ? '#007AFF' : color} />
  </View>
);

const HOME_TAB_ICON = ({ focused, color, size }: TabIconProps) => (
  <TabIcon focused={focused} color={color} size={size} name={TAB_ICON_MAP.Home} />
);

const TIMELINE_TAB_ICON = ({ focused, color, size }: TabIconProps) => (
  <TabIcon focused={focused} color={color} size={size} name={TAB_ICON_MAP.Timeline} />
);

const SETTINGS_TAB_ICON = ({ focused, color, size }: TabIconProps) => (
  <TabIcon focused={focused} color={color} size={size} name={TAB_ICON_MAP.Settings} />
);

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: HOME_TAB_ICON }}
      />
      <Tab.Screen
        name="Timeline"
        component={TimelineScreen}
        options={{ tabBarIcon: TIMELINE_TAB_ICON }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarIcon: SETTINGS_TAB_ICON }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Onboarding"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Permissions"
          component={PermissionsScreen}
          options={{ title: 'Permissions' }}
        />
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CaptureMemory"
          component={CaptureMemoryScreen}
          options={{ title: 'Capture Memory' }}
        />
        <Stack.Screen
          name="VoiceNote"
          component={VoiceNoteScreen}
          options={{ title: 'Voice Note' }}
        />
        <Stack.Screen
          name="CameraMemory"
          component={CameraMemoryScreen}
          options={{ title: 'Camera Memory' }}
        />
        <Stack.Screen
          name="AskMemoryLens"
          component={AskMemoryLensScreen}
          options={{ title: 'Ask MemoryLens' }}
        />
        <Stack.Screen
          name="SearchResults"
          component={SearchResultsScreen}
          options={{ title: 'Search Results' }}
        />
        <Stack.Screen
          name="MemoryDetail"
          component={MemoryDetailScreen}
          options={{ title: 'Memory Detail' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 68,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 0,
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  tabBarItem: {
    paddingVertical: 2,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapperFocused: {
    backgroundColor: '#e8f1ff',
  },
});

