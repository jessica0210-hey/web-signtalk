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
            userId: data.formatted_uid,
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

  // Convert image to base64
  const getLogoBase64 = async () => {
    try {
      const response = await fetch('/signtalk_logo.png');
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error loading logo:', error);
      return '';
    }
  };

  // Print functionality
  const handlePrint = async () => {
    const logoBase64 = await getLogoBase64();
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Feedback Report</title>
        <meta charset="UTF-8">
        <style>
          * { box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 40px;
            background: white;
          }
          .content-wrapper {
            max-width: 90%;
            margin: 0 auto;
            padding: 20px;
          }
          .print-header { 
            text-align: center; 
            margin-bottom: 30px; 
            padding-bottom: 20px;
            border-bottom: 2px solid #481872;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
          }
          .logo-container {
            flex-shrink: 0;
          }
          .logo-container img {
            width: 60px;
            height: 60px;
            object-fit: contain;
          }
          .header-text {
            text-align: center;
          }
          .print-header h1 { 
            color: #481872; 
            margin: 0 0 10px 0; 
            font-size: 24px;
          }
          .print-date-filter { 
            margin-bottom: 20px; 
            font-weight: bold; 
            text-align: center;
          }
          .print-table { 
            width: 85%; 
            border-collapse: collapse; 
            margin: 0 auto 30px auto;
            page-break-inside: avoid;
          }
          .print-table thead {
            display: table-header-group;
          }
          .print-table th, .print-table td { 
            border: 1px solid #000; 
            padding: 10px; 
            text-align: center; 
            vertical-align: middle;
          }
          .print-table th { 
            background-color: #481872 !important; 
            color: white !important; 
            font-weight: bold;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
            border: 2px solid #481872 !important;
            box-shadow: inset 0 0 0 1000px #481872 !important;
          }
          .print-table td {
            word-wrap: break-word;
            max-width: 180px;
          }
          .print-table tr {
            page-break-inside: avoid;
          }
          .print-no-data { 
            text-align: center; 
            padding: 40px; 
            font-size: 18px;
          }
          
          /* Print styles */
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body { 
              margin: 0; 
              padding: 15px;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            .content-wrapper { padding: 5px; }
            
            .page-header, .page-footer {
              display: none !important;
            }
            
            .print-header {
              margin-bottom: 20px;
              page-break-after: avoid;
            }
            
            .print-table {
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            
            .print-table thead {
              display: table-header-group;
            }
            
            .print-table th {
              background-color: #481872 !important;
              color: white !important;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            .print-table tr {
              page-break-inside: avoid;
            }
            
            /* Page setup with better margins and page numbering */
            @page {
              margin: 0.5in 0.75in 1in 0.75in;
              size: letter;
              @bottom-center {
                content: "Page " counter(page);
                font-size: 12px;
                color: #481872;
                font-family: Arial, sans-serif;
              }
            }
            
            /* Page break styling */
            .page-break {
              page-break-before: always;
            }
          }
        </style>
      </head>
      <body>
        <div class="content-wrapper">
          <div class="print-header">
            <div class="logo-container">
              <img src="data:image/png;base64,${logoBase64}" alt="SignTalk Logo" />
            </div>
            <div class="header-text">
              <h1>FEEDBACK REPORT</h1>
              <p style="margin: 0;">Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
              ${selectedDate ? `<p class="print-date-filter">Filtered by date: ${selectedDate}</p>` : '<p style="margin: 5px 0;">All feedback records</p>'}
            </div>
          </div>
        
        ${filteredData.length > 0 ? `
          <table class="print-table">
            <thead>
              <tr>
                <th style="width: 8%">#</th>
                <th style="width: 20%">Date / Time</th>
                <th style="width: 15%">User ID</th>
                <th style="width: 57%">Feedback</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.date.replace('\n', '<br>')}</td>
                  <td>${item.userId || 'N/A'}</td>
                  <td>${item.message}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<div class="print-no-data">No feedback records found</div>'}
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              // Trigger print dialog
              window.print();
              
              // Close popup window immediately after print dialog opens
              // The print dialog will remain open for the user
              setTimeout(function() {
                window.close();
              }, 100);
            }, 500);
          };
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

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
      <div id="feedback-page-wrapper" style={styles.wrapper}>
        <div style={styles.panel}>
          {/* Header */}
          <div id="feedback-header" style={styles.headerTitle}>
            <span style={styles.colHeader}></span>
            <span style={{ ...styles.colHeader, marginLeft: '100px' }}>DATE/TIME</span>
            <span style={{ ...styles.colHeader, marginLeft: '150px' }}>USER ID</span>
            <span style={{ ...styles.colHeader, marginLeft: '360px' }}>FEEDBACK</span>
            <div style={styles.iconGroup}>
              <div style={{ position: 'relative' }}>
                <img id="filter-icon"
                  src={filterIcon}
                  alt="filter"
                  className="icon"
                  onClick={() => {
                    if (dateInputRef.current) {
                      dateInputRef.current.showPicker();
                    }
                  }}
                />
                <input id="date-filter-input"
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
              <img 
                id="generate-report-icon"
                src={generateIcon} 
                alt="generate" 
                className="icon" 
                onClick={handlePrint}
                title="Print Feedback Report"
              />
            </div>
          </div>

          {/* Body */}
          <div id="feedback-scroll-area" style={styles.scrollArea}>
            {loading ? (
              <div id="feedback-loading" style={{ padding: '60px', textAlign: 'center', color: '#777' }}>
                Loading feedback...
              </div>
            ) : filteredData.length > 0 ? (
              filteredData.map((item, index) => (
                <div id={`feedback-row-${index}`} key={item.id || index} style={styles.feedbackRow}>
                  <div id={`feedback-index-${index}`} style={{ ...styles.col, ...styles.colIndex }}>{index + 1}</div>
                  <div id={`feedback-date-${index}`} style={{ ...styles.col, ...styles.colDate }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{item.date.split('\n')[0]}</div>
                      <div>{item.date.split('\n')[1]}</div>
                    </div>
                  </div>
                  <div id={`feedback-user-${index}`} style={{ ...styles.col, ...styles.colUser }}>
                    {item.userId || 'N/A'}
                  </div>
                  <div id={`feedback-message-${index}`} style={{ ...styles.col, ...styles.colMessage }}>{item.message}</div>
                </div>
              ))
            ) : (
              <div id="no-feedback-message" style={{ padding: '60px', textAlign: 'center', color: '#777' }}>
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
    fontWeight: 700,
    letterSpacing: '0.7px',
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

