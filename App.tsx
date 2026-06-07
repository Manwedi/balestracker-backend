import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { InventoryProvider } from './src/contexts/InventoryContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <InventoryProvider>
          <RootNavigator />
        </InventoryProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

