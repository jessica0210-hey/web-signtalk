import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear any existing session data on mount
    sessionStorage.clear();
    localStorage.removeItem('isLoggedIn');
    
    // Authentication state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoading(false);
      if (user) {
        setIsAuthenticated(true);
        // Set session data for authenticated user
        sessionStorage.setItem('authenticated', 'true');
        localStorage.setItem('isLoggedIn', 'true');
      } else {
        setIsAuthenticated(false);
        // Clear all session data
        sessionStorage.clear();
        localStorage.clear();
        // Redirect to login
        navigate('/login', { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    // Comprehensive navigation protection
    const blockNavigation = (event) => {
      if (!auth.currentUser) {
        event.preventDefault();
        navigate('/login', { replace: true });
      }
    };

    const handlePopState = (event) => {
      if (!auth.currentUser) {
        // Prevent going back to protected pages
        window.history.pushState(null, '', '/login');
        navigate('/login', { replace: true });
      }
    };

    const handleBeforeUnload = (event) => {
      if (!auth.currentUser) {
        // Clear session data on page unload
        sessionStorage.clear();
        localStorage.clear();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && !auth.currentUser) {
        // Page became visible but user not authenticated
        navigate('/login', { replace: true });
      }
    };

    const handleFocus = () => {
      if (!auth.currentUser) {
        navigate('/login', { replace: true });
      }
    };

    // Override browser history methods
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = function(...args) {
      if (!auth.currentUser) {
        originalPushState.call(this, null, '', '/login');
        return;
      }
      originalPushState.apply(this, args);
    };

    window.history.replaceState = function(...args) {
      if (!auth.currentUser) {
        originalReplaceState.call(this, null, '', '/login');
        return;
      }
      originalReplaceState.apply(this, args);
    };

    // Add event listeners
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Continuous authentication check
    const authCheck = setInterval(() => {
      if (!auth.currentUser) {
        sessionStorage.clear();
        localStorage.clear();
        navigate('/login', { replace: true });
      }
    }, 1000);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(authCheck);
      
      // Restore original methods
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [navigate]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div 
        id="auth-loading-container" 
        style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5',
        flexDirection: 'column'
      }}>
        <div 
          id="auth-loading-spinner"
          style={{
          width: '50px',
          height: '50px',
          border: '5px solid #e0e0e0',
          borderTop: '5px solid #6D2593',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p id="auth-loading-text" 
          style={{
          marginTop: '20px',
          color: '#666',
          fontSize: '16px'
        }}>Authenticating...</p>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  // Only render children if authenticated
  return isAuthenticated ? children : null;
}

export default ProtectedRoute;