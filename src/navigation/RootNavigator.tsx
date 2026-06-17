import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { Home, Package, PlusCircle, TrendingUp } from 'lucide-react-native';

// Screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import DashboardScreen from '../screens/DashboardScreen';
import InventoryScreen from '../screens/InventoryScreen';
import AddItemScreen from '../screens/AddItemScreen';
import SalesScreen from '../screens/SalesScreen';
import AdminScreen from '../screens/AdminScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ShieldCheck } from 'lucide-react-native';

const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();

export default function RootNavigator() {
  const { user } = useAuth();

  // Show Login/Signup flow if no user
  if (!user) {
    return (
      <NavigationContainer>
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Signup" component={SignupScreen} />
          <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </AuthStack.Navigator>
      </NavigationContainer>
    );
  }

  // Define tab visibility based on roles
  const canViewDashboard = user.role === 'admin' || user.role === 'sales_tech';
  const canAddItems = user.role === 'admin';
  const canMakeSales = user.role === 'admin' || user.role === 'sales_tech';
  const isAdmin = user.role === 'admin';

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#4a90e2',
          tabBarInactiveTintColor: '#999',
          headerShown: false,
        }}
      >
        {canViewDashboard && (
          <Tab.Screen 
            name="Dashboard" 
            component={DashboardScreen} 
            options={{
              tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
            }}
          />
        )}
        
        <Tab.Screen 
          name="Inventory" 
          component={InventoryScreen} 
          options={{
            tabBarIcon: ({ color, size }) => <Package color={color} size={size} />
          }}
        />

        {isAdmin && (
          <Tab.Screen 
            name="Admin" 
            component={AdminScreen} 
            options={{
              tabBarIcon: ({ color, size }) => <ShieldCheck color={color} size={size} />
            }}
          />
        )}

        {canAddItems && (
          <Tab.Screen 
            name="Add Item" 
            component={AddItemScreen} 
            options={{
              tabBarIcon: ({ color, size }) => <PlusCircle color={color} size={size} />
            }}
          />
        )}

        {canMakeSales && (
          <Tab.Screen 
            name="Sales" 
            component={SalesScreen} 
            options={{
              tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size} />
            }}
          />
        )}
      </Tab.Navigator>
    </NavigationContainer>
  );
}
