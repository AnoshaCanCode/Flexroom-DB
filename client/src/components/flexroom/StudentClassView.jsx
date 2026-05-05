import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../DashboardLayout.module.css'; 

const StudentClassView = () => {
    const navigate = useNavigate();

    // Mock data - replace with actual API call
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
                                        <span className={`${styles.statusBadge} ${assignment.status === 'Submitted' ? styles.statusSuccess : styles.statusPending}`}>
                                            {assignment.status}
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
                                <td colSpan="5" className={styles.noData}>No assignments found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StudentClassView;