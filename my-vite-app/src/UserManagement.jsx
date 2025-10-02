import React, { useState, useEffect } from 'react';
import AdminLayout from './components/AdminLayout';
import searchIcon from './assets/search-icon.png';
import deleteUserIcon from './assets/delete_user_icon.png';
import deleteUserConfirmation from './assets/delete_user_confirmation.png';
import resetUserPassIcon from './assets/reset-user-pass.png';
import addAdminIcon from './assets/add_admin.png';
import successIcon from './assets/success.png';
import { firestore, auth } from './firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc, addDoc, setDoc, getDoc } from 'firebase/firestore';
import { updatePassword, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
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
  const [userEmail, setUserEmail] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  
  // Add Admin states
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [addAdminLoading, setAddAdminLoading] = useState(false);
  const [addAdminError, setAddAdminError] = useState('');
  const [showAddAdminSuccess, setShowAddAdminSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Helper function to fetch users with current user detection
  const fetchUsersWithCurrentUserDetection = async () => {
    const currentUserUID = auth.currentUser?.uid;
    console.log('Current user UID:', currentUserUID);
    
    const usersRef = collection(firestore, "users");
    const snapshot = await getDocs(usersRef);
    const usersArr = snapshot.docs.map((doc, idx) => {
      const data = doc.data();
      const userId = data.formatted_uid || data.uid || doc.id;
      const userIdString = userId ? String(userId) : '';
      const isCurrentUser = doc.id === currentUserUID;
      console.log('User data:', { formatted_uid: data.formatted_uid, uid: data.uid, doc_id: doc.id, final_id: userIdString, isCurrentUser });
      return {
        id: userIdString,
        docId: doc.id,
        name: data.name || `User ${idx + 1}`,
        email: data.email || '',
        userType: data.userType,
        isOnline: data.isOnline,
        isCurrentUser: isCurrentUser
      };
    });
    
    const regularUsers = usersArr.filter(user => user.userType !== 'admin');
    const adminUsers = usersArr.filter(user => user.userType === 'admin');
    
    setUsers(regularUsers);
    setAdmins(adminUsers);
  };

  // Function to generate the next formatted UID
  const generateNextFormattedUID = async () => {
    try {
      const usersRef = collection(firestore, 'users');
      const snapshot = await getDocs(usersRef);
      
      let highestUID = 0;
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const docId = doc.id;
        
        // Check ALL users to avoid duplicate formatted_uid values
        const formattedUID = data.formatted_uid;
        
        console.log(`User Document ID: ${docId}, userType: ${data.userType}, formatted_uid: ${formattedUID}`);
        
        if (formattedUID) {
          // Convert to string first, then extract numbers
          const uidString = String(formattedUID);
          const uidNumber = parseInt(uidString.replace(/\D/g, ''), 10);
          console.log(`  Checking formatted_uid: ${formattedUID} -> parsed as: ${uidNumber}`);
          
          // Only consider UIDs in reasonable range (1-99999) to exclude Firebase-generated large numbers
          if (!isNaN(uidNumber) && uidNumber > 0 && uidNumber < 100000 && uidNumber > highestUID) {
            console.log(`    New highest valid formatted_uid found: ${uidNumber} (was ${highestUID})`);
            highestUID = uidNumber;
          } else if (uidNumber >= 100000) {
            console.log(`    Skipping large UID: ${uidNumber} (likely Firebase-generated)`);
          }
        }
      });
      
      console.log(`Highest formatted_uid found: ${highestUID}`);
      
      // If no formatted UIDs found, start from 1001, otherwise increment the highest
      const nextUID = highestUID === 0 ? 1001 : highestUID + 1;
      const minDigits = Math.max(3, String(highestUID).length);
      return String(nextUID).padStart(minDigits, '0');
    } catch (error) {
      console.error('Error generating formatted UID:', error);
      // Fallback to timestamp-based UID if there's an error
      return String(Date.now()).slice(-3);
    }
  };

  // Fetch users from Firebase
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        await fetchUsersWithCurrentUserDetection();
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
    // Prevent deleting the currently logged-in admin
    if (user.isCurrentUser && activeTab === "admins") {
      alert('You cannot delete your own admin account while you are logged in.');
      return;
    }
    
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (!userToDelete) return;

    try {
      // All users (both regular users and admins) are stored in the 'users' collection
      console.log('Deleting user with docId:', userToDelete.docId, 'userType:', userToDelete.userType);
      await deleteDoc(doc(firestore, 'users', userToDelete.docId));
      console.log('Successfully deleted user from Firestore');
      
      // Refresh the users list to maintain current user detection
      await fetchUsersWithCurrentUserDetection();
      console.log('Updated users list, removed user with docId:', userToDelete.docId);
      
      setShowDeleteModal(false);
      setUserToDelete(null);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error deleting account:', error);
      console.error('Failed to delete user with docId:', userToDelete.docId);
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
    setUserEmail(user?.email || '');
    // Ensure search doesn't interfere with modal
    console.log('Opening reset password for user:', user);
  };

  const confirmResetPassword = async () => {
    if (!userToResetPassword) return;

    // Validation
    if (!userEmail.trim()) {
      alert('Please enter an email address.');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      alert('Please enter a valid email address.');
      return;
    }

    setResetPasswordLoading(true);

    try {
      console.log('Starting password reset for user:', userToResetPassword);
      
      // Get user document from Firestore
      const userDocRef = doc(firestore, 'users', userToResetPassword.docId);
      const userDocSnapshot = await getDoc(userDocRef);
      
      if (!userDocSnapshot.exists()) {
        throw new Error('User document not found');
      }
      
      const userDoc = { id: userDocSnapshot.id, ...userDocSnapshot.data() };
      
      console.log('User document found:', userDoc);
      
      // Verify the entered email matches the user's email
      if (userDoc.email.toLowerCase() !== userEmail.toLowerCase()) {
        alert('The entered email does not match the user\'s registered email address.');
        return;
      }
      
      // Send password reset email via Firebase Auth
      await sendPasswordResetEmail(auth, userEmail);
      console.log('Password reset email sent to:', userEmail);
      
      // Update Firestore with reset information
      await updateDoc(doc(firestore, 'users', userToResetPassword.docId), {
        passwordResetRequested: true,
        passwordResetRequestedAt: new Date(),
        passwordResetBy: auth.currentUser?.uid || 'admin'
      });
      
      alert(`Password reset email sent to ${userEmail}. The user will receive an email with a link to reset their password.`);
      
      // Close modal
      setShowResetPasswordModal(false);
      setUserToResetPassword(null);
      setUserEmail('');
      
      // Refresh the users list
      await fetchUsersWithCurrentUserDetection();
      
    } catch (error) {
      console.error('Error sending password reset email:', error);
      
      if (error.code === 'auth/user-not-found') {
        alert('No Firebase Auth account found for this email. The user may need to create an account first.');
      } else {
        alert(`Error sending password reset email: ${error.message}. Please try again.`);
      }
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const cancelResetPassword = () => {
    setShowResetPasswordModal(false);
    setUserToResetPassword(null);
    setUserEmail('');
    console.log('Closing reset password modal');
  };

  // Add Admin Functions
  const handleAddAdmin = () => {
    setShowPassword(false); // Reset password visibility
    setShowAddAdminModal(true);
    setAddAdminError('');
  };

  const confirmAddAdmin = async () => {
    console.log('confirmAddAdmin called, loading state:', addAdminLoading);
    
    // Prevent multiple simultaneous executions
    if (addAdminLoading) {
      console.log('Admin creation already in progress, ignoring duplicate request');
      return;
    }

    // Validation
    if (!adminName.trim()) {
      setAddAdminError('Name is required');
      return;
    }

    if (!adminEmail.trim()) {
      setAddAdminError('Email is required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      setAddAdminError('Please enter a valid email address');
      return;
    }

    if (!adminPassword.trim()) {
      setAddAdminError('Password is required');
      return;
    }

    if (adminPassword.length < 8) {
      setAddAdminError('Password must be at least 8 characters long');
      return;
    }

    // Set loading immediately to prevent multiple executions
    setAddAdminLoading(true);
    setAddAdminError('');
    console.log('Starting admin creation process...');

    try {
      // Store current admin info
      const currentAdmin = auth.currentUser;
      const currentAdminUid = currentAdmin?.uid;
      
      console.log('Current admin UID:', currentAdminUid);
      
      // Check if email already exists in Firestore
      const usersRef = collection(firestore, 'users');
      const existingUsersSnapshot = await getDocs(usersRef);
      const existingEmails = existingUsersSnapshot.docs.map(doc => doc.data().email);
      
      if (existingEmails.includes(adminEmail.trim())) {
        setAddAdminError('This email is already registered. Please use a different email.');
        return;
      }
      
      // Generate the next formatted UID
      const nextFormattedUID = await generateNextFormattedUID();
      console.log('Generated formatted UID for new admin:', nextFormattedUID);
      
      // Generate a unique document ID for the new admin (we'll use this as their UID)
      const newAdminDocRef = doc(collection(firestore, 'users'));
      const newAdminUid = newAdminDocRef.id;
      
      console.log('Generated document ID for new admin:', newAdminUid);

      // Add admin data to Firestore users collection
      // The admin will be created as a "pending" account that gets activated when they first log in
      const adminData = {
        name: adminName.trim(),
        email: adminEmail.trim(),
        password: adminPassword.trim(), // Store temporarily - in production, this should be hashed
        userType: 'admin',
        isOnline: false,
        uid: newAdminUid,
        formatted_uid: nextFormattedUID,
        createdAt: new Date(),
        createdBy: currentAdminUid || 'system',
        accountStatus: 'pending', // Will be activated on first login
        authCreated: false // Auth account not yet created
      };
      
      console.log('Creating admin with data:', adminData);
      await setDoc(newAdminDocRef, adminData);
      
      console.log('Admin document created in Firestore with ID:', newAdminUid);

      // Reset form and close modal
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');
      setShowAddAdminModal(false);
      setShowAddAdminSuccess(true);

      // Refresh the users list to show the new admin
      await fetchUsersWithCurrentUserDetection();

      console.log('Admin account created successfully without affecting current session');

    } catch (error) {
      console.error('Error creating admin account:', error);
      let errorMessage = 'Failed to create admin account. Please try again.';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your admin privileges.';
      } else if (error.message.includes('email')) {
        errorMessage = 'Invalid email address. Please check and try again.';
      }
      
      setAddAdminError(errorMessage);
    } finally {
      setAddAdminLoading(false);
    }
  };

  const cancelAddAdmin = () => {
    setShowAddAdminModal(false);
    setAdminName('');
    setAdminEmail('');
    setAdminPassword('');
    setAddAdminError('');
    setAddAdminLoading(false);
    setShowPassword(false); // Reset password visibility
  };

  const closeAddAdminSuccess = () => {
    setShowAddAdminSuccess(false);
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

          <div style={styles.rightControls}>
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
        </div>

        {/* Table */}
        <div style={styles.tableWrapper}>
          {/* Fixed header */}
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: '15%' }}>ID</th>
                <th style={{ ...styles.th, width: '35%' }}>Email</th>
                <th style={{ ...styles.th, width: '25%' }}>Name</th>
                <th style={{ ...styles.th, width: '25%', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
          </table>

          {/* Scrollable body */}
          <div style={styles.tbodyContainer}>
            <table style={styles.table}>
              <tbody>
                {loading ? (
                  <tr style={styles.row}>
                    <td colSpan={4} style={{ ...styles.td, textAlign: 'center', padding: '40px', borderRadius: '10px' }}>
                      Loading users...
                    </td>
                  </tr>
                ) : (
                  (activeTab === "users" ? filteredUsers : filteredAdmins).length === 0 ? (
                    <tr style={styles.row}>
                      <td colSpan={4} style={{ ...styles.td, textAlign: 'center', padding: '40px', borderRadius: '10px' }}>
                        {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                      </td>
                    </tr>
                  ) : (
                    (activeTab === "users" ? filteredUsers : filteredAdmins).map((item, i) => (
                      <tr key={item.id || i} style={styles.row}>
                        <td style={{ ...styles.td, borderTopLeftRadius: "10px", borderBottomLeftRadius: "10px", width: '15%' }}>
                          {item.id || 'N/A'}
                        </td>
                        <td style={{ ...styles.td, width: '35%' }}>{item.email || 'N/A'}</td>
                        <td style={{ ...styles.td, width: '25%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {item.name || 'N/A'}
                            {item.isCurrentUser && activeTab === "admins" && (
                              <span style={styles.currentUserBadge}>
                                (You)
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ ...styles.td, borderTopRightRadius: "10px", borderBottomRightRadius: "10px", textAlign: "right", width: '25%' }}>
                          <button 
                            style={styles.resetBtn}
                            onClick={() => handleResetPassword(item)}
                          >
                            Reset Password
                          </button>
                          <button 
                            style={{
                              ...styles.deleteBtn,
                              opacity: (item.isCurrentUser && activeTab === "admins") ? 0.5 : 1,
                              cursor: (item.isCurrentUser && activeTab === "admins") ? 'not-allowed' : 'pointer'
                            }}
                            onClick={() => handleDeleteAccount(item)}
                            disabled={item.isCurrentUser && activeTab === "admins"}
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

        {activeTab === "admins" && <button style={styles.addBtn} onClick={handleAddAdmin}>+ Add an account</button>}
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
              <p style={{ ...styles.modalSubtitle, fontSize: '14px', color: '#666', marginTop: '10px' }}>
                A password reset email will be sent to the user's email address with a secure link to create a new password.
              </p>
              
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>User Email Address:</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  style={styles.addAdminPasswordInput}
                  placeholder="Enter user's email address"
                  autoComplete="email"
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
                {resetPasswordLoading ? 'Sending Email...' : 'Send Reset Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddAdminModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.addAdminModal}>
            <div style={styles.modalIcon}>
              <img src={addAdminIcon} alt="Add Admin" style={styles.addAdminIconStyle} />
            </div>
            <h3 style={styles.addAdminTitle}>ADD NEW ADMIN ACCOUNT</h3>
            
            {addAdminError && (
              <div style={styles.errorMessage}>
                {addAdminError}
              </div>
            )}
            
            <div style={styles.formGroup}>
              <label style={styles.addAdminLabel}>Name:</label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                style={styles.addAdminInput}
                placeholder="Enter admin name"
                disabled={addAdminLoading}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.addAdminLabel}>Email:</label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                style={styles.addAdminInput}
                placeholder="Enter admin email"
                disabled={addAdminLoading}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.addAdminLabel}>Password:</label>
              <div style={styles.passwordContainer}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  style={styles.addAdminPasswordInput}
                  placeholder="Enter admin password"
                  disabled={addAdminLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  disabled={addAdminLoading}
                >
                  {showPassword ? (
                    <svg style={styles.eyeIcon} viewBox="0 0 24 24" fill="none">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 2l20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg style={styles.eyeIcon} viewBox="0 0 24 24" fill="none">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <p style={styles.addAdminNote}>
              *Must contain Uppercase, Lowercase, At least 8 digit number
            </p>
            
            <div style={styles.addAdminConfirmation}>
              <p style={styles.confirmationText}>
                Are you sure you want to add this account as an administrator? This will grant them full access to system settings and user management.
              </p>
            </div>
            
            <div style={styles.addAdminBtns}>
              <button 
                onClick={cancelAddAdmin} 
                style={styles.cancelBtn}
                disabled={addAdminLoading}
              >
                Cancel
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!addAdminLoading) {
                    confirmAddAdmin();
                  }
                }}
                style={{
                  ...styles.confirmBtn,
                  opacity: addAdminLoading ? 0.6 : 1,
                  cursor: addAdminLoading ? 'not-allowed' : 'pointer'
                }}
                disabled={addAdminLoading}
                type="button"
              >
                {addAdminLoading ? 'Adding...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Admin Success Modal */}
      {showAddAdminSuccess && (
        <div style={styles.modalOverlay}>
          <div style={styles.successModal}>
            <div style={styles.modalIcon}>
              <img src={successIcon} alt="Success" style={styles.successIcon} />
            </div>
            <div style={styles.modalContent}>
              <h3 style={styles.successTitle}>Success!</h3>
              <p style={styles.successMessage}>
                New admin account has been created successfully!
              </p>
            </div>
            <div style={styles.modalButtons}>
              <button 
                onClick={closeAddAdminSuccess} 
                style={styles.successBtn}
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
  rightControls: { display: 'flex', alignItems: 'center', gap: '15px' },
  // Add Admin Modal Styles
  addAdminModal: { backgroundColor: '#fff', borderRadius: '15px', padding: '40px', maxWidth: '450px', width: '90%', textAlign: 'center', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)', border: 'none', animation: 'popupSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', transform: 'scale(1)' },
  addAdminIconStyle: { width: '70px', height: '70px', animation: 'iconBounce 0.6s ease-out 0.2s both' },
  addAdminTitle: { fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '30px', margin: '0 0 30px 0' },
  userIconContainer: { position: 'relative', display: 'inline-block', marginBottom: '20px' },
  userIcon: { width: '70px', height: '70px', backgroundColor: '#6F22A3', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  userHead: { width: '24px', height: '24px', backgroundColor: '#fff', borderRadius: '50%', marginBottom: '4px' },
  userBody: { width: '40px', height: '24px', backgroundColor: '#fff', borderRadius: '20px 20px 0 0' },
  plusIcon: { position: 'absolute', bottom: '-5px', right: '-5px', width: '28px', height: '28px', backgroundColor: '#6F22A3', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold', border: '3px solid #fff' },
  addAdminLabel: { display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '8px', textAlign: 'left' },
  addAdminInput: { width: '100%', padding: '12px 15px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', color: '#333', outline: 'none', transition: 'all 0.3s ease', boxSizing: 'border-box', backgroundColor: '#f5f5f5' },
  passwordContainer: { position: 'relative', display: 'flex', alignItems: 'center' },
  addAdminPasswordInput: { width: '100%', padding: '12px 45px 12px 15px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', color: '#333', outline: 'none', transition: 'all 0.3s ease', boxSizing: 'border-box', backgroundColor: '#f5f5f5' },
  eyeButton: { position: 'absolute', right: '12px', background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', transition: 'color 0.3s ease' },
  eyeIcon: { width: '20px', height: '20px', color: '#666' },
  addAdminNote: { fontSize: '12px', color: '#999', textAlign: 'center', margin: '15px 0 20px 0', fontStyle: 'italic' },
  addAdminConfirmation: { backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px', margin: '20px 0', textAlign: 'left' },
  confirmationText: { fontSize: '14px', color: '#333', margin: 0, lineHeight: '1.4' },
  addAdminBtns: { display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '25px' },
  cancelBtn: { backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 30px', cursor: 'pointer', fontSize: '14px', transition: 'all 0.3s ease', fontWeight: '500' },
  confirmBtn: { backgroundColor: '#38B000', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 30px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all 0.3s ease' },
  errorMessage: { backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '5px', marginBottom: '20px', fontSize: '14px' },
  successModal: { backgroundColor: '#fff', borderRadius: '15px', padding: '40px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)', border: 'none', animation: 'popupSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', transform: 'scale(1)' },
  successTitle: { fontSize: '20px', fontWeight: 'bold', color: '#28a745', marginBottom: '20px' },
  successMessage: { fontSize: '16px', color: '#666', marginBottom: '25px' },
  successBtn: { backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 30px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all 0.3s ease', transform: 'translateY(0px)' },
  // Current User Badge Style
  currentUserBadge: { fontSize: '12px', color: '#28a745', fontWeight: '600', backgroundColor: '#d4edda', padding: '2px 8px', borderRadius: '12px', border: '1px solid #c3e6cb' },
};

export default UserManagement;
