import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import bgImage from '../assets/background.png';
import headerImage from '../assets/headerImage.png';
import logo from '../assets/signtalk_logo.png';
import profileBtn from '../assets/profile.png'; 
import logoutBtn from '../assets/logout_btn.png';
import dialogImg from '../assets/dialogImg.png';
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
      transform: scale(0.5) translateY(-30px);
    }
    60% {
      opacity: 0.9;
      transform: scale(1.08) translateY(-5px);
    }
    80% {
      opacity: 1;
      transform: scale(0.98) translateY(2px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0px);
    }
  }

  @keyframes iconBounce {
    0% {
      opacity: 0;
      transform: scale(0.3) rotate(-10deg);
    }
    50% {
      opacity: 0.7;
      transform: scale(1.1) rotate(5deg);
    }
    80% {
      opacity: 0.9;
      transform: scale(0.95) rotate(-2deg);
    }
    100% {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }
  }

  @keyframes spin {
    0% { 
      transform: rotate(0deg); 
    }
    100% { 
      transform: rotate(360deg); 
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
    padding: '40px',
    maxWidth: '400px',
    width: '90%',
    textAlign: 'center',
    animation: 'popupSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    transform: 'scale(1)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    border: 'none',
    zIndex: 1001,
    fontFamily: 'Arial, sans-serif'
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
    border: 'none',
    borderRadius: '8px',
    padding: '12px 30px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    transform: 'translateY(0px)',
    minWidth: '120px',
    outline: 'none',
    backgroundColor: '#38B000',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(56, 176, 0, 0.3)',
    fontFamily: 'Arial, sans-serif'
  };
  const cancelLogoutBtnStyle = {
    border: 'none',
    borderRadius: '8px',
    padding: '12px 30px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    transform: 'translateY(0px)',
    minWidth: '120px',
    outline: 'none',
    backgroundColor: '#6c757d',
    color: '#fff',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    fontFamily: 'Arial, sans-serif'
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
            <span style={{
              fontSize: '25px',
              fontWeight: '700',
              color: '#fff',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              letterSpacing: '0.4px',
              margin: 0,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
              Hello, Admin {adminName}!
            </span>
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
            <img 
              src={dialogImg} 
              alt="Dialog Illustration" 
              style={{ 
                width: '80px', 
                height: '80px',
                marginBottom: '20px',
                animation: 'iconBounce 0.6s ease-out 0.3s both'
              }}
            />
            
            <h3 style={{
              color: '#333',
              fontSize: '20px',
              marginBottom: '15px',
              fontFamily: 'Arial, sans-serif',
              fontWeight: '600'
            }}>
              Logout Confirmation
            </h3>
            
            <p style={{
              color: '#666',
              fontSize: '16px',
              marginBottom: '25px',
              fontFamily: 'Arial, sans-serif',
              lineHeight: '1.4'
            }}>
              {loggingOut ? 'Please wait while we securely log you out...' : 'Are you sure you want to logout?'}
            </p>

            {!loggingOut ? (
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  className="modal-btn modal-btn-cancel"
                  onClick={cancelLogout}
                  style={cancelLogoutBtnStyle}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#5a6268';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#6c757d';
                    e.target.style.transform = 'translateY(0px)';
                    e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                  }}
                >
                  Cancel
                </button>
                <button
                  className="modal-btn modal-btn-success"
                  onClick={confirmLogout}
                  style={confirmLogoutBtnStyle}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#2E8B00';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(56, 176, 0, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#38B000';
                    e.target.style.transform = 'translateY(0px)';
                    e.target.style.boxShadow = '0 2px 8px rgba(56, 176, 0, 0.3)';
                  }}
                >
                  Confirm
                </button>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                fontSize: '14px',
                color: '#666'
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #fff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Processing...
              </div>
            )}
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
