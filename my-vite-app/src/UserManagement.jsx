import React, { useState, useEffect } from 'react';
import AdminLayout from './components/AdminLayout';
import searchIcon from './assets/search-icon.png';
import deleteUserIcon from './assets/delete_user_icon.png';
import deleteUserConfirmation from './assets/delete_user_confirmation.png';
import resetUserPassIcon from './assets/reset-user-pass.png';
import addAdminIcon from './assets/add_admin.png';
import successIcon from './assets/success.png';
import { firestore, auth, functions } from './firebase';
import { collection, getDocs, doc, deleteDoc, updateDoc, addDoc, setDoc, getDoc } from 'firebase/firestore';
import { updatePassword, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
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
      transform: scale(0);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.3);
    }
    70% {
      opacity: 1;
      transform: scale(0.9);
    }
    100% {
      opacity: 1;
      transform: scale(1);
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

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
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

  .tab-content-slide {
    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease;
  }
  
  /* Button reset styles */
  button {
    -webkit-appearance: none !important;
    -moz-appearance: none !important;
    appearance: none !important;
    border: none !important;
    outline: none !important;
  }
  
  /* Success Modal Button */
  .success-modal-btn {
    background-color: #38B000 !important;
    color: #fff !important;
    border: none !important;
    border-radius: 8px !important;
    padding: 12px 30px !important;
    cursor: pointer !important;
    font-size: 16px !important;
    font-weight: 600 !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 2px 8px rgba(56, 176, 0, 0.3) !important;
    min-width: 120px !important;
    outline: none !important;
    text-decoration: none !important;
    -webkit-appearance: none !important;
    -moz-appearance: none !important;
    appearance: none !important;
    border-width: 0 !important;
    border-style: none !important;
    box-sizing: border-box !important;
  }
  
  .success-modal-btn:hover {
    background-color: #2E8B00 !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 12px rgba(56, 176, 0, 0.4) !important;
  }
  
  .success-modal-btn:focus {
    outline: none !important;
    border: none !important;
  }
  
  /* High specificity override for success button */
  #success-btn-override,
  #success-btn-override:active,
  #success-btn-override:focus,
  button#success-btn-override {
    background-color: #38B000 !important;
    color: #fff !important;
    border: none !important;
    border-radius: 8px !important;
    padding: 12px 30px !important;
    cursor: pointer !important;
    font-size: 16px !important;
    font-weight: 600 !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 2px 8px rgba(56, 176, 0, 0.3) !important;
    min-width: 120px !important;
    outline: none !important;
    text-decoration: none !important;
    -webkit-appearance: none !important;
    -moz-appearance: none !important;
    appearance: none !important;
    border-width: 0 !important;
    border-style: none !important;
    box-sizing: border-box !important;
  }
  
  #success-btn-override:hover,
  button#success-btn-override:hover {
    background-color: #2E8B00 !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 12px rgba(56, 176, 0, 0.4) !important;
  }
