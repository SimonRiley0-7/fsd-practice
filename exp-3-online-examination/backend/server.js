const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/online_exam_system')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- SCHEMAS ---
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

const ExamSchema = new mongoose.Schema({
  title: { type: String, required: true },
  durationMinutes: { type: Number, required: true },
  questions: [{
    questionText: String,
    options: [String],
    correctAnswer: String // We will hide this when sending to the frontend!
  }]
});
const Exam = mongoose.model('Exam', ExamSchema);

const ResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  score: Number,
  total: Number,
  submittedAt: { type: Date, default: Date.now }
});
const Result = mongoose.model('Result', ResultSchema);

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
    if (!username || password.length < 6) return res.status(400).json({ error: 'Username required, password >= 6 chars' });
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

// 3. Exams: List available
app.get('/api/exams', auth, async (req, res) => {
  const exams = await Exam.find({}, 'title durationMinutes'); // Only fetch basic info
  res.json(exams);
});

// 4. Exams: Get Specific Exam (HIDE CORRECT ANSWERS)
app.get('/api/exams/:id', auth, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    
    // Create a safe copy to send to the student without the answers
    const safeExam = {
      _id: exam._id,
      title: exam.title,
      durationMinutes: exam.durationMinutes,
      questions: exam.questions.map(q => ({
        _id: q._id,
        questionText: q.questionText,
        options: q.options
      }))
    };
    res.json(safeExam);
  } catch (err) {
    res.status(400).json({ error: 'Invalid ID' });
  }
});

// 5. Exams: Submit & Evaluate
app.post('/api/exams/:id/submit', auth, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    const { answers } = req.body; // Map of questionId -> student's selected option string
    
    let score = 0;
    exam.questions.forEach(q => {
      const studentAnswer = answers[q._id.toString()];
      if (studentAnswer && studentAnswer === q.correctAnswer) {
        score += 1;
      }
    });

    const result = new Result({
      userId: req.user._id,
      examId: exam._id,
      score,
      total: exam.questions.length
    });
    await result.save();

    res.json({ message: 'Exam submitted successfully', score, total: exam.questions.length });
  } catch (err) {
    res.status(500).json({ error: 'Server error during evaluation' });
  }
});

// 6. Results: List User Results
app.get('/api/results', auth, async (req, res) => {
  const results = await Result.find({ userId: req.user._id }).populate('examId', 'title').sort({ submittedAt: -1 });
  res.json(results);
});

// 7. Utility: Seed DB
app.post('/api/seed', async (req, res) => {
  await Exam.deleteMany({});
  await Result.deleteMany({});
  await Exam.insertMany([
    {
      title: 'JavaScript Basics',
      durationMinutes: 5,
      questions: [
        { questionText: 'What keyword declares a block-scoped variable?', options: ['var', 'let', 'def', 'int'], correctAnswer: 'let' },
        { questionText: 'Which symbol is used for strict equality?', options: ['=', '==', '===', '=>'], correctAnswer: '===' },
        { questionText: 'How do you create a function in JavaScript?', options: ['function myFunction()', 'def myFunction()', 'create myFunction()', 'func myFunction()'], correctAnswer: 'function myFunction()' }
      ]
    },
    {
      title: 'HTML & CSS Fundamentals',
      durationMinutes: 10,
      questions: [
        { questionText: 'What does HTML stand for?', options: ['Hyper Text Markup Language', 'High Text Machine Language', 'Hyperlink and Text Markup Language', 'None of the above'], correctAnswer: 'Hyper Text Markup Language' },
        { questionText: 'Which property is used to change background color?', options: ['color', 'bg-color', 'background-color', 'bgcolor'], correctAnswer: 'background-color' }
      ]
    }
  ]);
  res.json({ message: 'Database seeded with exams!' });
});

const PORT = 5003;
app.listen(PORT, () => console.log(`Backend API running on http://localhost:${PORT}`));
