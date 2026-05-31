import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import './index.css';

const API_URL = 'http://localhost:5001/api';

// --- COMPONENTS --- //

function Navbar({ token, setToken, cartCount }) {
  const navigate = useNavigate();
  return (
    <nav className="navbar">
      <h2><Link to="/">🛍️ ShopHub</Link></h2>
      <div className="nav-links">
        <Link to="/">Products</Link>
        <Link to="/cart">Cart ({cartCount})</Link>
        {token ? (
          <>
            <Link to="/orders">My Orders</Link>
            <button onClick={() => { setToken(null); localStorage.removeItem('token'); navigate('/login'); }}>Logout</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}

function ProductList() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');

  const fetchProducts = () => {
    fetch(`${API_URL}/products?q=${search}`)
      .then(res => res.json())
      .then(setProducts);
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const seedDb = async () => {
    await fetch(`${API_URL}/seed`, { method: 'POST' });
    alert('Products seeded successfully!');
    fetchProducts();
  };

  return (
    <div className="page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Our Products</h1>
        <button className="btn" style={{ width: 'auto', margin: 0 }} onClick={seedDb}>Seed Products</button>
      </div>
      <input 
        className="search-bar"
        type="text" 
        placeholder="Search products..." 
        value={search} 
        onChange={e => setSearch(e.target.value)} 
      />
      <div className="product-grid">
        {products.map(p => (
          <div key={p._id} className="card">
            <h3>{p.name}</h3>
            <p className="price">${p.price.toFixed(2)}</p>
            <Link to={`/products/${p._id}`} className="btn">View Details</Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductDetail({ addToCart }) {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  
  useEffect(() => {
    fetch(`${API_URL}/products/${id}`)
      .then(res => res.json())
      .then(setProduct);
  }, [id]);

  if (!product) return <div className="page">Loading...</div>;

  return (
    <div className="page detail-page">
      <div className="card detail-card">
        <h1>{product.name}</h1>
        <p className="desc">{product.desc}</p>
        <h2 className="price">${product.price.toFixed(2)}</h2>
        <button className="btn" onClick={() => addToCart(product)}>Add to Cart</button>
      </div>
    </div>
  );
}

function Cart({ cart, setCart, token }) {
  const navigate = useNavigate();
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const checkout = async () => {
    if (!token) return alert('Please login to checkout.');
    const res = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': token },
      body: JSON.stringify({ items: cart, total })
    });
    if (res.ok) {
      alert('Order placed successfully!');
      setCart([]);
      navigate('/orders');
    }
  };

  return (
    <div className="page">
      <h1>Shopping Cart</h1>
      {cart.length === 0 ? <p>Your cart is empty.</p> : (
        <div className="cart-list">
          {cart.map(item => (
            <div key={item._id} className="cart-item">
              <span>{item.qty}x {item.name}</span>
              <span>${(item.price * item.qty).toFixed(2)}</span>
            </div>
          ))}
          <h2 className="total">Total: ${total.toFixed(2)}</h2>
          <button className="btn checkout-btn" onClick={checkout}>Proceed to Checkout</button>
        </div>
      )}
    </div>
  );
}

function Orders({ token }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/orders`, { headers: { 'Authorization': token } })
        .then(res => res.json())
        .then(setOrders);
    }
  }, [token]);

  if (!token) return <div className="page">Please login to view orders.</div>;

  return (
    <div className="page">
      <h1>My Orders</h1>
      {orders.length === 0 ? <p>No orders found.</p> : (
        <div className="order-list">
          {orders.map(o => (
            <div key={o._id} className="card order-card">
              <p><strong>Order ID:</strong> {o._id}</p>
              <p><strong>Date:</strong> {new Date(o.date).toLocaleString()}</p>
              <p><strong>Total:</strong> ${o.total.toFixed(2)}</p>
              <ul>
                {o.items.map((i, idx) => <li key={idx}>{i.qty}x {i.name}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
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
    <div className="page auth-page">
      <div className="card auth-card">
        <h1>{isLogin ? 'Login' : 'Register'}</h1>
        {error && <p className="error">{error}</p>}
        <form onSubmit={submit}>
          <input type="text" placeholder="Username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
          <input type="password" placeholder="Password (min 6 chars)" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6} />
          <button type="submit" className="btn">{isLogin ? 'Login' : 'Register'}</button>
        </form>
        <p>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <Link to={isLogin ? '/register' : '/login'}>{isLogin ? 'Sign up' : 'Login'}</Link>
        </p>
      </div>
    </div>
  );
}

// --- MAIN APP --- //

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    const existing = cart.find(c => c._id === product._id);
    if (existing) setCart(cart.map(c => c._id === product._id ? { ...c, qty: c.qty + 1 } : c));
    else setCart([...cart, { ...product, qty: 1 }]);
    alert('Added to cart!');
  };

  return (
    <BrowserRouter>
      <Navbar token={token} setToken={setToken} cartCount={cart.reduce((n, i) => n + i.qty, 0)} />
      <Routes>
        <Route path="/" element={<ProductList />} />
        <Route path="/products/:id" element={<ProductDetail addToCart={addToCart} />} />
        <Route path="/cart" element={<Cart cart={cart} setCart={setCart} token={token} />} />
        <Route path="/orders" element={<Orders token={token} />} />
        <Route path="/login" element={<Auth isLogin={true} setToken={setToken} />} />
        <Route path="/register" element={<Auth isLogin={false} setToken={setToken} />} />
      </Routes>
    </BrowserRouter>
  );
}
