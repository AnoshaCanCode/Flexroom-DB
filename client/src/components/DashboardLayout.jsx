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
            if (userRole === 'evaluator') {
                return window.localStorage.getItem('flexroomDisplayNameEvaluator') || 'Rida Amir';
            }
            return window.localStorage.getItem('flexroomDisplayName') || 'Apple';
        } catch {
            return userRole === 'evaluator' ? 'Rida Amir' : 'Apple';
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