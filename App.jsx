import React, { useState, useEffect } from 'react';
import {
  View,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import StorageService from './src/services/storageService';
import LoginScreen from './src/screens/LoginScreen';
import EmployeeDashboardScreen from './src/screens/EmployeeDashboardScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';

function MainApp() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      await StorageService.initDefaults();
      const user = await StorageService.getCurrentUser();
      setCurrentUser(user);
    } catch (e) {
      console.error('Failed to initialize session:', e);
    } finally {
      setLoadingSession(false);
    }
  };

  const handleLogout = async () => {
    try {
      await StorageService.logout();
      setCurrentUser(null);
    } catch (e) {
      console.error('Error logging out:', e);
    }
  };

  if (loadingSession) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="#FFFFFF"
      />
      {!currentUser ? (
        <LoginScreen onLoginSuccess={setCurrentUser} />
      ) : currentUser.role === 'admin' ? (
        <AdminDashboardScreen user={currentUser} onLogout={handleLogout} />
      ) : (
        <EmployeeDashboardScreen user={currentUser} onLogout={handleLogout} />
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});
