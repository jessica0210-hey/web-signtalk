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

function LoginWrapper() {
  const navigate = useNavigate();
  const [showForgotPopup, setShowForgotPopup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false); // Add loading state

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
          usersSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.email === email && 
                data.password === password && 
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
        usersSnapshot.docs.forEach(doc => {
          const data = doc.data();
          console.log('Checking user:', {
            docId: doc.id,
            email: data.email,
            inputEmail: email,
            emailMatch: data.email === email,
            password: data.password,
            inputPassword: password,
            passwordMatch: data.password === password,
            userType: data.userType,
            accountStatus: data.accountStatus,
            authCreated: data.authCreated,
            hasPassword: !!data.password
          });
          
          if (data.email === email && 
              data.password === password && 
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