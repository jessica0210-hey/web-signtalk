import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import bgImage from '../assets/background.png';
import headerImage from '../assets/headerImage.png';
import logo from '../assets/signtalk_logo.png';
import profileBtn from '../assets/profile.png'; 
import logoutBtn from '../assets/logout_btn.png';
import { auth, firestore } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, getDocFromServer } from 'firebase/firestore'; 

// Add CSS animations for modal effects
const modalAnimations = `
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes popupSlideIn {
    0% {
      opacity: 0;
      transform: scale(0.7) translateY(-20px);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.05) translateY(-10px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0px);
    }
  }
`;

// Inject animations into document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = modalAnimations;
  if (!document.head.querySelector('style[data-logout-modal-animations]')) {
    styleElement.setAttribute('data-logout-modal-animations', 'true');
    document.head.appendChild(styleElement);
  }
}

function AdminLayout({ children, title }) {
  const navigate = useNavigate();
  const location = useLocation(); // <-- get current route
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [adminName, setAdminName] = useState('');
  const dropdownRef = useRef(null);

  // Listen to auth state changes and fetch admin name accordingly
  useEffect(() => {
    const fetchAdminName = async (user) => {
      if (user) {
        try {
          console.log('Auth state changed - Fetching admin name for UID:', user.uid);
          console.log('Current user email:', user.email);
          
          const userDocRef = doc(firestore, 'users', user.uid);
          const userDoc = await getDocFromServer(userDocRef); // Force fresh data from server
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('Found user data:', userData);
            console.log('Setting admin name to:', userData.name || 'Admin');
            setAdminName(userData.name || 'Admin');
          } else {
            console.log('No user document found for UID:', user.uid);
            setAdminName('Admin');
          }
        } catch (error) {
          console.error('Error fetching admin name:', error);
          setAdminName('Admin');
        }
      } else {
        console.log('No current user found');
        setAdminName('Admin');
      }
    };

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user?.email || 'No user');
      fetchAdminName(user);
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, []);

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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.3s ease-out'
  };

  const popupStyle = {
    backgroundColor: '#fff',
    borderRadius: '15px',
    padding: '0',
    maxWidth: '420px',
    width: '90%',
    textAlign: 'center',
    animation: 'popupSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    transform: 'scale(1)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    border: 'none',
    overflow: 'hidden',
    zIndex: 1001,
    fontFamily: 'Arial, sans-serif'
  };

  const popupHeaderStyle = {
    backgroundColor: '#6D2593',
    color: 'white',
    padding: '20px',
    fontSize: '18px',
    fontWeight: '600',
    margin: '0',
    textAlign: 'center'
  };

  const popupBodyStyle = {
    padding: '30px 25px 25px 25px',
    textAlign: 'center',
    color: '#333'
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
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#6D2593',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    transform: 'translateY(0px)',
    minWidth: '100px'
  };
  const cancelLogoutBtnStyle = {
    padding: '12px 24px',
    borderRadius: '8px',
    border: '1px solid #6c757d',
    backgroundColor: 'white',
    color: '#6c757d',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    transform: 'translateY(0px)',
    minWidth: '100px'
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

  const confirmLogout = async () => {
    setLoggingOut(true);
    setLogoutError('');
    
    try {
      // Sign out from Firebase Auth
      await signOut(auth);
      
      // Clear all session and local storage data
      sessionStorage.clear();
      localStorage.clear();
      
      // Clear browser cache (if possible)
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }
      
      // Set logout flag for other components
      window.localStorage.setItem('forceLogout', 'true');
      
      // Replace current history entry with login
      window.history.replaceState(null, '', '/login');
      
      // Navigate to login page with complete replacement
      navigate('/login', { replace: true });
      
      // Reload page to ensure clean state
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
      
    } catch (error) {
      console.error('Error signing out:', error);
      setLoggingOut(false);
      
      // Check if it's a network error
      if (error.code === 'auth/network-request-failed' || 
          error.message.includes('network') || 
          error.message.includes('connection') ||
          !navigator.onLine) {
        // Network failure - keep admin logged in and show error
        setLogoutError('Logout failed. Please check your network connection.');
        setShowLogoutPopup(false);
      } else {
        // Other errors - still try to logout for security
        setLogoutError('Logout encountered an issue, but you have been signed out for security.');
        sessionStorage.clear();
        localStorage.clear();
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    }
  };

  const cancelLogout = () => {
    setShowLogoutPopup(false);
    setLogoutError('');
    setLoggingOut(false);
  };

  return (
    <div style={bgStyle}>
      {/* Header */}
      <header style={headerStyle}>
        <div style={leftHeaderStyle}>
          <img src={logo} alt="Logo" style={logoStyle} onClick={() => navigate('/dashboardPage')} />
          {/* Render "Hello Admin {name}!" only on Dashboard page */}
          {location.pathname === '/dashboardPage' && (
            <span style={greetings}>Hello Admin {adminName}!</span>
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
              <p style={{ 
                fontSize: '16px', 
                margin: '0 0 25px 0',
                lineHeight: '1.5',
                color: loggingOut ? '#666' : '#333'
              }}>
                {loggingOut ? 'Logging out...' : 'Are you sure you want to logout?'}
              </p>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center',
                gap: '15px',
                marginTop: '20px'
              }}>
                <button 
                  onClick={cancelLogout} 
                  style={cancelLogoutBtnStyle}
                  disabled={loggingOut}
                  onMouseEnter={(e) => {
                    if (!loggingOut) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                      e.target.style.backgroundColor = '#5a6268';
                      e.target.style.borderColor = '#5a6268';
                      e.target.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loggingOut) {
                      e.target.style.transform = 'translateY(0px)';
                      e.target.style.boxShadow = 'none';
                      e.target.style.backgroundColor = 'white';
                      e.target.style.borderColor = '#6c757d';
                      e.target.style.color = '#6c757d';
                    }
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmLogout} 
                  style={{
                    ...confirmLogoutBtnStyle,
                    opacity: loggingOut ? 0.6 : 1,
                    cursor: loggingOut ? 'not-allowed' : 'pointer'
                  }}
                  disabled={loggingOut}
                  onMouseEnter={(e) => {
                    if (!loggingOut) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(109, 37, 147, 0.4)';
                      e.target.style.backgroundColor = '#5d1c87';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loggingOut) {
                      e.target.style.transform = 'translateY(0px)';
                      e.target.style.boxShadow = 'none';
                      e.target.style.backgroundColor = '#6D2593';
                    }
                  }}
                >
                  {loggingOut ? 'Please wait...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Network Error Display */}
      {logoutError && (
        <div style={popupNotifStyle}>
          <div style={{
            ...popupStyle,
            backgroundColor: '#fff',
            border: '2px solid #e74c3c'
          }}>
            <div style={{
              ...popupHeaderStyle,
              backgroundColor: '#e74c3c',
              color: 'white'
            }}>
              Logout Error
            </div>
            <div style={popupBodyStyle}>
              <p style={{ fontSize: '16px', padding: '10px', color: '#e74c3c' }}>
                {logoutError}
              </p>
              <div style={{ textAlign: 'center', marginTop: '15px' }}>
                <button 
                  onClick={() => setLogoutError('')}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#6D2593',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
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

export default AdminLayout;
