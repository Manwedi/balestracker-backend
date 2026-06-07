import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// Use 10.0.2.2 for Android Emulator to hit localhost. Change to your computer's IP if testing on a physical phone.
const API_URL = 'https://balestracker-api.onrender.com/api';

export type Location = 'BBS' | 'MMOPANE' | 'LETLHAKANE';

export interface InventoryItem {
  id: string;
  code: string;
  tag: Location;
  name: string;
  price: number;
  quantity: number;
  lastEditedBy?: string;
}

export interface SaleTransaction {
  id: string;
  date: string;
  items: { itemId: string; quantity: number; price: number }[];
  total: number;
  customerName?: string;
  paymentMethod: string;
  soldBy: string;
}

export interface Product {
  code: string;
  name: string;
  price: number;
}

interface InventoryContextType {
  inventory: InventoryItem[];
  sales: SaleTransaction[];
  products: Product[];
  isLoading: boolean;
  addItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateItemQuantity: (id: string, delta: number, lastEditedBy?: string) => Promise<void>;
  processSale: (transaction: Omit<SaleTransaction, 'id' | 'date'>) => Promise<void>;
  refreshInventory: () => Promise<void>;
}


const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const [invRes, prodRes] = await Promise.all([
        fetch(`${API_URL}/inventory`),
        fetch(`${API_URL}/products`)
      ]);
      
      if (invRes.ok) setInventory(await invRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
    } catch (err) {
      console.warn('Unable to fetch from API', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);


  const addItem = async (item: Omit<InventoryItem, 'id'>) => {
    try {
      const res = await fetch(`${API_URL}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (res.ok) {
        const newItem = await res.json();
        setInventory((prev) => [...prev, newItem]);
      } else {
        throw new Error('Failed to save to backend');
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const updateItemQuantity = async (id: string, delta: number, lastEditedBy?: string) => {
    const itemToUpdate = inventory.find(i => i.id === id);
    if (!itemToUpdate) return;
    const newQty = Math.max(0, itemToUpdate.quantity + delta);

    // Optimistic cache update
    setInventory((prev) => prev.map(item => item.id === id ? { ...item, quantity: newQty, lastEditedBy: lastEditedBy || item.lastEditedBy } : item));

    try {
      // Sync strictly to backend
      const res = await fetch(`${API_URL}/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty, lastEditedBy }),
      });
      if (!res.ok) throw new Error('Failed to update backend');
    } catch (err) {
      console.error(err);
      // Revert if failed
      setInventory((prev) => prev.map(item => item.id === id ? { ...item, quantity: itemToUpdate.quantity, lastEditedBy: itemToUpdate.lastEditedBy } : item));
    }
  };

  const processSale = async (transaction: Omit<SaleTransaction, 'id' | 'date'>) => {
    try {
      const res = await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      });

      if (!res.ok) {
        throw new Error('Failed to process sale in backend');
      }

      const { saleId } = await res.json();

      const newSale = {
        ...transaction,
        id: saleId,
        date: new Date().toISOString()
      };

      // Deduct stock locally immediately
      setInventory((prev) => {
        let newInv = [...prev];
        transaction.items.forEach(saleItem => {
          newInv = newInv.map(invItem =>
            invItem.id === saleItem.itemId
              ? { ...invItem, quantity: Math.max(0, invItem.quantity - saleItem.quantity) }
              : invItem
          );
        });
        return newInv;
      });

      setSales((prev) => [...prev, newSale]);

    } catch (err) {
      console.error('Sale error', err);
      throw err;
    }
  };

  return (
    <InventoryContext.Provider value={{ inventory, sales, products, isLoading, addItem, updateItemQuantity, processSale, refreshInventory: fetchInventory }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

