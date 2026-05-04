import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './DashboardLayout.module.css'; // Reuse your existing layout styles

const StudentClassView = () => {
    const navigate = useNavigate();

    // Mock data - replace with your actual API call
    const assignments = [
        { id: 1, title: 'Assignment 1: Fork', status: 'Submitted', obtained: 18, total: 20 },
        { id: 2, title: 'Class Activity 1', status: 'Assigned', obtained: null, total: 10 },
        { id: 3, title: 'Assignment 2: Pipes', status: 'Submitted', obtained: 15, total: 20 },
    ];

    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.headerRow}>
                <h1 className={styles.title}>My Assignments</h1>
            </div>

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
                    {assignments.map((assignment, index) => (
                        <tr 
                            key={assignment.id} 
                            onClick={() => navigate(`/student/assignment/${assignment.id}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            <td>{index + 1}</td>
                            <td>{assignment.title}</td>
                            <td>
                                <span style={{ 
                                    color: assignment.status === 'Submitted' ? '#2e7d32' : '#d32f2f',
                                    fontWeight: '600' 
                                }}>
                                    {assignment.status}
                                </span>
                            </td>
                            <td>{assignment.obtained !== null ? assignment.obtained : '-'}</td>
                            <td>{assignment.total}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default StudentClassView;