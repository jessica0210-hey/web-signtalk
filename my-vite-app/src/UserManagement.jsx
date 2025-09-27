import React, { useState, useEffect } from 'react';
import AdminLayout from './components/AdminLayout';
import searchIcon from './assets/search-icon.png';
import { firestore } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import './index.css';

function UserManagement() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch users from Firebase
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersRef = collection(firestore, "users");
        const snapshot = await getDocs(usersRef);
        const usersArr = snapshot.docs.map((doc, idx) => {
          const data = doc.data();
          return {
            id: data.uid || doc.id,
            name: data.name || `User ${idx + 1}`,
            email: data.email || '',
            userType: data.userType,
            isOnline: data.isOnline
          };
        });
        
        // Separate users and admins based on userType field
        const regularUsers = usersArr.filter(user => user.userType !== 'admin');
        const adminUsers = usersArr.filter(user => user.userType === 'admin');
        
        setUsers(regularUsers);
        setAdmins(adminUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
        setAdmins([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleSearch = () => {
    // Search functionality can be implemented here
    // For now, we'll just log the search term
    console.log('Searching for:', searchTerm);
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAdmins = admins.filter(admin => 
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
                {loading ? (
                  <tr style={styles.row}>
                    <td colSpan={activeTab === "users" ? 4 : 3} style={{ ...styles.td, textAlign: 'center', padding: '40px' }}>
                      Loading users...
                    </td>
                  </tr>
                ) : (
                  (activeTab === "users" ? filteredUsers : filteredAdmins).length === 0 ? (
                    <tr style={styles.row}>
                      <td colSpan={activeTab === "users" ? 4 : 3} style={{ ...styles.td, textAlign: 'center', padding: '40px' }}>
                        {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                      </td>
                    </tr>
                  ) : (
                    (activeTab === "users" ? filteredUsers : filteredAdmins).map((item, i) => (
                      <tr key={item.id} style={styles.row}>
                        <td style={{ ...styles.td, borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px"}}>
                          {item.id}
                        </td>
                        <td style={styles.td}>{item.email}</td>
                        {activeTab === "users" && <td style={styles.td}>{item.name}</td>}
                        <td style={{ ...styles.td, borderTopRightRadius: "10px", borderBottomRightRadius: "10px" }}>
                          <button style={styles.resetBtn}>Reset Password</button>
                          <button style={styles.deleteBtn}>Delete Account</button>
                        </td>
                      </tr>
                    ))
                  )
                )}
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
