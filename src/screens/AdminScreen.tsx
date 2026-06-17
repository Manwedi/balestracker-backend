import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const API_URL = 'https://balestracker-api.onrender.com/api';

export default function AdminScreen() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState<any[]>([]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/users`);
      if (res.ok) setUsersList(await res.json());
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const changeRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`${API_URL}/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) fetchUsers();
    } catch(err) {
      Alert.alert('Error updating role');
    }
  };

  if (user?.role !== 'admin') {
    return <SafeAreaView style={styles.container}><Text>Access Denied</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Admin Panel</Text>
      <FlatList 
        data={usersList}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <View>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userRole}>Current Role: <Text style={{fontWeight: 'bold'}}>{item.role}</Text></Text>
            </View>
            <View style={styles.actions}>
              {item.role !== 'admin' && (
                <TouchableOpacity style={styles.btnAdmin} onPress={() => changeRole(item.id, 'admin')}>
                  <Text style={styles.btnText}>Make Admin</Text>
                </TouchableOpacity>
              )}
              {item.role !== 'sales_tech' && (
                <TouchableOpacity style={styles.btnSales} onPress={() => changeRole(item.id, 'sales_tech')}>
                  <Text style={styles.btnText}>Make Sales</Text>
                </TouchableOpacity>
              )}
              {item.role !== 'customer' && (
                <TouchableOpacity style={styles.btnCustomer} onPress={() => changeRole(item.id, 'customer')}>
                  <Text style={styles.btnText}>Demote</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  userCard: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12, elevation: 2 },
  userName: { fontSize: 18, fontWeight: 'bold' },
  userRole: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  btnAdmin: { backgroundColor: '#e74c3c', padding: 8, borderRadius: 4 },
  btnSales: { backgroundColor: '#3498db', padding: 8, borderRadius: 4 },
  btnCustomer: { backgroundColor: '#95a5a6', padding: 8, borderRadius: 4 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 }
});
