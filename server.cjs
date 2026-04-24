const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function readJSON(filename) {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch (e) { return []; }
}

function writeJSON(filename, data) {
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}

function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

function initConfig() {
  const configPath = path.join(DATA_DIR, 'config.json');
  if (!fs.existsSync(configPath)) {
    const defaultConfig = {
      owner: { username: 'shadow', password: '1234' },
      pricing: {
        followers: { base: 300, unit: 100 },
        likes: { base: 200, unit: 100 },
        comments: { base: 500, unit: 50 },
        shares: { base: 150, unit: 100 }
      },
      siteName: 'TikTok Boost Pro',
      whatsappNumber: '+923001234567'
    };
    writeJSON('config.json', defaultConfig);
  }
}

function initDataFiles() {
  initConfig();
  ['admins.json', 'orders.json', 'reviews.json', 'complaints.json', 'messages.json'].forEach(f => {
    if (!fs.existsSync(path.join(DATA_DIR, f))) writeJSON(f, []);
  });
}

initDataFiles();

function getConfig() {
  return readJSON('config.json');
}

function saveConfig(config) {
  writeJSON('config.json', config);
}

// Auth middleware
function ownerAuth(req, res, next) {
  const { username, password } = req.headers;
  const config = getConfig();
  if (config.owner?.username === username && config.owner?.password === password) {
    next();
  } else {
    res.status(401).json({ error: 'Invalid owner credentials' });
  }
}

function adminAuth(req, res, next) {
  const { adminid, adminpassword } = req.headers;
  const admins = readJSON('admins.json');
  const admin = admins.find(a => a.id === adminid && a.password === adminpassword);
  if (admin) {
    req.admin = admin;
    next();
  } else {
    res.status(401).json({ error: 'Invalid admin credentials' });
  }
}

// ========== OWNER ROUTES ==========

