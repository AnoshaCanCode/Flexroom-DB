import React, { useState } from 'react';
import ClassCard from '../components/ClassCard';
import { classList } from '../data/ClassData';
import styles from '../components/DashboardLayout.module.css';

const StudentDashboard = () => {
    // Added this line to define state
    const [showModal, setShowModal] = useState(false);
    return (
        <div className={styles.dashboardContainer}>
            {/* Your Header Row */}
            <div className={styles.headerRow}>
                <h1 className={styles.title}>My Classes</h1>
                <button className={styles.addButton} onClick={() => setShowModal(true)}>
                +
                </button>
             </div>

            {/* The Conditional Modal */}
             {showModal && (
             <div className={styles.modalOverlay}>
                 <div className={styles.modalContent}>
                 <h2>Join New Class</h2>
                <input 
                 type="text" 
                 placeholder="Enter class code" 
                className={styles.modalInput}
                />
                <div className={styles.modalActions}>
                <button onClick={() => setShowModal(false)} className={styles.cancelBtn}>Cancel</button>
                <button className={styles.joinBtn}>Join</button>
                </div>
             </div>
            </div>
            )}

            <div className={styles.grid}>
                {classList.map((cls) => (
                    // The spread operator {...cls} passes title and evaluatorName automatically
                    <ClassCard key={cls.id} role="student" {...cls} />
                ))}
            </div>
        </div>
    );
};

export default StudentDashboard;