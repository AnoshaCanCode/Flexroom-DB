import React from 'react';
import ClassCard from '../components/ClassCard';
import { classList } from '../data/ClassData';
import styles from '../components/DashboardLayout.module.css';

const StudentDashboard = () => {
    return (
        <div className={styles.dashboardContainer}>
            <h1>My Classes</h1>
            <div className={styles.grid}>
                {classList.map((cls) => (
                    <ClassCard key={cls.id} {...cls} />
                ))}
            </div>
        </div>
    );
};

export default StudentDashboard;