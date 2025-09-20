import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import bgImage from '../assets/background.png';
import headerImage from '../assets/headerImage.png';
import logo from '../assets/signtalk_logo.png';
import profileBtn from '../assets/profile.png'; 
import logoutBtn from '../assets/logout_btn.png'; 

function AdminLayout({ children, title }) {
  const navigate = useNavigate();
  const location = useLocation(); // <-- get current route
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const dropdownRef = useRef(null);

  const bgStyle = {
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    width: '100vw',
    minHeight: '100vh',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: 0,
    margin: 0,
    fontSize: '24px'
  };

  const headerStyle = {
    width: '100%',
    height: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    backgroundImage: `url(${headerImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    boxShadow: '0 4px 10px rgba(255, 255, 255, 0.3)',
    position: 'relative'
  };

  const leftHeaderStyle = { display: 'flex', alignItems: 'center', gap: '20px' };
  const logoStyle = { height: '60px', cursor: 'pointer' };
  const greetings = { fontSize: '20px', margin: 0 };
  const profileBtnStyle = { height: '40px', width: '40px', cursor: 'pointer' };
  const contentStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginTop: '40px' };

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
    width: '300px',
    height: 'auto',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
    zIndex: 1000
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

  const logoutBtnStyle = {
    width: '140px', 
    height: '80px',
    cursor: 'pointer',
    position: 'absolute',
    top: '18px', 
    right: -12,
    zIndex: 1000,
    borderRadius: '8px'
  };

  const confirmLogoutBtnStyle = {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#6D2593',
    color: 'white',
    cursor: 'pointer'
  };
  const cancelLogoutBtnStyle = {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #6D2593',
    backgroundColor: 'white',
    color: '#6D2593',
    cursor: 'pointer'
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowLogoutPopup(true);
    setIsOpen(false);
  };

  const confirmLogout = () => {
    setShowLogoutPopup(false);
    navigate('/');
  };

  const cancelLogout = () => {
    setShowLogoutPopup(false);
  };

  return (
    <div style={bgStyle}>
      {/* Header */}
      <header style={headerStyle}>
        <div style={leftHeaderStyle}>
          <img src={logo} alt="Logo" style={logoStyle} onClick={() => navigate('/dashboardPage')} />
          {/* Render "Hello Admin!" only on Dashboard page */}
          {location.pathname === '/dashboardPage' && (
            <span style={greetings}>Hello Admin!</span>
          )}
        </div>

        {/* Centered title */}
        <p style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          margin: 0,
          color: 'white'
        }}>
          {title}
        </p>

        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <img src={profileBtn} alt="Profile Icon" style={profileBtnStyle} onClick={() => setIsOpen(!isOpen)} />
          {isOpen && (
            <img src={logoutBtn} alt="Logout" style={logoutBtnStyle} onClick={handleLogout} />
          )}
        </div>
      </header>

      {/* Content */}
      <main style={contentStyle}>{children}</main>

      {/* Logout Confirmation Popup */}
      {showLogoutPopup && (
        <div style={popupNotifStyle}>
          <div style={popupStyle}>
            <div style={popupHeaderStyle}>Confirmation</div>
            <div style={popupBodyStyle}>
              <p style={{ fontSize: '16px', padding: '6px' }}>Are you sure you want to logout?</p>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '15px' }}>
                <button onClick={cancelLogout} style={cancelLogoutBtnStyle}>Cancel</button>
                <button onClick={confirmLogout} style={confirmLogoutBtnStyle}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLayout;
