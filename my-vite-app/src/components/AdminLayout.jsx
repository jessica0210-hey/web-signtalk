import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import bgImage from '../assets/background.png';
import headerImage from '../assets/headerImage.png';
import logo from '../assets/signtalk_logo.png';
import profileBtn from '../assets/profile.png'; 
import logoutBtn from '../assets/logout_btn.png';
import apiBtn from '../assets/api_.btn.png';
import dialogImg from '../assets/dialogImg.png';
import { auth, firestore } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc,setDoc,serverTimestamp,getDoc, getDocFromServer } from 'firebase/firestore'; 

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

  @keyframes logoutButtonPopup {
    0% {
      opacity: 0;
      transform: scale(0.3) translateX(20px) translateY(-10px);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.15) translateX(-5px) translateY(2px);
    }
    80% {
      opacity: 0.95;
      transform: scale(0.95) translateX(2px) translateY(-1px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateX(0px) translateY(0px);
    }
  }

  @keyframes logoutButtonHover {
    0% {
      transform: scale(1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    100% {
      transform: scale(1.05);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
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

  @keyframes modalButtonPulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.02);
    }
    100% {
      transform: scale(1);
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
  const [showApiInput, setShowApiInput] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [logoutError, setLogoutError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [adminName, setAdminName] = useState('');
  const dropdownRef = useRef(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [showAlert, setShowAlert] = useState(false);

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
    fontWeight: '700',
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
  const profileBtnStyle = { 
    height: '40px', 
    width: '40px', 
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    borderRadius: '50%',
    padding: '2px'
  };
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

  const apiBtnStyle = {
    width: '135px', 
    height: '50px',
    cursor: 'pointer',
    position: 'absolute',
    top: '-18px', 
    right: -10,
    zIndex: 1000,
    borderRadius: '8px',
    animation: 'logoutButtonPopup 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
    transition: 'all 0.3s ease',
    transform: 'scale(1)'
  }

  const logoutBtnStyle = {
    width: '135px', 
    height: '39px',
    cursor: 'pointer',
    position: 'absolute',
    top: '32px', 
    right: -10,
    zIndex: 1000,
    borderRadius: '8px',
    animation: 'logoutButtonPopup 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
    transition: 'all 0.3s ease',
    transform: 'scale(1)'
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

   // Add this useEffect to load the API key when component mounts
  useEffect(() => {
  const loadApiKey = async () => {
    console.log('useEffect triggered - attempting to load API key');
    
    try {
      const apiId = 'serverApi';
      console.log('Using apiId:', apiId);
      console.log('Firestore instance:', firestore);
      
      const docRef = doc(firestore, 'BaseUrl', apiId);
      console.log('Document reference created:', docRef);
      
      const docSnap = await getDoc(docRef);
      console.log('Document snapshot received:', docSnap);
      console.log('Document exists?', docSnap.exists());
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('Document data:', data);
        const savedApiKey = data.URL;
        console.log('Setting API key to:', savedApiKey);
        setApiKey(savedApiKey);
      } else {
        console.log('No API key document found in Firestore');
      }
    } catch (error) {
      console.error('Error loading API key:', error);
      console.error('Error details:', error.message);
    }
  };
  loadApiKey();
}, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  const customAlert = (message) => {
  setAlertMessage(message);
  setShowAlert(true);
};

  const handleApiInput = () => {
  setShowApiInput(true);
  setIsOpen(false);
  };

  const handleSaveApiKey = async() => {
    const apiId = 'serverApi';
    console.log('Attempting to save to Firebase...');
    // Save to Firestore
    await setDoc(doc(firestore, 'BaseUrl', apiId), {
      URL: apiKey,
      createdAt: serverTimestamp()
    });

    console.log('API Key saved successfully to Firebase!');
    customAlert('URL saved successfully!');
    
    // Close modal and reset
    setShowApiInput(false);
    setApiKey('');
    setIsOpen(false);
  };

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
          <img id="signtalk-logo" src={logo} alt="Logo" style={logoStyle} onClick={() => navigate('/dashboardPage')} />
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
          <img 
            id="profileButton"
            src={profileBtn} 
            alt="Profile Icon" 
            style={profileBtnStyle} 
            onClick={() => setIsOpen(!isOpen)}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.1) rotate(5deg)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
              e.target.style.filter = 'brightness(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1) rotate(0deg)';
              e.target.style.boxShadow = 'none';
              e.target.style.filter = 'brightness(1)';
            }}
          />
          {isOpen && (
             <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginTop: '8px',
              zIndex: 1000
            }}>
             <img
              id="apiButton"
              src={apiBtn}
              alt="API"
              style={apiBtnStyle}
              onClick={handleApiInput}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.filter = 'brightness(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.filter = 'brightness(1)';
              }}
            />
            <img 
              id="logoutButton" 
              src={logoutBtn} 
              alt="Logout" 
              style={logoutBtnStyle} 
              onClick={handleLogout}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.filter = 'brightness(1.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.filter = 'brightness(1)';
              }}
            />
          </div>
          )}
        </div>
      </header>

    {showAlert && (<>
        {/* Backdrop */}
        <div
          id="alertOverlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 3000
          }}
          onClick={() => setShowAlert(false)}
        />
        
        {/* Alert Box */}
        <div
          id="alertBox" 
          style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          zIndex: 3001,
          minWidth: '500px',
          maxWidth: '600px',
          textAlign: 'center'
        }}>
          <p id="alertMessage" style={{
            margin: '0 0 20px 0',
            fontSize: '25px',
            color: '#333',
            lineHeight: '1.5'
          }}>
            {alertMessage}
          </p>
          <button
            id="alertOkBtn"
            onClick={() => setShowAlert(false)}
            style={{
              padding: '10px 24px',
              backgroundColor: '#7f49d1ff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '20px',
              fontWeight: '500'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#7f49d1ff'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#5e2b8c'}
          >
            OK
          </button>
        </div>
      </>
    )}

