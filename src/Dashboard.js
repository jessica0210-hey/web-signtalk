import React from 'react';
import { Link } from 'react-router-dom';

function Dashboard() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome to the Dashboard</h1>
      <Link to="/">Logout</Link>
    </div>
  );
}

export default Dashboard;
