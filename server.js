require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const axios = require('axios');
const crypto = require('crypto');

const hashPassword = (password) => crypto.createHash('sha256').update(password).digest('hex');


const app = express();
app.use(cors());
app.use(express.json());

// Auto-admin secure whitelist
const ADMIN_WHITELIST = ['77790448', '75273126', '72158870', '76392713', 'claudemanwedi@gmail.com', 'cmanwedi@gmail.com', 'pakogorewang@gmail.com'];


// Initialize auth - see https://theoephraim.github.io/node-google-spreadsheet/#/guides/authentication
const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
  ],
});

let doc;

async function initGoogleSheets() {
  try {
    if (!process.env.GOOGLE_SHEET_ID) {
      console.log('Waiting for GOOGLE_SHEET_ID in .env...');
      return;
    }
    doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo(); 
    console.log(`Connected to Google Sheet: ${doc.title}`);

    // Ensure sheets exist
    let inventorySheet = doc.sheetsByTitle['Inventory'];
    if (!inventorySheet) {
      inventorySheet = await doc.addSheet({ headerValues: ['id', 'code', 'tag', 'name', 'price', 'quantity', 'lastEditedBy'], title: 'Inventory' });
      console.log('Created Inventory sheet');
    }

    let salesSheet = doc.sheetsByTitle['Sales'];
    if (!salesSheet) {
      salesSheet = await doc.addSheet({ headerValues: ['id', 'date', 'items', 'total', 'customerName', 'paymentMethod', 'soldBy'], title: 'Sales' });
      console.log('Created Sales sheet');
    }

    let usersSheet = doc.sheetsByTitle['Users'];
    if (!usersSheet) {
      usersSheet = await doc.addSheet({ headerValues: ['id', 'contactId', 'password', 'role'], title: 'Users' });
      console.log('Created Users sheet');
    }

    let productsSheet = doc.sheetsByTitle['Products'];
    if (!productsSheet) {
      productsSheet = await doc.addSheet({ headerValues: ['code', 'name', 'price'], title: 'Products' });
      console.log('Created Products sheet');
      
      // Auto-populate some sample products on creation
      await productsSheet.addRow({ code: 'BALE-A', name: 'Premium Men Shirts', price: 1500 });
      await productsSheet.addRow({ code: 'BALE-B', name: 'Mixed Kids Clothes', price: 800 });
    }


  } catch (err) {
    console.error('Error connecting to Google Sheets:', err.message);
  }
}

