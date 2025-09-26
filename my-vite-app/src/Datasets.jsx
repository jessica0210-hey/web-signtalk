import React, { useState, useEffect } from "react";
import AdminLayout from './components/AdminLayout';
import uploadBg from './assets/uploadBg.png';  
import uploadIcon from './assets/uploadIcon.png'; 
import { storage, firestore } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";

function Datasets() {
  const [gif, setGif] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    const loadData = async () => {
      const snapshot = await getDocs(collection(firestore, "triggers"));
      const data = snapshot.docs.map((doc) => doc.data());
      setGif(data);
    };
    loadData();
  }, []);
  
    const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!selectedFile || !keyword) {
      alert("Please select a GIF and enter a keyword.");
      return;
    }

    const keywordId = keyword.toLowerCase();

    try {
      setIsUploading(true);

    // Upload GIF to Firebase Storage
    const storageRef = ref(storage, `triggers/${keywordId}.gif`);
    await uploadBytes(storageRef, selectedFile);

    // Get Download URL
    const downloadURL = await getDownloadURL(storageRef);

    // Save/Update Firestore doc - overwrites if exists
    await setDoc(
      doc(firestore, "triggers", keywordId),
      {
        keyword: keywordId,
        gifUrl: downloadURL,
      },
      { merge: true }
    );

    // Update UI state — replace if keyword exists, otherwise add
    setGif((prev) => {
      const exists = prev.find((g) => g.keyword === keywordId);
      if (exists) {
        return prev.map((g) =>
          g.keyword === keywordId ? { keyword: keywordId, gifUrl: downloadURL } : g
        );
      } else {
        return [...prev, { keyword: keywordId, gifUrl: downloadURL }];
      }
    });

      setSelectedFile(null);
      setKeyword("");

      alert("GIF uploaded successfully!");
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed, check console for details.");
    } finally {
    setIsUploading(false);
  }
  };

  return (
    <AdminLayout title="DATASET">
      {/* Upload Section */}
      <div style={styles.uploadBox}>
        <label htmlFor="file-upload" style={styles.uploadContent}>
          <img src={uploadIcon} alt="Upload" style={styles.uploadIcon} />
          <p style={styles.uploadText}>Select your GIF here:</p>
          {/*<p style={styles.note}>Note: GIF must not exceed 30 seconds</p>*/}
        </label>
        
        <div style={styles.inputRow}>
        {/*File input*/}
        <input
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
            <input type="text" placeholder="Search GIF..." style={styles.searchInput} />
          </div>
        </div>

        <div style={styles.grid}>
          {gif.length === 0 ? (
            <p style={styles.emptyText}>No uploaded gif yet.</p>
          ) : (
            gif.map((item, index) => (
              <div key={index} style={styles.card}>
                <img src={item.gifUrl} alt={item.keyword} style={styles.gif} />
                <p style={styles.gifName}>{item.keyword}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

const styles = {
  uploadBox: {
    backgroundImage: `url(${uploadBg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center',
    marginTop: '20px',
    width: '700px',
    height: '220px',
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
    width: '50px',
    marginBottom: '10px',
    marginTop: '-20px',
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
    padding: "8px 15px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
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
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '15px',
  },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: '10px',
    padding: '10px',
    textAlign: 'center',
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
  },
};

export default Datasets;
