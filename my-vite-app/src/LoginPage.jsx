import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import bgImage from './assets/background.png'; 
import logo from './assets/signtalk_logo.png'; 
import './index.css';
import DashboardPage from './DashboardPage'; 
import Feedback from './Feedback';
import GenerateReport from './GenerateReport';
import Datasets from './Datasets';
import ForgotPass from './ForgotPass';
import UserManagement from './UserManagement';
import { auth, firestore } from './firebase';
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

function LoginWrapper() {
  const navigate = useNavigate();
  const [showForgotPopup, setShowForgotPopup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false); // Add loading state

  //admin credentials
  //signtalk625@gmail.com
  //test12345678

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true); // Start loading
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Check userType in Firestore
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists() && userDoc.data().userType === 'admin') {
        navigate('/dashboardPage');
      } else {
        setErrorMsg('Access denied. Only admin users can log in.');
        await auth.signOut();
      }
    } catch {
      setErrorMsg('Incorrect Username or Password. Please try again.');
    } finally {
      setLoading(false); // Stop loading
    }
  };

  // Popup styles using your reference
  const popupNotifStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999
  };

  const popupStyle = {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '380px',
    height: '180px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
    zIndex: 1000,
    fontFamily: 'Arial, sans-serif',
    color: '#6D2593'
  };

  const popupHeaderStyle = {
    backgroundColor: '#6D2593',
    color: 'white',
    padding: '15px',
    fontSize: '16px'
  };

  const popupBodyStyle = {
    padding: '10px',
    textAlign: 'center',
    color: '#2d006a'
  };

  const confirmBtnStyle = {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#6D2593',
    color: 'white',
    cursor: 'pointer'
  };
  const cancelBtnStyle = {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #6D2593',
    backgroundColor: 'white',
    color: '#6D2593',
    cursor: 'pointer'
  };

  // Popup handlers
  const cancelForgot = () => setShowForgotPopup(false);
  const confirmForgot = () => {
    setShowForgotPopup(false);
    navigate('/forgotpass');
  };

  const handleForgotClick = () => setShowForgotPopup(true);

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
    gap: 0
  };

  // Loading spinner style
  const spinnerOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(109, 37, 147, 0.15)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001
  };

  const spinnerStyle = {
    border: '8px solid #e9d6f7',
    borderTop: '8px solid #6D2593',
    borderRadius: '50%',
    width: '70px',
    height: '70px',
    animation: 'spin 1s linear infinite'
  };

  // Add keyframes for spinner animation
  const spinnerKeyframes = `
    @keyframes spin {
      0% { transform: rotate(0deg);}
      100% { transform: rotate(360deg);}
    }
  `;

  return (
    <div style={bgStyle}>
      <style>{spinnerKeyframes}</style>
      <img src={logo} alt="SignTalk Logo" className="logo" />
      <p>ADMIN</p>
      <form onSubmit={handleSubmit}>
        Username or Email
        <input
          type="text"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        Password
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <div className="forgot-password">
          <span
            style={{
              color: '#ffffff',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '16px',
              marginTop: '4px',
              marginBottom: '8px',
              float: 'right'
            }}
            onClick={handleForgotClick}
          >
            Forgot Password?
          </span>
        </div>
        {errorMsg && (
          <div style={{ color: 'red', marginTop: '10px', fontWeight: 'bold', textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}
        <div className="form-button">
          <input type="submit" value="Login" disabled={loading} />
        </div>
      </form>
      {showForgotPopup && (
        <div style={popupNotifStyle}>
          <div style={popupStyle}>
            <div style={popupHeaderStyle}>Confirmation</div>
            <div style={popupBodyStyle}>
              <p style={{ fontSize: '16px', padding: '6px' }}>
                Are you sure you want to proceed to forgot password?
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '15px' }}>
                <button onClick={cancelForgot} style={cancelBtnStyle}>Cancel</button>
                <button onClick={confirmForgot} style={confirmBtnStyle}>Proceed</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {loading && (
        <div style={spinnerOverlayStyle}>
          <div style={spinnerStyle}></div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginWrapper />} />
        <Route path="/dashboardPage" element={<DashboardPage />} />
        <Route path="/generateReport" element={<GenerateReport />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/datasets" element={<Datasets />} />
        <Route path="/forgotpass" element={<ForgotPass />} />
        <Route path="/userManagement" element={<UserManagement />} />
      </Routes>
    </Router>
  );
}

export default App;