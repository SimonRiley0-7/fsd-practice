const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/student_performance')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- SCHEMAS ---
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNo: { type: String, required: true, unique: true },
  marks: {
    math: { type: Number, default: 0 },
    science: { type: Number, default: 0 },
    english: { type: Number, default: 0 }
  },
  assignments: [{ title: String, status: String }], // status: "Completed", "Pending"
  feedback: String
});
const Student = mongoose.model('Student', StudentSchema);

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

// 3. Students: List & Search (Requires Auth)
app.get('/api/students', auth, async (req, res) => {
  try {
    const { q } = req.query;
    // Search by name or rollNo
    const filter = q ? { 
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { rollNo: { $regex: q, $options: 'i' } }
      ]
    } : {};
    const students = await Student.find(filter);
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 4. Students: Details
app.get('/api/students/:id', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(400).json({ error: 'Invalid ID' });
  }
});

// 5. Utility: Seed DB
app.post('/api/seed', async (req, res) => {
  await Student.deleteMany({});
  await Student.insertMany([
    { 
      name: 'Alice Johnson', 
      rollNo: 'S001', 
      marks: { math: 85, science: 90, english: 88 },
      assignments: [{ title: 'Math Homework 1', status: 'Completed' }, { title: 'Science Project', status: 'Pending' }],
      feedback: 'Excellent student, actively participates in class.'
    },
    { 
      name: 'Bob Smith', 
      rollNo: 'S002', 
      marks: { math: 60, science: 75, english: 70 },
      assignments: [{ title: 'Math Homework 1', status: 'Completed' }, { title: 'Science Project', status: 'Completed' }],
      feedback: 'Needs to focus more on Math.'
    },
    { 
      name: 'Charlie Davis', 
      rollNo: 'S003', 
      marks: { math: 95, science: 85, english: 92 },
      assignments: [{ title: 'Math Homework 1', status: 'Completed' }, { title: 'Science Project', status: 'Completed' }],
      feedback: 'Outstanding performance across all subjects.'
    }
  ]);
  res.json({ message: 'Database seeded with students!' });
});

const PORT = 5002;
app.listen(PORT, () => console.log(`Backend API running on http://localhost:${PORT}`));
