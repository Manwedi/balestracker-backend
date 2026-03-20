require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

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
      inventorySheet = await doc.addSheet({ headerValues: ['id', 'code', 'tag', 'name', 'price', 'quantity'], title: 'Inventory' });
      console.log('Created Inventory sheet');
    }

    let salesSheet = doc.sheetsByTitle['Sales'];
    if (!salesSheet) {
      salesSheet = await doc.addSheet({ headerValues: ['id', 'date', 'items', 'total', 'customerName', 'paymentMethod', 'soldBy'], title: 'Sales' });
      console.log('Created Sales sheet');
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
      quantity: item.quantity
    });
    res.json(item);
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