// Routes
app.get('/api/inventory', async (req, res) => {
  if (!doc) return res.status(500).json({ error: 'Database not initialized' });
  try {
    const sheet = doc.sheetsByTitle['Inventory'];
    const rows = await sheet.getRows();
    const inventory = rows.map(row => ({
      id: row.get('id'),
      code: row.get('code'),
      tag: row.get('tag'),
      name: row.get('name'),
      price: parseFloat(row.get('price')),
      quantity: parseInt(row.get('quantity'), 10),
      lastEditedBy: row.get('lastEditedBy') || 'Unknown',
    }));
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/inventory', async (req, res) => {
  if (!doc) return res.status(500).json({ error: 'Database not initialized' });
  try {
    const sheet = doc.sheetsByTitle['Inventory'];
    const item = req.body;
    item.id = Math.random().toString().substring(2, 10);
    await sheet.addRow({
      id: item.id,
      code: item.code,
      tag: item.tag,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      lastEditedBy: item.lastEditedBy || 'Admin'
    });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/inventory/:id', async (req, res) => {
  if (!doc) return res.status(500).json({ error: 'Database not initialized' });
  try {
    const sheet = doc.sheetsByTitle['Inventory'];
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('id') === req.params.id);
    if (!row) return res.status(404).json({ error: 'Item not found' });
    
    // allow updating specific fields
    if (req.body.quantity !== undefined) {
      const newQty = Math.max(0, parseInt(req.body.quantity, 10));
      row.set('quantity', newQty);
    }
    if (req.body.lastEditedBy) {
      row.set('lastEditedBy', req.body.lastEditedBy);
    }
    
    await row.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products', async (req, res) => {
  if (!doc) return res.status(500).json({ error: 'Database not initialized' });
  try {
    const sheet = doc.sheetsByTitle['Products'];
    const rows = await sheet.getRows();
    const products = rows.map(row => ({
      code: row.get('code'),
      name: row.get('name'),
      price: parseFloat(row.get('price')),
    }));
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/register', async (req, res) => {
  if (!doc) return res.status(500).json({ error: 'Database not initialized' });
  try {
    const { contactId, password } = req.body;
    const sheet = doc.sheetsByTitle['Users'];
    const rows = await sheet.getRows();
    
    if (rows.find(r => r.get('contactId') === contactId)) {
      return res.status(400).json({ error: 'Account already exists' });
    }

    const id = Math.random().toString().substring(2, 10);
    // Security Hook: Automatically assign Admin if strictly in the Whitelist
    const role = ADMIN_WHITELIST.includes(contactId) ? 'admin' : (rows.length === 0 ? 'admin' : 'customer');

    await sheet.addRow({
      id,
      contactId,
      password: hashPassword(password),
      role
    });

    res.json({ user: { id, name: contactId, role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  if (!doc) return res.status(500).json({ error: 'Database not initialized' });
  try {
    const { contactId, password } = req.body;
    const sheet = doc.sheetsByTitle['Users'];
    const rows = await sheet.getRows();
    
    const userRow = rows.find(r => r.get('contactId') === contactId);
    if (!userRow) return res.status(404).json({ error: 'User not found' });

    if (userRow.get('password') !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    res.json({ 
      user: { 
        id: userRow.get('id'), 
        name: userRow.get('contactId'), 
        role: userRow.get('role') 
      } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  if (!doc) return res.status(500).json({ error: 'Database not initialized' });
  try {
    const sheet = doc.sheetsByTitle['Users'];
    const rows = await sheet.getRows();
    const users = rows.map(row => ({
      id: row.get('id'),
      name: row.get('contactId'),
      role: row.get('role'),
    }));
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id/role', async (req, res) => {
  if (!doc) return res.status(500).json({ error: 'Database not initialized' });
  try {
    const sheet = doc.sheetsByTitle['Users'];
    const rows = await sheet.getRows();
    const row = rows.find(r => r.get('id') === req.params.id);
    
    if (!row) return res.status(404).json({ error: 'User not found' });
    
    row.set('role', req.body.role);
    await row.save();
    
    res.json({ success: true, role: req.body.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sales', async (req, res) => {
  if (!doc) return res.status(500).json({ error: 'Database not initialized' });
  try {
    const salesSheet = doc.sheetsByTitle['Sales'];
    const inventorySheet = doc.sheetsByTitle['Inventory'];
    const transaction = req.body;
    const saleId = Math.random().toString().substring(2, 10);

    // 1. Deduct Inventory
    const rows = await inventorySheet.getRows();
    for (const saleItem of transaction.items) {
      const row = rows.find(r => r.get('id') === saleItem.itemId);
      if (row) {
        const currentQty = parseInt(row.get('quantity'), 10);
        row.set('quantity', Math.max(0, currentQty - saleItem.quantity));
        await row.save();
      }
    }

    // 2. Add Sale Record
    await salesSheet.addRow({
      id: saleId,
      date: new Date().toISOString(),
      items: JSON.stringify(transaction.items),
      total: transaction.total,
      customerName: transaction.customerName,
      paymentMethod: transaction.paymentMethod,
      soldBy: transaction.soldBy,
    });

    // 3. Trigger Webhook
    if (process.env.MAKE_WEBHOOK_URL) {
      try {
        await axios.post(process.env.MAKE_WEBHOOK_URL, {
          saleId,
          total: transaction.total,
          customerName: transaction.customerName,
          soldBy: transaction.soldBy,
          date: new Date().toISOString()
        });
        console.log('Webhook dispatched successfully');
      } catch (whErr) {
        console.error('Webhook error:', whErr.message);
      }
    }

    res.json({ success: true, saleId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Backend proxy running on http://localhost:${PORT}`);
  await initGoogleSheets();
});
