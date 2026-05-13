import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getStudentAssessments } from '../../api/assignmentsApi';
import styles from '../DashboardLayout.module.css';

const StudentClassView = () => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Replace this with your actual logged-in user logic
    const studentId = localStorage.getItem('userId') || 1; 

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const response = await getStudentAssessments(classId, studentId);
                setAssignments(response.data);
            } catch (err) {
                console.error("Error loading assignments:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAssignments();
    }, [classId, studentId]);

    if (loading) return <div className={styles.loading}>Loading Assignments...</div>;

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.headerRow}>
                <h1 className={styles.title}>My Assignments</h1>
            </div>

            <div className={styles.tableWrapper}>
                <table className={styles.assignmentTable}>
                    <thead>
                        <tr>
                            <th>S.No#</th>
                            <th>Title</th>
                            <th>Status</th>
                            <th>Obtained Marks</th>
                            <th>Total Marks</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assignments.length > 0 ? (
                            assignments.map((assignment, index) => (
                                <tr 
                                    key={assignment.id} 
                                    onClick={() => navigate(`/student/assignment/${assignment.id}`)}
                                    className={styles.clickableRow}
                                >
                                    <td>{index + 1}</td>
                                    <td className={styles.assignmentTitle}>{assignment.title}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${
                                            assignment.submissionStatus === 'submitted' 
                                            ? styles.statusSuccess 
                                            : styles.statusPending
                                        }`}>
                                            {assignment.submissionStatus}
                                        </span>
                                    </td>
                                    <td className={styles.marksColumn}>
                                        {assignment.obtained !== null ? assignment.obtained : '--'}
                                    </td>
                                    <td className={styles.marksColumn}>{assignment.total}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className={styles.noData}>No assignments found for this class.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StudentClassView;