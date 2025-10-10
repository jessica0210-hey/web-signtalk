import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bgImage from './assets/background.png'; 
import logo from './assets/signtalk_logo.png'; 
import './index.css';
import { auth, firestore } from './firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';

// CSS animations for enhanced UI effects
const modalAnimations = `
  @keyframes modalFadeIn {
    from {
      opacity: 0;
      visibility: hidden;
    }
    to {
      opacity: 1;
      visibility: visible;
    }
  }
  
  @keyframes modalSlideIn {
    from {
      transform: translate(-50%, -60%) scale(0.8);
      opacity: 0;
    }
    to {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
  }
  
  @keyframes modalBounce {
    0% {
      transform: translate(-50%, -50%) scale(0.3);
    }
    50% {
      transform: translate(-50%, -50%) scale(1.05);
    }
    70% {
      transform: translate(-50%, -50%) scale(0.9);
    }
    100% {
      transform: translate(-50%, -50%) scale(1);
    }
  }
  
  @keyframes inputFocus {
    from {
      transform: scale(1);
      box-shadow: 0 2px 8px rgba(109, 37, 147, 0.1);
    }
    to {
      transform: scale(1.02);
      box-shadow: 0 4px 20px rgba(109, 37, 147, 0.3);
    }
  }
  
  @keyframes buttonHover {
    from {
      transform: translateY(0px);
    }
    to {
      transform: translateY(-3px);
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
  if (!document.head.querySelector('style[data-forgot-pass-animations]')) {
    styleElement.setAttribute('data-forgot-pass-animations', 'true');
    document.head.appendChild(styleElement);
  }
}

function LoginWrapper() {
  const [email, setEmail] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popupType, setPopupType] = useState('success'); // 'success' or 'error'
  const [popupMessage, setPopupMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email
    if (!email.trim()) {
      setPopupType('error');
      setPopupMessage('Please enter your email address.');
      setShowPopup(true);
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setPopupType('error');
      setPopupMessage('Please enter a valid email address.');
      setShowPopup(true);
      return;
    }
    
    setLoading(true);
    
    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Request timeout - stopping loading');
      setLoading(false);
      setPopupType('error');
      setPopupMessage('Request timeout. Please check your internet connection and try again.');
      setShowPopup(true);
    }, 30000); // 30 second timeout
    
    try {
      // First, check if the email exists in the Firestore database
      console.log('Checking if email exists in database:', email);
      
      const usersRef = collection(firestore, 'users');
      const emailQuery = query(usersRef, where('email', '==', email.toLowerCase()));
      
      console.log('Executing Firestore query...');
      const querySnapshot = await getDocs(emailQuery);
      console.log('Firestore query completed, snapshot size:', querySnapshot.size);
      
      if (querySnapshot.empty) {
        // Email not found in database
        setLoading(false); // Stop loading before showing error
        setPopupType('error');
        setPopupMessage('No account found with this email address. Please check your email or contact support.');
        setShowPopup(true);
        console.log('Email not found in database:', email);
        return;
      }
      
      console.log('Email found in database, proceeding with password reset');
      
      // Email exists in database, proceed with sending password reset email
      await sendPasswordResetEmail(auth, email);
      
      setPopupType('success');
      setPopupMessage('Password reset email sent successfully! Please check your inbox and follow the instructions to reset your password.');
      setShowPopup(true);
      
      console.log('Password reset email sent to:', email);
      
    } catch (error) {
      console.error('Error in password reset process:', error);
      
      let errorMessage = 'An error occurred while processing your request. Please try again.';
      
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'The email address is not valid. Please enter a correct email.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many reset attempts. Please try again later.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No Firebase account found for this email. Please contact support.';
      }
      
      setPopupType('error');
      setPopupMessage(errorMessage);
      setShowPopup(true);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      console.log('Password reset process completed, loading stopped');
    }
  };

  const handleLogoClick = () => {
    navigate('/'); // <-- Go to login page
  };

  const handleOkClick = () => {
    if (popupType === 'success') {
      navigate('/'); // Go to login page only on success
    } else {
      // For error cases, just close the modal and stay on forgot password page
      setShowPopup(false);
      setEmail(''); // Clear the email field
    }
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
    gap: '30px',
    position: 'relative',
    overflow: 'hidden'
  };
  
  const logoStyle = {
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))',
    '&:hover': {
      transform: 'scale(1.05)',
      filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.4))'
    }
  };
  
  const titleStyle = {
    fontSize: '32px',
    fontWeight: '700',
    letterSpacing: '2px',
    textShadow: '0 4px 8px rgba(0,0,0,0.5)',
    margin: '20px 0',
    textAlign: 'center'
  };
  
  const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    minWidth: '400px',
    padding: '40px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '24px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  };
  
  const labelStyle = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#4a4a4a',
    marginBottom: '16px',
    marginRight: '10px'
  };
  
  const inputStyle = {
    padding: '16px 20px',
    fontSize: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    outline: 'none',
    transition: 'all 0.3s ease',
    backgroundColor: 'white',
    color: '#333',
    fontFamily: 'inherit'
  };
  
  const submitButtonStyle = {
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: '600',
    background: loading ? '#ccc' : 'linear-gradient(135deg, #FF8C42, #FF6B35)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(255, 140, 66, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    opacity: loading ? 0.7 : 1
  };

  const popupNotifStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    animation: 'modalFadeIn 0.3s ease-out forwards',
    backdropFilter: 'blur(5px)'
  };

  const popupStyle = {
    backgroundColor: 'white',
    borderRadius: '24px',
    width: '450px',
    minHeight: '240px',
    boxShadow: popupType === 'error' ? 
      '0 20px 60px rgba(231, 76, 60, 0.3), 0 8px 32px rgba(0, 0, 0, 0.2)' :
      '0 20px 60px rgba(46, 204, 113, 0.3), 0 8px 32px rgba(0, 0, 0, 0.2)',
    overflow: 'hidden',
    zIndex: 1001,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    color: '#333',
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    animation: 'modalBounce 0.5s ease-out forwards',
    border: `1px solid ${popupType === 'error' ? 'rgba(231, 76, 60, 0.2)' : 'rgba(46, 204, 113, 0.2)'}`
  };

  const popupHeaderStyle = {
    background: popupType === 'error' ?
      'linear-gradient(135deg, #E74C3C 0%, #C0392B 50%, #A93226 100%)' :
      'linear-gradient(135deg, #2ECC71 0%, #27AE60 50%, #229954 100%)',
    color: 'white',
    padding: '24px',   
    fontSize: '18px',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: '0.5px',
    boxShadow: popupType === 'error' ?
      '0 2px 10px rgba(231, 76, 60, 0.3)' :
      '0 2px 10px rgba(46, 204, 113, 0.3)'
  };

  const popupBodyStyle = {
    padding: '32px 24px 24px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    color: '#4a4a4a',
    fontSize: '15px',
    textAlign: 'center',
    backgroundColor: '#fafafa',
    borderRadius: '0 0 24px 24px',
    lineHeight: '1.6'
  };

  const okBtnContainerStyle = {
    display: 'flex',
    justifyContent: 'flex-end', 
    marginTop: '10px'
  };

  const okBtnStyle = {
    background: popupType === 'error' ?
      'linear-gradient(135deg, #E74C3C, #C0392B)' :
      'linear-gradient(135deg, #2ECC71, #27AE60)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 32px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    boxShadow: popupType === 'error' ?
      '0 4px 12px rgba(231, 76, 60, 0.3)' :
      '0 4px 12px rgba(46, 204, 113, 0.3)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  return (
    <div id="forgotpass-page-wrapper" style={bgStyle}>
      <img 
        id="signtalk-logo"
        src={logo} 
        alt="SignTalk Logo" 
        className="logo" 
        style={logoStyle}
        onClick={handleLogoClick}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.05)';
          e.target.style.filter = 'drop-shadow(0 12px 24px rgba(0,0,0,0.4))';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.filter = 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))';
        }}
      />
      <h1 id="forgotpass-title" style={titleStyle}>FORGOT PASSWORD</h1>
      
      <form id="forgotpass-form" onSubmit={handleSubmit} style={formStyle}>
        <div>
          <label htmlFor="email" style={labelStyle}>Email Address</label>
          <input
            id="forgotpass-email-input"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
            placeholder="Enter your email address"
            disabled={loading}
            onFocus={(e) => {
              e.target.style.borderColor = '#6D2593';
              e.target.style.boxShadow = '0 0 0 3px rgba(109, 37, 147, 0.1)';
              e.target.style.transform = 'scale(1.02)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e0e0e0';
              e.target.style.boxShadow = 'none';
              e.target.style.transform = 'scale(1)';
            }}
          />
        </div>
        
        <button 
          id="forgotpass-submit-btn"
          type="submit" 
          style={submitButtonStyle}
          disabled={loading}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 6px 20px rgba(255, 140, 66, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(0px)';
              e.target.style.boxShadow = '0 4px 15px rgba(255, 140, 66, 0.4)';
            }
          }}
        >
          {loading ? 'Sending...' : 'Send Reset Email'}
        </button>
      </form>

      {showPopup && (
        <div id="forgotpass-popup-overlay" style={popupNotifStyle}>
          <div id="forgotpass-popup-container" style={popupStyle}>
            <div id="forgotpass-popup-header" style={popupHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>
                  {popupType === 'error' ? '❌' : '✅'}
                </span>
                {popupType === 'error' ? 'Error' : 'Success'}
              </div>
            </div>
            <div style={popupBodyStyle}>
              <div style={{ marginBottom: '24px' }}>
                <p id="forgotpass-popup-message" style={{ margin: '0', fontWeight: '500', fontSize: '14px', lineHeight: '1.5' }}>
                  {popupMessage}
                </p>
              </div>
              <div style={okBtnContainerStyle}>
                <button 
                  id="forgotpass-ok-btn"
                  style={okBtnStyle} 
                  onClick={handleOkClick}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = popupType === 'error' ?
                      '0 6px 20px rgba(231, 76, 60, 0.4)' :
                      '0 6px 20px rgba(46, 204, 113, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0px)';
                    e.target.style.boxShadow = popupType === 'error' ?
                      '0 4px 12px rgba(231, 76, 60, 0.3)' :
                      '0 4px 12px rgba(46, 204, 113, 0.3)';
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {loading && (
        <>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <div id="forgotpass-loading-spinner" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 999
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderTop: '4px solid #FF8C42',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        </>
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
