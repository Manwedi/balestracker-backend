import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react-native';

export default function ResetPasswordScreen({ navigation }: any) {
  const { resetPassword, isLoading } = useAuth();
  
  const [contactId, setContactId] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleResetPassword = async () => {
    if (!contactId || !newPassword) return Alert.alert('Error', 'Please enter your username and a new password');
    try {
      await resetPassword(contactId.toLowerCase(), newPassword);
      Alert.alert('Success', 'Your password has been reset!', [
        { text: 'Login Now', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reset password.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <ArrowLeft color="#2c3e50" size={24} />
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your username to set a new password.</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Username" 
          value={contactId} 
          onChangeText={setContactId} 
          autoCapitalize="none"
        />
        <TextInput 
          style={styles.input} 
          placeholder="New Password" 
          value={newPassword} 
          onChangeText={setNewPassword} 
          secureTextEntry
        />
        <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Change Password</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', justifyContent: 'center', padding: 20 },
  backBtn: { position: 'absolute', top: 60, left: 20, zIndex: 10, padding: 8, backgroundColor: '#fff', borderRadius: 8, elevation: 2 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 24, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#2c3e50', marginBottom: 16 },
  subtitle: { fontSize: 14, color: '#7f8c8d', marginBottom: 24, lineHeight: 20 },
  input: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e1e5e8', borderRadius: 8, padding: 16, marginBottom: 16, fontSize: 16 },
  button: { backgroundColor: '#8e44ad', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
