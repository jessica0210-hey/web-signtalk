import React, { useState } from 'react';
import AdminLayout from './components/AdminLayout';
import searchIcon from './assets/search-icon.png';
import './index.css';

function UserManagement() {
  const [activeTab, setActiveTab] = useState("users");

  const users = [
    { id: 'user000293', email: 'sign@talk.com', name: 'Maricris Alcanar' },
    { id: 'user000294', email: 'sign@talk.com', name: 'Jamila Chan' },
    { id: 'user000295', email: 'sign@talk.com', name: 'Jessica Chan' },
    { id: 'user000296', email: 'sign@talk.com', name: 'Dave Chan' },
    { id: 'user000297', email: 'sign@talk.com', name: 'Dave Chan' },
    { id: 'user000298', email: 'sign@talk.com', name: 'Dave Chan' },
    { id: 'user000299', email: 'sign@talk.com', name: 'Dave Chan' },
  ];

  const admins = [
    { id: 'admin0001', email: 'admin@talk.com' },
    { id: 'admin0002', email: 'admin@talk.com' },
  ];

  const handleSearch = () => {
    // search logic
  };

  return (
    <AdminLayout title="USER MANAGEMENT">
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <div style={styles.tabs}>
            <button
              onClick={() => setActiveTab("users")}
              style={{
                ...styles.tabBtn,
                backgroundColor: activeTab === "users" ? "#fff" : "transparent",
                color: activeTab === "users" ? "#6F22A3" : "#fff",
              }}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab("admins")}
              style={{
                ...styles.tabBtn,
                backgroundColor: activeTab === "admins" ? "#fff" : "transparent",
                color: activeTab === "admins" ? "#6F22A3" : "#fff",
              }}
            >
              Admin
            </button>
          </div>

          <div style={styles.searchBox}>
            <input
              type="text"
              placeholder="Search..."
              className="searchInput"
              style={styles.searchInput}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button style={styles.searchBtn} onClick={handleSearch}>
              <img src={searchIcon} alt="Search" style={styles.searchIcon} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={styles.tableWrapper}>
          {/* Fixed header */}
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Email</th>
                {activeTab === "users" && <th style={styles.th}>Name</th>}
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
          </table>

          {/* Scrollable body */}
          <div style={styles.tbodyContainer}>
            <table style={styles.table}>
              <tbody>
                {(activeTab === "users" ? users : admins).map((item, i) => (
                  <tr key={i} style={styles.row}>
                    <td style={{ ...styles.td, borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px"}}>{item.id}</td>
                    <td style={styles.td}>{item.email}</td>
                    {activeTab === "users" && <td style={styles.td}>{item.name}</td>}
                    <td style={{ ...styles.td, borderTopRightRadius: "10px", borderBottomRightRadius: "10px" }}>
                      <button style={styles.resetBtn}>Reset Password</button>
                      <button style={styles.deleteBtn}>Delete Account</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {activeTab === "admins" && <button style={styles.addBtn}>+ Add an account</button>}
      </div>
    </AdminLayout>
  );
}

const styles = {
  container: { borderRadius: '20px', padding: '20px', margin: '20px', color: '#fff' },
  headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' },
  tabs: { display: 'flex', gap: '10px' },
  tabBtn: { padding: '10px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' },
  searchBox: { display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.28)', borderRadius: '25px', paddingLeft: '15px', paddingRight: '15px', width: '350px', height: '45px', color: '#fff' },
  searchIcon: { width: '20px', filter: 'brightness(0) invert(1)' },
  searchInput: { border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '16px', color: '#fff' },
  searchBtn: { background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', padding: 0, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  tableWrapper: { borderRadius: '15px', backgroundColor: '#3C0B68', border: '1px solid #ddd', overflow: 'hidden' },
  tbodyContainer: { maxHeight: '550px', overflowY: 'auto' ,marginLeft: '24px', marginRight: '24px'},
  table: { width: '99%', tableLayout: 'fixed', borderCollapse: 'separate', borderSpacing: '0 10px'},
  th: { padding: '12px', color: '#fff', textAlign: 'center', backgroundColor: '#3C0B68' },
  td: { padding: '20px', backgroundColor: '#fdfdfd', textAlign: 'center', color: '#333' ,marginLeft: '20px', marginRight: '20px'},
  row: { backgroundColor: 'transparent'},
  resetBtn: { backgroundColor: '#6F22A3', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', marginRight: '10px', cursor: 'pointer' },
  deleteBtn: { backgroundColor: '#E63946', color: '#fff', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer' },
  addBtn: { marginTop: '15px', backgroundColor: '#38B000', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 20px', cursor: 'pointer', fontSize: '16px' },
};

export default UserManagement;
