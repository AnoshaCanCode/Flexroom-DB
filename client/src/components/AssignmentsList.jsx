import React from 'react';
import { Link } from 'react-router-dom';
import styles from './DashboardLayout.module.css';

/**
 * @param {Array<{ assessmentID: number, title: string, dueDate?: string, status?: string, marks?: number }>} assignments
 * @param {string} [classId] When set, assignment title links to the assignment dashboard route.
 * @param {(a: object) => void} [onDownloadQuestion] Download question PDF for a row.
 */
function AssignmentsList({
    assignments,
    loading,
    error,
    classId,
    onDownloadQuestion,
    gradesByAssessmentId = {},
}) {
    if (loading) {
        return <p className={styles.title}>Loading assignments…</p>;
    }

    if (error) {
        return <p style={{ color: '#c62828' }}>{error}</p>;
    }

    if (!assignments?.length) {
        return <p>No assignments for this class yet.</p>;
    }

    return (
        <table className={styles.assignmentTable}>
            <thead>
                <tr>
                    <th>S.No#</th>
                    <th>Title</th>
                    {classId ? <th>Question PDF</th> : null}
                    <th>Due</th>
                    <th>Status</th>
                    <th>Obtained Marks</th>
                    <th>Total Marks</th>
                </tr>
            </thead>
            <tbody>
                {assignments.map((a, index) => {
                    const g = gradesByAssessmentId[a.assessmentID];
                    return (
                        <tr key={a.assessmentID}>
                            <td>{index + 1}</td>
                            <td>
                                {classId ? (
                                    <Link
                                        to={`/student/class/${classId}/assignment/${a.assessmentID}`}
                                        className={styles.linkButton}
                                    >
                                        {a.title}
                                    </Link>
                                ) : (
                                    <button
                                        type="button"
                                        className={styles.linkButton}
                                        onClick={() => onDownloadQuestion?.(a)}
                                    >
                                        {a.title}
                                    </button>
                                )}
                            </td>
                            {classId ? (
                                <td>
                                    <button
                                        type="button"
                                        className={styles.linkButton}
                                        onClick={() => onDownloadQuestion?.(a)}
                                    >
                                        Download
                                    </button>
                                </td>
                            ) : null}
                            <td>{a.dueDate || '—'}</td>
                            <td>
                                <span
                                    style={{
                                        color: a.status === 'marked' ? '#2e7d32' : '#d32f2f',
                                        fontWeight: 600,
                                    }}
                                >
                                    {a.status === 'marked'
                                        ? 'Graded'
                                        : a.status === 'unmarked'
                                          ? 'Open'
                                          : a.status || 'Open'}
                                </span>
                            </td>
                            <td>{g?.totalMarks != null ? g.totalMarks : '—'}</td>
                            <td>{a.marks ?? '—'}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

export default AssignmentsList;
