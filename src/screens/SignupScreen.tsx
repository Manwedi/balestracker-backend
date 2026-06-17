import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function SignupScreen({ navigation }: any) {
  const { register, isLoading } = useAuth();
  const [contactId, setContactId] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    if (!contactId || !password) return Alert.alert('Error', 'Please enter an Email or Phone number and password');
    try {
      await register(contactId.toLowerCase(), password);
    } catch (err: any) {
      Alert.alert('Signup Failed', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Join Jane's Bale Hub</Text>
        <Text style={styles.subtitle}>Create a new account</Text>
        
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
        
        <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign Up</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2c3e50', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#7f8c8d', textAlign: 'center', marginBottom: 32 },
  input: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e1e5e8', borderRadius: 8, padding: 16, marginBottom: 16, fontSize: 16 },
  button: { backgroundColor: '#27ae60', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linkButton: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#4a90e2', fontSize: 16 }
});
