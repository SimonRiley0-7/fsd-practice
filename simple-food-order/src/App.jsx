import { useState, Fragment } from 'react';
import './index.css';

const MENU = [
  { id: 1, name: 'Truffle Burger', desc: 'Beef patty, truffle mayo', price: 14.99 },
  { id: 2, name: 'Margherita Pizza', desc: 'Fresh mozzarella', price: 18.50 },
  { id: 3, name: 'Quinoa Bowl', desc: 'Roasted veggies', price: 12.00 },
  { id: 4, name: 'Spicy Ramen', desc: 'Tonkotsu broth', price: 16.50 },
];

function App() {
  const [cart, setCart] = useState([]);

  const addToCart = (item) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    else setCart([...cart, { ...item, qty: 1 }]);
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <Fragment>
      <header>
        <h1 style={{margin: 0}}>Foodies 🍔</h1>
        <div>🛍️ {cart.reduce((n, i) => n + i.qty, 0)} items</div>
      </header>
      
      <main>
        <div className="menu">
          {MENU.map(item => (
            <div key={item.id} className="card">
              <h3 style={{margin: "0 0 0.5rem"}}>{item.name}</h3>
              <p style={{margin: "0 0 1rem", color: "#666"}}>{item.desc}</p>
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                <strong>${item.price.toFixed(2)}</strong>
                <button onClick={() => addToCart(item)}>Add</button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="cart">
          <h2 style={{marginTop: 0}}>Your Order</h2>
          {cart.length === 0 ? <p>Cart is empty</p> : (
            <Fragment>
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <span>{item.qty}x {item.name}</span>
                  <span>${(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
              <div className="total">Total: ${total.toFixed(2)}</div>
              <button style={{width: '100%', marginTop: '1rem'}} onClick={() => {
                alert(`Order placed! Total: $${total.toFixed(2)}`);
                setCart([]);
              }}>Checkout</button>
            </Fragment>
          )}
        </div>
      </main>
    </Fragment>
  );
}

export default App;
