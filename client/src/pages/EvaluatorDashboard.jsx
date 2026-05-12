import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClassCard from '../components/ClassCard';
import styles from '../components/DashboardLayout.module.css';

const EvaluatorDashboard = () => {
    const navigate = useNavigate();
    const [classes, setClasses] = useState([]); // State for DB data
    const [showModal, setShowModal] = useState(false);
    const [classTitle, setClassTitle] = useState('');
    const [section, setSection] = useState(''); // Note: Section isn't in your SQL schema yet, we'll combine it with Title

    // Fetch classes from DB on load
    const fetchClasses = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/users/classes');
            const data = await response.json();
            
            // Safety Check: Only set state if data is an array
            if (Array.isArray(data)) {
                setClasses(data);
            } else {
                console.error("Received non-array data:", data);
                setClasses([]); // Fallback to empty array
            }
        } catch (error) {
            console.error("Fetch error:", error);
            setClasses([]); 
        }
    };

    useEffect(() => {
        fetchClasses();
    }, []);

    const handleCreateClass = async () => {
        if (!classTitle) return alert("Please enter a title");

        try {
            const token = sessionStorage.getItem('flexroom_token');
            const response = await fetch('http://localhost:5000/api/users/create-class', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ className: `${classTitle} (${section})` })
            });

            if (response.ok) {
                alert("Class Created Successfully!");
                setShowModal(false);
                setClassTitle('');
                setSection('');
                fetchClasses(); // Refresh list automatically
            }
        } catch (error) {
            alert("Failed to create class.");
        }
    };

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.headerRow}>
                <h1 className={styles.title}>Evaluated Classes</h1>
                <button className={styles.addButton} onClick={() => setShowModal(true)}>+</button>
            </div>

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2>Create New Class</h2>
                        <input 
                            type="text" 
                            placeholder="Class Title (e.g. OS)" 
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
                {classes.map((cls) => (
                    <div 
                        key={cls.classID} 
                        onClick={() => navigate(`/evaluator/class/${cls.classID}`)} 
                        style={{ cursor: 'pointer' }}
                    >
                        <ClassCard 
                            role="evaluator"
                            title={cls.className} 
                            section={`Code: ${cls.classCode}`} // Displaying the join code here
                            assignments={[]} // Assignments will be fetched in Phase 4
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EvaluatorDashboard;