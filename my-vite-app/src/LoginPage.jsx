import React, { useState, useEffect } from 'react';
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
import ProtectedRoute from './components/ProtectedRoute';
import { auth, firestore } from './firebase';
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, getDocs, setDoc } from "firebase/firestore";

// CSS animations for modal effects
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
`;

// Inject animations into document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = modalAnimations;
  if (!document.head.querySelector('style[data-forgot-modal-animations]')) {
    styleElement.setAttribute('data-forgot-modal-animations', 'true');
    document.head.appendChild(styleElement);
  }
}

function LoginWrapper() {
  const navigate = useNavigate();
  const [showForgotPopup, setShowForgotPopup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Password hashing function (same as UserManagement.jsx)
  const createPasswordHash = async (password) => {
    try {
      // Simple hash using SubtleCrypto API (available in browsers)
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (error) {
      console.warn('Hashing not available, returning plain text password:', error);
      return password; // Fallback to plain text if hashing fails
    }
  };

  // Clear session data and handle logout on mount
  useEffect(() => {
    // Clear all session data when login page loads
    sessionStorage.clear();
    localStorage.removeItem('isLoggedIn');
    
    // Check for forced logout flag
    if (localStorage.getItem('forceLogout') === 'true') {
      localStorage.clear();
      sessionStorage.clear();
    }
    
    // Override browser back/forward navigation
    const handlePopState = (event) => {
      // Clear any protected history and stay on login
      window.history.pushState(null, '', '/login');
    };

    // Override history API methods
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function(...args) {
      // If trying to navigate to protected routes without auth, redirect to login
      if (args[2] && (args[2].includes('dashboard') || args[2].includes('userManagement') || args[2].includes('generateReport') || args[2].includes('feedback') || args[2].includes('datasets') || args[2].includes('settings'))) {
        if (!auth.currentUser) {
          originalPushState.call(this, null, '', '/login');
          return;
        }
      }
      originalPushState.apply(this, args);
    };

    window.history.replaceState = function(...args) {
      // If trying to navigate to protected routes without auth, redirect to login  
      if (args[2] && (args[2].includes('dashboard') || args[2].includes('userManagement') || args[2].includes('generateReport') || args[2].includes('feedback') || args[2].includes('datasets') || args[2].includes('settings'))) {
        if (!auth.currentUser) {
          originalReplaceState.call(this, null, '', '/login');
          return;
        }
      }
      originalReplaceState.apply(this, args);
    };

    // Add event listeners
    window.addEventListener('popstate', handlePopState);
    
    // Clear browser history and set login as the only entry
    window.history.replaceState(null, '', '/login');
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Restore original methods
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  // Monitor authentication state and redirect if user becomes authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is authenticated, check if they're an admin and redirect to dashboard
        const checkAdminAndRedirect = async () => {
          try {
            const userDocRef = doc(firestore, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists() && userDoc.data().userType === 'admin') {
              navigate('/dashboardPage', { replace: true });
            } else {
              // Not an admin, sign them out
              await auth.signOut();
            }
          } catch (error) {
            // Error checking admin status, sign out for security
            await auth.signOut();
          }
        };
        checkAdminAndRedirect();
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Prevent navigation to protected routes via direct interaction
  useEffect(() => {
    const handleUserInteraction = (event) => {
      // Check if user is trying to navigate without authentication
      if (!auth.currentUser) {
        // Block any navigation attempts and ensure we stay on login
        const href = event.target.href;
        if (href && (href.includes('dashboard') || href.includes('user') || href.includes('generate') || href.includes('feedback') || href.includes('datasets'))) {
          event.preventDefault();
          navigate('/login', { replace: true });
        }
      }
    };

    const handleKeyDown = (event) => {
      // Block common navigation keyboard shortcuts when not authenticated
      if (!auth.currentUser) {
        if ((event.altKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) ||
            (event.ctrlKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) ||
            event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
          // Allow refresh but ensure we stay on login
          if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
            window.location.href = '/login';
          }
        }
      }
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  //admin credentials
  //signtalk625@gmail.com
  //test12345678

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true); // Start loading
    
    try {
      // First, try regular Firebase Auth login
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        console.log('Firebase Auth successful for user:', user.uid);
        
        // Check userType in Firestore
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        console.log('User document exists:', userDoc.exists());
        if (userDoc.exists()) {
          console.log('User document data:', userDoc.data());
        }
        
        if (userDoc.exists() && userDoc.data().userType === 'admin') {
          // Clear browser history and navigate to dashboard
          window.history.replaceState(null, '', '/dashboardPage');
          navigate('/dashboardPage', { replace: true });
          return;
        } else if (!userDoc.exists()) {
          console.log('User document does not exist, checking for pending admin account...');
          // Sign out the current user first since we need to check for pending admin
          await auth.signOut();
          
          // Check if this is a pending admin account
          const usersRef = collection(firestore, 'users');
          const usersSnapshot = await getDocs(usersRef);
          let pendingAdmin = null;
          
          // Find pending admin with matching email
          const hashedInputPassword = await createPasswordHash(password);
          usersSnapshot.docs.forEach(doc => {
            const data = doc.data();
            // Check both hashed and plain text passwords for compatibility
            const passwordMatches = (data.password === hashedInputPassword) || (data.password === password);
            if (data.email === email && 
                passwordMatches && 
                data.userType === 'admin' && 
                data.accountStatus === 'pending' && 
                data.authCreated === false) {
              console.log('Found matching pending admin during Firebase Auth success!');
              pendingAdmin = { id: doc.id, ...data };
            }
          });
          
          if (pendingAdmin) {
            console.log('Migrating pending admin to existing Firebase Auth account...');
            
            // Sign back in to get the Firebase Auth user
            const userCredential2 = await signInWithEmailAndPassword(auth, email, password);
            const existingAuthUser = userCredential2.user;
            
            // Create new document with existing Firebase Auth UID
            const { password: _, ...adminDataWithoutPassword } = pendingAdmin;
            await setDoc(doc(firestore, 'users', existingAuthUser.uid), {
              ...adminDataWithoutPassword,
              uid: existingAuthUser.uid,
              accountStatus: 'active',
              authCreated: true,
              activatedAt: new Date()
            });
            
            // Delete the old pending document
            const { deleteDoc } = await import('firebase/firestore');
            await deleteDoc(doc(firestore, 'users', pendingAdmin.id));
            
            console.log('Admin account activated with existing Firebase Auth UID');
            
            // Navigate to dashboard
            window.history.replaceState(null, '', '/dashboardPage');
            navigate('/dashboardPage', { replace: true });
            return;
          } else {
            console.log('No pending admin found for existing Firebase Auth account');
            setErrorMsg('Access denied. Only admin users can log in.');
            return;
          }
        } else {
          console.log('Access denied - user document exists but not admin');
          setErrorMsg('Access denied. Only admin users can log in.');
          await auth.signOut();
          return;
        }
      } catch (authError) {
        console.log('Firebase Auth login failed with error:', authError.code, authError.message);
        console.log('Firebase Auth login failed, checking for pending admin account...');
        
        // If Firebase Auth fails, check if this is a pending admin account
        console.log('Checking for pending admin accounts...');
        const usersRef = collection(firestore, 'users');
        const usersSnapshot = await getDocs(usersRef);
        let pendingAdmin = null;
        
        console.log(`Found ${usersSnapshot.docs.length} user documents`);
        
        // Find pending admin with matching email and password
        const hashedInputPassword = await createPasswordHash(password);
        console.log('Input password hash:', hashedInputPassword);
        
        usersSnapshot.docs.forEach(doc => {
          const data = doc.data();
          // Check both hashed and plain text passwords for compatibility
          const hashedPasswordMatch = data.password === hashedInputPassword;
          const plainPasswordMatch = data.password === password;
          const passwordMatches = hashedPasswordMatch || plainPasswordMatch;
          
          console.log('Checking user:', {
            docId: doc.id,
            email: data.email,
            inputEmail: email,
            emailMatch: data.email === email,
            storedPassword: data.password,
            inputPassword: password,
            hashedInputPassword: hashedInputPassword,
            hashedPasswordMatch: hashedPasswordMatch,
            plainPasswordMatch: plainPasswordMatch,
            passwordMatches: passwordMatches,
            userType: data.userType,
            accountStatus: data.accountStatus,
            authCreated: data.authCreated,
            hasPassword: !!data.password
          });
          
          if (data.email === email && 
              passwordMatches && 
              data.userType === 'admin' && 
              data.accountStatus === 'pending' && 
              data.authCreated === false) {
            console.log('Found matching pending admin!');
            pendingAdmin = { id: doc.id, ...data };
          }
        });
        
        console.log('Pending admin search result:', pendingAdmin);
        
        if (pendingAdmin) {
          console.log('Found pending admin account...');
          
          // Check if Firebase Auth account already exists
          try {
            // Try to create Firebase Auth account
            const { createUserWithEmailAndPassword } = await import('firebase/auth');
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newAuthUser = userCredential.user;
            
            console.log('Created new Firebase Auth account with UID:', newAuthUser.uid);
            
            // Create new document with Firebase Auth UID as document ID
            const { password: _, ...adminDataWithoutPassword } = pendingAdmin;
            await setDoc(doc(firestore, 'users', newAuthUser.uid), {
              ...adminDataWithoutPassword,
              uid: newAuthUser.uid,
              accountStatus: 'active',
              authCreated: true,
              activatedAt: new Date()
            });
            
            // Delete the old pending document
            const { deleteDoc } = await import('firebase/firestore');
            await deleteDoc(doc(firestore, 'users', pendingAdmin.id));
            
          } catch (authCreateError) {
            if (authCreateError.code === 'auth/email-already-in-use') {
              console.log('Firebase Auth account already exists, signing in instead...');
              
              // Sign in with existing account
              const userCredential = await signInWithEmailAndPassword(auth, email, password);
              const existingAuthUser = userCredential.user;
              
              console.log('Signed in with existing Firebase Auth UID:', existingAuthUser.uid);
              
              // Create new document with existing Firebase Auth UID
              const { password: _, ...adminDataWithoutPassword } = pendingAdmin;
              await setDoc(doc(firestore, 'users', existingAuthUser.uid), {
                ...adminDataWithoutPassword,
                uid: existingAuthUser.uid,
                accountStatus: 'active',
                authCreated: true,
                activatedAt: new Date()
              });
              
              // Delete the old pending document
              const { deleteDoc } = await import('firebase/firestore');
              await deleteDoc(doc(firestore, 'users', pendingAdmin.id));
            } else {
              throw authCreateError;
            }
          }
          
          console.log('Admin account activated successfully');
          
          // Navigate to dashboard
          window.history.replaceState(null, '', '/dashboardPage');
          navigate('/dashboardPage', { replace: true });
          return;
        }
        
        // If no pending admin found, show error
        setErrorMsg('Incorrect Username or Password. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMsg('An error occurred during login. Please try again.');
      
      // If there was an error during Firebase Auth creation, sign out
      if (auth.currentUser) {
        await auth.signOut();
      }
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    animation: 'modalFadeIn 0.3s ease-out forwards',
    backdropFilter: 'blur(3px)'
  };

  const popupStyle = {
    backgroundColor: 'white',
    borderRadius: '20px',
    width: '420px',
    minHeight: '220px',
    boxShadow: '0 20px 60px rgba(109, 37, 147, 0.3), 0 8px 32px rgba(0, 0, 0, 0.2)',
    overflow: 'hidden',
    zIndex: 1001,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    color: '#6D2593',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    animation: 'modalBounce 0.5s ease-out forwards',
    border: '1px solid rgba(109, 37, 147, 0.1)'
  };

  const popupHeaderStyle = {
    background: 'linear-gradient(135deg, #6D2593 0%, #8A4FB8 50%, #A673D4 100%)',
    color: 'white',
    padding: '20px 24px',
    fontSize: '18px',
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: '0.5px',
    boxShadow: '0 2px 10px rgba(109, 37, 147, 0.3)'
  };

  const popupBodyStyle = {
    padding: '30px 24px 24px',
    textAlign: 'center',
    color: '#4a4a4a',
    backgroundColor: '#fafafa',
    borderRadius: '0 0 20px 20px'
  };

  const confirmBtnStyle = {
    padding: '12px 28px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #6D2593, #8A4FB8)',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(109, 37, 147, 0.3)',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(109, 37, 147, 0.4)'
    },
    '&:active': {
      transform: 'translateY(0px)'
    }
  };
  const cancelBtnStyle = {
    padding: '12px 28px',
    borderRadius: '12px',
    border: '2px solid #6D2593',
    backgroundColor: 'white',
    color: '#6D2593',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(109, 37, 147, 0.15)',
    '&:hover': {
      backgroundColor: '#f8f4fc',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(109, 37, 147, 0.2)'
    },
    '&:active': {
      transform: 'translateY(0px)'
    }
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
    position: 'fixed',
    top: 0,
    left: 0
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

  // Enhanced styles for better UI
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    padding: '40px',
    minHeight: '100vh',
    justifyContent: 'center'
  };

  const logoStyle = {
    width: '150px',
    height: 'auto',
    filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  };

  const titleStyle = {
    fontSize: '28px',
    fontWeight: '700',
    color: 'white',
    textShadow: '0 4px 8px rgba(0,0,0,0.5)',
    letterSpacing: '2px',
    margin: '0'
  };

  const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    fontSize: '16px',
    width: '400px'
  };

  const labelStyle = {
    fontSize: '16px',
    fontWeight: '500',
    color: 'white',
    marginBottom: '4px',
    display: 'block',
    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
  };

  const inputStyle = {
    padding: '12px 16px',
    border: 'none',
    borderRadius: '20px',
    fontSize: '16px',
    outline: 'none',
    transition: 'all 0.3s ease',
    backgroundColor: 'white',
    color: '#333',
    fontFamily: 'inherit',
    width: '100%',
    height: '50px',
    boxSizing: 'border-box'
  };

  const forgotLinkStyle = {
    color: '#ffffff',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'right',
    marginTop: '6px',
    marginBottom: '8px',
    transition: 'all 0.2s ease',
    display: 'block',
    textShadow: '0 1px 2px rgba(0,0,0,0.7)'
  };

  const submitButtonStyle = {
    backgroundColor: loading ? '#ccc' : '#FF8B00',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    height: '50px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '12px',
    width: '180px',
    alignSelf: 'flex-end',
    opacity: loading ? 0.7 : 1,
    textTransform: 'uppercase'
  };

  const passwordContainerStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  };

  const eyeButtonStyle = {
    position: 'absolute',
    right: '16px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#999',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0',
    width: '24px',
    height: '24px',
    transition: 'color 0.2s ease'
  };

  const eyeIconStyle = {
    width: '20px',
    height: '20px',
    strokeWidth: 2,
    stroke: 'currentColor',
    fill: 'none'
  };

  const errorStyle = {
    color: '#e74c3c',
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    border: '1px solid rgba(231, 76, 60, 0.3)',
    borderRadius: '8px',
    padding: '12px 16px',
    marginTop: '16px',
    fontSize: '14px',
    textAlign: 'center',
    fontWeight: '500'
  };

  return (
    <div style={{...bgStyle, ...containerStyle}}>
      <style>{spinnerKeyframes}</style>
      <img 
        src={logo} 
        alt="SignTalk Logo" 
        style={logoStyle}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.05)';
          e.target.style.filter = 'drop-shadow(0 12px 24px rgba(0,0,0,0.4))';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.filter = 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))';
        }}
      />
      <h1 style={titleStyle}>ADMIN</h1>
      
      <form onSubmit={handleSubmit} style={formStyle}>
          <div>
            <label style={labelStyle}>Username or Email</label>
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={inputStyle}
              placeholder="Enter your username or email"
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
          
          <div>
            <label style={labelStyle}>Password</label>
            <div style={passwordContainerStyle}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{...inputStyle, paddingRight: '50px'}}
                placeholder="Enter your password"
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
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={eyeButtonStyle}
                onMouseEnter={(e) => {
                  e.target.style.color = '#6D2593';
                }}
                onMouseLeave={(e) => {
                  e.target.style.color = '#999';
                }}
              >
                {showPassword ? (
                  <svg style={eyeIconStyle} viewBox="0 0 24 24">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M2 2l20 20"/>
                  </svg>
                ) : (
                  <svg style={eyeIconStyle} viewBox="0 0 24 24">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            <span
              style={forgotLinkStyle}
              onClick={handleForgotClick}
              onMouseEnter={(e) => {
                e.target.style.color = '#ad71ceff';
                e.target.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#ffffff';
                e.target.style.textDecoration = 'underline';
              }}
            >
              Forgot Password?
            </span>
          </div>
          
          {errorMsg && (
            <div style={errorStyle}>
              {errorMsg}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading}
            style={submitButtonStyle}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 6px 20px rgba(255, 139, 0, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0px)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      {showForgotPopup && (
        <div style={popupNotifStyle}>
          <div style={popupStyle}>
            <div style={popupHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🔐</span>
                Confirmation
              </div>
            </div>
            <div style={popupBodyStyle}>
              <div style={{ marginBottom: '24px' }}>
                <p style={{ 
                  fontSize: '16px', 
                  padding: '0', 
                  margin: '0 0 8px 0',
                  fontWeight: '500',
                  color: '#333'
                }}>
                  Are you sure you want to proceed to forgot password?
                </p>
                <p style={{
                  fontSize: '14px',
                  color: '#666',
                  margin: '0',
                  lineHeight: '1.4'
                }}>
                  You will be redirected to the password recovery page.
                </p>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center',
                gap: '16px',
                marginTop: '20px'
              }}>
                <button 
                  onClick={cancelForgot} 
                  style={cancelBtnStyle}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f8f4fc';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(109, 37, 147, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.transform = 'translateY(0px)';
                    e.target.style.boxShadow = '0 2px 8px rgba(109, 37, 147, 0.15)';
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmForgot} 
                  style={confirmBtnStyle}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(109, 37, 147, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(109, 37, 147, 0.3)';
                  }}
                >
                  Proceed
                </button>
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
        <Route path="/login" element={<LoginWrapper />} />
        <Route path="/forgotpass" element={<ForgotPass />} />
        <Route 
          path="/dashboardPage" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/generateReport" 
          element={
            <ProtectedRoute>
              <GenerateReport />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/feedback" 
          element={
            <ProtectedRoute>
              <Feedback />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/datasets" 
          element={
            <ProtectedRoute>
              <Datasets />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/userManagement" 
          element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;