import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useInventory, InventoryItem } from '../contexts/InventoryContext';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface CartItem extends InventoryItem {
  cartQuantity: number;
}

export default function SalesScreen() {
  const { inventory, processSale } = useInventory();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter available items
  const availableItems = inventory.filter(item => 
    item.quantity > 0 &&
    ((item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
     (item.code || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);

  const addToCart = (item: InventoryItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        if (existing.cartQuantity >= item.quantity) {
          Alert.alert('Limit Reached', 'Cannot add more than available stock.');
          return prev;
        }
        return prev.map(i => i.id === item.id ? { ...i, cartQuantity: i.cartQuantity + 1 } : i);
      }
      return [...prev, { ...item, cartQuantity: 1 }];
    });
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.cartQuantity + delta;
          if (newQty <= 0) return item; // Handled by remove
          if (newQty > item.quantity) return item; // Prevent exceeding stock
          return { ...item, cartQuantity: newQty };
        }
        return item;
      });
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const generateReceiptPDF = async (saleId: string) => {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; }
            .title { font-size: 28px; font-weight: bold; color: #4a90e2; margin: 0; }
            .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
            .details { margin-bottom: 30px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { text-align: left; padding: 12px; border-bottom: 1px solid #eee; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .total-row { font-weight: bold; font-size: 18px; }
            .total-cell { text-align: right; }
            .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Jane's Bale Hub</h1>
            <p class="subtitle">Sales Receipt</p>
          </div>
          
          <div class="details">
            <p><strong>Receipt #:</strong> ${saleId.substring(0, 8).toUpperCase()}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Customer:</strong> ${customerName || 'Walk-in'}</p>
            <p><strong>Served By:</strong> ${user?.name || 'Staff'}</p>
            <p><strong>Payment Method:</strong> ${paymentMethod}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th style="text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${cart.map(item => `
                <tr>
                  <td>
                    <strong>${item.name}</strong><br/>
                    <small style="color: #666;">${item.code}</small>
                  </td>
                  <td>${item.cartQuantity}</td>
                  <td>P ${item.price.toFixed(2)}</td>
                  <td style="text-align: right;">P ${(item.price * item.cartQuantity).toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3" class="total-cell">Total Amount:</td>
                <td style="text-align: right;">P ${cartTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer" style="margin-top: 40px; text-align: center; border-top: 1px solid #ccc; padding-top: 20px; color: #555;">
            <p><strong>Pangie Investments</strong></p>
            <p>72158870, 75273126</p>
            <p><em>Thank you for your business!</em></p>
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('PDF Generated', `Saved to: ${uri}`);
      }
    } catch (error) {
      console.error('Error generating PDF', error);
      Alert.alert('Error', 'Could not generate receipt PDF.');
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to the cart before checking out.');
      return;
    }

    try {
      setIsProcessing(true);
      const saleId = Math.random().toString();
      
      await processSale({
        items: cart.map(i => ({ itemId: i.id, quantity: i.cartQuantity, price: i.price })),
        total: cartTotal,
        customerName: customerName || 'Walk-in Customer',
        paymentMethod,
        soldBy: user?.name || 'Unknown'
      });

      setIsProcessing(false);
      
      Alert.alert(
        'Sale Complete', 
        `Payment of P ${cartTotal.toFixed(2)} successful.`,
        [
          { text: 'Done', onPress: () => closeCart() },
          { text: 'Print & Share Receipt', onPress: () => {
            generateReceiptPDF(saleId);
            closeCart();
          }}
        ]
      );
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to process sale.');
    }
  };

  const closeCart = () => {
    setCart([]);
    setCustomerName('');
    setSearchQuery('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Sales Checkout</Text>
          <Text style={styles.subtitle}>Select items to sell and process transactions</Text>
        </View>

        {/* Available Items Section */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <ShoppingCart size={20} color="#111" />
            <Text style={styles.sectionTitle}>Available Items</Text>
          </View>

          <TextInput 
            style={styles.searchInput}
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {availableItems.slice(0, 5).map(item => (
            <View key={item.id} style={styles.availableItem}>
              <View style={styles.itemInfo}>
                <View style={styles.codeRow}>
                  <Text style={styles.itemCode}>{item.code || 'NO-CODE'}</Text>
                  <View style={[styles.tagBadge, { backgroundColor: item.tag === 'MMOPANE' ? '#e8f5e9' : '#e3f2fd' }]}>
                    <Text style={[styles.tagText, { color: item.tag === 'MMOPANE' ? '#2e7d32' : '#1976d2' }]}>{item.tag || 'NO-TAG'}</Text>
                  </View>
                </View>
                <Text style={styles.itemName}>{item.name || 'Unknown Item'}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.itemPrice}>P {Number(item.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                  <Text style={styles.itemStock}>Stock: {item.quantity || 0}</Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item)}>
                <Plus size={16} color="#fff" style={{marginRight: 4}} />
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          ))}
          {availableItems.length > 5 && (
            <Text style={styles.moreText}>+{availableItems.length - 5} more items (use search to find them)</Text>
          )}
        </Card>

        {/* Shopping Cart Section */}
        {cart.length > 0 && (
          <Card style={styles.cartCard}>
            <View style={styles.cartHeaderRow}>
              <Text style={styles.cartTitle}>Shopping Cart ({cart.length})</Text>
              <TouchableOpacity onPress={closeCart}>
                <Text style={styles.clearBtn}>Clear All</Text>
              </TouchableOpacity>
            </View>

            {cart.map(item => (
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.cartItemInfo}>
                  <View style={styles.codeRow}>
                    <Text style={styles.cartItemCode}>{item.code}</Text>
                    <View style={[styles.tagBadge, { backgroundColor: item.tag === 'MMOPANE' ? '#e8f5e9' : '#e3f2fd' }]}>
                      <Text style={[styles.tagText, { color: item.tag === 'MMOPANE' ? '#2e7d32' : '#1976d2' }]}>{item.tag}</Text>
                    </View>
                  </View>
                  <Text style={styles.cartItemName}>{item.name || 'Unknown Item'}</Text>
                  <Text style={styles.cartItemPrice}>P {Number(item.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} each</Text>
                </View>

                <View style={styles.cartItemControls}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateCartQuantity(item.id, -1)}>
                    <Minus size={14} color="#555" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.cartQuantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateCartQuantity(item.id, 1)}>
                    <Plus size={14} color="#555" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => removeFromCart(item.id)}>
                    <Trash2 size={16} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>P {cartTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
            </View>

            {/* Checkout Form */}
            <View style={styles.checkoutForm}>
              <Text style={styles.checkoutTitle}>Checkout Details</Text>
              
              <Input 
                label="Customer Name (Optional)" 
                placeholder="Enter customer name..." 
                value={customerName}
                onChangeText={setCustomerName}
              />

              <View style={styles.paymentMethodContainer}>
                <Text style={styles.label}>Payment Method</Text>
                <View style={styles.paymentButtons}>
                  {['Cash', 'Card', 'Transfer'].map((method) => (
                    <Button 
                      key={method}
                      title={method}
                      variant={paymentMethod === method ? 'primary' : 'outline'}
                      onPress={() => setPaymentMethod(method)}
                      style={styles.paymentBtn}
                    />
                  ))}
                </View>
              </View>

              <Button 
                title={`Complete Sale - P ${cartTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                variant="primary"
                style={{ backgroundColor: '#27ae60' }} // Override to Green
                onPress={handleCheckout}
                isLoading={isProcessing}
              />
            </View>
          </Card>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
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
  sectionCard: {
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#111',
  },
  searchInput: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  availableItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  itemInfo: {
    flex: 1,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemCode: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#111',
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
  itemName: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemPrice: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#111',
    marginRight: 12,
  },
  itemStock: {
    fontSize: 12,
    color: '#888',
  },
  addBtn: {
    backgroundColor: '#111',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  moreText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 12,
    fontSize: 12,
  },
  cartCard: {
    padding: 20,
  },
  cartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111',
  },
  clearBtn: {
    color: '#e74c3c',
    fontWeight: '500',
    borderWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemCode: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#111',
  },
  cartItemName: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#111',
    fontWeight: '500',
  },
  cartItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyBtn: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 32,
    textAlign: 'center',
  },
  deleteBtn: {
    borderWidth: 1,
    borderColor: '#fee2e2',
    backgroundColor: '#fef2f2',
    borderRadius: 6,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#f1f1f1',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111',
  },
  checkoutForm: {
    marginTop: 32,
    backgroundColor: '#fafafa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  checkoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 16,
  },
  paymentMethodContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  paymentButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 40,
    flex: 1,
  }
});