<<<<<<< HEAD
      {/* API Input Modal */}
      {showApiInput && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1999,
              animation: 'fadeIn 0.3s ease-out',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onClick={() => setShowApiInput(false)}
          >
            {/* Modal Content */}
            <div
              style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '15px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                zIndex: 2000,
                minWidth: '560px',
                maxWidth: '600px',
                animation: 'popupSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
            <h3
              style={{
                marginTop: 0,
                marginBottom: '24px',
                color: '#333',
                fontSize: '24px',
                fontWeight: '600',
                textAlign: 'left'
              }}
            >
              Enter Base URL
            </h3>
            
            <input
              type="text"
              placeholder="https"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid #e0e0e0',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '24px',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => (e.target.style.borderColor = '#d849e8ff')}
              onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
            />
            
            <button
              onClick={handleSaveApiKey}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(90deg, #ff8ad6 0%, #d849e8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.filter = 'brightness(1.1)';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(216, 73, 232, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.filter = 'brightness(1)';
                e.target.style.transform = 'translateY(0px)';
                e.target.style.boxShadow = 'none';
              }}
              onMouseDown={(e) => {
                e.target.style.animation = 'modalButtonPulse 0.2s ease';
              }}
              onAnimationEnd={(e) => {
                e.target.style.animation = '';
              }}
            >
              SAVE
            </button>
          </div>
          </div>
        </>
      )}
=======
       {/* API Input Modal */}
        {showApiInput && (<>
        {/* Backdrop */}
          <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1999
        }}
          onClick={() => {
          setShowApiInput(false);
        }}/>  
        {/* Modal Content */}
          <div id="apiModal" style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          zIndex: 2000,
          minWidth: '600px'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#333' }}>Enter Base URL</h3>
          <input
          id="apiUrlInput" 
          type="text"
          placeholder="Enter URL"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          style={{
          width: '100%',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          fontSize: '14px',
          outline: 'none',
          boxSizing: 'border-box',
          marginBottom: '12px'
        }}
          onFocus={(e) => e.target.style.borderColor = '#75408eff'}
          onBlur={(e) => e.target.style.borderColor = '#ccc'}
        />
          <div style={{ display: 'flex', gap: '8px' }}>
          <button
          id="saveApiButton"
          onClick={handleSaveApiKey}
          style={{
          flex: 1,
          padding: '10px',
          backgroundColor: '#d849e8ff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500'
        }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#e17ac7ff'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#d849e8ff'}
        >
          Save
        </button>
      </div>
    </div>
  </>
)}
>>>>>>> c7d02ad (Initial Commit)

      {/* Content */}
      <main style={contentStyle}>{children}</main>

      {/* Logout Confirmation Popup */}
      {showLogoutPopup && (
        <div id="logoutPopup" style={popupNotifStyle}>
          <div id="logoutPopupBox" style={popupStyle}>
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
                  id="cancelLogoutBtn"
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
                  onMouseDown={(e) => {
                    e.target.style.animation = 'modalButtonPulse 0.2s ease';
                  }}
                  onAnimationEnd={(e) => {
                    e.target.style.animation = '';
                  }}
                >
                  Cancel
                </button>
                <button
                  id="confirmLogoutBtn"
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
                  onMouseDown={(e) => {
                    e.target.style.animation = 'modalButtonPulse 0.2s ease';
                  }}
                  onAnimationEnd={(e) => {
                    e.target.style.animation = '';
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
