import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, firestore } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import bgImage from './assets/background.png';
import headerImage from './assets/headerImage.png';
import logo from './assets/signtalk_logo.png';
import logoutBtn from './assets/logout_btn.png';
import settingsBG from './assets/settings_bg.png';
import languageIcon from './assets/language_icon.png';
import chartIcon from './assets/chart_icon.png';

function Settings() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [adminName, setAdminName] = useState('');

  // Fetch admin name from Firestore
  useEffect(() => {
    const fetchAdminName = async () => {
      if (auth.currentUser) {
        try {
          const userDocRef = doc(firestore, 'users', auth.currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setAdminName(userData.name || 'Admin');
          } else {
            setAdminName('Admin');
          }
        } catch (error) {
          console.error('Error fetching admin name:', error);
          setAdminName('Admin');
        }
      }
    };

    fetchAdminName();
  }, []);

  const handleLogout = () => navigate('/');
  const handleLogoClick = () => navigate('/dashboard');

  const handleCardClick = (cardName) => {
    if (cardName === 'ASL nd FSL Alphabet (Chart)') {
      navigate('/chart');
    } else {
      console.log(`Clicked on: ${cardName}`);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
    console.log(`Dark mode is now ${!darkMode}`);
  };

  const bgStyle = {
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    width: '100vw',
    height: '100vh',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: 0,
    fontSize: '24px'
  };

  const headerStyle = {
    width: '100%',
    height: '80px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '0 20px',
    backgroundImage: `url(${headerImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    boxSizing: 'border-box'
  };

  const leftHeader= {
    display: 'flex',
    alignItems: 'center',
    gap: '30px'
  };

  const logoStyle = {
    height: '60px',
    cursor: 'pointer'
  };

  const greetings = {
    fontSize: '20px',
    margin: 0
  };

  const content = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    marginTop: '40px'
  };

  const logoutBtnStyle = {
    marginTop: '30px',
    width: '110px',
    height: '50px',
    cursor: 'pointer'
  };

  const settingsContainer = {
    width: '600px',
    height: '70px',
    backgroundImage: `url(${settingsBG})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderRadius: '15px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 30px',
    color: 'white',
    fontSize: '20px'
  };

  const iconsStyle = {
    width: '30px',
    height: '30px'
  };

  const toggleStyle = {
    position: 'relative',
    width: '50px',
    height: '26px',
    borderRadius: '13px',
    background: darkMode ? '#6C63FF' : '#999',
    transition: '0.3s',
    cursor: 'pointer'
  };

  const circleStyle = {
    position: 'absolute',
    top: '3px',
    left: darkMode ? '26px' : '3px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: 'white',
    transition: '0.3s'
  };

  return (
    <div style={bgStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={leftHeader}>
          <img src={logo} alt="Logo" style={logoStyle} onClick={handleLogoClick} />
          <span style={greetings}>Hello Admin {adminName}!</span>
        </div>
      </div>

      {/* Main Content */}
      <div style={content}>
        <p style={{ margin: 0, fontSize: '30px' }}>Settings</p>

        <div
          style={{ ...settingsContainer, cursor: 'pointer' }}
          onClick={() => handleCardClick('Switch Language')}
        >
          <span style={{ fontWeight: '500' }}>Switch Language</span>
          <img src={languageIcon} alt="Icon" style={iconsStyle} />
        </div>

        <div style={{ ...settingsContainer, cursor: 'default' }}>
          <span style={{ fontWeight: '500' }}>Dark Mode</span>
          <div style={toggleStyle} onClick={toggleDarkMode}>
            <div style={circleStyle}></div>
          </div>
        </div>

        <div
          style={{ ...settingsContainer, cursor: 'pointer' }}
          onClick={() => handleCardClick('ASL nd FSL Alphabet (Chart)')}
        >
          <span style={{ fontWeight: '500' }}>ASL nd FSL Alphabet (Chart)</span>
          <img src={chartIcon} alt="Icon" style={iconsStyle} />
        </div>

        <img src={logoutBtn} alt="Logout" style={logoutBtnStyle} onClick={handleLogout} />
      </div>
    </div>
  );
}

export default Settings;
