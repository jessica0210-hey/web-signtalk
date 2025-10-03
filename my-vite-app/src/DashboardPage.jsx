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
import { EmailAuthProvider, reauthenticateWithCredential, onAuthStateChanged } from "firebase/auth";

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
function UserStatsChart({ userType, totalUsers, hearingUsers, nonHearingUsers, activeUsers, inactiveUsers, adminUsers }) {
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
      case 'admin':
        return {
          title: 'Admin Users',
          value: adminUsers,
          color: '#FF6B35',
          description: 'System administrators'
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
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF6B35' }}>{adminUsers}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Admin</div>
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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [totalUsers, setTotalUsers] = useState(0);
  const [hearingUsers, setHearingUsers] = useState(0);
  const [nonHearingUsers, setNonHearingUsers] = useState(0);
  const [inactiveUsers, setInactiveUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [adminUsers, setAdminUsers] = useState(0);
  
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
        let admins = 0;
        let regularUsers = 0;

        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.userType === "admin") {
            admins++;
          } else {
            regularUsers++;
            if (data.userType === "Hearing") hearing++;
            if (data.userType === "Non-Hearing") nonHearing++;
          }
          if (data.isOnline === false) inactive++;
          if (data.isOnline === true) active++;
        });

        const total = regularUsers + admins; // Total includes both regular users and admins
        
        setTotalUsers(total);
        setHearingUsers(hearing);
        setNonHearingUsers(nonHearing);
        setInactiveUsers(inactive);
        setActiveUsers(active);
        setAdminUsers(admins);
      } catch {
        setTotalUsers(0);
        setHearingUsers(0);
        setNonHearingUsers(0);
        setInactiveUsers(0);
        setActiveUsers(0);
        setAdminUsers(0);
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
    if (!password || password.trim() === '') {
      setError('Admin password is required!');
      return;
    }

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

  const headerStyle = { fontSize: '32px', margin: 0 , fontWeight: 700};
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
    color: 'white',
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
    height: '180px',
    transition: 'all 0.3s ease',
    transform: 'translateY(0px) scale(1)'
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
  const btnTextStyle = { fontSize: '34px', margin: 0 , fontWeight: 700};


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
        transition: 'all 0.3s ease',
        transform: 'translateY(0px) scale(1)'
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
        letterSpacing: '2px',
        transition: 'all 0.3s ease',
        transform: 'translateY(0px) scale(1)'
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

    @keyframes buttonHover {
      0% {
        transform: translateY(0px);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      100% {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      }
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
          <div 
            style={dashboardBtnStyle} 
            onClick={() => navigate('/generatereport')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.transition = 'all 0.3s ease';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0px) scale(1)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transition = 'all 0.3s ease';
            }}
          >
            <img src={reportIcon} alt="Reports" style={btnIconStyle} />
            <p style={btnTextStyle}>REPORTS</p>
          </div>
          <div 
            style={dashboardBtnStyle} 
            onClick={() => navigate('/userManagement')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.transition = 'all 0.3s ease';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0px) scale(1)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transition = 'all 0.3s ease';
            }}
          >
            <img src={usersIcon} alt="Users" style={btnIconStyle} />
            <p style={btnTextStyle}>USERS</p>
          </div>
          <div 
            style={dashboardBtnStyle} 
            onClick={() => navigate('/datasets')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.transition = 'all 0.3s ease';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0px) scale(1)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transition = 'all 0.3s ease';
            }}
          >
            <img src={datasetIcon} alt="Data Sets" style={btnIconStyle} />
            <p style={btnTextStyle}>DATASETS</p>
          </div>
          <div 
            style={dashboardBtnStyle} 
            onClick={() => navigate('/feedback')}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.transition = 'all 0.3s ease';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0px) scale(1)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transition = 'all 0.3s ease';
            }}
          >
            <img src={feedbackIcon} alt="Feedback" style={btnIconStyle} />
            <p style={btnTextStyle}>FEEDBACK</p>
          </div>
        </div>
        {/* System Status */}
        <div style={systemStatBgStyle}>
          <p style={{ fontSize: '60px', textAlign: 'center', fontWeight: 700, letterSpacing: '0.7px' }}>SYSTEM STATUS</p>
          {isActive ? (
            <p style={{ fontSize: '20px', textAlign: 'center', marginTop: '20px' }}>
              Activating maintenance mode will <br /> make the system
              unavailable to all users.
            </p>
          ) : (
            <p style={{ fontSize: '18px', textAlign: 'center', marginTop: '30px' }}>
              The system is currently in maintenance mode.<br />
              All services are temporarily unavailable and will remain offline until the administrator reactivates the system.
            </p>
          )}
          <div style={{ textAlign: 'center' }}>
            <div 
              style={activeBtnStyle} 
              onClick={handleActiveClick}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
                e.currentTarget.style.transition = 'all 0.3s ease';
                e.currentTarget.style.filter = 'brightness(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0px) scale(1)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transition = 'all 0.3s ease';
                e.currentTarget.style.filter = 'brightness(1)';
              }}
            >
            
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
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '15px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            minWidth: '400px',
            maxWidth: '500px',
            width: '90%',
            animation: 'popupSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            textAlign: 'center',
            color: '#481872'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <img 
                src={dialogImg} 
                alt="Dialog Illustration" 
                style={{ 
                  width: '80px', 
                  height: '80px',
                  animation: 'iconBounce 0.6s ease-out 0.3s both'
                }}
              />
            </div>

            {isActive ? (
              <>
                <h3 style={{ 
                  marginBottom: '15px', 
                  fontWeight: '600', 
                  fontSize: '22px', 
                  textAlign:'center',
                  color: '#E63946',
                  fontFamily: 'Arial, sans-serif'
                }}>
                  Active sessions will be terminated.
                </h3>
                <p style={{ 
                  fontSize: '16px', 
                  marginBottom: '25px', 
                  textAlign:'center',
                  color: '#666',
                  lineHeight: '1.4',
                  fontFamily: 'Arial, sans-serif'
                }}>
                  The system is currently in active mode.<br />
                  The system will remain in maintenance mode.
                </p>
              </>
            ) : (
              <>
                <h3 style={{ 
                  marginBottom: '15px', 
                  fontWeight: '600', 
                  fontSize: '22px', 
                  textAlign:'center',
                  color: '#FFC107',
                  fontFamily: 'Arial, sans-serif'
                }}>
                  The system is currently in maintenance mode.
                </h3>
                <p style={{ 
                  fontSize: '16px', 
                  marginBottom: '25px', 
                  textAlign:'center',
                  color: '#666',
                  lineHeight: '1.4',
                  fontFamily: 'Arial, sans-serif'
                }}>
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
              <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '80%',
                margin: '0 auto 10px auto'
              }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your admin password"
                  style={{
                    width: '100%',
                    padding: '12px 45px 12px 12px',
                    height: '44px',
                    color: '#481872',
                    borderRadius: '8px',
                    fontSize: '16px',
                    border: '2px solid #ddd',
                    backgroundColor: '#f8f9fa',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6f22a3';
                    e.target.style.boxShadow = '0 0 0 3px rgba(111, 34, 163, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#ddd';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(111, 34, 163, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6f22a3"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {showPassword ? (
                      // Eye off icon
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    ) : (
                      // Eye on icon
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <p style={{ color: 'red', fontSize: '14px', margin: '0 0 15px 0' }}>
                  {error}
                </p>
              )}

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button 
                  type="button" 
                  onClick={handleCancel} 
                  style={{ 
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
                  }}
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
                  type="submit"
                  style={{ 
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 30px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    transform: 'translateY(0px)',
                    minWidth: '120px',
                    outline: 'none',
                    backgroundColor: loading ? '#95a5a6' : '#38B000',
                    color: '#fff',
                    boxShadow: loading ? '0 2px 4px rgba(0, 0, 0, 0.1)' : '0 2px 8px rgba(56, 176, 0, 0.3)',
                    opacity: loading ? 0.7 : 1,
                    fontFamily: 'Arial, sans-serif'
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.target.style.backgroundColor = '#2E8B00';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 12px rgba(56, 176, 0, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.target.style.backgroundColor = '#38B000';
                      e.target.style.transform = 'translateY(0px)';
                      e.target.style.boxShadow = '0 2px 8px rgba(56, 176, 0, 0.3)';
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #fff',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Confirming...
                    </div>
                  ) : (
                    'Confirm'
                  )}
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
          zIndex: 1002,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '15px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            width: '600px',
            maxWidth: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            textAlign: 'center',
            position: 'relative',
            animation: 'popupSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
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
              adminUsers={adminUsers}
            />
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default DashboardPage;
