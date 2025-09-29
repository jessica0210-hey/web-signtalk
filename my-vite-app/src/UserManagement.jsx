import React, { useState, useEffect } from 'react';
import AdminLayout from './components/AdminLayout';
import searchIcon from './assets/search-icon.png';
import deleteUserIcon from './assets/delete_user_icon.png';
import deleteUserConfirmation from './assets/delete_user_confirmation.png';
import { firestore } from './firebase';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import './index.css';

function UserManagement() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Fetch users from Firebase
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersRef = collection(firestore, "users");
        const snapshot = await getDocs(usersRef);
        const usersArr = snapshot.docs.map((doc, idx) => {
          const data = doc.data();
          const userId = data.formatted_uid || data.uid || doc.id;
          // Convert to string to ensure consistent search behavior
          const userIdString = userId ? String(userId) : '';
          console.log('User data:', { formatted_uid: data.formatted_uid, uid: data.uid, doc_id: doc.id, final_id: userIdString });
          return {
            id: userIdString, // Display ID (formatted_uid)
            docId: doc.id, // Firebase document ID for deletion
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
  const filteredUsers = users.filter(user => {
    try {
      if (!searchTerm.trim()) return true;
      const searchLower = searchTerm.toLowerCase();
      
      // Debug logging
      if (searchTerm.trim()) {
        console.log('Searching for:', searchLower);
        console.log('User ID:', user.id, 'Type:', typeof user.id);
        console.log('User name:', user.name, 'Type:', typeof user.name);
        console.log('User email:', user.email, 'Type:', typeof user.email);
      }
      
      const nameMatch = user.name && String(user.name).toLowerCase().includes(searchLower);
      const emailMatch = user.email && String(user.email).toLowerCase().includes(searchLower);
      const idMatch = user.id && String(user.id).toLowerCase().includes(searchLower);
      
      if (searchTerm.trim()) {
        console.log('Matches - Name:', nameMatch, 'Email:', emailMatch, 'ID:', idMatch);
      }
      
      return nameMatch || emailMatch || idMatch;
    } catch (error) {
      console.error('Error filtering user:', error, user);
      return false;
    }
  });

  const filteredAdmins = admins.filter(admin => {
    try {
      if (!searchTerm.trim()) return true;
      const searchLower = searchTerm.toLowerCase();
      
      const nameMatch = admin.name && String(admin.name).toLowerCase().includes(searchLower);
      const emailMatch = admin.email && String(admin.email).toLowerCase().includes(searchLower);
      const idMatch = admin.id && String(admin.id).toLowerCase().includes(searchLower);
      
      return nameMatch || emailMatch || idMatch;
    } catch (error) {
      console.error('Error filtering admin:', error, admin);
      return false;
    }
  });

  const handleDeleteAccount = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (!userToDelete) return;

    try {
      const collectionName = activeTab === 'users' ? 'users' : 'admins';
      console.log('Deleting user with docId:', userToDelete.docId);
      await deleteDoc(doc(firestore, collectionName, userToDelete.docId));
      
      // Update local state
      if (activeTab === 'users') {
        setUsers(users.filter(u => u.docId !== userToDelete.docId));
      } else {
        setAdmins(admins.filter(a => a.docId !== userToDelete.docId));
      }
      
      setShowDeleteModal(false);
      setUserToDelete(null);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Error deleting account. Please try again.');
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
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
                <th style={{ ...styles.th, textAlign: 'center', display: 'table-cell', verticalAlign: 'middle', justifyContent: 'center', alignItems: 'center' }}>Action</th>
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
                      <tr key={item.id || i} style={styles.row}>
                        <td style={{ ...styles.td, borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px"}}>
                          {item.id || 'N/A'}
                        </td>
                        <td style={styles.td}>{item.email || 'N/A'}</td>
                        {activeTab === "users" && <td style={styles.td}>{item.name || 'N/A'}</td>}
                        <td style={{ ...styles.td, borderTopRightRadius: "10px", borderBottomRightRadius: "10px", textAlign: "right" }}>
                          <button style={styles.resetBtn}>Reset Password</button>
                          <button 
                            style={styles.deleteBtn}
                            onClick={() => handleDeleteAccount(item)}
                          >
                            Delete Account
                          </button>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalIcon}>
              <img src={deleteUserIcon} alt="Delete User" style={styles.deleteIcon} />
            </div>
            <div style={styles.modalContent}>
              <h3 style={styles.modalTitle}>Are you sure you want to delete this account?</h3>
              <p style={styles.modalSubtitle}>This action is permanent and cannot be undone.</p>
            </div>
            <div style={styles.modalButtons}>
              <button 
                style={styles.cancelBtn}
                onClick={cancelDelete}
              >
                Cancel
              </button>
              <button 
                style={styles.confirmDeleteBtn}
                onClick={confirmDeleteAccount}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Confirmation Modal */}
      {showSuccessModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.successModal}>
            <div style={styles.modalIcon}>
              <img src={deleteUserConfirmation} alt="Success" style={styles.successIcon} />
            </div>
            <div style={styles.modalContent}>
              <p style={styles.successMessage}>The account has been successfully removed from the system.</p>
            </div>
            <div style={styles.modalButtons}>
              <button 
                style={styles.okBtn}
                onClick={closeSuccessModal}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
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
  th: { padding: '12px', color: '#fff', textAlign: 'center', backgroundColor: '#3C0B68', display: 'table-cell', verticalAlign: 'middle' },
  td: { padding: '20px', backgroundColor: '#fdfdfd', textAlign: 'center', color: '#333' ,marginLeft: '20px', marginRight: '20px'},
  row: { backgroundColor: 'transparent'},
  resetBtn: { backgroundColor: '#6F22A3', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', marginRight: '12px', cursor: 'pointer', fontSize: '14px' },
  deleteBtn: { backgroundColor: '#E63946', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', cursor: 'pointer', fontSize: '14px' },
  addBtn: { marginTop: '15px', backgroundColor: '#38B000', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 20px', cursor: 'pointer', fontSize: '16px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#fff', borderRadius: '10px', padding: '30px', maxWidth: '400px', width: '90%', textAlign: 'center', animation: 'scaleInModal 0.3s ease-out' },
  modalIcon: { marginBottom: '20px' },
  deleteIcon: { width: '80px', height: '80px' },
  modalContent: { marginBottom: '30px' },
  modalTitle: { fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '10px', margin: '0 0 10px 0' },
  modalSubtitle: { fontSize: '14px', color: '#666', margin: 0 },
  modalButtons: { display: 'flex', gap: '15px', justifyContent: 'center' },
  cancelBtn: { backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 24px', cursor: 'pointer', fontSize: '14px' },
  confirmDeleteBtn: { backgroundColor: '#E63946', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 24px', cursor: 'pointer', fontSize: '14px' },
  successModal: { backgroundColor: '#fff', borderRadius: '10px', padding: '30px', maxWidth: '400px', width: '90%', textAlign: 'center', animation: 'scaleInModal 0.3s ease-out' },
  successIcon: { width: '60px', height: '60px' },
  successMessage: { fontSize: '16px', color: '#333', margin: '20px 0', lineHeight: '1.4' },
  okBtn: { backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 30px', cursor: 'pointer', fontSize: '14px' },
};

export default UserManagement;
