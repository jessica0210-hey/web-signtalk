import React, { useState } from 'react';
import AdminLayout from './components/AdminLayout';
import uploadBg from './assets/uploadBg.png';  
import uploadIcon from './assets/uploadIcon.png'; 

function Datasets() {
  const [videos, setVideos] = useState([]); 

  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      
      const newVideos = files.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      }));
      setVideos((prev) => [...prev, ...newVideos]);
    }
  };

  return (
    <AdminLayout title="DATA SET">
      {/* Upload Section */}
      <div style={styles.uploadBox}>
        <label htmlFor="file-upload" style={styles.uploadContent}>
          <img src={uploadIcon} alt="Upload" style={styles.uploadIcon} />
          <p style={styles.uploadText}>Upload your Video here:</p>
          <p style={styles.note}>Note: Video must not exceed 30 seconds</p>
        </label>
        <input
          id="file-upload"
          type="file"
          accept="video/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleUpload}
        />
      </div>

      {/* Uploaded Videos Section */}
      <div style={styles.videosContainer}>
        <div style={styles.headerRow}>
          <h2 style={styles.sectionTitle}>Uploaded videos</h2>
          <div style={styles.searchBox}>
            <input type="text" placeholder="Search video..." style={styles.searchInput} />
          </div>
        </div>

        <div style={styles.grid}>
          {videos.length === 0 ? (
            <p style={styles.emptyText}>No uploaded videos yet.</p>
          ) : (
            videos.map((video, index) => (
              <div key={index} style={styles.card}>
                <video src={video.url} style={styles.video} controls />
                <p style={styles.videoName}>{video.name}</p>
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
  videosContainer: {
    background: '#fff',   
    borderRadius: '10px',
    padding: '20px',
    margin: '10px auto',
    width: '1700px',
    height: '450px',          
    overflowY: 'auto',          
    overflowX: 'hidden',         
  },
  video: {
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
  videoName: {
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
