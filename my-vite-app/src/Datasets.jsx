import React, { useState, useEffect, useRef } from "react";
import AdminLayout from './components/AdminLayout';
import uploadBg from './assets/uploadBg.png';  
import uploadIcon from './assets/uploadIcon.png'; 
import { storage, firestore } from "./firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject, getBytes } from "firebase/storage";
import { doc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";

function Datasets() {
  const [gif, setGif] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [keyword, setKeyword] = useState("");
  
  // Context menu states
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, item: null });
  const [renameModal, setRenameModal] = useState({ show: false, item: null, newKeyword: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, item: null });
  
  // Modal states for the UI
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newKeyword, setNewKeyword] = useState('');
  
  // Loading states
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // File input ref for resetting
  const fileInputRef = useRef(null);

  // Focus management for delete modal keyboard support
  useEffect(() => {
    if (showDeleteModal) {
      // Add a small delay to ensure the modal is rendered
      const timer = setTimeout(() => {
        const deleteModal = document.querySelector('[data-delete-modal]');
        if (deleteModal) {
          deleteModal.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showDeleteModal]);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading initial data from Firebase...');
        const snapshot = await getDocs(collection(firestore, "triggers"));
        const data = snapshot.docs.map((doc) => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        setGif(data);
        console.log('Initial data loaded:', data);
        console.log('Total documents:', data.length);
      } catch (error) {
        console.error('Failed to load initial data:', error);
        alert('Failed to load data from Firebase. Please check your connection.');
      }
    };
    loadData();
  }, []);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => closeContextMenu();
    if (contextMenu.show) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu.show]);
  
  const [isUploading, setIsUploading] = useState(false);

  // Filter GIFs based on search term
  const filteredGifs = gif.filter(item => 
    item.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Context menu functions
  const handleContextMenu = (e, item) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.pageX,
      y: e.pageY,
      item: item
    });
  };

  // Left click handler - same as context menu
  const handleLeftClick = (e, item) => {
    console.log('Left click detected on item:', item.keyword); // Debug log
    e.stopPropagation(); // Stop event bubbling but don't prevent default
    setContextMenu({
      show: true,
      x: e.pageX,
      y: e.pageY,
      item: item
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, item: null });
  };

  // Action handlers
  const handleOpen = () => {
    if (contextMenu.item) {
      setSelectedItem(contextMenu.item);
      setShowImageModal(true);
    }
    closeContextMenu();
  };

  const handleRename = () => {
    if (contextMenu.item) {
      setSelectedItem(contextMenu.item);
      setNewKeyword(contextMenu.item.keyword);
      setShowRenameModal(true);
    }
    closeContextMenu();
  };

  const handleDelete = () => {
    if (contextMenu.item) {
      setSelectedItem(contextMenu.item);
      setShowDeleteModal(true);
    }
    closeContextMenu();
  };

  // Show notification with auto-hide
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 4000);
  };

  // Refresh data from Firebase
  const refreshData = async () => {
    try {
      console.log('Refreshing data from Firebase...');
      const snapshot = await getDocs(collection(firestore, "triggers"));
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setGif(data);
      console.log('Data refreshed from Firebase:', data);
      console.log('Total documents found:', data.length);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };





  // Firebase operations
  const confirmRename = async () => {
    if (!newKeyword.trim()) return;
    
    const newKeywordValue = newKeyword.toLowerCase().trim();
    const oldKeyword = selectedItem.keyword;
    
    // Don't proceed if the keyword is the same
    if (oldKeyword === newKeywordValue) {
      setShowRenameModal(false);
      setNewKeyword('');
      setSelectedItem(null);
      return;
    }
    
    setIsRenaming(true);
    
    try {
      console.log('Starting fast Firestore-only rename operation...');
      console.log('Selected item:', selectedItem);
      console.log('Old keyword:', oldKeyword);
      console.log('New keyword:', newKeywordValue);
      
      // Validate required fields
      if (!selectedItem.gifUrl) {
        throw new Error('GIF URL is missing from selected item');
      }
      
      // Use document ID, fallback to keyword if ID is missing
      const documentId = selectedItem.id || selectedItem.keyword || oldKeyword;
      console.log('Using document ID:', documentId);
      
      // Fast rename: Only update Firestore documents, keep Storage file as-is
      // Step 1: Create new Firestore document with new keyword but same GIF URL
      console.log('Creating new Firestore document...');
      await setDoc(
        doc(firestore, "triggers", newKeywordValue),
        {
          keyword: newKeywordValue,
          gifUrl: selectedItem.gifUrl, // Keep the same Storage URL
        }
      );
      console.log('New Firestore document created');
      
      // Step 2: Delete old Firestore document
      console.log('Deleting old Firestore document with ID:', documentId);
      await deleteDoc(doc(firestore, "triggers", documentId));
      console.log('Old Firestore document deleted');
      
      // Step 3: Update local state immediately (no need to refresh from server)
      setGif(prev => prev.map(item => 
        (item.id === documentId || item.keyword === documentId)
          ? { id: newKeywordValue, keyword: newKeywordValue, gifUrl: selectedItem.gifUrl }
          : item
      ));
      
      // Close modal and reset states
      setShowRenameModal(false);
      setNewKeyword('');
      setSelectedItem(null);
      setIsRenaming(false);
      
      // Show success notification
      showNotification('success', `"${oldKeyword}" renamed to "${newKeywordValue}" successfully!`);
      
    } catch (error) {
      console.error('Rename failed:', error);
      console.error('Error details:', error.code, error.message);
      setIsRenaming(false);
      showNotification('error', `Rename failed: ${error.message}`);
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    
    try {
      console.log('Starting delete operation...');
      console.log('Selected item:', selectedItem);
      console.log('Deleting keyword:', selectedItem.keyword);
      console.log('Document ID:', selectedItem.id);
      
      let storageDeleted = false;
      
      // Try to delete from Firebase Storage using multiple strategies
      // Strategy 1: Extract filename from the GIF URL (most reliable for renamed files)
      try {
        if (selectedItem.gifUrl) {
          // Extract the Storage path from the download URL
          // URLs look like: https://firebasestorage.googleapis.com/.../triggers%2Foriginal-filename.gif?alt=media&token=...
          const url = new URL(selectedItem.gifUrl);
          const pathPart = url.pathname;
          // Find the part that contains 'triggers%2F' (URL encoded 'triggers/')
          const triggersIndex = pathPart.indexOf('triggers%2F');
          if (triggersIndex !== -1) {
            // Extract the filename after 'triggers%2F'
            const afterTriggers = pathPart.substring(triggersIndex + 'triggers%2F'.length);
            const filename = afterTriggers.split('%2F')[0]; // Get first part before any more path separators
            const decodedFilename = decodeURIComponent(filename);
            
            console.log('Extracted filename from URL:', decodedFilename);
            const storageRef = ref(storage, `triggers/${decodedFilename}`);
            console.log('Attempting to delete from Storage using URL extraction:', `triggers/${decodedFilename}`);
            await deleteObject(storageRef);
            console.log('File deleted from Firebase Storage successfully (URL extraction)');
            storageDeleted = true;
          } else {
            throw new Error('Could not extract filename from URL');
          }
        } else {
          throw new Error('No GIF URL available');
        }
      } catch (urlExtractionError) {
        console.log('URL extraction failed:', urlExtractionError.message);
        
        // Strategy 2: Try using document ID
        try {
          const storageRef = ref(storage, `triggers/${selectedItem.id}.gif`);
          console.log('Attempting to delete from Storage using document ID:', `triggers/${selectedItem.id}.gif`);
          await deleteObject(storageRef);
          console.log('File deleted from Firebase Storage successfully (document ID)');
          storageDeleted = true;
        } catch (docIdError) {
          console.log('Document ID strategy failed:', docIdError.message);
          
          // Strategy 3: Try using current keyword
          try {
            const fallbackStorageRef = ref(storage, `triggers/${selectedItem.keyword.toLowerCase()}.gif`);
            console.log('Fallback attempt with keyword:', `triggers/${selectedItem.keyword.toLowerCase()}.gif`);
            await deleteObject(fallbackStorageRef);
            console.log('File deleted from Firebase Storage successfully (keyword fallback)');
            storageDeleted = true;
          } catch (fallbackError) {
            console.log('All Storage deletion strategies failed:', fallbackError.message);
            console.log('The Storage file may have been manually deleted or have a different name');
            // Continue with Firestore deletion even if Storage file doesn't exist
          }
        }
      }
      
      // Delete from Firestore Database
      await deleteDoc(doc(firestore, "triggers", selectedItem.id));
      console.log('Document deleted from Firestore successfully');
      
      // Refresh data from Firebase to ensure sync
      await refreshData();
      
      setShowDeleteModal(false);
      const deletedKeyword = selectedItem.keyword;
      setSelectedItem(null);
      setIsDeleting(false);
      
      // Show appropriate success notification
      if (storageDeleted) {
        showNotification('success', `"${deletedKeyword}" deleted successfully!`);
      } else {
        showNotification('success', `"${deletedKeyword}" deleted from Database (Storage file was already missing)!`);
      }
      
    } catch (error) {
      console.error('Delete failed:', error);
      console.error('Error details:', error.code, error.message);
      setIsDeleting(false);
      showNotification('error', `Delete failed: ${error.message}`);
    }
  };

  // Popup action handlers
  const handleRenameFromPopup = () => {
    setShowImageModal(false);
    setNewKeyword(selectedItem.keyword);
    setShowRenameModal(true);
  };

  const handleDeleteFromPopup = () => {
    setShowImageModal(false);
    setShowDeleteModal(true);
  };

  const handleUpload = async () => {
    if (!selectedFile || !keyword) {
      showNotification('error', 'Please select a GIF and enter a keyword.');
      return;
    }

    const keywordId = keyword.toLowerCase();

    // Check if keyword already exists
    const existingItem = gif.find(item => item.keyword === keywordId);
    if (existingItem) {
      showNotification('error', `A dataset with the name "${keywordId}" already exists. Please choose a different name.`);
      return;
    }

    try {
      setIsUploading(true);

    // Upload GIF to Firebase Storage
    const storageRef = ref(storage, `triggers/${keywordId}.gif`);
    await uploadBytes(storageRef, selectedFile);

    // Get Download URL
    const downloadURL = await getDownloadURL(storageRef);

    // Save new Firestore document
    await setDoc(
      doc(firestore, "triggers", keywordId),
      {
        keyword: keywordId,
        gifUrl: downloadURL,
      }
    );

    // Add new item to UI state
    setGif((prev) => [...prev, { id: keywordId, keyword: keywordId, gifUrl: downloadURL }]);

      // Reset form and file input
      setSelectedFile(null);
      setKeyword("");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setIsUploading(false);

      showNotification('success', `"${keywordId}" uploaded successfully!`);
    } catch (error) {
      console.error("Upload failed:", error);
      setIsUploading(false);
      // Reset file input on error too
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setSelectedFile(null);
      showNotification('error', 'Upload failed. Please try again.');
    }
  };

  return (
    <AdminLayout title="DATASETS">
      {/* Upload Section */}
      <div style={styles.uploadBox}>
        <label htmlFor="file-upload" style={styles.uploadContent}>
          <img 
            src={uploadIcon} 
            alt="Upload" 
            style={styles.uploadIcon}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          />
          <p style={styles.uploadText}>Select your GIF here:</p>
          {/*<p style={styles.note}>Note: GIF must not exceed 30 seconds</p>*/}
        </label>
        
        <div style={styles.inputRow}>
        {/*File input*/}
        <input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          accept="image/gif"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />

       {/*Keyword input*/}
          <input
          type="text"
          placeholder="Enter keyword (e.g. hello)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && selectedFile && keyword) {
              handleUpload();
            }
          }}
          style={styles.keywordInput}
        />

       {/*Upload Button*/}
        <button onClick={handleUpload} 
        disabled={!selectedFile || !keyword}
        style={{...styles.uploadBtn, background:!selectedFile || !keyword ? "#aaa" : "#4CAF50",}} >
        {isUploading ? "Uploading..." : "Upload"}
        </button>
        </div>

      {/* Show selected file name */}
        {selectedFile && (
          <p style={styles.fileName}>Selected: {selectedFile.name}</p>
        )}
      </div>


      {/* Uploaded GIF Section */}
      <div style={styles.gifContainer}>
        <div style={styles.headerRow}>
          <h2 style={styles.sectionTitle}>Uploaded GIFs</h2>
          <div style={styles.searchBox}>
            <input 
              type="text" 
              placeholder="Search GIF..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput} 
            />
          </div>
        </div>

        <div style={styles.grid}>
          {gif.length === 0 ? (
            <p style={styles.emptyText}>No uploaded gif yet.</p>
          ) : filteredGifs.length === 0 ? (
            <p style={styles.emptyText}>No GIFs match your search "{searchTerm}".</p>
          ) : (
            filteredGifs.map((item, index) => (
              <div 
                key={`${item.keyword}-${index}`} 
                style={{
                  ...styles.card,
                  animationDelay: `${index * 0.1}s`
                }}
                onContextMenu={(e) => handleContextMenu(e, item)}
                onClick={(e) => handleLeftClick(e, item)}
                onMouseEnter={(e) => {
                  const card = e.currentTarget;
                  card.style.transform = 'scale(1.02)';
                  card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                  card.style.backgroundColor = '#eaeaea';
                }}
                onMouseLeave={(e) => {
                  const card = e.currentTarget;
                  card.style.transform = 'scale(1)';
                  card.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  card.style.backgroundColor = '#f5f5f5';
                }}
              >
                <img src={item.gifUrl} alt={item.keyword} style={styles.gif} />
                <p style={styles.gifName}>{item.keyword}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu.show && (
        <div 
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1001,
            minWidth: '120px',
            overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#333',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onClick={handleOpen}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            Open
          </div>
          <div 
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#333',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onClick={handleRename}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            Rename
          </div>
          <div 
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onClick={handleDelete}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#ffe6e6';
              e.target.style.color = '#dc3545';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#333';
            }}
          >
            Delete
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && (
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
          zIndex: 1002
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            minWidth: '400px',
            maxWidth: '500px',
            animation: 'scaleInModal 0.3s ease-out',
            transform: 'scale(1)'
          }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              color: '#333', 
              fontSize: '18px'
            }}>
              Rename Dataset
            </h3>
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newKeyword.trim() && !isRenaming) {
                  confirmRename();
                }
                if (e.key === 'Escape') {
                  setShowRenameModal(false);
                  setNewKeyword('');
                  setSelectedItem(null);
                }
              }}
              placeholder="Enter new keyword name..."
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                marginBottom: '20px',
                outline: 'none',
                transition: 'border-color 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#007bff'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowRenameModal(false);
                  setNewKeyword('');
                  setSelectedItem(null);
                }}
                style={{
                  padding: '10px 20px',
                  border: '2px solid #6c757d',
                  backgroundColor: 'transparent',
                  color: '#6c757d',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#6c757d';
                  e.target.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#6c757d';
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmRename}
                style={{
                  padding: '10px 20px',
                  border: '2px solid #007bff',
                  backgroundColor: isRenaming ? '#6c757d' : '#007bff',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: isRenaming ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => !isRenaming && (e.target.style.backgroundColor = '#0056b3')}
                onMouseLeave={(e) => !isRenaming && (e.target.style.backgroundColor = '#007bff')}
                disabled={!newKeyword.trim() || isRenaming}
              >
                {isRenaming ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #ffffff40',
                      borderTop: '2px solid #ffffff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Renaming...
                  </>
                ) : (
                  'Rename'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1002
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isDeleting) {
              confirmDelete();
            }
            if (e.key === 'Escape') {
              setShowDeleteModal(false);
              setSelectedItem(null);
            }
          }}
          tabIndex={0}
          autoFocus
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              minWidth: '400px',
              maxWidth: '500px',
              animation: 'scaleInModal 0.3s ease-out',
              transform: 'scale(1)',
              outline: 'none'
            }}
            data-delete-modal
            tabIndex={-1}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '15px',
              marginBottom: '20px'
            }}>
              <div style={{
                fontSize: '48px',
                color: '#dc3545'
              }}>⚠️</div>
              <div>
                <h3 style={{ margin: '0', color: '#333', fontSize: '18px' }}>
                  Delete Dataset
                </h3>
                <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
                  This action cannot be undone
                </p>
              </div>
            </div>
            <p style={{ color: '#555', marginBottom: '25px', lineHeight: '1.5', fontSize: '20px' }}>
              Are you sure you want to delete the dataset "<strong>{selectedItem?.keyword}</strong>"? 
              This will permanently remove all associated data and cannot be recovered.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedItem(null);
                }}
                style={{
                  padding: '10px 20px',
                  border: '2px solid #6c757d',
                  backgroundColor: 'transparent',
                  color: '#6c757d',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#6c757d';
                  e.target.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.color = '#6c757d';
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '10px 20px',
                  border: '2px solid #dc3545',
                  backgroundColor: isDeleting ? '#6c757d' : '#dc3545',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => !isDeleting && (e.target.style.backgroundColor = '#c82333')}
                onMouseLeave={(e) => !isDeleting && (e.target.style.backgroundColor = '#dc3545')}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #ffffff40',
                      borderTop: '2px solid #ffffff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Permanently'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Popup Modal */}
      {showImageModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1003,
            cursor: 'pointer'
          }}
          onClick={() => setShowImageModal(false)}
        >
          <div 
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              animation: 'scaleInModal 0.3s ease-out',
              transform: 'scale(1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowImageModal(false)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
                zIndex: 1,
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              ✕
            </button>
            
            {/* GIF title */}
            <h3 style={{
              margin: '0 0 15px 0',
              color: '#333',
              fontSize: '20px',
              textAlign: 'center',
              textTransform: 'capitalize'
            }}>
              {selectedItem?.keyword}
            </h3>
            
            {/* GIF image */}
            <img
              src={selectedItem?.gifUrl}
              alt={selectedItem?.keyword}
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                borderRadius: '8px',
                display: 'block'
              }}
            />
            
            {/* Action buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '15px',
              marginTop: '20px'
            }}>
              <button
                onClick={handleRenameFromPopup}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#0056b3';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#007bff';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Rename
              </button>
              
              <button
                onClick={handleDeleteFromPopup}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#c82333';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#dc3545';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1004,
          animation: 'slideInRight 0.3s ease-out'
        }}>
          <div style={{
            backgroundColor: notification.type === 'success' ? '#28a745' :
                           notification.type === 'warning' ? '#ffc107' : '#dc3545',
            color: notification.type === 'warning' ? '#212529' : 'white',
            padding: '16px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            minWidth: '300px',
            maxWidth: '400px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            <div style={{ fontSize: '20px' }}>
              {notification.type === 'success' ? '✅' :
               notification.type === 'warning' ? '⚠️' : '❌'}
            </div>
            <div style={{ flex: 1 }}>
              {notification.message}
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeInUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeOut {
          from {
            transform: scale(1);
            opacity: 1;
          }
          to {
            transform: scale(0.9);
            opacity: 0;
          }
        }
        
        @keyframes fadeInModal {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
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
        

      `}</style>
    </AdminLayout>
  );
}

const styles = {
  uploadBox: {
    backgroundImage: `url(${uploadBg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderRadius: '12px',
    padding: '45px',
    textAlign: 'center',
    marginTop: '20px',
    width: '800px',
    height: '260px',
    cursor: 'pointer',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',   
    border: '1px solid #fff',  
  },
  uploadContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  uploadIcon: {
    width: '70px',
    height: '70px',
    marginBottom: '15px',
    marginTop: '-20px',
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
    transform: 'scale(1)',
    transition: 'transform 0.3s ease',
  },
  uploadText: {
    fontSize: '20px',
    fontWeight: 'bold',
  },
  note: {
    fontSize: '14px',
    marginTop: '5px',
    opacity: 0.8,
  },
  gifContainer: {
    background: '#fff',   
    borderRadius: '10px',
    padding: '20px',
    margin: '10px auto',
    width: '1700px',
    height: '450px',          
    overflowY: 'auto',          
    overflowX: 'hidden',         
  },
  gif: {
    width: '100%', 
    height: '200px',          
    borderRadius: '10px',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center', 
    position: 'relative',
    marginBottom: '15px',
  },

  sectionTitle: {
    margin: 0,
    color: '#6F22A3',
    fontSize: '24px',
    fontWeight: 'bold',
    padding:'20px'
  },

  keywordInput: {
    display: "inline",
    padding: "10px",
    marginTop: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    height: "50px",
    width: "400px",
    fontSize: "20px",
  },

  uploadBtn: {
    display: "inline",
    marginLeft: '20px',
    color: "#fff",
    padding: "12px 20px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "16px",
    height: "50px",
    fontWeight: "500",
    transition: "background 0.3s ease",
  },

  fileName: {
    display: "inline-block",
    marginTop: "10px",
    marginLeft: "-70px",
    fontSize: "20px",
    color: "#ffffffff",
  },

  searchBox: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    border: '1px solid #ccc',
    borderRadius: '20px',
    position: 'absolute',
    right: 20,
    padding: '0 15px',
    height: '40px',
    width: '300px',
    display: 'flex',
    alignItems: 'center',    
  },

  searchInput: {
    flex: 1,                
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: '#333',
    fontSize: '14px',
    textAlign: 'left',
    transition: 'all 0.3s ease',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '15px',
    transition: 'all 0.3s ease',
  },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: '10px',
    padding: '10px',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    transform: 'scale(1)',
    opacity: 1,
    animation: 'fadeInUp 0.4s ease-out',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  gifName: {
    marginTop: '8px',
    fontSize: '14px',
    color: '#481872',
  },
  emptyText: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    color: '#888',
    fontSize: '16px',
    padding: '40px 0',
    transition: 'all 0.3s ease',
    animation: 'fadeInUp 0.4s ease-out'
  },
};

export default Datasets;
