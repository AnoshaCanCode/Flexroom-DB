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
        // 1. Change localStorage to sessionStorage
        // 2. Change 'user' to 'flexroom_user'
        const savedUser = window.sessionStorage.getItem('flexroom_user');
        
        if (savedUser) {
            const parsed = JSON.parse(savedUser);
            // Use .name or .Name depending on your SQL column casing
            return parsed.name || parsed.Name || 'User';
        }
        
        // 3. Remove hardcoded names to avoid confusion during debugging
        return userRole === 'evaluator' ? 'Evaluator' : 'Student';
    } catch (err) {
        console.error("Error parsing user from session:", err);
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