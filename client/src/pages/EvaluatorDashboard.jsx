import React, { useState } from 'react';
import ClassCard from '../components/ClassCard';
import styles from '../components/DashboardLayout.module.css';
import { evaluatorClassList } from '../data/EvaluatorClassData';

const EvaluatorDashboard = () => {
    const [showModal, setShowModal] = useState(false);
    
    // New states for the Create Class form
    const [classTitle, setClassTitle] = useState('');
    const [section, setSection] = useState('');

    const handleCreateClass = () => {
        console.log("Creating:", classTitle, section);
        setShowModal(false);
        // Add your logic to push this to your backend here!
    };

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.headerRow}>
                <h1 className={styles.title}>Evaluated Classes</h1>
                <button className={styles.addButton} onClick={() => setShowModal(true)}>
                    +
                </button>
            </div>

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2>Create New Class</h2>
                        <input 
                            type="text" 
                            placeholder="Class Title" 
                            className={styles.modalInput}
                            value={classTitle}
                            onChange={(e) => setClassTitle(e.target.value)}
                        />
                        <input 
                            type="text" 
                            placeholder="Section (e.g. BCS-4J)" 
                            className={styles.modalInput}
                            value={section}
                            onChange={(e) => setSection(e.target.value)}
                        />
                        <div className={styles.modalActions}>
                            <button onClick={() => setShowModal(false)} className={styles.cancelBtn}>Cancel</button>
                            <button onClick={handleCreateClass} className={styles.joinBtn}>Create</button>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.grid}>
                {evaluatorClassList.map((cls) => (
                    <ClassCard 
                        key={cls.id} 
                        role="evaluator"
                        title={cls.title} 
                        section={cls.section} // Passing the section
                        assignments={cls.assignments}
                    />
                ))}
            </div>
        </div>
    );
};

export default EvaluatorDashboard;