import React, { useState } from 'react';
import AdminLayout from './components/AdminLayout';
import restrictIcon from './assets/restrict_icon.png';
import searchIcon from './assets/search-icon.png';

const restrictedAccounts = [
  { name: 'Kwini Vistan', username: 'Kwasong0978' },
  { name: 'Kwini Vistan', username: 'debReyes0789' },
  { name: 'Kwini Vistan', username: 'cICt1236' },
  { name: 'Kwini Vistan', username: 'mOsesJess09' },
  { name: 'Kwini Vistan', username: 'mOsesJess09' },
  { name: 'Kwini Vistan', username: 'mOsesJess09' },
];

function ManageAccounts() {
  const [showNotif, setShowNotif] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const handleUnrestrictClick = (user) => {
    setSelectedUser(user);
    setShowNotif(true);
  };

  const confirmUnrestrict = () => {
    console.log('User unrestricted:', selectedUser);
    setShowNotif(false);
  };

  return (
    <AdminLayout>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            <img src={restrictIcon} alt="Restricted Icon" style={styles.headerIcon} />
            <span>RESTRICTED ACCOUNTS</span>
          </div>

          <div style={styles.searchBox}>
            <img src={searchIcon} alt="Search" style={styles.searchIcon} />
            <input type="text" placeholder="Search user . . ." style={styles.searchInput}/>
          </div>
        </div>

        <div style={styles.tableContainer}>
          <div style={styles.scrollBar}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Username</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {restrictedAccounts.map((account, index) => (
                  <tr key={index} style={styles.row}>
                    <td style={{ ...styles.td, borderLeft: '1px solid #878686', borderTopLeftRadius: '20px', borderBottomLeftRadius: '20px' }}>{index + 1}</td>
                    <td style={styles.td}>{account.name}</td>
                    <td style={styles.td}>{account.username}</td>
                    <td style={{ ...styles.td, borderRight: '1px solid #878686', borderTopRightRadius: '20px', borderBottomRightRadius: '20px' }}>
                      <button style={styles.button} onClick={() => handleUnrestrictClick(account)}>
                        Unrestrict
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Confirmation Notif */}
        {showNotif && (
          <div style={styles.notif}>
            <div style={styles.notifBox}>
              <div style={styles.notifHeader}>Are you sure you want to enable this user?</div>
              <div style={styles.notifActions}>
                <button style={styles.cancelButton} onClick={() => setShowNotif(false)}>Cancel</button>
                <button style={styles.yesButton} onClick={confirmUnrestrict}>YES</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}


const styles = {
  container: {
    backgroundColor: '#fff',
    borderRadius: '25px',
    padding: '30px',
    margin: '30px',
    fontFamily: 'Arial, sans-serif',
    height: '500px',
    width: '1200px',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '15px',
    justifyContent: 'space-between',
  },
  headerIcon: {
    width: '30px',
    height: '30px',
  },
  headerTitle: {
    background: 'linear-gradient(to bottom, #6F22A3, #2A0D3D)',
    borderRadius: '25px',
    padding: '12px 30px',
    color: 'white',
    fontSize: '24px',
    marginRight: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#eee',
    borderRadius: '25px',
    paddingLeft: '20px',
    width: '600px',
    height: '60px',
  },
  searchIcon: {
    width: '20px',
    marginRight: '10px',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    width: '100%',
    fontSize: '16px',
    paddingBottom:'0px'
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#EBEBEB',
    borderRadius: '10px',
    padding: '10px',
    position: 'relative',
    height:'100px'
  },
    scrollBar: {
    overflowY: 'auto',
    maxHeight: '100%',
  },
  table: {
    width: '100%',
    minWidth: '800px', 
    borderCollapse: 'separate',
    borderSpacing: '0 10px',
  },
  th: {
    borderBottom: '1px solid #6F22A3',
    padding: '10px',
    color: '#842BBF',
    top: 0,
    zIndex: 2,
    textAlign:'center',
    position:'sticky',
    backgroundColor: '#EBEBEB',
    fontSize:'16px'
  },
  td: {
    padding: '15px 10px 10px',
    borderBottom: '1px solid #878686',
    borderTop: '1px solid #878686',
    fontSize: '14px',
    color: '#481872',
    fontWeight:'bold',
    textAlign:'center',
  },
  row: {
    backgroundColor: '#fdfdfd',
  },
  button: {
    backgroundColor: '#6C6C6C',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 14px',
    cursor: 'pointer',
  },
  notif: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  notifBox: {
    width: '300px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
  },
  notifHeader: {
    backgroundColor: '#6F22A3',
    color: '#fff',
    padding: '24px 22px',
    fontSize: '16px',
  },
  notifActions: {
    display: 'flex',
    gap:'10px',
    padding:'10px',
   marginLeft:'120px'
  },
  cancelButton: {
    color: '#481872',
    background: 'none',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    padding:'10px',
  },
  yesButton: {
    backgroundColor: '#FF8B00',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding:'10px',
    width:'80px',
    fontSize: '14px',
    cursor: 'pointer',
  },
};

export default ManageAccounts;
