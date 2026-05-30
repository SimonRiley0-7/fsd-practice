import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import './index.css';

const API_URL = 'http://localhost:5002/api';

function Navbar({ token, setToken }) {
  const navigate = useNavigate();
  return (
    <nav>
      <Link to="/"><strong>Student Dashboard</strong></Link>
      {token ? (
        <button onClick={() => { setToken(null); localStorage.removeItem('token'); navigate('/login'); }}>Logout</button>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </nav>
  );
}

function Dashboard({ token }) {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');

  const fetchStudents = () => {
    fetch(`${API_URL}/students?q=${search}`, { headers: { 'Authorization': token } })
      .then(res => res.json())
      .then(setStudents);
  };

  useEffect(() => {
    if (token) fetchStudents();
  }, [search, token]);

  const seedDb = async () => {
    await fetch(`${API_URL}/seed`, { method: 'POST' });
    alert('Dummy Students seeded!');
    fetchStudents();
  };

  if (!token) return <div>Please login to access the dashboard.</div>;

  return (
    <div>
      <div className="header-row">
        <h1>Dashboard</h1>
        <button onClick={seedDb}>Seed Students</button>
      </div>
      
      <input 
        type="text" 
        className="search-bar"
        placeholder="Search by name or roll number..." 
        value={search} 
        onChange={e => setSearch(e.target.value)} 
      />

      <div className="student-list">
        {students.length === 0 ? <p>No students found.</p> : students.map(s => (
          <div key={s._id} className="card">
            <h3>{s.name} ({s.rollNo})</h3>
            <p>Math: {s.marks.math} | Science: {s.marks.science} | English: {s.marks.english}</p>
            <Link to={`/students/${s._id}`}><button>View Full Details</button></Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentDetail({ token }) {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  
  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/students/${id}`, { headers: { 'Authorization': token } })
        .then(res => res.json())
        .then(setStudent);
    }
  }, [id, token]);

  if (!token) return <div>Please login.</div>;
  if (!student) return <div>Loading...</div>;

  return (
    <div>
      <Link to="/">&larr; Back to Dashboard</Link>
      <h1>{student.name} ({student.rollNo})</h1>
      
      <div className="details-grid">
        <div className="card">
          <h2>Marks</h2>
          <ul>
            <li>Math: {student.marks.math}</li>
            <li>Science: {student.marks.science}</li>
            <li>English: {student.marks.english}</li>
          </ul>
        </div>
        
        <div className="card">
          <h2>Assignments</h2>
          <ul>
            {student.assignments.map((a, i) => (
              <li key={i}>{a.title} - <strong>{a.status}</strong></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <h2>Teacher Feedback</h2>
        <p>{student.feedback}</p>
      </div>
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
          <Route path="/students/:id" element={<StudentDetail token={token} />} />
          <Route path="/login" element={<Auth isLogin={true} setToken={setToken} />} />
          <Route path="/register" element={<Auth isLogin={false} setToken={setToken} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
