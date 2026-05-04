import React, { useState } from 'react';
import React from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

import ClassCard from '../components/ClassCard';
import styles from '../components/DashboardLayout.module.css';
import { evaluatorClassList } from '../data/EvaluatorClassData';

const EvaluatorDashboard = () => {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    
    // New states for the Create Class form
    const [classTitle, setClassTitle] = useState('');
    const [section, setSection] = useState('');

    const handleCreateClass = () => {
        console.log("Creating:", classTitle, section);
        setShowModal(false);
        // Add your logic to push this to your backend here!
    };

const defaultClassContext = {
    courseTitle: 'Operating Systems',
    courseCode: 'BSCS-4J',
};

export default function EvaluatorDashboard() {
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
                    <div 
                        key={cls.id} 
                        onClick={() => navigate(`/evaluator/class/${cls.id}`)} 
                        style={{ cursor: 'pointer' }}
                    >
                        <ClassCard 
                            role="evaluator"
                            title={cls.title} 
                            section={cls.section}
                            assignments={cls.assignments}
                        />
                    </div>
                ))}
            </div>
            <div style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <Link
                    to="/create-doc-assignment"
                    state={defaultClassContext}
                    className="btn btn-lg"
                    style={{ background: '#6a714b', color: '#fff', borderRadius: 999 }}
                >
                    New document assignment
                </Link>
                <Link
                    to="/create-code-assignment"
                    state={defaultClassContext}
                    className="btn btn-lg"
                    style={{ background: '#6a714b', color: '#fff', borderRadius: 999 }}
                >
                    New code assignment
                </Link>
            </div>
        </div>
    );
};

export default EvaluatorDashboard;
}
