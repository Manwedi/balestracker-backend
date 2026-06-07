import React from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useInventory } from '../contexts/InventoryContext';
import { Card } from '../components/Card';
import { Package, DollarSign, MapPin, Layers } from 'lucide-react-native';

// Using a standard View with background color for the gradient effect to avoid extra dependencies for now
export default function DashboardScreen() {
  const { user } = useAuth();
  const { inventory } = useInventory();

  // Derived stats
  const totalBales = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const stockValue = inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const uniqueLocations = new Set(inventory.map(i => i.tag)).size;
  const productTypes = inventory.length;

  // Recent items (last 3)
  const recentItems = [...inventory].reverse().slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <Text style={styles.welcomeText}>Welcome back, {user?.name}!</Text>
        <Text style={styles.welcomeSubtext}>Manage your clothing bales inventory</Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statTitle}>Total Bales</Text>
              <Package size={20} color="#4a90e2" />
            </View>
            <Text style={styles.statValue}>{totalBales}</Text>
            <Text style={styles.statSubtext}>{productTypes} product types</Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statTitle}>Stock Value</Text>
              <DollarSign size={20} color="#27ae60" />
            </View>
            <Text style={styles.statValue}>P {stockValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
          </Card>
        </View>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statTitle}>Locations</Text>
              <MapPin size={20} color="#8e44ad" />
            </View>
            <Text style={styles.statValue}>{uniqueLocations}</Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statTitle}>Product Types</Text>
              <Layers size={20} color="#e67e22" />
            </View>
            <Text style={styles.statValue}>{productTypes}</Text>
          </Card>
        </View>
      </View>

      {/* Recent Items List */}
      <View style={styles.recentContainer}>
        <View style={styles.recentHeader}>
          <Package size={24} color="#333" />
          <Text style={styles.recentTitle}>Recently Added Items</Text>
        </View>

        <FlatList
          data={recentItems}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <Card style={styles.listItem}>
              <View style={styles.listItemLeft}>
                <View style={styles.listCodeContainer}>
                  <Text style={styles.itemCode}>{item.code}</Text>
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>{item.tag}</Text>
                  </View>
                </View>
                <Text style={styles.itemName}>{item.name}</Text>
              </View>
              <View style={styles.listItemRight}>
                <Text style={styles.itemPrice}>P {item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
              </View>
            </Card>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerBanner: {
    backgroundColor: '#4a90e2', // Fallback for gradient
    margin: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#4a90e2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeSubtext: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  statsContainer: {
    paddingHorizontal: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statTitle: {
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
  },
  statSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  recentContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#111',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 0,
    shadowOpacity: 0,
  },
  listItemLeft: {
    flex: 1,
  },
  listItemRight: {
    alignItems: 'flex-end',
  },
  listCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemCode: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  tagBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  tagText: {
    color: '#1976d2',
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemName: {
    color: '#666',
    fontSize: 14,
  },
  itemPrice: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  itemQty: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  }
});