// Owner login
app.post('/api/owner/login', (req, res) => {
  const { username, password } = req.body;
  const config = getConfig();
  if (config.owner?.username === username && config.owner?.password === password) {
    res.json({ success: true, message: 'Owner logged in' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Change owner password
app.post('/api/owner/change-password', ownerAuth, (req, res) => {
  const { newPassword } = req.body;
  const config = getConfig();
  config.owner.password = newPassword;
  saveConfig(config);
  res.json({ success: true });
});

// Change owner username
app.post('/api/owner/change-username', ownerAuth, (req, res) => {
  const { newUsername } = req.body;
  const config = getConfig();
  config.owner.username = newUsername;
  saveConfig(config);
  res.json({ success: true });
});

// Get all admins
app.get('/api/owner/admins', ownerAuth, (req, res) => {
  const admins = readJSON('admins.json');
  const config = getConfig();
  const safeAdmins = admins.map(a => ({
    id: a.id,
    username: a.username,
    paymentMethod: a.paymentMethod,
    accountNumber: a.accountNumber,
    accountName: a.accountName,
    uniqueLink: `${req.protocol}://${req.get('host')}/?ref=${a.id}`,
    createdAt: a.createdAt,
    stats: a.stats || { totalOrders: 0, completedOrders: 0, pendingOrders: 0, totalEarnings: 0 }
  }));
  res.json(safeAdmins);
});

// Add admin
app.post('/api/owner/admins', ownerAuth, (req, res) => {
  const { username, password } = req.body;
  const admins = readJSON('admins.json');
  if (admins.find(a => a.username === username)) {
    return res.status(400).json({ error: 'Admin username already exists' });
  }
  const newAdmin = {
    id: generateId(),
    username,
    password,
    paymentMethod: '',
    accountNumber: '',
    accountName: '',
    createdAt: new Date().toISOString(),
    stats: { totalOrders: 0, completedOrders: 0, pendingOrders: 0, totalEarnings: 0 }
  };
  admins.push(newAdmin);
  writeJSON('admins.json', admins);
  res.json({ success: true, admin: { id: newAdmin.id, username, uniqueLink: `/api/redirect?ref=${newAdmin.id}` } });
});

// Remove admin
app.delete('/api/owner/admins/:id', ownerAuth, (req, res) => {
  const admins = readJSON('admins.json');
  const filtered = admins.filter(a => a.id !== req.params.id);
  writeJSON('admins.json', filtered);
  res.json({ success: true });
});

// Get all orders
app.get('/api/owner/orders', ownerAuth, (req, res) => {
  const orders = readJSON('orders.json');
  const admins = readJSON('admins.json');
  const enriched = orders.map(o => {
    const admin = admins.find(a => a.id === o.adminId);
    return { ...o, adminUsername: admin?.username || 'Unknown' };
  });
  res.json(enriched);
});

// Get all reviews
app.get('/api/owner/reviews', ownerAuth, (req, res) => {
  const reviews = readJSON('reviews.json');
  const admins = readJSON('admins.json');
  const orders = readJSON('orders.json');
  const enriched = reviews.map(r => {
    const admin = admins.find(a => a.id === r.adminId);
    const order = orders.find(o => o.id === r.orderId);
    return { ...r, adminUsername: admin?.username || 'Unknown', tiktokUsername: order?.tiktokUsername || 'Unknown' };
  });
  res.json(enriched);
});

// Get all complaints
app.get('/api/owner/complaints', ownerAuth, (req, res) => {
  res.json(readJSON('complaints.json'));
});

// Get live stats
app.get('/api/owner/stats', ownerAuth, (req, res) => {
  const orders = readJSON('orders.json');
  const admins = readJSON('admins.json');
  const reviews = readJSON('reviews.json');
  const complaints = readJSON('complaints.json');
  
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const paidOrders = orders.filter(o => o.status === 'paid').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const totalRevenue = orders.filter(o => o.status === 'completed' || o.status === 'paid').reduce((s, o) => s + (o.price || 0), 0);
  
  const adminStats = admins.map(a => {
    const adminOrders = orders.filter(o => o.adminId === a.id);
    return {
      id: a.id,
      username: a.username,
      totalOrders: adminOrders.length,
      pendingOrders: adminOrders.filter(o => o.status === 'pending' || o.status === 'paid').length,
      completedOrders: adminOrders.filter(o => o.status === 'completed').length,
      totalEarnings: adminOrders.filter(o => o.status === 'completed' || o.status === 'paid').reduce((s, o) => s + (o.price || 0), 0)
    };
  });
  
  res.json({
    overview: { totalOrders, pendingOrders, paidOrders, completedOrders, totalRevenue },
    adminStats,
    recentReviews: reviews.slice(-5).reverse(),
    recentComplaints: complaints.slice(-5).reverse()
  });
});

// Update pricing
app.put('/api/owner/pricing', ownerAuth, (req, res) => {
  const { pricing } = req.body;
  const config = getConfig();
  config.pricing = pricing;
  saveConfig(config);
  res.json({ success: true });
});

// Get pricing (public)
app.get('/api/pricing', (req, res) => {
  const config = getConfig();
  res.json(config.pricing || {});
});

// Update WhatsApp number
app.put('/api/owner/whatsapp', ownerAuth, (req, res) => {
  const { whatsappNumber } = req.body;
  const config = getConfig();
  config.whatsappNumber = whatsappNumber;
  saveConfig(config);
  res.json({ success: true });
});

// ========== ADMIN ROUTES ==========

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const admins = readJSON('admins.json');
  const admin = admins.find(a => a.username === username && a.password === password);
  if (admin) {
    res.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        paymentMethod: admin.paymentMethod,
        accountNumber: admin.accountNumber,
        accountName: admin.accountName
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid admin credentials' });
  }
});

// Get admin profile
app.get('/api/admin/profile', adminAuth, (req, res) => {
  const { id, username, paymentMethod, accountNumber, accountName, createdAt } = req.admin;
  res.json({ id, username, paymentMethod, accountNumber, accountName, createdAt });
});

// Update admin profile (payment info)
app.put('/api/admin/profile', adminAuth, (req, res) => {
  const { paymentMethod, accountNumber, accountName } = req.body;
  const admins = readJSON('admins.json');
  const idx = admins.findIndex(a => a.id === req.admin.id);
  if (idx === -1) return res.status(404).json({ error: 'Admin not found' });
  admins[idx].paymentMethod = paymentMethod;
  admins[idx].accountNumber = accountNumber;
  admins[idx].accountName = accountName;
  writeJSON('admins.json', admins);
  res.json({ success: true });
});

// Get admin orders
app.get('/api/admin/orders', adminAuth, (req, res) => {
  const orders = readJSON('orders.json');
  const myOrders = orders.filter(o => o.adminId === req.admin.id);
  res.json(myOrders.reverse());
});

// Confirm payment
app.put('/api/admin/orders/:id/confirm-payment', adminAuth, (req, res) => {
  const orders = readJSON('orders.json');
  const idx = orders.findIndex(o => o.id === req.params.id && o.adminId === req.admin.id);
  if (idx === -1) return res.status(404).json({ error: 'Order not found' });
  orders[idx].status = 'paid';
  orders[idx].paymentConfirmedAt = new Date().toISOString();
  writeJSON('orders.json', orders);
  res.json({ success: true, order: orders[idx] });
});

// Complete order
app.put('/api/admin/orders/:id/complete', adminAuth, (req, res) => {
  const orders = readJSON('orders.json');
  const idx = orders.findIndex(o => o.id === req.params.id && o.adminId === req.admin.id);
  if (idx === -1) return res.status(404).json({ error: 'Order not found' });
  orders[idx].status = 'completed';
  orders[idx].completedAt = new Date().toISOString();
  writeJSON('orders.json', orders);
  res.json({ success: true, order: orders[idx] });
});

// Reject order
app.put('/api/admin/orders/:id/reject', adminAuth, (req, res) => {
  const orders = readJSON('orders.json');
  const idx = orders.findIndex(o => o.id === req.params.id && o.adminId === req.admin.id);
  if (idx === -1) return res.status(404).json({ error: 'Order not found' });
  orders[idx].status = 'rejected';
  orders[idx].rejectedAt = new Date().toISOString();
  writeJSON('orders.json', orders);
  res.json({ success: true, order: orders[idx] });
});

// Send message
app.post('/api/admin/messages', adminAuth, (req, res) => {
  const { orderId, content } = req.body;
  const messages = readJSON('messages.json');
  const newMessage = {
    id: generateId(),
    orderId,
    sender: 'admin',
    adminId: req.admin.id,
    content,
    createdAt: new Date().toISOString()
  };
  messages.push(newMessage);
  writeJSON('messages.json', messages);
  res.json({ success: true, message: newMessage });
});

// Get messages for order
app.get('/api/admin/messages/:orderId', adminAuth, (req, res) => {
  const messages = readJSON('messages.json');
  const orderMessages = messages.filter(m => m.orderId === req.params.orderId && m.adminId === req.admin.id);
  res.json(orderMessages);
});

// Get admin stats
app.get('/api/admin/stats', adminAuth, (req, res) => {
  const orders = readJSON('orders.json');
  const myOrders = orders.filter(o => o.adminId === req.admin.id);
  res.json({
    totalOrders: myOrders.length,
    pendingOrders: myOrders.filter(o => o.status === 'pending').length,
    paidOrders: myOrders.filter(o => o.status === 'paid').length,
    completedOrders: myOrders.filter(o => o.status === 'completed').length,
    totalEarnings: myOrders.filter(o => o.status === 'completed' || o.status === 'paid').reduce((s, o) => s + (o.price || 0), 0)
  });
});

// ========== USER ROUTES ==========

// Create order
app.post('/api/user/order', (req, res) => {
  const { tiktokUsername, service, quantity, adminId, price } = req.body;
  const admins = readJSON('admins.json');
  
  let targetAdminId = adminId;
  if (!targetAdminId) {
    // Random assignment if no ref
    targetAdminId = admins.length > 0 ? admins[Math.floor(Math.random() * admins.length)].id : null;
  }
  if (!targetAdminId || !admins.find(a => a.id === targetAdminId)) {
    return res.status(400).json({ error: 'No admin available' });
  }
  
  const order = {
    id: generateId(),
    adminId: targetAdminId,
    tiktokUsername,
    service,
    quantity,
    price,
    status: 'pending',
    transactionId: '',
    screenshot: '',
    createdAt: new Date().toISOString(),
    userNotification: 'Order placed successfully! Please complete payment.'
  };
  const orders = readJSON('orders.json');
  orders.push(order);
  writeJSON('orders.json', orders);
  res.json({ success: true, order });
});

// Get order
app.get('/api/user/order/:id', (req, res) => {
  const orders = readJSON('orders.json');
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  
  const messages = readJSON('messages.json');
  const orderMessages = messages.filter(m => m.orderId === order.id);
  
  res.json({ ...order, messages: orderMessages });
});

// Submit payment
app.post('/api/user/order/:id/payment', (req, res) => {
  const { transactionId, screenshot } = req.body;
  const orders = readJSON('orders.json');
  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Order not found' });
  orders[idx].transactionId = transactionId;
  orders[idx].screenshot = screenshot;
  orders[idx].status = 'paid';
  orders[idx].userNotification = 'Payment submitted! Admin will confirm shortly.';
  writeJSON('orders.json', orders);
  res.json({ success: true, order: orders[idx] });
});

// Submit review
app.post('/api/user/review', (req, res) => {
  const { orderId, rating, comment } = req.body;
  const orders = readJSON('orders.json');
  const order = orders.find(o => o.id === orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  
  const review = {
    id: generateId(),
    orderId,
    adminId: order.adminId,
    rating,
    comment,
    createdAt: new Date().toISOString()
  };
  const reviews = readJSON('reviews.json');
  reviews.push(review);
  writeJSON('reviews.json', reviews);
  res.json({ success: true });
});

// Submit complaint
app.post('/api/user/complaint', (req, res) => {
  const { name, whatsapp, message } = req.body;
  const complaint = {
    id: generateId(),
    name,
    whatsapp,
    message,
    createdAt: new Date().toISOString()
  };
  const complaints = readJSON('complaints.json');
  complaints.push(complaint);
  writeJSON('complaints.json', complaints);
  res.json({ success: true });
});

// Calculate price
app.post('/api/user/calculate', (req, res) => {
  const { service, quantity } = req.body;
  const config = getConfig();
  const pricing = config.pricing?.[service];
  if (!pricing) return res.status(400).json({ error: 'Invalid service' });
  const price = Math.ceil((quantity / pricing.unit) * pricing.base);
  res.json({ price, unit: pricing.unit, base: pricing.base });
});

// Get admin info (for user site - public)
app.get('/api/admin-info/:id', (req, res) => {
  const admins = readJSON('admins.json');
  const admin = admins.find(a => a.id === req.params.id);
  if (!admin) return res.status(404).json({ error: 'Admin not found' });
  res.json({
    id: admin.id,
    username: admin.username,
    paymentMethod: admin.paymentMethod,
    accountNumber: admin.accountNumber,
    accountName: admin.accountName
  });
});

// Get WhatsApp number
app.get('/api/whatsapp', (req, res) => {
  const config = getConfig();
  res.json({ whatsappNumber: config.whatsappNumber || '+923001234567' });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback for SPA - handle all non-API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
