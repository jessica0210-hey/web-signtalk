import React, { useState, useRef, useEffect } from "react";
import AdminLayout from "./components/AdminLayout";
import dropdownIcon from "./assets/dropdown.png";
import generateReport from "./assets/generate_icon.png";
import { firestore } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

const allColumns = [
  { key: "AllUsers", label: "ALL USERS" },
  { key: "Hearing", label: "HEARING USERS" },
  { key: "Non-Hearing", label: "NON-HEARING USERS" },
  { key: "active", label: "ACTIVE USERS" },
  { key: "inactive", label: "INACTIVE USERS" },
];

function GenerateReports() {
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

  // Print only the visible table exactly as displayed
  const [, setPrintRefresh] = useState(false);
  const handlePrint = async () => {
    const logoBase64 = await getLogoBase64();
    
    // Generate clean table HTML from data instead of cloning DOM
    const generateCleanTableHTML = () => {
      // Prepare filtered users for each selected column
      const filteredUsersPerCol = selectedCols.map(getFilteredUsers);
      
      // Find the max number of rows needed - only consider selected columns
      const maxRows = selectedCols.length > 0 
        ? Math.max(...filteredUsersPerCol.map(arr => arr.length), 0)
        : userData.length; // Only use userData.length when no columns are selected
      
      // Generate headers - exclude "LIST OF USERS" if any columns are selected
      const headers = [];
      if (selectedCols.length === 0) {
        headers.push('LIST OF USERS');
      }
      headers.push(...selectedCols.map(col => {
        const colDef = allColumns.find(c => c.key === col);
        return colDef ? colDef.label : col;
      }));
      
      let tableHTML = '<table><thead><tr>';
      headers.forEach(header => {
        tableHTML += `<th>${header}</th>`;
      });
      tableHTML += '</tr></thead><tbody>';
      
      // Generate rows
      for (let rowIdx = 0; rowIdx < maxRows; rowIdx++) {
        tableHTML += '<tr>';
        
        // Default list user - only if no columns are selected
        if (selectedCols.length === 0) {
          tableHTML += '<td>';
          if (userData[rowIdx]) {
            tableHTML += `<div><strong>${rowIdx + 1}. ${userData[rowIdx].name}</strong></div>`;
            tableHTML += `<div style="font-size: 13px;">${userData[rowIdx].email}</div>`;
          }
          tableHTML += '</td>';
        }
        
        // Selected filter columns
        selectedCols.forEach((col, colIdx) => {
          const users = filteredUsersPerCol[colIdx];
          tableHTML += '<td>';
          if (users[rowIdx]) {
            tableHTML += `<div><strong>${rowIdx + 1}. ${users[rowIdx].name}</strong></div>`;
            tableHTML += `<div style="font-size: 13px;">${users[rowIdx].email}</div>`;
          }
          tableHTML += '</td>';
        });
        
        tableHTML += '</tr>';
      }
      
      tableHTML += '</tbody></table>';
      return tableHTML;
    };
    
    const tableHTML = generateCleanTableHTML();
    const printWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    
    // Get current column configuration for report title
    let reportTitle = "USERS REPORT";
    if (selectedCols.length > 0) {
      const columnNames = selectedCols.map(col => {
        const colDef = allColumns.find(c => c.key === col);
        return colDef ? colDef.label : col;
      });
      reportTitle = `USERS REPORT - ${columnNames.join(', ')}`;
    }
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Users Report</title>
        <meta charset="UTF-8">
        <style>
          * { box-sizing: border-box; }
          html, body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0;
            background: white;
            height: auto;
            width: 100%;
          }
          .content-wrapper {
            max-width: 95%;
            margin: 20px auto;
            padding: 20px;
            min-height: 100vh;
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
            font-size: 20px;
            line-height: 1.2;
          }
          .print-table-wrapper { 
            overflow-x: visible; 
            width: 100%;
            margin: 0 auto;
          }
          table { 
            width: 100%;
            border-collapse: collapse; 
            margin: 0 auto;
            table-layout: auto;
          }
          th, td { 
            border: 1px solid #ccc; 
            padding: 12px 18px; 
            text-align: left;
            vertical-align: top;
            word-wrap: break-word;
          }
          th { 
            background-color: #481872 !important; 
            color: white !important; 
            font-weight: bold;
            font-size: 14px;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
            border: 2px solid #481872 !important;
            box-shadow: inset 0 0 0 1000px #481872 !important;
          }
          td {
            background-color: white;
            color: black;
            font-size: 12px;
          }
          td div {
            margin: 2px 0;
          }
          td strong {
            font-weight: bold;
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
            html, body { 
              margin: 0; 
              padding: 0;
              height: auto;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            .content-wrapper { 
              margin: 0;
              padding: 15px;
              max-width: 100%;
            }
            
            .print-header {
              margin-bottom: 20px;
              page-break-after: avoid;
            }
            
            table {
              width: 100%;
              page-break-inside: auto;
              margin: 0 auto;
              table-layout: auto;
            }
            
            thead {
              display: table-header-group;
            }
            
            tr {
              page-break-inside: avoid;
            }
            
            th, td {
              border: 1px solid #ccc;
              padding: 8px 12px;
              font-size: 10px;
              text-align: left;
              vertical-align: top;
            }
            
            th {
              background-color: #481872 !important;
              color: white !important;
              font-weight: bold;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
              border: 2px solid #481872 !important;
              box-shadow: inset 0 0 0 1000px #481872 !important;
            }
            
            td {
              background-color: white;
              color: black;
            }
            
            td strong {
              font-weight: bold;
            }
            
            td div {
              margin: 1px 0;
            }
            
            /* Page setup with better margins */
            @page {
              margin: 0.5in;
              size: landscape;
            }
            
            /* Footer for page numbers */
            .print-footer {
              position: fixed;
              bottom: 20px;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 12px;
              color: #481872;
              font-family: Arial, sans-serif;
            }
            
            /* Hide any remaining UI elements */
            button, .dropdown, img[alt="dropdown"], img[alt="print"] {
              display: none !important;
            }
          }
          
          /* Ensure content is visible on screen */
          @media screen {
            body {
              overflow: auto;
            }
            .content-wrapper {
              position: relative;
              top: 0;
              left: 0;
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
              <h1>${reportTitle}</h1>
              <p style="margin: 0; font-size: 12px;">Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
            </div>
          </div>
          
          <div class="print-table-wrapper">
            ${tableHTML}
          </div>
        </div>
        
        <div class="print-footer">
          Page <span id="pageNum">1</span>
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
    setOpenDropdown(null);
    setPrintRefresh((prev) => !prev); // force re-render
  };
  const [selectedCols, setSelectedCols] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(true);

  const tableContainerRef = useRef(null);

  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollLeft = tableContainerRef.current.scrollWidth;
    }
  }, [selectedCols]);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersRef = collection(firestore, "users");
        const snapshot = await getDocs(usersRef);
        const usersArr = snapshot.docs.map((doc, idx) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || `User ${idx + 1}`,
            email: data.email || "",
            userType: data.userType,      // <-- add this
    isOnline: data.isOnline,
          };
        });
        setUserData(usersArr);
      } catch {
        setUserData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const toggleColumn = (colKey) => {
    setSelectedCols((prev) =>
      prev.includes(colKey)
        ? prev.filter((c) => c !== colKey)
        : [...prev, colKey]
    );
    setOpenDropdown(null);
  };

  // --- Filtering logic for each column ---
  const getFilteredUsers = (colKey) => {
    switch (colKey) {
      case "AllUsers":
        return userData;
      case "Hearing":
        return userData.filter((u) => u.userType === "Hearing");
      case "Non-Hearing":
        return userData.filter((u) => u.userType === "Non-Hearing");
      case "active":
        return userData.filter((u) => u.isOnline === true);
      case "inactive":
        return userData.filter((u) => u.isOnline === false);
      default:
        return [];
    }
  };

  // --- Render table headers ---
  const renderHeaders = () => (
    <tr>
      {/* Default list header - only show if no columns are selected */}
      {selectedCols.length === 0 && (
        <th
          style={{
            background: "#481872",
            color: "#fff",
            width: "320px",
            minWidth: "320px",
            maxWidth: "320px",
            position: "relative",
            textAlign: "left",
            padding: "12px 18px" // Added padding
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginLeft: '10px' }}>
            <span className="print-header">LIST OF USERS</span>
            {selectedCols.length === 0 && (
                  <div style={{ display: "flex", alignItems: "center", opacity: 1, visibility: "visible" }}>
                <button
                  onClick={() => setOpenDropdown(openDropdown === "users" ? null : "users")}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    marginRight: "8px"
                  }}
                >
                  <img
                    src={dropdownIcon}
                    alt="dropdown"
                    width="32"
                    height="32"
                    style={{ verticalAlign: "middle" }}
                  />
                </button>
                <button
                  onClick={handlePrint}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0
                  }}
                >
                  <img
                    src={generateReport}
                    alt="print"
                    width="32"
                    height="32"
                    style={{ verticalAlign: "middle" }}
                  />
                </button>
              </div>
            )}
          </div>
          {selectedCols.length === 0 && openDropdown === "users" && (
            <div
              style={{
                position: "absolute",
                top: "48px",
                right: "0px",
                background: "white",
                border: "1px solid gray",
                borderRadius: "4px",
                zIndex: 10,
                minWidth: "140px"
              }}
            >
              {allColumns.map((col) => (
                <div
                  key={col.key}
                  onClick={() => toggleColumn(col.key)}
                  style={{
                    padding: "10px 16px",
                    cursor: "pointer",
                    background: selectedCols.includes(col.key) ? "#b77df1ff" : "white",
                    fontWeight: selectedCols.includes(col.key) ? "bold" : "normal",
                    color: "#000"
                  }}
                >
                  {col.label}
                </div>
              ))}
            </div>
          )}
        </th>
      )}
      {/* For each selected filter, add header */}
      {selectedCols.map((col, idx) => {
        const colDef = allColumns.find((c) => c.key === col);
        const isLast = idx === selectedCols.length - 1;
        return (
          <th
            key={col}
            className="print-header"
            style={{
              background: "#481872",
              color: "#fff",
              width: "320px",
              minWidth: "320px",
              maxWidth: "320px",
              position: "relative",
              textAlign: "left",
              padding: "12px 18px" // Added padding
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>{colDef.label}</span>
              {isLast && (
                <div style={{ display: "flex", alignItems: "center", visibility: "visible" }}>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === col ? null : col)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      marginRight: "8px"
                    }}
                  >
                    <img
                      src={dropdownIcon}
                      alt="dropdown"
                      width="32"
                      height="32"
                      style={{ verticalAlign: "middle", opacity: 1, visibility: "visible", display: "inline-block" }}
                    />
                  </button>
                  <button
                    onClick={handlePrint}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: 0
                    }}
                  >
                    <img
                      src={generateReport}
                      alt="print"
                      width="32"
                      height="32"
                      style={{ verticalAlign: "middle", opacity: 1, visibility: "visible", display: "inline-block" }}
                    />
                  </button>
                </div>
              )}
            </div>
            {/* Only the dropdown menu is conditional */}
            {isLast && openDropdown === col && (
              <div
                style={{
                  position: "absolute",
                  top: "48px",
                  right: "0px",
                  background: "white",
                  border: "1px solid gray",
                  borderRadius: "4px",
                  zIndex: 10,
                  minWidth: "140px"
                }}
              >
                {allColumns.map((dropdownCol) => (
                  <div
                    key={dropdownCol.key}
                    onClick={() => toggleColumn(dropdownCol.key)}
                    style={{
                      padding: "10px 16px",
                      cursor: "pointer",
                      background: selectedCols.includes(dropdownCol.key) ? "#b77df1ff" : "white",
                      fontWeight: selectedCols.includes(dropdownCol.key) ? "bold" : "normal",
                      color: "#000"
                    }}
                  >
                    {dropdownCol.label}
                  </div>
                ))}
              </div>
            )}
          </th>
        );
      })}
    </tr>
  );

  // --- Render table body ---
  const renderBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={1 + selectedCols.length} style={{ textAlign: "center", padding: "40px" }}>
            Loading users...
          </td>
        </tr>
      );
    }

    // Prepare filtered users for each selected column
    const filteredUsersPerCol = selectedCols.map(getFilteredUsers);

    // Find the max number of rows needed - only consider selected columns
    const maxRows = selectedCols.length > 0 
      ? Math.max(...filteredUsersPerCol.map(arr => arr.length), 0)
      : userData.length; // Only use userData.length when no columns are selected

    // Render rows per user index in each column
    return Array.from({ length: maxRows }).map((_, rowIdx) => (
      <tr key={rowIdx}>
        {/* Default list user - only show if no columns are selected */}
        {selectedCols.length === 0 && (
          <td
            style={{
              background: "#fff",
              color: "#481872",
              width: "320px",
              minWidth: "320px",
              maxWidth: "320px",
              textAlign: "left",
              padding: "12px 18px" // Added padding
            }}
          >
            {userData[rowIdx] ? (
              <div>
                <div className="print-user-name"><b>{rowIdx + 1}.</b> {userData[rowIdx].name}</div>
                <div style={{ fontSize: "13px" }}>{userData[rowIdx].email}</div>
              </div>
            ) : null}
          </td>
        )}
        {/* For each selected filter, add user */}
        {selectedCols.map((col, colIdx) => {
          const users = filteredUsersPerCol[colIdx];
          return (
            <td
              key={col}
              style={{
                background: "#fff",
                color: "#481872",
                width: "320px",
                minWidth: "320px",
                maxWidth: "320px",
                textAlign: "left",
                padding: "12px 18px" // Added padding
              }}
            >
              {users[rowIdx] ? (
                <div>
                  <div className="print-user-name"><b>{rowIdx + 1}.</b> {users[rowIdx].name}</div>
                  <div style={{ fontSize: "13px" }}>{users[rowIdx].email}</div>
                </div>
              ) : null}
            </td>
          );
        })}
      </tr>
    ));
  };

  return (
    <AdminLayout title="Generate Report">
      <div style={{ padding: "16px", height: "80vh" }}>
        {selectedCols.length === 0 ? (
          // Show message when no columns are selected
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "60vh",
            textAlign: "center",
            color: "#fff",
            fontSize: "18px"
          }}>
            <div style={{ marginBottom: "10px" }}>
              Please select one or more user categories from the dropdown menu to generate a report.
            </div>
            
            {/* Show the dropdown button for easy access */}
            <div style={{ marginTop: "30px", position: "relative" }}>
              <button
                onClick={() => setOpenDropdown(openDropdown === "users" ? null : "users")}
                style={{
                  background: "#481872",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}
              >
                <img
                  src={dropdownIcon}
                  alt="dropdown"
                  width="20"
                  height="20"
                  style={{ filter: "brightness(0) invert(1)" }}
                />
                Select User Categories
              </button>
              
              {/* Dropdown menu */}
              {openDropdown === "users" && (
                <div
                  style={{
                    position: "absolute",
                    top: "60px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "white",
                    border: "1px solid gray",
                    borderRadius: "4px",
                    zIndex: 10,
                    minWidth: "200px",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
                  }}
                >
                  {allColumns.map((col) => (
                    <div
                      key={col.key}
                      onClick={() => toggleColumn(col.key)}
                      style={{
                        padding: "12px 16px",
                        cursor: "pointer",
                        background: selectedCols.includes(col.key) ? "#b77df1ff" : "white",
                        fontWeight: selectedCols.includes(col.key) ? "bold" : "normal",
                        color: "#000",
                        borderBottom: "1px solid #eee"
                      }}
                    >
                      {col.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Show table when columns are selected
          <div
            ref={tableContainerRef}
            style={{
              overflowX: "auto",
              overflowY: "auto",
              maxWidth: "90vw",
              maxHeight: "76vh",
              border: "1px solid #ccc",
              marginLeft: "50px", 
              marginRight: "50px",
              display: "flex",
              alignItems: "flex-start"
            }}
          >
            <table
              border="1"
              cellPadding="8"
              cellSpacing="0"
              style={{
                minWidth: "100px",
                width: "100%",
                maxWidth: "1600px",
                borderCollapse: "collapse",
                tableLayout: "fixed",
                marginLeft: 0
              }}
            >
              <thead>{renderHeaders()}</thead>
              <tbody>{renderBody()}</tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default GenerateReports;