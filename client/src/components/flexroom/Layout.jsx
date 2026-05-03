import React, { useState } from 'react';

import Sidebar from '../Sidebar';

import Topbar from '../Topbar';

import './flexroom.css'; // Use this format, not the 'styles' object



function Layout({ displayName, userRole, defaultSidebarOpen = true, children }) {

  const [isSidebarOpen, setIsSidebarOpen] = useState(defaultSidebarOpen);

  const handleToggle = () => setIsSidebarOpen(!isSidebarOpen);



  return (

    <div className="fr-shell">

      {/* 1. Topbar stays at the top, fixed height */}

      <Topbar

        userName={displayName}

        toggleSidebar={handleToggle}

      />

     

      {/* 2. Body container: Sidebar + Content side-by-side */}

      <div className="fr-body">

        <div className={`fr-sidebar-container ${isSidebarOpen ? 'open' : 'closed'}`}>

          <Sidebar userRole={userRole} isOpen={isSidebarOpen} />

        </div>

       

        <main className="fr-content-area">

          {children}

        </main>

      </div>

    </div>

  );

}



export default Layout;