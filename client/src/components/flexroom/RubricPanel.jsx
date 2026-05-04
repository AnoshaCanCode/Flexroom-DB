import React from 'react';
import styles from './RubricPanel.module.css';

function RubricPanel({ rubric, marksObtained, onMarkChange, totalMarks }) {
  return (
    <div className={styles.rubricContainer}>
      <div className={styles.rubricHeader}>
        <h3>Rubric</h3>
        <span className={styles.totalDisplay}>Total: {totalMarks}</span>
      </div>
      <div className={styles.rubricBody}>
        {rubric.map((item, index) => (
          <div key={index} className={styles.rubricItem}>
            <div className={styles.pointCircle}>+{item.maxMarks}</div>
            <div className={styles.itemDetails}>
              <span className={styles.itemTitle}>
                {item.id}. {item.criteria}
              </span>
              <div className={styles.inputGroup}>
                <label>Obtained:</label>
                <input
                  type="number"
                  min="0"
                  max={item.maxMarks}
                  value={marksObtained[item.id] || ''}
                  onChange={(e) => onMarkChange(item.id, e.target.value)}
                  className={styles.obtainedInput}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RubricPanel;