import React from 'react';
import styles from './ClassCard.module.css'; // Assuming you use modules

const ClassCard = ({ title, evaluatorName, section, assignments = [], role }) => {
    // This variable changes based on the role
    const titleClass = role === 'evaluator' ? styles.evaluatorAssignmentTitle : styles.assignmentTitle;
    
    return (
        <div className={styles.card}>
            <div className={styles.topSection}>
                <div className={styles.cardInfo}>
                    <h3>{title}</h3>
                    {evaluatorName && <p>Evaluator: {evaluatorName}</p>}
                    {section && <p>Section: {section}</p>}
                </div>
            </div>

            <div className={styles.bottomSection}>
                <div className={styles.bottomSection}>
                    {assignments && assignments.length > 0 ? (
                    assignments.map((assignment) => (
                    <a 
                     key={assignment.id} 
                     href={`/assignments/${assignment.id}`} 
                     className={styles.assignmentLink}
                     >
                     <div className={styles.assignmentRow}>
                     {/* Conditionally render due date ONLY if it exists */}
                     {assignment.dueDate && <span className={styles.dueDate}>{assignment.dueDate}</span>}
                        <span className={titleClass}>{assignment.title}</span>
                 </div>
                </a>
                ))
                 ) : (
                <p className={styles.noAssignments}>No uploaded assignments due</p>
                )}
                </div>
            </div>
        </div>
    );
};

export default ClassCard;