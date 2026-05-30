const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/shopping_system')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- SCHEMAS ---
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  desc: String,
  price: { type: Number, required: true },
  image: String
});
const Product = mongoose.model('Product', ProductSchema);

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: Array,
  total: Number,
  date: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', OrderSchema);

const JWT_SECRET = 'my_super_secret_key_123';

// --- MIDDLEWARE ---
const auth = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (ex) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// --- ROUTES ---

// 1. Auth: Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || password.length < 6) {
      return res.status(400).json({ error: 'Username required, password must be >= 6 chars' });
    }
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: 'Username already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 2. Auth: Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Invalid username or password' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: 'Invalid username or password' });

    const token = jwt.sign({ _id: user._id, username: user.username }, JWT_SECRET);
    res.json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 3. Products: List & Search
app.get('/api/products', async (req, res) => {
  const { q } = req.query;
  const filter = q ? { name: { $regex: q, $options: 'i' } } : {};
  const products = await Product.find(filter);
  res.json(products);
});

// 4. Products: Details
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: 'Invalid ID' });
  }
});

// 5. Orders: Create (Checkout)
app.post('/api/orders', auth, async (req, res) => {
  const { items, total } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ error: 'Cart is empty' });

  const order = new Order({
    userId: req.user._id,
    items,
    total
  });
  await order.save();
  res.status(201).json({ message: 'Order created successfully', order });
});

// 6. Orders: List User Orders
app.get('/api/orders', auth, async (req, res) => {
  const orders = await Order.find({ userId: req.user._id }).sort({ date: -1 });
  res.json(orders);
});

// 7. Utility: Seed DB
app.post('/api/seed', async (req, res) => {
  await Product.deleteMany({});
  await Product.insertMany([
    { name: 'Wireless Headphones', desc: 'Noise-cancelling over-ear headphones.', price: 199.99, image: '🎧' },
    { name: 'Smartphone', desc: 'Latest 5G smartphone with 128GB storage.', price: 699.00, image: '📱' },
    { name: 'Gaming Laptop', desc: 'High-performance laptop with RTX 4070.', price: 1299.50, image: '💻' },
    { name: 'Mechanical Keyboard', desc: 'RGB mechanical keyboard with blue switches.', price: 89.99, image: '⌨️' },
    { name: 'Smartwatch', desc: 'Fitness tracker and smartwatch.', price: 149.00, image: '⌚' }
  ]);
  res.json({ message: 'Database seeded with products!' });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend API running on http://localhost:${PORT}`));
