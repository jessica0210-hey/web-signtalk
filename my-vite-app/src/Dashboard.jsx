import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import restrictIcon from './assets/restrict_icon.png';
import feedbackIcon from './assets/feedback_icon.png';
import dashboardBG from './assets/dashboard_bg.png';
import workingStatus from './assets/working_status.png';
import downStatus from './assets/down_status.png';

function Dashboard() {
  const navigate = useNavigate();
  const [isWorking, setIsWorking] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleStatusClick = () => {
    if (isWorking) {
      setShowPopup(true);
    } else {
      setIsWorking(true);
    }
  };

  const confirmStatusChange = () => {
    if (password === 'admin123') {
      setIsWorking(false);
      setShowPopup(false);
      setPassword('');
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setPassword('');
    setError('');
  };

  const contentStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    marginTop: '20px'
  };

  const dashboardBtnStyle = {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  };

  const dashboardStyle = {
    width: '280px',
    height: '300px',
    backgroundImage: `url(${dashboardBG})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderRadius: '15px',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    textAlign: 'center',
    border: '1px solid white',
    fontSize: '24px'
  };

  const iconStyle = {
    width: '150px',
    height: 'auto',
    marginBottom: '10px'
  };

  const statusContainerStyle = {
    backgroundImage: `url(${dashboardBG})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    padding: '20px 40px',
    borderRadius: '15px',
    textAlign: 'center',
    color: 'white',
    width: '570px'
  };

  const statusImageStyle = {
    width: '100%',
    height: 'auto',
    marginTop: '10px',
    cursor: 'pointer',
    borderRadius: '10px'
  };

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
    width: '300px',
    height: 'auto',
    fontFamily: 'Arial, sans-serif',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden'
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
    color: '#2d006a',
  };

  const inputStyle = {
    width: '100%',
    height: '90%',
    padding: '18px',
    borderRadius: '10px',
    border: 'none',
    fontSize: '14px',
    backgroundColor: '#f0f0f0',
  };

  const buttonRow = {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '10px',
    marginLeft:'50px'
  };

  const buttonStyle = {
    flex: 1,
    padding: '10px',
    fontSize: '16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    backgroundColor: 'transparent',
    color: '#6d2593',
  };

  const confirmButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#FF8B00',
    color: 'white',
    marginLeft: '10px',
  };

  return (
    <AdminLayout onSettingsClick={() => navigate('/settings')}>
      <div style={contentStyle}>
        <div style={dashboardBtnStyle}>
          <div style={dashboardStyle} onClick={() => navigate('/manage-accounts')}>
            <img src={restrictIcon} alt="Restricted" style={{ ...iconStyle, marginBottom: '10px' }} />
            <span>Restricted Accounts</span>
          </div>
          <div style={dashboardStyle} onClick={() => navigate('/feedback')}>
            <img
              src={feedbackIcon}
              alt="Feedback"
              style={{ ...iconStyle, marginLeft: '40px' }}
            />
            <span>Feedback</span>
          </div>
        </div>

        <div style={statusContainerStyle}>
          <p style={{ margin: 0, fontSize: '24px' }}>SYSTEM STATUS:</p>
          <img
            src={isWorking ? workingStatus : downStatus}
            alt="System Status"
            style={statusImageStyle}
            onClick={handleStatusClick}
          />
        </div>
      </div>

      {/* Pop-up Notification */}
      {showPopup && (
        <div style={popupNotifStyle}>
          <div style={popupStyle}>
            <div style={popupHeaderStyle}>
              <b>Authentication required!</b><br />
              <span style={{ fontSize: '13px' }}>
                Enter admin password to confirm maintenance mode.
              </span>
            </div>
            <div style={popupBodyStyle}>
              <input type="password"placeholder="Enter password..." value={password}onChange={(e) => setPassword(e.target.value)} style={inputStyle}/>
              {error && <p style={{ color: 'red', fontSize:'12px' }}>{error}</p>}
              <div style={buttonRow}>
                <button style={cancelButtonStyle} onClick={closePopup}>
                  Cancel
                </button>
                <button style={confirmButtonStyle} onClick={confirmStatusChange}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default Dashboard;
