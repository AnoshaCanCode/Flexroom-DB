import React, { useMemo } from 'react';
import styles from './RubricPanel.module.css';

function RubricPanel({
  panelTitle = 'Rubric',
  rubric,
  marksObtained,
  onMarkChange,
  maxAssessmentMarks,
}) {
  const sumObtained = useMemo(() => {
    if (!rubric?.length) return 0;
    return rubric.reduce((s, item) => {
      const v = Number(marksObtained[item.id]);
      return s + (Number.isFinite(v) ? v : 0);
    }, 0);
  }, [rubric, marksObtained]);

  return (
    <div className={styles.rubricContainer}>
      <div className={styles.rubricHeader}>
        <h3>{panelTitle}</h3>
        <span className={styles.totalDisplay}>
          Total: {sumObtained}
          {maxAssessmentMarks != null ? (
            <span className={styles.maxHint}> / {maxAssessmentMarks}</span>
          ) : null}
        </span>
      </div>
      <div className={styles.rubricBody}>
        {rubric.map((item, index) => (
          <div key={index} className={styles.rubricItem}>
            <div className={styles.pointCircle}>+{item.maxMarks}</div>
            <div className={styles.itemDetails}>
              <span className={styles.itemTitle}>
                {item.criteria}
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