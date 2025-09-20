import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import bgImage from './assets/background.png'; 
import logo from './assets/signtalk_logo.png'; 
import './index.css';
import Dashboard from './Dashboard'; // new page

function LoginPage() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // simulate login
    navigate('/dashboard'); // redirect to dashboard
  };

  const bgStyle = {
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    gap: '10px'
  };

  return (
    <div style={bgStyle}>
      <img src={logo} alt="SignTalk Logo" className="logo" />
      <p>ADMIN</p>
      <form onSubmit={handleSubmit}>
        Username or Email<input type="text" />
        Password<input type="password" />
        <div className="form-button">
          <input type="submit" value="Login" />
        </div>
      </form>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
