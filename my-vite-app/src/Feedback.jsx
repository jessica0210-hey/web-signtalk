import React, { useState, useRef, useEffect } from 'react';
import AdminLayout from './components/AdminLayout';
import filterIcon from './assets/dateIcon.png';
import generateIcon from './assets/generate_icon.png';
import { firestore } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

function Feedback() {
  const [feedbackData, setFeedbackData] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const dateInputRef = useRef(null);

  // Fetch feedback from Firestore
  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      try {
        const feedbackRef = collection(firestore, 'user feedback');
        const snapshot = await getDocs(feedbackRef);
        const feedbackArr = snapshot.docs.map((doc) => {
          const data = doc.data();
          let dateStr = '';
          let timestampValue = 0;
          if (data.timestamp?.toDate) {
            const dateObj = data.timestamp.toDate();
            timestampValue = dateObj.getTime();
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            const yyyy = dateObj.getFullYear();
            let hours = dateObj.getHours();
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'P.M' : 'A.M';
            hours = hours % 12 || 12;
            dateStr = `${mm}/${dd}/${yyyy}\n${hours}:${minutes} ${ampm}`;
          }
          return {
            id: doc.id,
            userId: data.uid,
            email: data.email,
            date: dateStr,
            message: data.message,
            timestampValue,
          };
        });
        // Sort by timestamp descending (latest first)
        feedbackArr.sort((a, b) => b.timestampValue - a.timestampValue);
        setFeedbackData(feedbackArr);
      } catch {
        setFeedbackData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, []);

  // Convert feedback date (MM/DD/YYYY) -> YYYY-MM-DD
  const normalizeDate = (dateStr) => {
    const [date] = dateStr.split('\n');
    const [month, day, year] = date.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const filteredData = selectedDate
    ? feedbackData.filter((item) => normalizeDate(item.date) === selectedDate)
    : feedbackData;

  return (
    <AdminLayout title="FEEDBACK">
      <style>
        {`
          .icon {
            width: 30px;
            height: 30px;
            cursor: pointer;
            transition: transform 0.2s ease, filter 0.2s ease;
          }
          .icon:hover {
            transform: scale(1.1);
            filter: brightness(0.85);
          }
        `}
      </style>
      <div style={styles.wrapper}>
        <div style={styles.panel}>
          {/* Header */}
          <div style={styles.headerTitle}>
            <span style={styles.colHeader}></span>
            <span style={styles.colHeader}>DATE / TIME</span>
            <span style={{ ...styles.colHeader, marginLeft: '170px' }}>USER ID</span>
            <span style={{ ...styles.colHeader, marginLeft: '360px' }}>FEEDBACK</span>
            <div style={styles.iconGroup}>
              <div style={{ position: 'relative' }}>
                <img
                  src={filterIcon}
                  alt="filter"
                  className="icon"
                  onClick={() => {
                    if (dateInputRef.current) {
                      dateInputRef.current.showPicker();
                    }
                  }}
                />
                <input
                  ref={dateInputRef}
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    position: 'absolute',
                    top: '40px',
                    right: 180,
                    opacity: 0,
                    cursor: 'cell',
                    height: 0,
                    width: 0,
                  }}
                />
              </div>
              <img src={generateIcon} alt="generate" className="icon" />
            </div>
          </div>

          {/* Body */}
          <div style={styles.scrollArea}>
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#777' }}>
                Loading feedback...
              </div>
            ) : filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <div key={item.id || index} style={styles.feedbackRow}>
                  <div style={{ ...styles.col, ...styles.colIndex }}>{index + 1}</div>
                  <div style={{ ...styles.col, ...styles.colDate }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{item.date.split('\n')[0]}</div>
                      <div>{item.date.split('\n')[1]}</div>
                    </div>
                  </div>
                  <div style={{ ...styles.col, ...styles.colUser }}>
                    {1001 + index}
                  </div>
                  <div style={{ ...styles.col, ...styles.colMessage }}>{item.message}</div>
                </div>
              ))
            ) : (
              <div style={{ padding: '60px', textAlign: 'center', color: '#777' }}>
                No feedback found for this date
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

const styles = {
  wrapper: {
    width: '100%',
    overflowX: 'auto',
  },
  panel: {
    backgroundColor: 'white',
    width: '100%',
    minWidth: '1600px',
    maxWidth: '1600px',
    height: '700px',
    boxShadow: '0 4px 8px rgba(29, 29, 29, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '10px',
    overflow: 'hidden',
    margin: '0 auto',
  },
  headerTitle: {
    background: '#481872',
    color: 'white',
    fontSize: '18px',
    display: 'grid',
    gridTemplateColumns: '100px minmax(120px, 1fr) minmax(120px, 1fr) 2fr auto',
    alignItems: 'center',
    padding: '0 10px',
    height: '50px',
    gap: '10px',
    position: 'relative',
  },
  colHeader: {},
  iconGroup: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  datePicker: {
    position: 'absolute',
    top: '40px',
    right: '10px',
    padding: '5px',
  },
  scrollArea: {
    overflowY: 'auto',
    flex: 1,
  },
  feedbackRow: {
    display: 'grid',
    gridTemplateColumns: '100px minmax(120px, 1fr) minmax(120px, 1fr) 2fr',
    borderBottom: '1px solid #000000ff',
  },
  col: {
    padding: '30px',
    borderRight: '1px solid #000000ff',
    color: '#481872',
    fontSize: '14px',
    wordBreak: 'break-word',
  },
  colIndex: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  colDate: {
    fontSize: '18px', // Increased font size for timestamp
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colUser: {
    textAlign: 'center',
    fontSize: '18px', // Increased font size for uid
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colMessage: {
    borderRight: '0',
    fontSize: '20px', // Increased font size
    textAlign: 'center', // Center the message
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default Feedback;

