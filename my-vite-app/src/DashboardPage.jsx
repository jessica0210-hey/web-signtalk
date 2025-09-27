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
import usersIcon from './assets/usersIcon.png';
import { firestore, auth } from './firebase';
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

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
    return () => setDisplay(end);
  }, [value, duration]);

  return <span>{display}</span>;
}

// UserStatsChart component for the popup
function UserStatsChart({ userType, totalUsers, hearingUsers, nonHearingUsers, activeUsers, inactiveUsers }) {
  const [animationDelay, setAnimationDelay] = useState(0);

  const getUserTypeInfo = () => {
    switch(userType) {
      case 'total':
        return {
          title: 'Total Users',
          value: totalUsers,
          color: '#481872',
          description: 'All registered users in the system'
        };
      case 'hearing':
        return {
          title: 'Hearing Users',
          value: hearingUsers,
          color: '#6D2593',
          description: 'Users who can hear normally'
        };
      case 'nonhearing':
        return {
          title: 'Non-Hearing Users',
          value: nonHearingUsers,
          color: '#9B59B6',
          description: 'Users with hearing impairments'
        };
      case 'active':
        return {
          title: 'Active Users',
          value: activeUsers,
          color: '#27AE60',
          description: 'Currently active users'
        };
      case 'inactive':
        return {
          title: 'Inactive Users',
          value: inactiveUsers,
          color: '#E74C3C',
          description: 'Currently inactive users'
        };
      default:
        return {
          title: 'Users',
          value: 0,
          color: '#481872',
          description: ''
        };
    }
  };

  const info = getUserTypeInfo();

  // Trigger animation when component mounts
  useEffect(() => {
    setAnimationDelay(Date.now());
  }, []);

  // Calculate percentage for progress bar
  const percentage = totalUsers > 0 ? (info.value / totalUsers * 100) : 0;

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ 
        color: info.color, 
        marginBottom: '10px',
        fontSize: '32px',
        fontWeight: 'bold'
      }}>
        {info.title}
      </h2>
      
      <p style={{ 
        color: '#666', 
        marginBottom: '30px',
        fontSize: '16px'
      }}>
        {info.description}
      </p>

      {/* Animated Circle Chart */}
      <div style={{ 
        margin: '30px auto',
        position: 'relative',
        width: '200px',
        height: '200px'
      }}>
        <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="#f0f0f0"
            strokeWidth="20"
          />
          {/* Animated progress circle */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke={info.color}
            strokeWidth="20"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 80}`}
            strokeDashoffset={animationDelay ? `${2 * Math.PI * 80 * (1 - percentage / 100)}` : `${2 * Math.PI * 80}`}
            style={{
              transition: 'stroke-dashoffset 2s ease-in-out 0.3s'
            }}
          />
        </svg>
        
        {/* Center number */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '36px',
          fontWeight: 'bold',
          color: info.color
        }}>
          {info.value}
        </div>
      </div>

      {/* Percentage display */}
      <div style={{ 
        marginTop: '20px',
        fontSize: '18px',
        color: '#666'
      }}>
        <strong>{percentage.toFixed(1)}%</strong> of total users
      </div>

      {/* Stats bar */}
      <div style={{
        marginTop: '30px',
        backgroundColor: '#f5f5f5',
        borderRadius: '10px',
        height: '10px',
        overflow: 'hidden'
      }}>
        <div style={{
          backgroundColor: info.color,
          height: '100%',
          width: animationDelay ? `${percentage}%` : '0%',
          borderRadius: '10px',
          transition: 'width 2s ease-in-out 0.5s'
        }} />
      </div>

      {/* Additional info */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f9f9f9',
        borderRadius: '10px',
        border: `2px solid ${info.color}`
      }}>
        <h3 style={{ color: info.color, marginBottom: '15px' }}>Quick Stats</h3>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27AE60' }}>{activeUsers}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Active</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#E74C3C' }}>{inactiveUsers}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Inactive</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6D2593' }}>{hearingUsers}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Hearing</div>
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9B59B6' }}>{nonHearingUsers}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Non-Hearing</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardPage() {
  const navigate = useNavigate();

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isActive, setIsActive] = useState(true); 
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [totalUsers, setTotalUsers] = useState(0);
  const [hearingUsers, setHearingUsers] = useState(0);
  const [nonHearingUsers, setNonHearingUsers] = useState(0);
  const [inactiveUsers, setInactiveUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  
  // New states for user statistics popup
  const [isUserStatsPopupOpen, setIsUserStatsPopupOpen] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState('');

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

  useEffect(() => {
    const fetchUserStats = async () => {
      setLoading(true);
      try {
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
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);

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

  // Handle clicks on user numbers
  const handleUserNumberClick = (userType) => {
    setSelectedUserType(userType);
    setIsUserStatsPopupOpen(true);
  };

  const handleCloseUserStatsPopup = () => {
    setIsUserStatsPopupOpen(false);
    setSelectedUserType('');
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCancel();
        handleCloseUserStatsPopup();
      }
    };
    if (isPopupOpen || isUserStatsPopupOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPopupOpen, isUserStatsPopupOpen]);

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

  const dashboardGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gridTemplateRows: 'repeat(2, 1fr)',
    gap: '20px',
    width: '70%',     
    height: '100%'
  };

  const dashboardBtnStyle = {
    backgroundImage: `url(${dashboardBtn})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderRadius: '16px',
    padding: '20px',
    color: 'white',
    textAlign: 'center',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'row',    
    alignItems: 'center',
    justifyContent: 'center',
    gap: '40px',
    border: '1px solid white',
    width: '100%',      
    height: '180px'   
  };

  const systemStatBgStyle = {
    width: '45%',
    height: '100%',
    backgroundImage: `url(${systemStatBg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderRadius: '16px',
    padding: '20px',
    color: 'white',
    position: 'relative',
    border: '1px solid white',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  };

  const btnIconStyle = { width: '110px', height: '120px', margin: '0' };
  const btnTextStyle = { fontSize: '34px', margin: 0 };


  const activeBtnStyle = isActive
    ? {
        backgroundImage:`url(${activeBtn})`, 
        color: 'white',
        padding: '12px 30px',
        borderRadius: '25px',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'inline-block',
        marginTop: '20px',
        width: '400px',
        height: '130px',
        textAlign: 'center',
        fontSize: '32px',
        border: 'none',
        lineHeight: ' 86px',
        letterSpacing: '2px',
      }
    : {
        background: `url(${inactiveBtn})`,
        color: 'white',
        padding: '12px 30px',
        borderRadius: '25px',
        fontWeight: 'bold',
        cursor: 'pointer',
        display: 'inline-block',
        marginTop: '20px',
        width: '400px',
        height: '130px',
        textAlign: 'center',
        fontSize: '32px',
        border: 'none',
        lineHeight: '86px',
        letterSpacing: '2px'
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
    
    @keyframes scaleInModal {
      from {
        transform: scale(0.7);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
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
          <div style={colStyle}>
            <p style={{...numberStyle, cursor: 'pointer', transition: 'transform 0.2s'}} 
               onClick={() => handleUserNumberClick('total')}
               onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
               onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
              <AnimatedNumber value={totalUsers} />
            </p>
          </div>
          <div style={colStyle}>
            <p style={{...numberStyle, cursor: 'pointer', transition: 'transform 0.2s'}} 
               onClick={() => handleUserNumberClick('hearing')}
               onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
               onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
              <AnimatedNumber value={hearingUsers} />
            </p>
          </div>
          <div style={colStyle}>
            <p style={{...numberStyle, cursor: 'pointer', transition: 'transform 0.2s'}} 
               onClick={() => handleUserNumberClick('nonhearing')}
               onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
               onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
              <AnimatedNumber value={nonHearingUsers} />
            </p>
          </div>
          <div style={colStyle}>
            <p style={{...numberStyle, cursor: 'pointer', transition: 'transform 0.2s'}} 
               onClick={() => handleUserNumberClick('inactive')}
               onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
               onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
              <AnimatedNumber value={inactiveUsers} />
            </p>
          </div>
          <div style={colEndStyle}>
            <p style={{...numberStyle, cursor: 'pointer', transition: 'transform 0.2s'}} 
               onClick={() => handleUserNumberClick('active')}
               onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
               onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}>
              <AnimatedNumber value={activeUsers} />
            </p>
          </div>
        </div>
      </div>

      {/* Lower Section */}
      <div style={lowerSectionStyle}>
        {/* 2x2 grid for dashboard buttons */}
        <div style={dashboardGridStyle}>
          <div style={dashboardBtnStyle} onClick={() => navigate('/generatereport')}>
            <img src={reportIcon} alt="Reports" style={btnIconStyle} />
            <p style={btnTextStyle}>REPORTS</p>
          </div>
          <div style={dashboardBtnStyle} onClick={() => navigate('/userManagement')}>
            <img src={usersIcon} alt="Users" style={btnIconStyle} />
            <p style={btnTextStyle}>USERS</p>
          </div>
          <div style={dashboardBtnStyle} onClick={() => navigate('/datasets')}>
            <img src={datasetIcon} alt="Data Sets" style={btnIconStyle} />
            <p style={btnTextStyle}>DATASETS</p>
          </div>
          <div style={dashboardBtnStyle} onClick={() => navigate('/feedback')}>
            <img src={feedbackIcon} alt="Feedback" style={btnIconStyle} />
            <p style={btnTextStyle}>FEEDBACK</p>
          </div>
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            minWidth: '400px',
            maxWidth: '500px',
            animation: 'scaleInModal 0.3s ease-out',
            transform: 'scale(1)',
            textAlign: 'center',
            color: '#481872'
          }}>
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

      {/* User Statistics Popup */}
      {isUserStatsPopupOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1002
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            width: '600px',
            maxHeight: '80vh',
            overflowY: 'auto',
            textAlign: 'center',
            position: 'relative',
            animation: 'scaleInModal 0.3s ease-out',
            transform: 'scale(1)'
          }}>
            {/* Close button */}
            <button
              onClick={handleCloseUserStatsPopup}
              style={{
                position: 'absolute',
                top: '15px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                fontSize: '30px',
                cursor: 'pointer',
                color: '#481872',
                fontWeight: 'bold'
              }}
            >
              ×
            </button>

            <UserStatsChart 
              userType={selectedUserType}
              totalUsers={totalUsers}
              hearingUsers={hearingUsers}
              nonHearingUsers={nonHearingUsers}
              activeUsers={activeUsers}
              inactiveUsers={inactiveUsers}
            />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default DashboardPage;