`;

// Inject animations and force button styling into document
if (typeof document !== 'undefined') {
  // Remove any existing modal styles
  const existingStyles = document.head.querySelectorAll('style[data-modal-animations]');
  existingStyles.forEach(style => style.remove());
  
  // Create new aggressive styles
  const styleElement = document.createElement('style');
  styleElement.textContent = modalAnimations + `
  
  /* EXTREMELY AGGRESSIVE BUTTON STYLING */
  .force-green-btn-12345 {
    background: #38B000 !important;
    background-color: #38B000 !important;
    color: #FFFFFF !important;
    border: 0 !important;
    border-width: 0 !important;
    border-style: none !important;
    border-color: transparent !important;
    border-radius: 8px !important;
    padding: 12px 30px !important;
    margin: 10px !important;
    cursor: pointer !important;
    font-size: 16px !important;
    font-weight: bold !important;
    font-family: Arial !important;
    text-align: center !important;
    text-decoration: none !important;
    display: inline-block !important;
    min-width: 120px !important;
    height: 45px !important;
    line-height: 21px !important;
    box-shadow: 0 3px 10px rgba(56, 176, 0, 0.5) !important;
    position: relative !important;
    z-index: 999999 !important;
    outline: none !important;
    user-select: none !important;
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    -ms-user-select: none !important;
    -webkit-appearance: none !important;
    -moz-appearance: none !important;
    appearance: none !important;
    box-sizing: border-box !important;
  }
  
  .force-green-btn-12345:hover {
    background: #2E8B00 !important;
    background-color: #2E8B00 !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 5px 15px rgba(46, 139, 0, 0.6) !important;
  }
  
  .force-green-btn-12345:active {
    background: #2E8B00 !important;
    background-color: #2E8B00 !important;
  }
  
  .force-green-btn-12345:focus {
    background: #38B000 !important;
    background-color: #38B000 !important;
    outline: none !important;
    border: none !important;
  }
  
  /* Override any possible framework styles */
  div.force-green-btn-12345,
  button.force-green-btn-12345,
  .force-green-btn-12345[role="button"],
  *[class*="force-green-btn-12345"] {
    background: #38B000 !important;
    background-color: #38B000 !important;
    color: #FFFFFF !important;
  }
  `;
  
  styleElement.setAttribute('data-modal-animations', 'true');
  document.head.appendChild(styleElement);
}

function UserManagement() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [isSliding, setIsSliding] = useState(false);
  const [slideDirection, setSlideDirection] = useState("right");
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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Add Admin states
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [addAdminLoading, setAddAdminLoading] = useState(false);
  const [addAdminError, setAddAdminError] = useState('');
  const [showAddAdminSuccess, setShowAddAdminSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // New modal states for success/error messages
  const [showGeneralSuccessModal, setShowGeneralSuccessModal] = useState(false);
  const [showGeneralErrorModal, setShowGeneralErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Button hover states
  const [successBtnHover, setSuccessBtnHover] = useState(false);
  const [errorBtnHover, setErrorBtnHover] = useState(false);

  // Force inject button styles - this WILL work!
  useEffect(() => {
    const createButtonStyles = () => {
      // Remove any previous attempts
      document.querySelectorAll('#final-button-fix').forEach(el => el.remove());

      const style = document.createElement('style');
      style.id = 'final-button-fix';
      style.innerHTML = `
        .final-green-button {
          background: #38B000 !important;
          background-color: #38B000 !important;
          color: #FFFFFF !important;
          border: none !important;
          border-radius: 8px !important;
          padding: 12px 30px !important;
          cursor: pointer !important;
          font-size: 16px !important;
          font-weight: bold !important;
          font-family: Arial, sans-serif !important;
          text-align: center !important;
          display: inline-block !important;
          min-width: 120px !important;
          height: 45px !important;
          line-height: 21px !important;
          box-shadow: 0 3px 10px rgba(56, 176, 0, 0.6) !important;
          outline: none !important;
          margin: 10px !important;
        }
        
        .final-green-button:hover {
          background: #2E8B00 !important;
          background-color: #2E8B00 !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 5px 15px rgba(46, 139, 0, 0.8) !important;
        }
        
        .final-green-button:active,
        .final-green-button:focus {
          background: #38B000 !important;
          background-color: #38B000 !important;
          outline: none !important;
        }
      `;
      
      document.head.appendChild(style);
    };

    createButtonStyles();
    
    // Also ensure it's applied when modals show
    if (showGeneralSuccessModal || showGeneralErrorModal) {
      setTimeout(createButtonStyles, 50);
    }
  }, [showGeneralSuccessModal, showGeneralErrorModal]);

  // Smooth tab change handler
  const handleTabChange = (newTab) => {
    if (newTab === activeTab || isSliding) return;
    
    // Determine slide direction based on tab change
    const slideRight = (activeTab === "users" && newTab === "admins");
    setSlideDirection(slideRight ? "right" : "left");
    
    setIsSliding(true);
    setTimeout(() => {
      setActiveTab(newTab);
      setIsSliding(false);
    }, 250);
  };

  // Helper functions for modals
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowGeneralSuccessModal(true);
  };

  const showError = (message) => {
    setErrorMessage(message);
    setShowGeneralErrorModal(true);
  };

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
      showError('You cannot delete your own admin account while you are logged in.');
      return;
    }
    
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    if (!userToDelete) return;

    // Prevent self-deletion
    if (userToDelete.isCurrentUser && activeTab === "admins") {
      showError('You cannot delete your own admin account while logged in.');
      return;
    }

    setDeleteLoading(true);

    try {
      const currentAdmin = auth.currentUser;
      
      if (!currentAdmin) {
        throw new Error('Not authenticated as admin');
      }

      console.log('Starting account deletion for user:', userToDelete.email);
      
      // Call Cloud Function to delete user account with Admin SDK privileges
      const deleteUserAccount = httpsCallable(functions, 'deleteUserAccount');
      
      const result = await deleteUserAccount({
        email: userToDelete.email,
        adminUid: currentAdmin.uid
      });

      console.log('Cloud Function result:', result.data);

      if (result.data.success) {
        // Close modal and show success
        setShowDeleteModal(false);
        setUserToDelete(null);
        
        // Refresh users list
        await fetchUsersWithCurrentUserDetection();
        
        // Show success message
        showSuccess(`Account successfully deleted for ${userToDelete.email}!`);
        setShowSuccessModal(true);
      } else {
        throw new Error(result.data.message || 'Unknown error');
      }
      
    } catch (error) {
      console.error('Account deletion error:', error);
      
      let errorMessage = 'Failed to delete account. Please try again.';
      
      if (error.message.includes('User not found')) {
        errorMessage = 'User not found. The account may have already been deleted.';
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Invalid email address.';
      } else if (error.message.includes('Unauthorized')) {
        errorMessage = 'Permission denied. Please check your admin privileges.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showError(`Account deletion failed: ${errorMessage}`);
      
      // Reset state on error
      setShowDeleteModal(false);
      setUserToDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
    setDeleteLoading(false);
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const handleResetPassword = (user) => {
    setUserToResetPassword(user);
    setShowResetPasswordModal(true);
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    // Ensure search doesn't interfere with modal
    console.log('Opening reset password for user:', user);
  };

  const confirmResetPassword = async () => {
    if (!userToResetPassword) return;

    // Validation
    if (!newPassword || !confirmPassword) {
      showError('Please fill in both password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('Passwords do not match. Please try again.');
      return;
    }

    if (newPassword.length < 8) {
      showError('Password must be at least 8 characters long.');
      return;
    }

    setResetPasswordLoading(true);

    try {
      const currentAdmin = auth.currentUser;
      
      if (!currentAdmin) {
        throw new Error('Not authenticated as admin');
      }

      console.log('Starting password reset for user:', userToResetPassword.email);
      
      // Call Cloud Function to reset password with Admin SDK privileges
      const resetUserPassword = httpsCallable(functions, 'resetUserPassword');
      
      const result = await resetUserPassword({
        email: userToResetPassword.email,
        newPassword: newPassword.trim(),
        adminUid: currentAdmin.uid
      });

      console.log('Cloud Function result:', result.data);

      if (result.data.success) {
        // Close modal and refresh
        setShowResetPasswordModal(false);
        setUserToResetPassword(null);
        setNewPassword('');
        setConfirmPassword('');
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        
        // Refresh users list
        await fetchUsersWithCurrentUserDetection();
        
        // Show success modal
        showSuccess(`Password successfully reset for ${userToResetPassword.email}!\n\nUser can now log in with the new password immediately!`);
      } else {
        throw new Error(result.data.message || 'Unknown error');
      }

    } catch (error) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Failed to reset password. Please try again.';
      
      if (error.message.includes('User not found')) {
        errorMessage = 'User not found. Please check the email address.';
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Invalid email address.';
      } else if (error.message.includes('Unauthorized')) {
        errorMessage = 'Permission denied. Please check your admin privileges.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showError(`Password reset failed: ${errorMessage}`);
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const cancelResetPassword = () => {
    setShowResetPasswordModal(false);
    setUserToResetPassword(null);
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    console.log('Closing reset password modal');
  };

  // Add Admin Functions
  const handleAddAdmin = () => {
    // Clear form fields when opening modal
    setAdminName('');
    setAdminEmail('');
    setAdminPassword('');
    setShowPassword(false); // Reset password visibility
    setAddAdminError('');
    setShowAddAdminModal(true);
    
    // Force clear fields after modal opens to prevent autofill
    setTimeout(() => {
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');
    }, 100);
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
    console.log('Starting admin creation process with Cloud Functions...');

    try {
      const currentAdmin = auth.currentUser;
      
      if (!currentAdmin) {
        throw new Error('Not authenticated');
      }

      console.log('Current admin UID:', currentAdmin.uid);
      
      // Call Cloud Function to create admin account with Admin SDK privileges
      const createAdminAccount = httpsCallable(functions, 'createAdminAccount');
      
      const result = await createAdminAccount({
        name: adminName.trim(),
        email: adminEmail.trim(),
        password: adminPassword.trim(),
        adminUid: currentAdmin.uid
      });

      console.log('Cloud Function result:', result.data);

      if (result.data.success) {
        // Reset form and close modal
        setAdminName('');
        setAdminEmail('');
        setAdminPassword('');
        setShowAddAdminModal(false);

        // Show appropriate success message based on whether email verification is required
        if (result.data.requiresEmailVerification) {
          // Always log verification link for debugging/manual sharing
          console.log('Verification link for', adminEmail.trim(), ':', result.data.verificationLink);
          
          if (result.data.emailSent) {
            showSuccess(`Admin account created successfully for ${adminEmail.trim()}!\n\nA verification email has been sent to their email address. The new admin must click the verification link before they can log in.`);
          } else {
            showSuccess(`Admin account created successfully for ${adminEmail.trim()}!\n\nEmail sending failed. Please manually share this verification link with the new admin:\n\n${result.data.verificationLink}\n\nThey must click this link before they can log in.`);
          }
        } else {
          setShowAddAdminSuccess(true);
        }

        // Refresh the users list to show the new admin
        await fetchUsersWithCurrentUserDetection();

        console.log('Admin account created successfully using Cloud Functions');
      } else {
        throw new Error(result.data.message || 'Unknown error');
      }

    } catch (error) {
      console.error('Error creating admin account:', error);
      let errorMessage = 'Failed to create admin account. Please try again.';
      
      if (error.message.includes('Email already exists')) {
        errorMessage = 'This email is already registered. Please use a different email.';
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Invalid email address. Please check and try again.';
      } else if (error.message.includes('weak-password')) {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (error.message.includes('Unauthorized')) {
        errorMessage = 'Permission denied. Please check your admin privileges.';
      } else if (error.message) {
        errorMessage = error.message;
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
          <div style={styles.tabsContainer}>
            {/* Sliding background selector */}
            <div 
              style={{
                ...styles.tabSelector,
                transform: `translateX(${activeTab === "users" ? "0%" : "100%"})`
              }}
            />
            <button
              onClick={() => handleTabChange("users")}
              style={{
                ...styles.tabBtn,
                color: activeTab === "users" ? "#6F22A3" : "#fff"
              }}
            >
              Users
            </button>
            <button
              onClick={() => handleTabChange("admins")}
              style={{
                ...styles.tabBtn,
                color: activeTab === "admins" ? "#6F22A3" : "#fff"
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
        <div 
          key={activeTab}
          className="tab-content-slide"
          style={{
            ...styles.tableWrapper,
            transform: isSliding ? `translateX(${slideDirection === "left" ? "-80px" : "80px"})` : 'translateX(0px)',
            opacity: isSliding ? 0.7 : 1
          }}
        >
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
                            {activeTab === "users" && (
                              <div 
                                style={{
                                  ...styles.onlineIndicator,
                                  ...(item.isOnline ? styles.onlineStatus : styles.offlineStatus)
                                }}
                                title={item.isOnline ? 'Online' : 'Offline'}
                              />
                            )}
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
                            onMouseEnter={(e) => {
                              e.target.style.transform = 'translateY(-2px)';
                              e.target.style.boxShadow = '0 4px 12px rgba(111, 34, 163, 0.4)';
                              e.target.style.backgroundColor = '#5d1c87';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.transform = 'translateY(0px)';
                              e.target.style.boxShadow = '0 2px 4px rgba(111, 34, 163, 0.3)';
                              e.target.style.backgroundColor = '#6F22A3';
                            }}
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
                            onMouseEnter={(e) => {
                              if (!(item.isCurrentUser && activeTab === "admins")) {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 12px rgba(230, 57, 70, 0.4)';
                                e.target.style.backgroundColor = '#c82333';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!(item.isCurrentUser && activeTab === "admins")) {
                                e.target.style.transform = 'translateY(0px)';
                                e.target.style.boxShadow = '0 2px 4px rgba(230, 57, 70, 0.3)';
                                e.target.style.backgroundColor = '#E63946';
                              }
                            }}
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

        {activeTab === "admins" && (
        <button 
          style={styles.addBtn} 
          onClick={handleAddAdmin}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 12px rgba(56, 176, 0, 0.4)';
            e.target.style.backgroundColor = '#2E8B00';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0px)';
            e.target.style.boxShadow = '0 2px 4px rgba(56, 176, 0, 0.3)';
            e.target.style.backgroundColor = '#38B000';
          }}
        >
          + Add an account
        </button>
      )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          ...styles.modalOverlay,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            ...styles.modal,
            animation: 'popupSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <div style={styles.modalIcon}>
              <img src={deleteUserIcon} alt="Delete User" style={styles.deleteIcon} />
            </div>
            <div style={styles.modalContent}>
              <h3 style={styles.modalTitle}>Are you sure you want to delete this account?</h3>
              <p style={styles.modalSubtitle}>This action is permanent and cannot be undone.</p>
            </div>
            <div style={styles.modalButtons}>
              <button 
                style={{
                  ...styles.cancelBtn,
                  opacity: deleteLoading ? 0.6 : 1,
                  cursor: deleteLoading ? 'not-allowed' : 'pointer'
                }}
                onClick={cancelDelete}
                disabled={deleteLoading}
                onMouseEnter={(e) => {
                  if (!deleteLoading) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                    e.target.style.backgroundColor = '#5a6268';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!deleteLoading) {
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
                  ...styles.confirmDeleteBtn,
                  opacity: deleteLoading ? 0.8 : 1,
                  cursor: deleteLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onClick={confirmDeleteAccount}
                disabled={deleteLoading}
                onMouseEnter={(e) => {
                  if (!deleteLoading) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(230, 57, 70, 0.4)';
                    e.target.style.backgroundColor = '#c82333';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!deleteLoading) {
                    e.target.style.transform = 'translateY(0px)';
                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    e.target.style.backgroundColor = '#E63946';
                  }
                }}
              >
                {deleteLoading && (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #fff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                )}
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Reset Password Modal */}
      {showResetPasswordModal && (
        <div style={{
          ...styles.modalOverlay,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            ...styles.resetPasswordModal,
            animation: 'popupSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <div style={styles.modalIcon}>
              <img src={resetUserPassIcon} alt="Reset Password" style={styles.resetPasswordIcon} />
            </div>
            <div style={styles.modalContent}>
              <h3 style={styles.modalTitle}>Reset User Password</h3>
              <p style={styles.modalSubtitle}>
                Reset password for: {userToResetPassword?.name || userToResetPassword?.email}
                <br />
                Enter a new password for this user account.
              </p>
              
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>New Password:</label>
                <div style={styles.passwordContainer}>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={styles.addAdminPasswordInput}
                    placeholder="Enter new password"
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
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={styles.eyeButton}
                  >
                    {showNewPassword ? (
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

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Confirm Password:</label>
                <div style={styles.passwordContainer}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={styles.addAdminPasswordInput}
                    placeholder="Confirm new password"
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
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeButton}
                  >
                    {showConfirmPassword ? (
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

      {/* Add Admin Modal */}
      {showAddAdminModal && (
        <div style={{
          ...styles.modalOverlay,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            ...styles.addAdminModal,
            animation: 'popupSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <div style={styles.modalIcon}>
              <img src={addAdminIcon} alt="Add Admin" style={styles.addAdminIconStyle} />
            </div>
            <h3 style={styles.addAdminTitle}>ADD NEW ADMIN ACCOUNT</h3>
            
            <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
              <input type="text" name="fakeusernameremembered" style={{display: 'none'}} />
              <input type="password" name="fakepasswordremembered" style={{display: 'none'}} />
            
            {addAdminError && (
              <div style={styles.addAdminErrorMessage}>
                {addAdminError}
              </div>
            )}
            
            <div style={styles.formGroup}>
              <label style={styles.addAdminLabel}>Name:</label>
              <input
                key={`admin-name-${showAddAdminModal ? 'open' : 'closed'}`}
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                style={styles.addAdminInput}
                placeholder="Enter admin name"
                disabled={addAdminLoading}
                autoComplete="off"
                autoFill="off"
                data-lpignore="true"
                data-form-type="other"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.addAdminLabel}>Email:</label>
              <input
                key={`admin-email-${showAddAdminModal ? 'open' : 'closed'}`}
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                style={styles.addAdminInput}
                placeholder="Enter admin email"
                disabled={addAdminLoading}
                autoComplete="new-email"
                autoFill="off"
                data-lpignore="true"
                data-form-type="other"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.addAdminLabel}>Password:</label>
              <div style={styles.passwordContainer}>
                <input
                  key={`admin-password-${showAddAdminModal ? 'open' : 'closed'}`}
                  type={showPassword ? "text" : "password"}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  style={styles.addAdminPasswordInput}
                  placeholder="Enter admin password"
                  disabled={addAdminLoading}
                  autoComplete="new-password"
                  autoFill="off"
                  data-lpignore="true"
                  data-form-type="other"
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
            
            </form>
            
            <div style={styles.addAdminConfirmation}>
              <p style={styles.confirmationText}>
                Are you sure you want to add this account as an administrator? This will grant them full access to system settings and user management.
              </p>
            </div>
            
            <div style={styles.addAdminBtns}>
              <button 
                onClick={cancelAddAdmin} 
                style={styles.addAdminCancelBtn}
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
                  ...styles.addAdminConfirmBtn,
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

      {/* Add Admin Success Modal - FIXED */}
      {showAddAdminSuccess && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            maxWidth: '400px',
            minWidth: '300px',
            animation: 'popupSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#38B000',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              color: 'white',
              fontSize: '30px',
              fontWeight: 'bold',
              animation: 'iconBounce 0.6s ease-out 0.3s both'
            }}>
              ✓
            </div>
            <h3 style={{
              color: '#333',
              fontSize: '20px',
              marginBottom: '15px',
              fontFamily: 'Arial, sans-serif'
            }}>
              Success!
            </h3>
            <p style={{
              color: '#666',
              fontSize: '16px',
              marginBottom: '25px',
              fontFamily: 'Arial, sans-serif',
              lineHeight: '1.4'
            }}>
              New admin account has been created successfully!
            </p>
            <button
              onClick={closeAddAdminSuccess}
              style={{
                backgroundColor: '#38B000',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 30px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                transform: 'translateY(0px)',
                boxShadow: '0 2px 8px rgba(56, 176, 0, 0.3)',
                minWidth: '120px',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#2E8B00';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(56, 176, 0, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#38B000';
                e.target.style.transform = 'translateY(0px)';
                e.target.style.boxShadow = '0 2px 8px rgba(56, 176, 0, 0.3)';
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* NEW Fresh Success Modal */}
      {showGeneralSuccessModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            maxWidth: '400px',
            minWidth: '300px',
            animation: 'popupSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#38B000',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              color: 'white',
              fontSize: '30px',
              fontWeight: 'bold',
              animation: 'iconBounce 0.6s ease-out 0.3s both'
            }}>
              ✓
            </div>
            <h3 style={{
              color: '#333',
              fontSize: '20px',
              marginBottom: '15px',
              fontFamily: 'Arial, sans-serif'
            }}>
              Success!
            </h3>
            <p style={{
              color: '#666',
              fontSize: '16px',
              marginBottom: '25px',
              fontFamily: 'Arial, sans-serif',
              lineHeight: '1.4'
            }}>
              {successMessage}
            </p>
            <button
              onClick={() => setShowGeneralSuccessModal(false)}
              style={{
                backgroundColor: '#38B000',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 30px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                transform: 'translateY(0px)',
                boxShadow: '0 2px 8px rgba(56, 176, 0, 0.3)',
                minWidth: '120px',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#2E8B00';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(56, 176, 0, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#38B000';
                e.target.style.transform = 'translateY(0px)';
                e.target.style.boxShadow = '0 2px 8px rgba(56, 176, 0, 0.3)';
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* General Error Modal */}
      {showGeneralErrorModal && (
        <div style={{
          ...styles.modalOverlay,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            ...styles.errorModal,
            animation: 'popupSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <div style={styles.errorIconContainer}>
              <div style={styles.customErrorIcon}>!</div>
            </div>
            <h3 style={styles.errorTitle}>Error</h3>
            <p style={styles.errorMessageText}>{errorMessage}</p>
            <button 
              onClick={() => setShowGeneralErrorModal(false)}
              onMouseEnter={() => setErrorBtnHover(true)}
              onMouseLeave={() => setErrorBtnHover(false)}
              style={{
                ...styles.errorBtn,
                backgroundColor: errorBtnHover ? '#C82333' : '#E63946',
                transform: errorBtnHover ? 'translateY(-2px)' : 'translateY(0px)',
                boxShadow: errorBtnHover ? '0 4px 12px rgba(230, 57, 70, 0.4)' : '0 2px 8px rgba(230, 57, 70, 0.3)',
                border: 'none',
                outline: 'none'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

    </AdminLayout>
  );
}

const styles = {
  container: { borderRadius: '20px', padding: '20px', margin: '20px', color: '#fff' },
  headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' },
  tabsContainer: { 
    display: 'flex', 
    position: 'relative',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '4px',
    gap: '0px'
  },
  tabSelector: {
    position: 'absolute',
    top: '4px',
    left: '4px',
    width: 'calc(50% - 4px)',
    height: 'calc(100% - 8px)',
    backgroundColor: '#fff',
    borderRadius: '8px',
    transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 1
  },
  tabBtn: { 
    padding: '10px 20px', 
    border: 'none', 
    backgroundColor: 'transparent',
    cursor: 'pointer', 
    fontWeight: 'bold', 
    fontSize: '16px',
    borderRadius: '8px',
    position: 'relative',
    zIndex: 2,
    flex: 1,
    transition: 'color 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
  },
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
  resetBtn: { backgroundColor: '#6F22A3', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', marginRight: '12px', cursor: 'pointer', fontSize: '14px', transition: 'all 0.3s ease', transform: 'translateY(0px)', boxShadow: '0 2px 4px rgba(111, 34, 163, 0.3)' },
  deleteBtn: { backgroundColor: '#E63946', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 18px', cursor: 'pointer', fontSize: '14px', transition: 'all 0.3s ease', transform: 'translateY(0px)', boxShadow: '0 2px 4px rgba(230, 57, 70, 0.3)' },
  addBtn: { marginTop: '15px', backgroundColor: '#38B000', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px 20px', cursor: 'pointer', fontSize: '16px', transition: 'all 0.3s ease', transform: 'translateY(0px)', boxShadow: '0 2px 4px rgba(56, 176, 0, 0.3)' },
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
  successMessage: { fontSize: '20px', color: '#333', margin: '20px 0', lineHeight: '1.4' },
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
  addAdminCancelBtn: { backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 30px', cursor: 'pointer', fontSize: '14px', transition: 'all 0.3s ease', fontWeight: '500' },
  addAdminConfirmBtn: { backgroundColor: '#38B000', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 30px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all 0.3s ease' },
  addAdminErrorMessage: { backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '5px', marginBottom: '20px', fontSize: '14px' },
  // Success Modal Styles
  generalSuccessModal: { backgroundColor: '#fff', borderRadius: '15px', padding: '40px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)', border: 'none', animation: 'popupSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', transform: 'scale(1)' },
  successIconContainer: { marginBottom: '25px' },
  customSuccessIcon: { width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#38B000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: 'bold', margin: '0 auto', animation: 'iconBounce 0.6s ease-out 0.2s both', boxShadow: '0 4px 15px rgba(56, 176, 0, 0.3)' },
  generalSuccessTitle: { fontSize: '22px', fontWeight: '700', color: '#38B000', marginBottom: '20px', letterSpacing: '0.5px' },
  generalSuccessMessage: { fontSize: '16px', color: '#666', marginBottom: '25px', whiteSpace: 'pre-line' },
  generalSuccessBtn: { backgroundColor: '#38B000', color: '#fff', border: 'none', outline: 'none', borderRadius: '8px', padding: '12px 30px', cursor: 'pointer', fontSize: '16px', fontWeight: '600', transition: 'all 0.3s ease', transform: 'translateY(0px)', boxShadow: '0 2px 8px rgba(56, 176, 0, 0.3)', minWidth: '120px', fontFamily: 'inherit', textDecoration: 'none', appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' },
  // Error Modal Styles
  errorModal: { backgroundColor: '#fff', borderRadius: '15px', padding: '40px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)', border: 'none', animation: 'popupSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', transform: 'scale(1)' },
  errorIconContainer: { marginBottom: '25px' },
  customErrorIcon: { width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#E63946', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: 'bold', margin: '0 auto', animation: 'iconBounce 0.6s ease-out 0.2s both', boxShadow: '0 4px 15px rgba(230, 57, 70, 0.3)' },
  errorTitle: { fontSize: '22px', fontWeight: '700', color: '#E63946', marginBottom: '20px', letterSpacing: '0.5px' },
  errorMessageText: { fontSize: '16px', color: '#666', marginBottom: '25px', whiteSpace: 'pre-line' },
  errorBtn: { backgroundColor: '#E63946', color: '#fff', border: 'none', outline: 'none', borderRadius: '8px', padding: '12px 30px', cursor: 'pointer', fontSize: '16px', fontWeight: '600', transition: 'all 0.3s ease', transform: 'translateY(0px)', boxShadow: '0 2px 8px rgba(230, 57, 70, 0.3)', minWidth: '120px', fontFamily: 'inherit', textDecoration: 'none', appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none' },
  // Current User Badge Style
  currentUserBadge: { fontSize: '12px', color: '#28a745', fontWeight: '600', backgroundColor: '#d4edda', padding: '2px 8px', borderRadius: '12px', border: '1px solid #c3e6cb' },
  // Online Status Indicator Styles
  onlineIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
    boxShadow: '0 0 4px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.3s ease'
  },
  onlineStatus: {
    backgroundColor: '#38B000',
    boxShadow: '0 0 6px rgba(56, 176, 0, 0.6)'
  },
  offlineStatus: {
    backgroundColor: '#6c757d',
    boxShadow: '0 0 4px rgba(108, 117, 125, 0.4)'
  },
};

export default UserManagement;
