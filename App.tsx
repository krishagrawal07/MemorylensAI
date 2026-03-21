import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { memoryService } from './src/services/memoryService';

function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const initApp = async () => {
      try {
        await memoryService.initialize();
        setAppReady(true);
      } catch (error) {
        console.error('App initialization failed in App.tsx:', error);
        Alert.alert('Initialization Error', 'MemoryLens AI failed to initialize. Please restart the app.');
      }
    };

    initApp();
  }, []);

  if (!appReady) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Starting MemoryLens AI runtime...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    color: '#333',
    fontSize: 16,
  },
});
