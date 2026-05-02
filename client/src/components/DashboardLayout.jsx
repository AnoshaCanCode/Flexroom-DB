import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar'; 
import Topbar from './Topbar';
import styles from './DashboardLayout.module.css'; // Import module

const DashboardLayout = ({ userRole }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className={styles.layoutContainer}>
            {/* 1. Full width Topbar */}
            <Topbar 
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} // This is the 'toggleSidebar' prop the Topbar needs
                userName="Apple" 
            />
            
            {/* 2. Body container (Row: Sidebar + Content) */}
            <div className={styles.layoutBody}>
                <Sidebar 
                    isOpen={isSidebarOpen} 
                    userRole={userRole} 
                />
                <main className={styles.mainContent}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
export default DashboardLayout;