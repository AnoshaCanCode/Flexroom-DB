import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClassCard from '../components/ClassCard';
import styles from '../components/DashboardLayout.module.css';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [classes, setClasses] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [joinCode, setJoinCode] = useState('');

    const token = sessionStorage.getItem('flexroom_token');

    // 1. Fetch only classes this student has joined
    const fetchMyClasses = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/users/my-classes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (Array.isArray(data)) setClasses(data);
        } catch (error) {
            console.error("Fetch error:", error);
        }
    };

    useEffect(() => {
        fetchMyClasses();
    }, []);

    // 2. Handle Joining a New Class
    const handleJoinClass = async () => {
        if (!joinCode) return alert("Please enter a code");

        try {
            const response = await fetch('http://localhost:5000/api/users/join-class', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ classCode: parseInt(joinCode) })
            });

            const data = await response.json();

            if (response.ok) {
                alert("Joined successfully!");
                setShowModal(false);
                setJoinCode('');
                fetchMyClasses(); // Refresh list
            } else {
                alert(data.error || "Failed to join");
            }
        } catch (error) {
            alert("Error connecting to server.");
        }
    };

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.headerRow}>
                <h1 className={styles.title}>My Classes</h1>
                <button className={styles.addButton} onClick={() => setShowModal(true)}>+</button>
            </div>

            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2>Join New Class</h2>
                        <input 
                            type="text" 
                            placeholder="Enter 4-digit class code" 
                            className={styles.modalInput}
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                        />
                        <div className={styles.modalActions}>
                            <button onClick={() => setShowModal(false)} className={styles.cancelBtn}>Cancel</button>
                            <button onClick={handleJoinClass} className={styles.joinBtn}>Join</button>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.grid}>
                {classes.map((cls) => (
                    <div 
                        key={cls.classID} 
                        onClick={() => navigate(`/student/class/${cls.classID}`)} 
                        style={{ cursor: 'pointer' }}
                    >
                        <ClassCard 
                            role="student"
                            title={cls.className}
                            section={`Code: ${cls.classCode}`}
                            assignments={[]} // To be handled later
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudentDashboard;