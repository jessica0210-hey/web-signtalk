import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import statsBg from './assets/statsBg.png'; 
import dashboardBtn from './assets/dashboardBtn.png'; 
import systemStatBg from './assets/SystemStatBg.png'; 
import reportIcon from './assets/generateReportIcon.png'; 
import datasetIcon from './assets/signlanguageIcon.png'; 
import feedbackIcon from './assets/feedbackIcon.png';
import dialogImg from './assets/dialogImg.png'; 
import inactiveBtn from './assets/inactiveBtn.png'; 
import activeBtn from './assets/activeBtn.png'; 
import { firestore, auth } from './firebase';
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

// AnimatedNumber component
function AnimatedNumber({ value, duration = 300 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) {
      setDisplay(end);
      return;
    }
    let startTime = null;
    function animateNumber(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setDisplay(Math.floor(progress * (end - start) + start));
      if (progress < 1) {
        requestAnimationFrame(animateNumber);
      } else {
        setDisplay(end);
      }
    }
    requestAnimationFrame(animateNumber);
    // Cleanup
    return () => setDisplay(end);
  }, [value, duration]);

  return <span>{display}</span>;
}

function DashboardPage() {
  const navigate = useNavigate();

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isActive, setIsActive] = useState(true); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // User stats
  const [totalUsers, setTotalUsers] = useState(0);
  const [hearingUsers, setHearingUsers] = useState(0);
  const [nonHearingUsers, setNonHearingUsers] = useState(0);
  const [inactiveUsers, setInactiveUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);

  // Fetch system status from Firestore on mount
  useEffect(() => {
    const fetchStatus = async () => {
      setLoading(true);
      try {
        const statusDocRef = doc(firestore, 'system status', '04N5OCS28bovQuovDRIS');
        const statusDoc = await getDoc(statusDocRef);
        if (statusDoc.exists()) {
          setIsActive(statusDoc.data().isActive);
        }
      } catch {
        setError('Failed to fetch system status.');
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  // Fetch user stats
  useEffect(() => {
    const fetchUserStats = async () => {
      setLoading(true);
      try {
        // Get all users from Firestore 'users' collection
        const usersRef = collection(firestore, 'users');
        const snapshot = await getDocs(usersRef);
        let hearing = 0;
        let nonHearing = 0;
        let inactive = 0;
        let active = 0;
        let total = snapshot.size;

        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.userType === "Hearing") hearing++;
          if (data.userType === "Non-Hearing") nonHearing++;
          if (data.isOnline === false) inactive++;
          if (data.isOnline === true) active++;
        });

        setTotalUsers(total);
        setHearingUsers(hearing);
        setNonHearingUsers(nonHearing);
        setInactiveUsers(inactive);
        setActiveUsers(active);
      } catch {
        setTotalUsers(0);
        setHearingUsers(0);
        setNonHearingUsers(0);
        setInactiveUsers(0);
        setActiveUsers(0);
      } finally {
        setLoading(false);
      }
    };
    fetchUserStats();
  }, []);

  const handleActiveClick = () => {
    setIsPopupOpen(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('No admin user is logged in.');
        setLoading(false);
        return;
      }
      // Re-authenticate using Firebase Auth
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);

      // If successful, update system status
      const statusDocRef = doc(firestore, 'system status', '04N5OCS28bovQuovDRIS');
      await updateDoc(statusDocRef, { isActive: !isActive });
      setIsActive(!isActive);
      setIsPopupOpen(false);
      setPassword('');
      setError('');
    } catch {
      setError('Incorrect password!');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsPopupOpen(false);
    setPassword('');
    setError('');
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };
    if (isPopupOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPopupOpen]);

  // --- styles ---

  const headerStyle = { fontSize: '28px', margin: 0 };
  const statsContainerStyle = {
    width: '1800px',
    height: '170px',
    marginTop: '20px',
    borderRadius: '18px',
    overflow: 'hidden',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
    backgroundImage: `url(${statsBg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    padding: '30px',
    color: 'white'
  };
  const rowStyle = { display: 'flex', justifyContent: 'space-between', textAlign: 'center' };
  const colStyle = { flex: 1, textAlign: 'center', borderRight: '2px solid rgba(255, 255, 255, 0.5)' };
  const colEndStyle = { flex: 1, textAlign: 'center' };
  const labelStyle = { fontSize: '28px' };
  const numberStyle = { fontSize: '60px', margin: 0 };
  const lowerSectionStyle = {
    marginTop: '20px',
    gap: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'stretch',
    height: '380px',
    width: '1800px'
  };
  const dashboardBtnStyle = {
    width: '35%',
    backgroundImage: `url(${dashboardBtn})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderRadius: '12px',
    padding: '20px',
    color: 'white',
    textAlign: 'center',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    border: '1px solid white'
  };
  const systemStatBgStyle = {
    width: '70%',
    backgroundImage: `url(${systemStatBg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderRadius: '12px',
    padding: '20px',
    color: 'white',
    position: 'relative',
    border: '1px solid white'
  };
  const btnIconStyle = { width: '120px', height: '150px', margin: '0 auto 20px auto' };
  const btnTextStyle = { fontSize: '28px', margin: 0 };

  // Button style changes based on isActive
  const activeBtnStyle = isActive
    ? {
        backgroundImage:`url(${activeBtn})`, // Green for active
        color: 'white',
        padding: '12px 30px',
        borderRadius: '25px',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'inline-block',
        marginTop: '20px',
        width: '400px',
        height: '125px',
        textAlign: 'center',
        fontSize: '32px',
        border: 'none',
        lineHeight: ' 86px',
        letterSpacing: '2px',
      }
    : {
        background: `url(${inactiveBtn})`, // Red for inactive
        color: 'white',
        padding: '12px 30px',
        borderRadius: '25px',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'inline-block',
        marginTop: '20px',
        width: '400px',
        height: '125px',
        textAlign: 'center',
        fontSize: '32px',
        border: 'none',
        lineHeight: '86px',
        letterSpacing: '2px'
      };

  const popupOverlay = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  };

  const popupContent = {
    width: '460px',
    padding: '20px',
    borderRadius: '30px',
    background: '#fff',
    textAlign: 'center',
    position: 'relative',
    color:"#481872"
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

  const spinnerKeyframes = `
    @keyframes spin {
      0% { transform: rotate(0deg);}
      100% { transform: rotate(360deg);}
    }
  `;

  return (
    <AdminLayout>
      <style>{spinnerKeyframes}</style>
      {loading && (
        <div style={spinnerOverlayStyle}>
          <div style={spinnerStyle}></div>
        </div>
      )}
      <p style={headerStyle}>NUMBER OF USERS</p>
      <div style={statsContainerStyle}>
        {/* First row: Labels */}
        <div style={rowStyle}>
          <div style={colStyle}><p style={labelStyle}>Total No. of Users</p></div>
          <div style={colStyle}><p style={labelStyle}>Hearing Users</p></div>
          <div style={colStyle}><p style={labelStyle}>Non-Hearing Users</p></div>
          <div style={colStyle}><p style={labelStyle}>Inactive (Offline) Users</p></div>
          <div style={colEndStyle}><p style={labelStyle}>Active Users</p></div>
        </div>

        {/* Second row: Numbers */}
        <div style={rowStyle}>
          <div style={colStyle}><p style={numberStyle}><AnimatedNumber value={totalUsers} /></p></div>
          <div style={colStyle}><p style={numberStyle}><AnimatedNumber value={hearingUsers} /></p></div>
          <div style={colStyle}><p style={numberStyle}><AnimatedNumber value={nonHearingUsers} /></p></div>
          <div style={colStyle}><p style={numberStyle}><AnimatedNumber value={inactiveUsers} /></p></div>
          <div style={colEndStyle}><p style={numberStyle}><AnimatedNumber value={activeUsers} /></p></div>
        </div>
      </div>

      {/* Lower Section */}
      <div style={lowerSectionStyle}>
        <div style={dashboardBtnStyle} onClick={() => navigate('/generatereport')}>
          <img src={reportIcon} alt="Report" style={btnIconStyle} />
          <p style={btnTextStyle}>Generate Report</p>
        </div>
        <div style={dashboardBtnStyle} onClick={() => navigate('/datasets')}>
          <img src={datasetIcon} alt="Data Sets" style={btnIconStyle} />
          <p style={btnTextStyle}>Data Sets</p>
        </div>
        <div style={dashboardBtnStyle} onClick={() => navigate('/feedback')}>
          <img src={feedbackIcon} alt="Feedback" style={btnIconStyle} />
          <p style={btnTextStyle}>Feedback</p>
        </div>
        {/* System Status */}
        <div style={systemStatBgStyle}>
          <p style={{ fontSize: '60px', textAlign: 'center'}}>System Status</p>
          {isActive ? (
            <p style={{ fontSize: '18px', textAlign: 'center', marginTop: '30px' }}>
              Warning:<br />
              Activating maintenance mode will make the system <br />
              unavailable to all users.
            </p>
          ) : (
            <p style={{ fontSize: '18px', textAlign: 'center', marginTop: '30px' }}>
              The system is currently in maintenance mode.<br />
              All services are temporarily unavailable and will remain offline until the administrator reactivates the system.
            </p>
          )}
          <div style={{ textAlign: 'center' }}>
            <div style={activeBtnStyle} onClick={handleActiveClick}>
            
            </div>
          </div>
        </div>
      </div>

      {isPopupOpen && (
        <div style={popupOverlay}>
          <div style={popupContent}>
            <img 
              src={dialogImg} 
              alt="Dialog Illustration" 
              style={{ width: '100px', marginBottom: '15px' }}
            />

            {isActive ? (
              <>
                <p style={{ marginBottom: '10px', fontWeight: 'bold', fontSize: '20px', textAlign:'center'}}>
                  Active sessions will be terminated.
                </p>
                <p style={{ fontSize: '14px', marginBottom: '20px', textAlign:'center'}}>
                  The system is currently in active mode.<br />
                  The system will remain in maintenance mode.
                </p>
              </>
            ) : (
              <>
                <p style={{ marginBottom: '10px', fontWeight: 'bold', fontSize: '20px', textAlign:'center' }}>
                  The system is currently in maintenance mode.
                </p>
                <p style={{ fontSize: '14px', marginBottom: '20px', textAlign:'center'}}>
                  Reactivation will bring all services back online and make the system available to users.
                </p>
              </>
            )}

            {/* 🔹 Wrap input + buttons in a form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
            >
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                style={{
                  display: 'block',
                  margin: '0 auto 10px auto',
                  padding: '8px',
                  width: '80%',
                  height: '40px',
                  color: '#481872',
                  borderRadius: '8px',
                  fontSize: '16px',
                  border: '1px solid #ccc',
                  backgroundColor: '#e9e7e7ff'
                }}
              />

              {/* Error Message */}
              {error && (
                <p style={{ color: 'red', fontSize: '14px', margin: '0 0 15px 0' }}>
                  {error}
                </p>
              )}

              <div>
                <button 
                  type="button" 
                  onClick={handleCancel} 
                  style={{ marginRight: '10px', width: '100px', height: '40px', border: '1px solid #ccc', background: 'transparent', color: '#481872', padding: '6px 12px', borderRadius: '5px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ background: 'green', color: 'white', padding: '6px 12px', borderRadius: '5px', width: '100px', height: '40px', border: '1px solid green'}}
                  disabled={loading}
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default DashboardPage;
