import React, { useState } from 'react';
import Sidebar from '../Sidebar';
import Topbar from '../Topbar'; 
import './flexroom.css';

function Layout({
  displayName,
  userRole,
  defaultSidebarOpen = true,
  children,
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(defaultSidebarOpen);

  // This function matches the 'toggleSidebar' prop in your Topbar code
  const handleToggle = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="fr-shell">
      {/* 1. Sidebar: Stays fixed to the left */}
      <div className={`fr-sidebar-container ${isSidebarOpen ? 'open' : 'closed'}`}>
        <Sidebar
          userRole={userRole}
          isOpen={isSidebarOpen}
        />
      </div>

      {/* 2. Viewport: Contains Topbar and Main Content */}
      <div className={`fr-viewport ${isSidebarOpen ? 'shifted' : 'full'}`}>
        <Topbar
          userName={displayName}     // Matches 'userName' in your Topbar.jsx
          toggleSidebar={handleToggle} // Matches 'toggleSidebar' in your Topbar.jsx
        />
        
        <main className="fr-content-area">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;