import React, { useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import styles from './DashboardLayout.module.css';

const DashboardLayout = ({ userRole }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [courseHeader, setCourseHeader] = useState({ title: null, code: null });

    const displayName = useMemo(() => {
    try {
        // 1. Get the main 'user' object we saved at login
        const savedUser = window.localStorage.getItem('user');
        
        if (savedUser) {
            const parsed = JSON.parse(savedUser);
            // 2. Return the name from that object
            return parsed.name || 'User';
        }
        
        // 3. Keep your role-based fallbacks just in case
        return userRole === 'evaluator' ? 'Rida Amir' : 'Student';
    } catch {
        return 'User';
    }
}, [userRole]);

    return (
        <div className={styles.layoutContainer}>
            <Topbar
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                userName={displayName}
                courseTitle={courseHeader.title}
                courseCode={courseHeader.code}
            />

            <div className={styles.layoutBody}>
                <Sidebar isOpen={isSidebarOpen} userRole={userRole} />
                <main className={styles.mainContent}>
                    <Outlet context={{ setCourseHeader }} />
                </main>
            </div>
        </div>
    );
};
export default DashboardLayout;