import React, { useState } from 'react';
import bgImage from './assets/background.png'; 
import logo from './assets/signtalk_logo.png'; 
import './index.css';

function LoginWrapper() {
  const [email, setEmail] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowPopup(true);
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
    gap: '20px'
  };

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
    color: '#6D2593',
    display: 'flex',
    flexDirection: 'column'
  };

  const popupHeaderStyle = {
    backgroundColor: '#6D2593',
    color: 'white',
    padding: '20px',   
    fontSize: '16px',
    textAlign: 'left',
  };

  const popupBodyStyle = {
    padding: '20px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    color: '#2d006a',
    fontSize: '16px',
    textAlign: 'center'
  };

  const okBtnContainerStyle = {
    display: 'flex',
    justifyContent: 'flex-end', 
    marginTop: '10px'
  };

  const okBtnStyle = {
    background: '#6D2593',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 24px',
    fontWeight: 'bold',
    cursor: 'pointer'
  };

  return (
    <div style={bgStyle}>
      <img src={logo} alt="SignTalk Logo" className="logo" />
      <p>FORGOT PASSWORD</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="text"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <div className="form-button">
          <input type="submit" value="Submit" />
        </div>
      </form>

      {showPopup && (
        <div style={popupNotifStyle}>
          <div style={popupStyle}>
            <div style={popupHeaderStyle}>Notification</div>
            <div style={popupBodyStyle}>
              <div>Check your email for password reset instructions.</div>
              <div style={okBtnContainerStyle}>
                <button style={okBtnStyle} onClick={() => setShowPopup(false)}>
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ForgotPass() {
  return (
    <LoginWrapper />
  );
}

export default ForgotPass;
