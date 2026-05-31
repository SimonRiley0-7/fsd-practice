import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import './index.css';

const API_URL = 'http://localhost:5003/api';

function Navbar({ token, setToken }) {
  const navigate = useNavigate();
  return (
    <nav>
      <Link to="/"><strong>Exam Portal</strong></Link>
      {token ? (
        <button onClick={() => { setToken(null); localStorage.removeItem('token'); navigate('/login'); }}>Logout</button>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </nav>
  );
}

function Dashboard({ token }) {
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);

  const fetchData = () => {
    fetch(`${API_URL}/exams`, { headers: { 'Authorization': token } })
      .then(res => res.json())
      .then(setExams);
    fetch(`${API_URL}/results`, { headers: { 'Authorization': token } })
      .then(res => res.json())
      .then(setResults);
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const seedDb = async () => {
    await fetch(`${API_URL}/seed`, { method: 'POST' });
    alert('Dummy exams seeded!');
    fetchData();
  };

  if (!token) return <div>Please login to access the portal.</div>;

  return (
    <div>
      <div className="header-row">
        <h1>Dashboard</h1>
        <button onClick={seedDb}>Seed Exams</button>
      </div>

      <div className="columns">
        <div className="col">
          <h2>Available Exams</h2>
          {exams.length === 0 ? <p>No exams available.</p> : exams.map(e => (
            <div key={e._id} className="card">
              <h3>{e.title}</h3>
              <p>Duration: {e.durationMinutes} mins</p>
              <Link to={`/exam/${e._id}`}><button>Start Exam</button></Link>
            </div>
          ))}
        </div>

        <div className="col">
          <h2>Your Past Results</h2>
          {results.length === 0 ? <p>No results found.</p> : results.map(r => (
            <div key={r._id} className="card">
              <h3>{r.examId?.title}</h3>
              <p>Score: {r.score} / {r.total}</p>
              <p><small>{new Date(r.submittedAt).toLocaleString()}</small></p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExamTaking({ token }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/exams/${id}`, { headers: { 'Authorization': token } })
        .then(res => res.json())
        .then(data => {
          if (data.error) return alert(data.error);
          setExam(data);
          setTimeLeft(data.durationMinutes * 60);
        });
    }
  }, [id, token]);

  useEffect(() => {
    if (!exam || timeLeft <= 0) {
      if (timeLeft === 0 && exam) submitExam(); // Auto-submit when time reaches 0
      return;
    }
    const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [exam, timeLeft]);

  const handleOptionChange = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const submitExam = async () => {
    const res = await fetch(`${API_URL}/exams/${id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': token },
      body: JSON.stringify({ answers })
    });
    const data = await res.json();
    if (res.ok) {
      alert(`Exam Submitted! Your score: ${data.score}/${data.total}`);
      navigate('/');
    } else {
      alert(data.error || 'Failed to submit exam');
    }
  };

  if (!token) return <div>Please login.</div>;
  if (!exam) return <div>Loading exam...</div>;

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;

  return (
    <div>
      <div className="header-row">
        <h2>{exam.title}</h2>
        <h2 style={{ color: timeLeft < 60 ? 'red' : 'black' }}>
          Time Left: {m}:{s < 10 ? '0' : ''}{s}
        </h2>
      </div>

      <div className="question-list">
        {exam.questions.map((q, idx) => (
          <div key={q._id} className="card">
            <p><strong>Q{idx + 1}: {q.questionText}</strong></p>
            {q.options.map((opt, i) => (
              <label key={i} style={{ display: 'block', margin: '5px 0' }}>
                <input 
                  type="radio" 
                  name={q._id} 
                  value={opt} 
                  checked={answers[q._id] === opt} 
                  onChange={() => handleOptionChange(q._id, opt)} 
                />
                {opt}
              </label>
            ))}
          </div>
        ))}
      </div>

      <button onClick={submitExam} style={{ marginTop: '20px', padding: '10px 20px' }}>Submit Exam</button>
    </div>
  );
}

function Auth({ isLogin, setToken }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? '/login' : '/register';
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    
    if (isLogin) {
      setToken(data.token);
      localStorage.setItem('token', data.token);
      navigate('/');
    } else {
      alert('Registered! Please login.');
      navigate('/login');
    }
  };

  return (
    <div className="auth-container">
      <h2>{isLogin ? 'Login' : 'Register'}</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={submit}>
        <input type="text" placeholder="Username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
        <br/>
        <input type="password" placeholder="Password (min 6 chars)" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6} />
        <br/>
        <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
      </form>
      <p>
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <Link to={isLogin ? '/register' : '/login'}>{isLogin ? 'Sign up' : 'Login'}</Link>
      </p>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  return (
    <BrowserRouter>
      <div className="container">
        <Navbar token={token} setToken={setToken} />
        <Routes>
          <Route path="/" element={<Dashboard token={token} />} />
          <Route path="/exam/:id" element={<ExamTaking token={token} />} />
          <Route path="/login" element={<Auth isLogin={true} setToken={setToken} />} />
          <Route path="/register" element={<Auth isLogin={false} setToken={setToken} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
