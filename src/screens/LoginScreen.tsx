import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen({ navigation }: any) {
  const { login, isLoading } = useAuth();
  const [contactId, setContactId] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!contactId || !password) return Alert.alert('Error', 'Please enter your email/phone and password');
    try {
      await login(contactId.toLowerCase(), password);
    } catch (err: any) {
      Alert.alert('Login Failed', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Jane's Bale Hub</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>
        
        <TextInput 
          style={styles.input} 
          placeholder="Username" 
          value={contactId} 
          onChangeText={setContactId} 
          autoCapitalize="none"
        />
        
        <TextInput 
          style={styles.input} 
          placeholder="Password" 
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry
        />
        
        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{marginTop: 12, alignItems: 'center'}} onPress={() => navigation.navigate('ResetPassword')}>
          <Text style={{color: '#7f8c8d', fontSize: 14}}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.footprint}>made by Manwedi Claude</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2c3e50', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#7f8c8d', textAlign: 'center', marginBottom: 32 },
  input: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e1e5e8', borderRadius: 8, padding: 16, marginBottom: 16, fontSize: 16 },
  button: { backgroundColor: '#4a90e2', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linkButton: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#4a90e2', fontSize: 16 },
  footprint: { position: 'absolute', bottom: 30, alignSelf: 'center', color: '#bdc3c7', fontSize: 12, fontWeight: '500', letterSpacing: 1 }
});
