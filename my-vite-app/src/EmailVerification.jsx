import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import bgImage from './assets/background.png';
import logo from './assets/signtalk_logo.png';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error', 'already-verified'
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get parameters from Firebase Auth action URL
        const mode = searchParams.get('mode');
        const oobCode = searchParams.get('oobCode');
        const apiKey = searchParams.get('apiKey');
        
        console.log('URL Parameters:', { mode, oobCode, apiKey });
        console.log('All search params:', Object.fromEntries(searchParams));
        
        if (mode !== 'verifyEmail' || !oobCode) {
          setStatus('error');
          setMessage('Invalid verification link. Please use the link from your email.');
          console.error('Invalid parameters:', { mode, oobCode });
          return;
        }

        // First, let Firebase Auth handle the email verification
        try {
          const { applyActionCode, checkActionCode } = await import('firebase/auth');
          const { auth } = await import('./firebase');
          
          console.log('Checking action code with Firebase Auth...');
          
          // Check the action code to get user info before applying it
          const actionCodeInfo = await checkActionCode(auth, oobCode);
          console.log('Action code info:', actionCodeInfo);
          
          const userEmail = actionCodeInfo.data.email;
          console.log('Email from action code:', userEmail);
          setEmail(userEmail);
          
          // Apply the action code to verify the email in Firebase Auth
          await applyActionCode(auth, oobCode);
          console.log('Firebase Auth email verification completed');
          
          // Now call our Cloud Function to update Firestore
          console.log('Calling verifyAdminEmail function with email:', userEmail);
          const verifyAdminEmail = httpsCallable(functions, 'verifyAdminEmail');
          const result = await verifyAdminEmail({ email: userEmail });
          console.log('verifyAdminEmail result:', result.data);
          
          if (result.data.success) {
            if (result.data.alreadyVerified) {
              setStatus('already-verified');
              setMessage('Your email has already been verified. You can now log in to your admin account.');
            } else {
              setStatus('success');
              setMessage('Email verification successful! Your admin account is now active. You can now log in.');
            }
          } else {
            setStatus('error');
            setMessage('Email verification failed: ' + (result.data.message || 'Unknown error'));
          }
          
        } catch (error) {
          console.error('Email verification error:', error);
          
          // Handle specific Firebase Auth errors
          if (error.code === 'auth/invalid-action-code') {
            setStatus('error');
            setMessage('The verification link is invalid or has already been used.');
          } else if (error.code === 'auth/expired-action-code') {
            setStatus('error');
            setMessage('The verification link has expired. Please request a new verification email.');
          } else {
            setStatus('error');
            setMessage('Error during email verification: ' + (error.message || 'Unknown error'));
          }
        }
        
      } catch (error) {
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage(error.message || 'An error occurred during email verification. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleLoginRedirect = () => {
    navigate('/');
  };

  const containerStyle = {
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  };

  const cardStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(10px)'
  };

  const logoStyle = {
    width: '80px',
    height: '80px',
    marginBottom: '20px',
    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
  };

  const titleStyle = {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#481872',
    marginBottom: '20px',
    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const messageStyle = {
    fontSize: '16px',
    lineHeight: '1.6',
    marginBottom: '30px',
    color: status === 'success' || status === 'already-verified' ? '#28a745' : status === 'error' ? '#dc3545' : '#666'
  };

  const buttonStyle = {
    backgroundColor: '#481872',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 30px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
    display: 'inline-block'
  };

  const spinnerStyle = {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #481872',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '20px auto'
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
      case 'already-verified':
        return (
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#28a745',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            color: 'white',
            fontSize: '30px',
            fontWeight: 'bold'
          }}>
            ✓
          </div>
        );
      case 'error':
        return (
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#dc3545',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            color: 'white',
            fontSize: '30px',
            fontWeight: 'bold'
          }}>
            !
          </div>
        );
      case 'verifying':
      default:
        return <div style={spinnerStyle}></div>;
    }
  };

  return (
    <div style={containerStyle}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      
      <div style={cardStyle}>
        <img src={logo} alt="SignTalk Logo" style={logoStyle} />
        <h1 style={titleStyle}>Email Verification</h1>
        
        {getStatusIcon()}
        
        <div style={messageStyle}>
          {status === 'verifying' && 'Verifying your email address...'}
          {status !== 'verifying' && message}
        </div>

        {email && (
          <div style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
            Email: {email}
          </div>
        )}

        {(status === 'success' || status === 'already-verified' || status === 'error') && (
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              style={buttonStyle}
              onClick={handleLoginRedirect}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#3a1458';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(72, 24, 114, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#481872';
                e.target.style.transform = 'translateY(0px)';
                e.target.style.boxShadow = 'none';
              }}
            >
              {status === 'error' ? 'Back to Login' : 'Go to Login'}
            </button>
            
            {status === 'error' && (
              <button
                style={{...buttonStyle, backgroundColor: '#dc3545'}}
                onClick={async () => {
                  // Manual verification attempt
                  if (email) {
                    try {
                      console.log('Manual verification attempt for:', email);
                      const verifyAdminEmail = httpsCallable(functions, 'verifyAdminEmail');
                      const result = await verifyAdminEmail({ email: email });
                      console.log('Manual verification result:', result.data);
                      
                      if (result.data.success) {
                        setStatus('success');
                        setMessage('Manual verification successful! You can now log in.');
                      } else {
                        setMessage('Manual verification failed: ' + (result.data.message || 'Unknown error'));
                      }
                    } catch (error) {
                      console.error('Manual verification error:', error);
                      setMessage('Manual verification error: ' + error.message);
                    }
                  }
                }}
              >
                Retry Verification
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;