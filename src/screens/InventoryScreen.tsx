import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, TextInput, TouchableOpacity } from 'react-native';
import { useInventory } from '../contexts/InventoryContext';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { Search, Edit2, Minus, Plus } from 'lucide-react-native';

export default function InventoryScreen() {
  const { inventory, updateItemQuantity } = useInventory();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInventory = inventory.filter(item => 
    (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.code || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalBales = inventory.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
        <Text style={styles.subtitle}>{totalBales} total bales</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search color="#999" size={20} style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput}
          placeholder="Search by code or description..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredInventory}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View>
                <Text style={styles.itemName}>{item.name || 'Unknown Item'}</Text>
                <View style={styles.codeRow}>
                  <Text style={styles.itemCode}>{item.code || 'NO-CODE'}</Text>
                  <View style={[styles.tagBadge, { backgroundColor: item.tag === 'MMOPANE' ? '#e8f5e9' : '#e3f2fd' }]}>
                    <Text style={[styles.tagText, { color: item.tag === 'MMOPANE' ? '#2e7d32' : '#1976d2' }]}>{item.tag || 'NO-TAG'}</Text>
                  </View>
                </View>

                {user?.role === 'admin' && (
                  <Text style={styles.auditText}>Last Edited By: {item.lastEditedBy}</Text>
                )}
              </View>
              <TouchableOpacity style={styles.editBtn}>
                <Edit2 size={18} color="#555" />
              </TouchableOpacity>
            </View>

            <View style={styles.itemFooter}>
              <Text style={styles.itemPrice}>P {Number(item.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
              
              <View style={styles.quantityControls}>
                <TouchableOpacity 
                  style={styles.qtyBtn} 
                  onPress={() => updateItemQuantity(item.id, -1, user?.name)}
                >
                  <Minus size={16} color="#555" />
                </TouchableOpacity>
                
                <Text style={styles.qtyText}>{item.quantity || 0}</Text>
                
                <TouchableOpacity 
                  style={styles.qtyBtn}
                  onPress={() => updateItemQuantity(item.id, 1, user?.name)}
                >
                  <Plus size={16} color="#555" />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    paddingTop: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  itemCard: {
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  itemCode: {
    color: '#666',
    fontSize: 14,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  auditText: {
    fontSize: 11,
    color: '#e74c3c',
    marginTop: 6,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  editBtn: {
    padding: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyBtn: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  qtyText: {
    fontSize: 18,
    fontWeight: 'bold',
    width: 40,
    textAlign: 'center',
  }
});

