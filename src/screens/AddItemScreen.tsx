import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useInventory, Location } from '../contexts/InventoryContext';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useNavigation } from '@react-navigation/native';
import { Package } from 'lucide-react-native';

export default function AddItemScreen() {
  const { addItem, products } = useInventory();
  const navigation = useNavigation<any>();

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [location, setLocation] = useState<Location>('BBS');
  
  const [isSaving, setIsSaving] = useState(false);

  // Helper autofill
  const handleSelectProduct = (product: any) => {
    setCode(product.code);
    setName(product.name);
    setPrice(product.price.toString());
  };

  const LocationSelector = () => (
    <View style={styles.locationContainer}>
      <Text style={styles.label}>Location *</Text>
      <View style={styles.locationButtons}>
        {['BBS', 'MMOPANE', 'LETLHAKANE'].map((loc) => (
          <Button 
            key={loc}
            title={loc}
            variant={location === loc ? 'primary' : 'outline'}
            onPress={() => setLocation(loc as Location)}
            style={styles.locBtn}
          />
        ))}
      </View>
    </View>
  );

  const handleSave = async () => {
    if (!code || !name || !price || !quantity) return Alert.alert('Error', 'Please fill in all required fields');

    const priceNum = parseFloat(price);
    const qtyNum = parseInt(quantity, 10);

    if (isNaN(priceNum) || priceNum <= 0) return Alert.alert('Error', 'Please enter a valid price');
    if (isNaN(qtyNum) || qtyNum < 0) return Alert.alert('Error', 'Please enter a valid quantity');

    try {
      setIsSaving(true);
      await addItem({
        code,
        name,
        price: priceNum,
        quantity: qtyNum,
        tag: location
      });
      setIsSaving(false);
      
      Alert.alert('Success', 'Item added successfully!', [
        { text: 'OK', onPress: () => navigation.navigate('Inventory') }
      ]);
      
      setCode('');
      setName('');
      setPrice('');
      setQuantity('');
    } catch (error) {
      setIsSaving(false);
      Alert.alert('Error', 'Failed to save item');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Add New Item</Text>
          <Text style={styles.subtitle}>Enter details for a new inventory item</Text>
        </View>

        <Card style={styles.formCard}>
          <View style={styles.cardHeader}>
            <Package size={20} color="#111" />
            <Text style={styles.cardTitle}>Item Information</Text>
          </View>

          {products && products.length > 0 && (
            <View style={styles.catalogSection}>
              <Text style={styles.label}>Quick Select Product:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                {products.map((prod, index) => (
                  <TouchableOpacity key={index} style={styles.chip} onPress={() => handleSelectProduct(prod)}>
                    <Text style={styles.chipText}>{prod.name}</Text>
                    <Text style={styles.chipPrice}>BWP {prod.price}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Input 
            label="Product Code" 
            placeholder="e.g. PLT01" 
            value={code}
            onChangeText={setCode}
            autoCapitalize="characters"
          />

          <Input 
            label="Item Description *" 
            placeholder="e.g. Mixed Dresses" 
            value={name}
            onChangeText={setName}
          />

          <View style={styles.row}>
            <View style={styles.flexHalf}>
              <Input 
                label="Price (BWP) *" 
                placeholder="4200.00" 
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>
            <View style={styles.spacer} />
            <View style={styles.flexHalf}>
              <Input 
                label="Quantity *" 
                placeholder="12" 
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />
            </View>
          </View>

          <LocationSelector />

          <View style={styles.actionRow}>
            <Button 
              title="Cancel" 
              variant="outline" 
              style={styles.actionBtn}
              onPress={() => navigation.goBack()}
            />
            <View style={styles.spacer} />
            <Button 
              title="Save Item" 
              variant="primary" 
              style={styles.actionBtn}
              onPress={handleSave}
              isLoading={isSaving}
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContent: { padding: 16, paddingTop: 24, paddingBottom: 40 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  formCard: { padding: 24 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 8, color: '#111' },
  catalogSection: { marginBottom: 20, backgroundColor: '#f8f9fa', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e1e5e8' },
  chipScroll: { flexDirection: 'row', marginTop: 8 },
  chip: { backgroundColor: '#4a90e2', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 10, alignItems: 'center' },
  chipText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  chipPrice: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  row: { flexDirection: 'row' },
  flexHalf: { flex: 1 },
  spacer: { width: 16 },
  locationContainer: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  locationButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  locBtn: { paddingVertical: 10, paddingHorizontal: 16, minHeight: 40, marginBottom: 8, marginRight: 8 },
  actionRow: { flexDirection: 'row', marginTop: 16 },
  actionBtn: { flex: 1 }
});
