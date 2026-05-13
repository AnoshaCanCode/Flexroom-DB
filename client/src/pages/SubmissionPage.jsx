import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './PeoplePage.module.css';

const SubmissionsPage = () => {
    const { id: assignmentId } = useParams(); // Matches :id in your routing pattern
    const navigate = useNavigate();
    
    const [pendingData, setPendingData] = useState([]);
    const [markedData, setMarkedData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                // Attach token headers if auth interception is not automated globally
                const token = localStorage.getItem('token'); 
                const response = await axios.get(`/api/submissions/assessment/${assignmentId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                setPendingData(response.data.pending);
                setMarkedData(response.data.marked);
            } catch (err) {
                console.error("Error pulling submission information:", err);
            } finally {
                setLoading(false);
            }
        };

        if (assignmentId) fetchSubmissions();
    }, [assignmentId]);

    const handleRowClick = (student, contextType) => {
        const assignmentType = student.type || 'document'; 
        // Directing layout to evaluations workspace with specific database primary keys
        navigate(`/evaluator/evaluate/${assignmentId}/${student.UserID || student.id}`, { 
            state: { type: assignmentType } 
        });
    };

    if (loading) {
        return <div className="text-center p-5">Loading assessment data vectors...</div>;
    }

    return (
        <div className={styles.pageContainer}>
            {/* --- SUBMISSIONS SECTION --- */}
            <div className={styles.headerContainer}>
                <h1 className={styles.classTitle}>Submissions</h1>
            </div>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th style={{ width: '80px' }}>S.No#</th>
                        <th>Name</th>
                    </tr>
                </thead>
                <tbody>
                    {pendingData.length === 0 ? (
                        <tr><td colSpan="2" className="text-center text-muted">No pending submissions found.</td></tr>
                    ) : (
                        pendingData.map((student, index) => (
                            <tr 
                                key={student.SubmissionID} 
                                onClick={() => handleRowClick(student, 'pending')}
                                style={{ cursor: 'pointer' }}
                            >
                                <td>{index + 1}.</td>
                                <td>{student.Name}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            <div style={{ marginTop: '40px' }}></div>

            {/* --- MARKED SECTION --- */}
            <div className={styles.headerContainer}>
                <h1 className={styles.classTitle}>Marked</h1>
            </div>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th style={{ width: '80px' }}>S.No#</th>
                        <th>Name</th>
                        <th style={{ width: '150px' }}>Marks</th>
                    </tr>
                </thead>
                <tbody>
                    {markedData.length === 0 ? (
                        <tr><td colSpan="3" className="text-center text-muted">No evaluations processed yet.</td></tr>
                    ) : (
                        markedData.map((student, index) => (
                            <tr 
                                key={student.GradeID} 
                                onClick={() => handleRowClick(student, 'marked')}
                                style={{ cursor: 'pointer' }}
                            >
                                <td>{index + 1}.</td>
                                <td>{student.Name}</td>
                                <td>{`${student.TotalMarks}/${student.MaxMarks}`}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default SubmissionsPage;