import React, { useState, useRef, useEffect } from "react";
import AdminLayout from "./components/AdminLayout";
import dropdownIcon from "./assets/dropdown.png";
import generateReport from "./assets/generate_icon.png";
import { firestore } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

const allColumns = [
  { key: "Hearing", label: "HEARING USERS" },
  { key: "Non-Hearing", label: "NON-HEARING USERS" },
  { key: "active", label: "ACTIVE USERS" },
  { key: "inactive", label: "INACTIVE USERS" },
];

function GenerateReports() {
  // Print only the visible table
  const [, setPrintRefresh] = useState(false);
  const handlePrint = () => {
    if (!tableContainerRef.current) return;
    const tableHTML = tableContainerRef.current.innerHTML;
    const printWindow = window.open('', '', 'width=1200,height=800');
        printWindow.document.write(
          '<!DOCTYPE html><html><head><title>Print Table</title><style>' +
          '@page { size: landscape; margin: 0; }' +
          '@media print { body { margin: 0; padding: 0; zoom: 0.9; } .print-table-wrapper { overflow-x: visible; width: 100vw; } table { width: 100vw !important; min-width: unset !important; table-layout: fixed !important; box-sizing: border-box !important; } th, td { border: 1px solid #ccc; padding: 1px; font-size: 8px; word-break: break-word; } .print-user-name { font-size: 12px !important; font-weight: bold; } th.print-header, .print-header { font-size: 14px !important; font-weight: bold; } th { background: #481872; color: #fff; } } ' +
          'body { font-family: Arial, sans-serif; margin: 0; padding: 2px; zoom: 0.9; } .print-table-wrapper { overflow-x: visible; width: 100vw; } table { width: 100vw !important; min-width: unset !important; table-layout: fixed !important; box-sizing: border-box !important; } th, td { border: 1px solid #ccc; padding: 1px; font-size: 8px; word-break: break-word; } .print-user-name { font-size: 12px !important; font-weight: bold; } th.print-header, .print-header { font-size: 14px !important; font-weight: bold; } th { background: #481872; color: #fff; }' +
          '</style></head><body><div class="print-table-wrapper">' +
          tableHTML +
          '</div></body></html>'
        );
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
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
      {/* Default list header */}
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
                onClick={() => setOpenDropdown("users")}
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
                    onClick={() => setOpenDropdown(col)}
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

    // Find the max number of rows needed for each column (default + all filters)
    const maxRows = Math.max(
      userData.length,
      ...filteredUsersPerCol.map(arr => arr.length),
      0
    );

    // Render rows per user index in each column
    return Array.from({ length: maxRows }).map((_, rowIdx) => (
      <tr key={rowIdx}>
        {/* Default list user */}
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
      </div>
    </AdminLayout>
  );
}

export default GenerateReports;