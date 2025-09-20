import React, { useState, useRef, useEffect } from "react";
import AdminLayout from "./components/AdminLayout";
import dropdownIcon from "./assets/dropdown.png";
import generateReport from "./assets/generate_icon.png";
import { firestore } from "./firebase";
import { collection, getDocs } from "firebase/firestore";

const allColumns = [
  { key: "hearing", label: "Hearing" },
  { key: "nonHearing", label: "Non-hearing" },
  { key: "active", label: "Active Users" },
  { key: "inactive", label: "Inactive (Offline)" },
];

function GenerateReports() {
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

  // Render table headers
  const renderHeaders = () => (
    <tr>
      <th
        style={{
          background: "#481872",
          color: "#fff",
          width: "60px",
          minWidth: "60px",
          maxWidth: "60px",
          textAlign: "center",
          position: "sticky",
          left: 0,
          zIndex: 2,
          boxShadow: "2px 0 4px -2px #ccc"
        }}
      >
        #
      </th>
      <th
        style={{
          background: "#481872",
          color: "#fff",
          width: "400px",
          minWidth: "400px",
          maxWidth: "400px",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",marginLeft:'10px' }}>
          <span>LIST OF USERS</span>
          {selectedCols.length < 1 && (
            <div style={{ display: "flex", alignItems: "center" }}>
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
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0
                }}
              >
                <img
                  src={generateReport}
                  alt="generate"
                  width="32"
                  height="32"
                  style={{ verticalAlign: "middle" }}
                />
              </button>
            </div>
          )}
        </div>
        {openDropdown === "users" && (
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
      {selectedCols.map((col, idx) => {
        const colDef = allColumns.find((c) => c.key === col);
        const isLast = idx === selectedCols.length - 1;
        return (
          <th
            key={col}
            style={{
              background: "#481872",
              color: "#fff",
              width: "400px",
              minWidth: "400px",
              maxWidth: "400px",
              position: "relative"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>{colDef.label}</span>
              {isLast && (
                <div style={{ display: "flex", alignItems: "center" }}>
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
                      style={{ verticalAlign: "middle" }}
                    />
                  </button>
                  <button
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: 0
                    }}
                  >
                    <img
                      src={generateReport}
                      alt="generate"
                      width="32"
                      height="32"
                      style={{ verticalAlign: "middle" }}
                    />
                  </button>
                </div>
              )}
            </div>
            {openDropdown === col && (
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

  const tableWidth = Math.min(60 + (1 + selectedCols.length) * 400, 100);

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
              minWidth: `${tableWidth}px`,
              width: `${tableWidth}px`,
              maxWidth: "1600px",
              borderCollapse: "collapse",
              tableLayout: "fixed",
              marginLeft: 0
            }}
          >
            <thead>{renderHeaders()}</thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={2 + selectedCols.length} style={{ textAlign: "center", padding: "40px" }}>
                    Loading users...
                  </td>
                </tr>
              ) : userData.length > 0 ? (
                userData.map((user, idx) => (
                  <tr key={user.id}>
                    <td
                      style={{
                        background: "#fff",
                        color: "#481872",
                        textAlign: "center",
                        position: "sticky",
                        left: 0,
                        zIndex: 1,
                        boxShadow: "2px 0 4px -2px #ccc",
                        width: "60px",
                        minWidth: "60px",
                        maxWidth: "60px"
                      }}
                    >
                      {idx + 1}
                    </td>
                    <td
                      style={{
                        background: "#fff",
                        color: "#481872",
                        width: "400px",
                        minWidth: "400px",
                        maxWidth: "400px"
                      }}
                    >
                      <div>{user.name}</div>
                      <div>{user.email}</div>
                    </td>
                    {selectedCols.map((col) => (
                      <td
                        key={col}
                        style={{
                          background: "#fff",
                          color: "#481872",
                          width: "400px",
                          minWidth: "400px",
                          maxWidth: "400px"
                        }}
                      >
                        {/* You can add more user info here based on col */}
                        {user.name}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2 + selectedCols.length} style={{ textAlign: "center", padding: "40px" }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

export default GenerateReports;