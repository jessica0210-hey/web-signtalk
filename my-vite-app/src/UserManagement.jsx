import React, { useState, useEffect } from 'react';
import AdminLayout from './components/AdminLayout';
import searchIcon from './assets/search-icon.png';
import deleteUserIcon from './assets/delete_user_icon.png';
import deleteUserConfirmation from './assets/delete_user_confirmation.png';
import resetUserPassIcon from './assets/reset-user-pass.png';
import { firestore, auth } from './firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { updatePassword, signInWithEmailAndPassword } from 'firebase/auth';
import './index.css';

// Add CSS animations for modal effects
const modalAnimations = `
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
      transform: scale(0.7) translateY(-20px);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.05) translateY(-10px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0px);
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
`;

// Inject animations into document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = modalAnimations;
  if (!document.head.querySelector('style[data-modal-animations]')) {
    styleElement.setAttribute('data-modal-animations', 'true');
    document.head.appendChild(styleElement);
  }
}

function UserManagement() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToResetPassword, setUserToResetPassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

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

  const handleResetPassword = (user) => {
    setUserToResetPassword(user);
    setShowResetPasswordModal(true);
    setNewPassword('');
    setConfirmPassword('');
    // Ensure search doesn't interfere with modal
    console.log('Opening reset password for user:', user);
  };

  const confirmResetPassword = async () => {
    if (!userToResetPassword) return;

    // Validation
    if (!newPassword || !confirmPassword) {
      alert('Please fill in both password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Passwords do not match. Please try again.');
      return;
    }

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    setResetPasswordLoading(true);

    try {
      // Note: Direct password reset for other users requires Firebase Admin SDK
      // This is a client-side approach that has limitations
      
      // Update password in Firestore (for your app's reference)
      const collectionName = activeTab === 'users' ? 'users' : 'admins';
      await updateDoc(doc(firestore, collectionName, userToResetPassword.docId), {
        passwordLastReset: new Date(),
        passwordResetBy: auth.currentUser?.uid || 'admin'
      });

      // Note: For security reasons, Firebase doesn't allow changing other users' passwords directly
      // You would need to implement this through Firebase Admin SDK on your server
      // or send a password reset email to the user
      
      setShowResetPasswordModal(false);
      setUserToResetPassword(null);
      setNewPassword('');
      setConfirmPassword('');
      setShowSuccessModal(true);
      
      alert('Password reset request recorded. Note: For security, actual password change requires server-side implementation with Firebase Admin SDK.');
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Error resetting password. Please try again.');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const cancelResetPassword = () => {
    setShowResetPasswordModal(false);
    setUserToResetPassword(null);
    setNewPassword('');
    setConfirmPassword('');
    // Clear any potential search interference
    console.log('Closing reset password modal');
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
              autoComplete="off"
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
                          <button 
                            style={styles.resetBtn}
                            onClick={() => handleResetPassword(item)}
                          >
                            Reset Password
                          </button>
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
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                  e.target.style.backgroundColor = '#5a6268';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0px)';
                  e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  e.target.style.backgroundColor = '#6c757d';
                }}
              >
                Cancel
              </button>
              <button 
                style={styles.confirmDeleteBtn}
                onClick={confirmDeleteAccount}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(230, 57, 70, 0.4)';
                  e.target.style.backgroundColor = '#c82333';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0px)';
                  e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  e.target.style.backgroundColor = '#E63946';
                }}
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
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                  e.target.style.backgroundColor = '#5a6268';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0px)';
                  e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  e.target.style.backgroundColor = '#6c757d';
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.resetPasswordModal}>
            <div style={styles.modalIcon}>
              <img src={resetUserPassIcon} alt="Reset Password" style={styles.resetPasswordIcon} />
            </div>
            <div style={styles.modalContent}>
              <h3 style={styles.modalTitle}>Reset User Password</h3>
              <p style={styles.modalSubtitle}>
                Reset password for: {userToResetPassword?.name || userToResetPassword?.email}
              </p>
              
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>New Password:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={styles.formInput}
                  placeholder="••••••••••••"
                  minLength="6"
                  autoComplete="new-password"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6F22A3';
                    e.target.style.boxShadow = '0 0 0 3px rgba(111, 34, 163, 0.1)';
                    e.target.style.transform = 'scale(1.02)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.boxShadow = 'none';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Confirm Password:</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={styles.formInput}
                  placeholder="Confirm new password"
                  minLength="6"
                  autoComplete="new-password"
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6F22A3';
                    e.target.style.boxShadow = '0 0 0 3px rgba(111, 34, 163, 0.1)';
                    e.target.style.transform = 'scale(1.02)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.boxShadow = 'none';
                    e.target.style.transform = 'scale(1)';
                  }}
                />
              </div>
            </div>
            <div style={styles.modalButtons}>
              <button 
                style={styles.cancelBtn}
                onClick={cancelResetPassword}
                disabled={resetPasswordLoading}
                onMouseEnter={(e) => {
                  if (!resetPasswordLoading) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                    e.target.style.backgroundColor = '#5a6268';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!resetPasswordLoading) {
                    e.target.style.transform = 'translateY(0px)';
                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    e.target.style.backgroundColor = '#6c757d';
                  }
                }}
              >
                Cancel
              </button>
              <button 
                style={{
                  ...styles.confirmResetBtn,
                  opacity: resetPasswordLoading ? 0.6 : 1,
                  cursor: resetPasswordLoading ? 'not-allowed' : 'pointer'
                }}
                onClick={confirmResetPassword}
                disabled={resetPasswordLoading}
                onMouseEnter={(e) => {
                  if (!resetPasswordLoading) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(111, 34, 163, 0.4)';
                    e.target.style.backgroundColor = '#5d1c87';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!resetPasswordLoading) {
                    e.target.style.transform = 'translateY(0px)';
                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    e.target.style.backgroundColor = '#6F22A3';
                  }
                }}
              >
                {resetPasswordLoading ? 'Resetting...' : 'Reset Password'}
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
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.3s ease-out' },
  modal: { backgroundColor: '#fff', borderRadius: '15px', padding: '40px', maxWidth: '400px', width: '90%', textAlign: 'center', animation: 'popupSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', transform: 'scale(1)', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)' },
  modalIcon: { marginBottom: '20px' },
  deleteIcon: { width: '80px', height: '80px', animation: 'iconBounce 0.6s ease-out 0.2s both' },
  modalContent: { marginBottom: '30px' },
  modalTitle: { fontSize: '20px', fontWeight: 'bold', color: '#333', marginBottom: '15px', margin: '0 0 15px 0' },
  modalSubtitle: { fontSize: '14px', color: '#666', margin: '0 0 25px 0' },
  modalButtons: { display: 'flex', gap: '15px', justifyContent: 'center' },
  cancelBtn: { backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 30px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all 0.3s ease', transform: 'translateY(0px)' },
  confirmDeleteBtn: { backgroundColor: '#E63946', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 24px', cursor: 'pointer', fontSize: '14px', transition: 'all 0.3s ease', transform: 'translateY(0px)', fontWeight: '500' },
  successModal: { backgroundColor: '#fff', borderRadius: '15px', padding: '40px', maxWidth: '400px', width: '90%', textAlign: 'center', animation: 'popupSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', transform: 'scale(1)', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)' },
  successIcon: { width: '60px', height: '60px', animation: 'iconBounce 0.6s ease-out 0.2s both' },
  successMessage: { fontSize: '16px', color: '#333', margin: '20px 0', lineHeight: '1.4' },
  okBtn: { backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 30px', cursor: 'pointer', fontSize: '14px', transition: 'all 0.3s ease', transform: 'translateY(0px)', fontWeight: '500' },
  resetPasswordModal: { backgroundColor: '#fff', borderRadius: '15px', padding: '40px', maxWidth: '450px', width: '90%', textAlign: 'center', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)', border: 'none', animation: 'popupSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', transform: 'scale(1)' },
  resetPasswordIcon: { width: '80px', height: '80px', animation: 'iconBounce 0.6s ease-out 0.2s both' },
  formGroup: { marginBottom: '25px', textAlign: 'left' },
  formLabel: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' },
  formInput: { width: '100%', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', color: '#333', outline: 'none', transition: 'all 0.3s ease', boxSizing: 'border-box', backgroundColor: '#f8f9fa', transform: 'scale(1)' },
  confirmResetBtn: { backgroundColor: '#6F22A3', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 30px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all 0.3s ease', transform: 'translateY(0px)' },
};

export default UserManagement;
